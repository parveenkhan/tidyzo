export const PLATFORM_FEE_PERCENT = 15;

export function paymentSplit(price: number) {
  const platformFee = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
  return { platformFee, providerAmount: price - platformFee };
}
