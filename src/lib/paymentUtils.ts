import type { Payment } from '../types';

/** Unpaid rent that can be paid online (matches API rules for checkout). */
export function isPayableRentPayment(p: Payment): boolean {
  return p.status === 'pending' || p.status === 'overdue';
}

/** Next payment to collect: overdue first, then by earliest due date. */
export function selectCurrentPayment(payments: Payment[]): Payment | undefined {
  const unpaid = payments.filter((p) => p.status === 'pending' || p.status === 'overdue');
  if (unpaid.length === 0) return undefined;
  unpaid.sort((a, b) => {
    const aOver = a.status === 'overdue' ? 1 : 0;
    const bOver = b.status === 'overdue' ? 1 : 0;
    if (aOver !== bOver) return bOver - aOver;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  return unpaid[0];
}
