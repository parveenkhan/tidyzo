export const PLATFORM_FEE_PERCENT = 15;

export function paymentSplit(price) {
  const amount = Number(price) || 0;
  const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100);
  return { platformFee, providerAmount: amount - platformFee };
}
