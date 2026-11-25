import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(mobile, otp) {
  return createHmac('sha256', config.otpPepper).update(`${mobile}:${otp}`).digest('hex');
}

export function otpMatches(mobile, otp, storedHash) {
  const actual = Buffer.from(hashOtp(mobile, otp));
  const expected = Buffer.from(String(storedHash || ''));
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
