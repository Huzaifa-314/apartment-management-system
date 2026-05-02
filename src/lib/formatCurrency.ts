/** Formats a numeric amount with a leading currency symbol from site settings. */
export function formatCurrency(amount: number, currencySymbol: string): string {
  const sym = currencySymbol || '৳';
  const n = Number.isFinite(amount) ? amount : 0;
  return `${sym}${n.toLocaleString()}`;
}
