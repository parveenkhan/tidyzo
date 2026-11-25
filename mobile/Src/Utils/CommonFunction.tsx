export function inr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function paymentLabel(method?: string, status?: string) {
  const name = method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Cash';
  if (method === 'upi' || method === 'card') return `${name} · Paid`;
  return status === 'paid' ? `${name} · Paid` : `${name} · Pay on visit`;
}

export function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}
