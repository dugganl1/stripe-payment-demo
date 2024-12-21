// public/client.js

// Initialize Stripe.js with your publishable key
const stripe = Stripe(
  "pk_test_51QWkV7K1LgKithIM1jFUbpCmm2RseOJhVBT4p4TKZ9x0lKvijjhNddKcrS92y0emtx2aJY5EGyGdtYYjimHcYmNL00IBjLK18L"
);
let elements;

// Create the payment form when the page loads
initialize();

async function initialize() {
  try {
    // Create payment intent on the server
    const response = await fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 4999 }), // $49.99 in cents
    });

    const { clientSecret } = await response.json();

    // Create the payment elements
    elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");
  } catch (e) {
    console.error("Error:", e);
    showError("Failed to load payment form. Please try again.");
  }
}

// Handle form submission
document.querySelector("#payment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(true);

  const emailInput = document.querySelector("#email");

  try {
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success.html`,
        receipt_email: emailInput.value,
      },
    });

    if (error) {
      showError(error.message);
    }
    // Payment successful - Stripe will redirect to success.html
  } catch (e) {
    showError("An unexpected error occurred.");
  }
  setLoading(false);
});

// Helper functions
function showError(message) {
  const errorDiv = document.querySelector("#error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setLoading(false);
}

function setLoading(isLoading) {
  const button = document.querySelector("#submit");
  button.disabled = isLoading;
  button.textContent = isLoading ? "Processing..." : "Pay Now";
}
