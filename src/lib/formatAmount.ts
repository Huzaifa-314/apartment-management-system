/** Plain numeric display for money fields (no currency symbol or code). */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return amount.toLocaleString();
}
