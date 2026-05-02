import { Payment } from '../models/Payment.js';
import { Room } from '../models/Room.js';
import Stripe from 'stripe';
import { serializePayment } from '../utils/serialize.js';
import { finalizePaymentFromCheckoutSession } from '../services/paymentCheckoutFinalize.js';
import { parsePagination } from '../utils/pagination.js';

function getStripe(secretKey) {
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

export const paymentController = {
  async list(req, res, next) {
    try {
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
      const allowedMethods = ['card', 'bank', 'cash', 'stripe'];
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
      const stripe = getStripe(process.env.STRIPE_SECRET_KEY);
      if (!stripe) {
        return res.status(503).json({ message: 'Stripe is not configured' });
      }

      const payment = await Payment.findById(req.params.id).populate('roomId');
      if (!payment) return res.status(404).json({ message: 'Payment not found' });

      if (payment.tenantId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (payment.status !== 'pending' && payment.status !== 'overdue') {
        return res.status(400).json({ message: 'Payment cannot be processed' });
      }

      const currency = (process.env.STRIPE_PRICE_CURRENCY || 'inr').toLowerCase();
      const amount = Number(payment.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' });
      }

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
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ message: 'session_id is required' });
      }

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
    } catch (e) {
      next(e);
    }
  },
};
