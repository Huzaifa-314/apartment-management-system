import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { effectivePaymentStatus } from '../utils/paymentStatus.js';

/**
 * Apply a validated SSLCommerz payment to a rent Payment record (idempotent).
 */
export async function finalizePaymentFromSSLCommerzPayment(paymentId, validationResult) {
  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
    return { result: 'invalid_metadata' };
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) return { result: 'not_found' };

  if (payment.status === 'paid' && payment.paidAt) {
    return { result: 'already_paid', payment };
  }

  if (!validationResult?.valid) {
    return { result: 'not_paid' };
  }

  const payStatus = effectivePaymentStatus(payment);
  if (payStatus !== 'pending' && payStatus !== 'overdue') {
    return { result: 'wrong_status', payment };
  }

  payment.status = 'paid';
  payment.method = 'sslcommerz';
  payment.paidAmount =
    validationResult.amount != null && Number.isFinite(Number(validationResult.amount))
      ? Number(validationResult.amount)
      : payment.amount;
  payment.paidAt = new Date();
  payment.date = new Date();
  payment.reference = validationResult.transactionId
    ? `SSL-${validationResult.transactionId}`
    : `SSL-${payment._id}`;
  payment.receiptUrl = `receipt-${payment._id}.pdf`;
  await payment.save();

  return { result: 'updated', payment };
}
