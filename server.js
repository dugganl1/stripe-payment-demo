require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();

// IMPORTANT: Move the webhook route BEFORE other middleware
// Webhook endpoint (must come first)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const endpointSecret = "whsec_424aba16da5e46e851a1a1d5e7bcdd972a92316dc14295c867e374557a60432b";
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
      // TODO: Deliver the file
      // TODO: Send email confirmation
      // TODO: Store in database
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
