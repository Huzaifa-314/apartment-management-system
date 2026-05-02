import { BookingApplication } from '../models/BookingApplication.js';
import { finalizeBookingFromSSLCommerzPayment } from '../services/sslcommerzCheckoutFinalize.js';

export const sslcommerzIPNController = {
  async handleIPN(req, res, next) {
    try {
      // SSLCommerz sends payment status via POST to IPN URL
      const { tran_id, status, amount } = req.body;

      if (!tran_id) {
        return res.status(400).json({ message: 'Invalid IPN data' });
      }

      // Find booking by transaction ID
      const booking = await BookingApplication.findOne({
        sslcommerzTransactionId: tran_id,
      });

      if (!booking) {
        // Log but don't fail - IPN might arrive before we store the transaction
        console.warn(`IPN received for unknown transaction: ${tran_id}`);
        return res.json({ ok: true });
      }

      if (status === 'VALID' || status === 'ACCEPTED') {
        // Payment successful
        const validationResult = {
          valid: true,
          transactionId: tran_id,
          amount: amount ? parseFloat(amount) : booking.paidAmount,
        };

        await finalizeBookingFromSSLCommerzPayment(booking._id.toString(), validationResult);
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        // Payment failed
        if (booking.status === 'pending_payment') {
          // Keep booking in pending_payment state for retry
          console.log(`Payment failed for booking ${booking._id}: ${status}`);
        }
      }

      res.json({ ok: true });
    } catch (e) {
      console.error('IPN handling error:', e);
      // Always return 200 to avoid SSLCommerz retries
      res.json({ ok: true, error: e.message });
    }
  },
};
