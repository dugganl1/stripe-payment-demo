require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const getOrderConfirmationEmail = require("./email-templates/order-confirmation");

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
        const emailHtml = getOrderConfirmationEmail({
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          downloadLink: "#", // We'll implement this properly later
        });

        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: paymentIntent.receipt_email,
          subject: "Your Financial Model Template - Order Confirmed",
          html: emailHtml,
        });
        console.log("✉️ Confirmation email sent");
      } catch (error) {
        console.error("📫 Email error:", error);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
