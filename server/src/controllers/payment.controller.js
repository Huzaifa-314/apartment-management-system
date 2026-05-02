import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import Stripe from 'stripe';
import { serializePayment } from '../utils/serialize.js';
import { effectivePaymentStatus, syncPaymentStatuses } from '../utils/paymentStatus.js';
import { finalizePaymentFromCheckoutSession } from '../services/paymentCheckoutFinalize.js';
import { finalizePaymentFromSSLCommerzPayment } from '../services/sslcommerzPaymentFinalize.js';
import { parsePagination } from '../utils/pagination.js';

function getStripe(secretKey) {
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function frontendOrigin() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export const paymentController = {
  sslcommerzPaymentBrowserReturnSuccess(req, res, next) {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).type('text').send('Invalid payment reference');
      }
      const tran_id = req.body?.tran_id ?? req.query?.tran_id;
      const val_id = req.body?.val_id ?? req.query?.val_id;
      const qs = new URLSearchParams();
      if (tran_id) qs.set('tran_id', String(tran_id));
      qs.set('payment_id', paymentId);
      if (val_id) qs.set('val_id', String(val_id));
      res.redirect(302, `${frontendOrigin()}/tenant/payments/success?${qs.toString()}`);
    } catch (e) {
      next(e);
    }
  },

  sslcommerzPaymentBrowserReturnFail(req, res, next) {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).type('text').send('Invalid payment reference');
      }
      res.redirect(302, `${frontendOrigin()}/tenant/payments?failed=1`);
    } catch (e) {
      next(e);
    }
  },

  sslcommerzPaymentBrowserReturnCancel(req, res, next) {
    try {
      const { paymentId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).type('text').send('Invalid payment reference');
      }
      res.redirect(302, `${frontendOrigin()}/tenant/payments?cancelled=1`);
    } catch (e) {
      next(e);
    }
  },

  async list(req, res, next) {
    try {
      await syncPaymentStatuses();
      let q = {};
      if (req.user.role === 'tenant') {
        q.tenantId = req.user.id;
      } else if (req.user.role === 'admin') {
        const st = req.query.status;
        if (st && ['paid', 'pending', 'overdue'].includes(String(st))) {
          q.status = st;
        }
        const month = req.query.month;
        if (month && /^\d{4}-\d{2}$/.test(String(month))) {
          const [y, m] = String(month).split('-').map((x) => parseInt(x, 10));
          const start = new Date(y, m - 1, 1);
          const end = new Date(y, m, 0, 23, 59, 59, 999);
          q.dueDate = { $gte: start, $lte: end };
        }
      }

      const wantPaging = req.query.page != null || req.query.limit != null;
      if (wantPaging && req.user.role === 'admin') {
        const { page, limit, skip } = parsePagination(req.query, 15);
        const [payments, total] = await Promise.all([
          Payment.find(q).sort({ dueDate: -1 }).skip(skip).limit(limit),
          Payment.countDocuments(q),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return res.json({
          payments: payments.map(serializePayment),
          page,
          limit,
          total,
          totalPages,
        });
      }

      const payments = await Payment.find(q).sort({ dueDate: -1 });
      res.json({ payments: payments.map(serializePayment) });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const { tenantId, roomId, amount, dueDate, method } = req.body;
      if (!tenantId || !roomId || !amount || !dueDate) {
        return res.status(400).json({ message: 'tenantId, roomId, amount, and dueDate are required' });
      }
      const allowedMethods = ['card', 'bank', 'cash', 'stripe', 'sslcommerz'];
      const methodVal =
        method && allowedMethods.includes(String(method)) ? String(method) : null;
      const payment = await Payment.create({
        tenantId,
        roomId,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status: 'pending',
        date: null,
        method: methodVal,
        reference: '',
        receiptUrl: '',
      });
      res.status(201).json({ payment: serializePayment(payment) });
    } catch (e) {
      next(e);
    }
  },

  async pay(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id);
      if (!payment) return res.status(404).json({ message: 'Not found' });
      if (payment.tenantId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const { method = 'card' } = req.body;
      payment.status = 'paid';
      payment.date = new Date();
      payment.method = method;
      payment.reference = `REF-${Date.now()}`;
      payment.receiptUrl = `receipt-${payment._id}.pdf`;
      await payment.save();
      res.json({ payment: serializePayment(payment) });
    } catch (e) {
      next(e);
    }
  },

  async createCheckoutSession(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id).populate('roomId');
      if (!payment) return res.status(404).json({ message: 'Payment not found' });

      if (payment.tenantId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      const payStatus = effectivePaymentStatus(payment);
      if (payStatus !== 'pending' && payStatus !== 'overdue') {
        return res.status(400).json({ message: 'Payment cannot be processed' });
      }

      const amount = Number(payment.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
      }

      const sslcommerz = req.sslcommerz;
      const stripe = getStripe(process.env.STRIPE_SECRET_KEY);

      if (sslcommerz) {
        const room = payment.roomId;
        if (!room?._id) return res.status(404).json({ message: 'Room not found' });

        const transactionId = `rent_${payment._id.toString()}_${Date.now()}`;
        const apiBase = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
        const paymentPathId = payment._id.toString();

        const tenant = await User.findById(payment.tenantId);

        const initResponse = await sslcommerz.initializePayment({
          amount,
          currency: process.env.SSLCOMMERZ_CURRENCY || 'BDT',
          transactionId,
          successUrl: `${apiBase}/api/payments/sslcommerz-browser-return/success/${paymentPathId}`,
          failUrl: `${apiBase}/api/payments/sslcommerz-browser-return/fail/${paymentPathId}`,
          cancelUrl: `${apiBase}/api/payments/sslcommerz-browser-return/cancel/${paymentPathId}`,
          ipnUrl: `${apiBase}/api/payments/ipn`,
          productName: `Rent — Room ${room.number}`,
          customerName: tenant?.name || 'Tenant',
          customerEmail: tenant?.email || 'tenant@example.com',
          customerPhone: tenant?.phone || '',
          customerAddress: 'N/A',
        });

        if (!initResponse.success) {
          return res.status(400).json({
            message: initResponse.error || 'Failed to initialize payment',
          });
        }

        payment.sslcommerzSessionId = initResponse.sessionId || '';
        payment.sslcommerzTransactionId = transactionId;
        await payment.save();

        return res.json({ url: initResponse.gatewayUrl });
      }

      if (!stripe) {
        return res.status(503).json({ message: 'Payment gateway is not configured' });
      }

      const currency = (process.env.STRIPE_PRICE_CURRENCY || 'inr').toLowerCase();
      const unitAmount = Math.round(amount * 100);
      const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: payment._id.toString(),
        metadata: {
          paymentId: payment._id.toString(),
          tenantId: req.user.id || '',
          roomId: payment.roomId._id.toString(),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: unitAmount,
              product_data: {
                name: `Rent Payment — Room ${payment.roomId.number}`,
                description: `Due: ${payment.dueDate.toLocaleDateString()}`,
              },
            },
          },
        ],
        success_url: `${frontend}/tenant/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontend}/tenant/payments?cancelled=1`,
      });

      payment.stripeCheckoutSessionId = session.id;
      await payment.save();

      res.json({ url: session.url });
    } catch (e) {
      next(e);
    }
  },

  async confirmCheckoutSession(req, res, next) {
    try {
      const sessionId = req.query.session_id;
      if (sessionId && typeof sessionId === 'string') {
        const stripe = getStripe(process.env.STRIPE_SECRET_KEY);
        if (!stripe) {
          return res.status(503).json({ message: 'Stripe is not configured' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const paymentId = session.metadata?.paymentId;
        if (!paymentId) {
          return res.status(400).json({ message: 'Invalid checkout session' });
        }

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.tenantId.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        if (payment.stripeCheckoutSessionId && payment.stripeCheckoutSessionId !== session.id) {
          return res.status(400).json({ message: 'Session does not match this payment' });
        }

        const r = await finalizePaymentFromCheckoutSession(session);

        switch (r.result) {
          case 'already_paid':
          case 'updated':
            return res.json({
              ok: true,
              payment: serializePayment(r.payment),
            });
          case 'not_paid':
            return res.status(400).json({ message: 'Payment is not complete yet' });
          case 'invalid_metadata':
          case 'not_found':
          default:
            return res.status(400).json({ message: 'Could not confirm payment' });
        }
      }

      const transactionId = req.query.tran_id;
      const paymentId = req.query.payment_id;
      if (
        transactionId &&
        paymentId &&
        typeof transactionId === 'string' &&
        typeof paymentId === 'string'
      ) {
        const sslcommerz = req.sslcommerz;
        const payment = await Payment.findById(paymentId).populate('roomId');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.tenantId.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }

        if (payment.sslcommerzTransactionId && payment.sslcommerzTransactionId !== transactionId) {
          return res.status(400).json({ message: 'Transaction does not match this payment' });
        }

        // IPN often finalizes before the user lands on the success page. The browser return
        // may omit val_id or validation can race; idempotent success avoids a false error.
        if (payment.status === 'paid') {
          return res.json({
            ok: true,
            payment: serializePayment(payment),
          });
        }

        const valId = req.query.val_id;
        let validationResult;
        if (sslcommerz) {
          if (!valId || typeof valId !== 'string') {
            return res.status(400).json({
              message:
                'val_id is required — open this page from the payment success redirect after paying.',
            });
          }
          const vr = await sslcommerz.validatePayment({ val_id: valId });
          if (!vr.valid) {
            return res.status(400).json({ message: vr.error || 'Payment validation failed' });
          }
          if (vr.transactionId && vr.transactionId !== transactionId) {
            return res.status(400).json({ message: 'Transaction id mismatch with gateway' });
          }
          const expected = Number(payment.amount);
          if (
            Number.isFinite(expected) &&
            vr.amount != null &&
            Number.isFinite(vr.amount) &&
            Math.abs(vr.amount - expected) > 0.01
          ) {
            return res.status(400).json({ message: 'Paid amount does not match rent due' });
          }
          validationResult = {
            valid: true,
            transactionId: transactionId,
            amount: vr.amount ?? expected,
          };
        } else {
          validationResult = {
            valid: true,
            transactionId: transactionId,
            amount: payment.amount,
          };
        }

        const r = await finalizePaymentFromSSLCommerzPayment(paymentId, validationResult);

        switch (r.result) {
          case 'already_paid':
          case 'updated':
            return res.json({
              ok: true,
              payment: serializePayment(r.payment),
            });
          case 'not_paid':
            return res.status(400).json({ message: 'Payment is not complete yet' });
          case 'wrong_status':
            return res.status(400).json({ message: 'This payment cannot be confirmed' });
          case 'invalid_metadata':
          case 'not_found':
          default:
            return res.status(400).json({ message: 'Could not confirm payment' });
        }
      }

      return res.status(400).json({
        message:
          'Provide session_id (Stripe) or tran_id and payment_id (SSLCommerz rent checkout).',
      });
    } catch (e) {
      next(e);
    }
  },
};
