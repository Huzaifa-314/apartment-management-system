import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';

/**
 * Apply a paid Stripe Checkout Session to the payment (idempotent).
 * @param {import('stripe').Stripe.Checkout.Session} session
 */
export async function finalizePaymentFromCheckoutSession(session) {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
    return { result: 'invalid_metadata' };
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) return { result: 'not_found' };

  if (payment.status === 'paid' && payment.paidAt) {
    return { result: 'already_paid', payment };
  }

  if (session.payment_status !== 'paid') {
    return { result: 'not_paid' };
  }

  const pi = session.payment_intent;
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id || '';

  const total = session.amount_total;
  const paidAmount =
    typeof total === 'number' && Number.isFinite(total) ? Math.round(total) / 100 : null;

  payment.status = 'paid';
  payment.method = 'stripe';
  payment.stripePaymentIntentId = paymentIntentId;
  payment.paidAmount = paidAmount;
  payment.paidAt = new Date();
  payment.date = new Date();
  payment.reference = `STRIPE-${session.id}`;
  payment.receiptUrl = `receipt-${payment._id}.pdf`;
  await payment.save();

  return { result: 'updated', payment };
}
