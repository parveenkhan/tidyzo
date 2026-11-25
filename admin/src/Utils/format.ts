export function inr(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

export const STATUSES = ['pending', 'approved', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'] as const;
