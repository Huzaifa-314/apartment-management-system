import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: null },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], required: true },
    method: { type: String, enum: ['card', 'bank', 'cash', 'stripe', 'sslcommerz'], default: null },
    reference: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    lastRentReminderAt: { type: Date, default: null },
    sslcommerzSessionId: { type: String, default: '' },
    sslcommerzTransactionId: { type: String, default: '' },
    stripeCheckoutSessionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    paidAmount: { type: Number, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
