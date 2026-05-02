import { Payment } from '../models/Payment.js';
import { finalizePaymentFromSSLCommerzPayment } from '../services/sslcommerzPaymentFinalize.js';

export const sslcommerzPaymentIPNController = {
  async handleIPN(req, res, next) {
    try {
      const { tran_id, status, amount } = req.body;

      if (!tran_id) {
        return res.status(400).json({ message: 'Invalid IPN data' });
      }

      const payment = await Payment.findOne({ sslcommerzTransactionId: tran_id });
      if (!payment) {
        return res.json({ ok: true });
      }

      if (status === 'VALID' || status === 'ACCEPTED') {
        const validationResult = {
          valid: true,
          transactionId: tran_id,
          amount: amount != null ? parseFloat(amount) : payment.amount,
        };
        await finalizePaymentFromSSLCommerzPayment(payment._id.toString(), validationResult);
      }

      res.json({ ok: true });
    } catch (e) {
      console.error('Rent payment IPN error:', e);
      res.json({ ok: true, error: e.message });
    }
  },
};
