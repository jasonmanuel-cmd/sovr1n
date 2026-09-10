const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripe = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

function getStripe() {
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY.');
  }
  return stripe;
}

module.exports = { getStripe, stripe };
