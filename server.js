require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const getOrderConfirmationEmail = require("./email-templates/order-confirmation");
const crypto = require("crypto");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const downloadTokens = new Map();

function generateDownloadUrl(paymentId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  downloadTokens.set(token, {
    paymentId,
    expiresAt,
    downloaded: false,
  });

  // Make sure we use the full URL
  return `${process.env.BASE_URL}/download/${token}`;
}
// IMPORTANT: Move the webhook route BEFORE other middleware
// Webhook endpoint (must come first)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      endpointSecret
    );
  } catch (err) {
    console.log(`⚠️ Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`💰 PaymentIntent ${paymentIntent.id} was successful!`);

      try {
        // Store order in Supabase
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            payment_intent_id: paymentIntent.id,
            email: paymentIntent.receipt_email,
            amount: paymentIntent.amount,
            status: "completed",
          })
          .select()
          .single();

        if (orderError) throw orderError;
        console.log("💾 Order stored in database:", order.id);

        // Generate download URL and send email (your existing code)
        const downloadUrl = generateDownloadUrl(paymentIntent.id);
        const emailHtml = getOrderConfirmationEmail({
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          downloadLink: downloadUrl,
        });

        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: paymentIntent.receipt_email,
          subject: "Your Financial Model Template - Order Confirmed",
          html: emailHtml,
        });
        console.log("✉️ Confirmation email sent");
      } catch (error) {
        console.error("Error processing order:", error);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log(`❌ Payment failed for PaymentIntent ${failedPayment.id}`);
      // TODO: Handle failed payment (notify customer, etc.)
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});

// Regular middleware (must come after webhook route)
app.use(express.static("public"));
app.use(express.json());

// Payment intent endpoint
app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 4999, // $49.99 in cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/download/:token", async (req, res) => {
  const token = req.params.token;
  const download = downloadTokens.get(token);

  if (!download) {
    return res.status(404).send("Download link expired or invalid");
  }

  if (Date.now() > download.expiresAt) {
    downloadTokens.delete(token);
    return res.status(410).send("Download link has expired");
  }

  try {
    // First get the current download count
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("download_count")
      .eq("payment_intent_id", download.paymentId)
      .single();

    // Then update with the incremented count
    const { data, error } = await supabase
      .from("orders")
      .update({
        download_count: (currentOrder?.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", download.paymentId)
      .select();

    if (error) throw error;

    // Process the download
    const filePath = path.join(__dirname, "files", "template.xlsx");
    download.downloaded = true;
    res.download(filePath, "financial-model-template.xlsx");

    console.log("📊 Download tracked for order:", download.paymentId);
  } catch (error) {
    console.error("Error tracking download:", error);
    res.status(500).send("Error processing download");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
