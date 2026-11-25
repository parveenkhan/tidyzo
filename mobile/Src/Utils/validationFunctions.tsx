export function normalizeMobile(input: string) {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile);
}

export function isValidPincode(value: string) {
  return /^\d{6}$/.test(value);
}
