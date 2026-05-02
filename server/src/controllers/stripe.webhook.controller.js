import Stripe from 'stripe';
import { finalizeBookingFromCheckoutSession } from '../services/checkoutSessionFinalize.js';

export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey) {
    return res.status(503).send('Stripe webhook not configured');
  }

  const stripe = new Stripe(stripeKey);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await finalizeBookingFromCheckoutSession(session);
    } catch (e) {
      console.error('Stripe webhook handler error:', e);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  return res.json({ received: true });
}
