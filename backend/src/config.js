import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const DEV_JWT = 'dev-only-change-me-tidyzo-jwt-secret-32';
const DEV_PEPPER = 'dev-only-change-me-tidyzo-otp-pepper';

function resolvePath(value, fallback) {
  const picked = value || fallback;
  return path.isAbsolute(picked) ? picked : path.resolve(backendRoot, picked);
}

export const config = {
  port: Number(process.env.PORT || 8443),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || DEV_JWT,
  otpPepper: process.env.OTP_PEPPER || DEV_PEPPER,
  allowDebugOtp: (process.env.ALLOW_DEBUG_OTP || 'true') === 'true',
  dbPath: process.env.DB_PATH === ':memory:' ? ':memory:' : resolvePath(process.env.DB_PATH, './data/tidyzo.db'),
  sslKey: resolvePath(process.env.SSL_KEY, '../certs/key.pem'),
  sslCert: resolvePath(process.env.SSL_CERT, '../certs/cert.pem'),
  firebaseAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolvePath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : '',
  tokenTtlSec: 60 * 60 * 24 * 7,
  otpTtlSec: 5 * 60,
  otpMaxAttempts: 5,
  otpMaxPerWindow: 5,
  otpWindowMs: 10 * 60 * 1000,
};

if (config.nodeEnv === 'production') {
  config.allowDebugOtp = false;
  if (config.jwtSecret === DEV_JWT || config.otpPepper === DEV_PEPPER) {
    throw new Error('Set JWT_SECRET and OTP_PEPPER before running in production.');
  }
}

export const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export const BOOKING_STATUSES = ['pending', 'approved', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'];

export function nowIso() {
  return new Date().toISOString();
}

export function todayIso() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isPastSlot(date, time) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const slot = new Date(year, month - 1, day, hour, minute, 0, 0);
  return slot.getTime() < Date.now() + 30 * 60 * 1000;
}
