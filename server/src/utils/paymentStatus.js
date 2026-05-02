import { Payment } from '../models/Payment.js';

/**
 * Unpaid rent is overdue only after the due calendar day has passed
 * (due today counts as pending, not overdue).
 */
export function effectivePaymentStatus(p) {
  const raw = p.status;
  if (raw === 'paid') return 'paid';
  const due = new Date(p.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  return 'pending';
}

/** Align stored status with due dates (pending ↔ overdue). Idempotent. */
export async function syncPaymentStatuses() {
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const r1 = await Payment.updateMany(
    { status: 'pending', dueDate: { $lt: startToday } },
    { $set: { status: 'overdue' } }
  );
  const r2 = await Payment.updateMany(
    { status: 'overdue', dueDate: { $gte: startToday } },
    { $set: { status: 'pending' } }
  );
  return {
    markedOverdue: r1.modifiedCount ?? 0,
    correctedToPending: r2.modifiedCount ?? 0,
  };
}
