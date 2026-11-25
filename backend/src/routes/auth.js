import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { config, nowIso } from '../config.js';
import { getDb } from '../db.js';
import { mapCustomer, mapProfessional } from '../mappers.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { generateOtp, hashOtp, otpMatches } from '../security/otp.js';
import { signToken } from '../security/token.js';

const router = Router();

const mobileSchema = z.string().trim().transform((value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}).refine((value) => /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit mobile number.');

const requestSchema = z.object({ mobile: mobileSchema });
const verifySchema = z.object({
  mobile: mobileSchema,
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
  account: z.enum(['consumer', 'provider']).default('consumer'),
  intent: z.enum(['signin', 'signup']),
  name: z.string().trim().min(2).max(40).optional(),
  skill: z.enum(['Cleaning', 'Repairs', 'Appliance', 'Beauty', 'Painting']).optional(),
  fcmToken: z.string().trim().min(10).max(512).optional(),
});

router.post('/otp/request', validate(requestSchema), (req, res) => {
  const db = getDb();
  const { mobile } = req.body;
  const since = Date.now() - config.otpWindowMs;
  const recent = db.prepare('SELECT COUNT(*) AS n FROM otp_challenges WHERE mobile = ? AND created_at > ?').get(mobile, since).n;
  if (recent >= config.otpMaxPerWindow) {
    return res.status(429).json({ ok: false, error: 'Too many codes requested. Wait a few minutes and try again.' });
  }

  const otp = generateOtp();
  const id = randomUUID();
  db.prepare('UPDATE otp_challenges SET used = 1 WHERE mobile = ? AND used = 0').run(mobile);
  db.prepare(`INSERT INTO otp_challenges (id, mobile, code_hash, expires_at, attempts, used, created_at)
    VALUES (?, ?, ?, ?, 0, 0, ?)`).run(id, mobile, hashOtp(mobile, otp), Date.now() + config.otpTtlSec * 1000, Date.now());

  const payload = { ok: true, expiresInSec: config.otpTtlSec };
  if (config.allowDebugOtp) payload.debugOtp = otp;
  return res.json(payload);
});

router.post('/otp/verify', validate(verifySchema), (req, res) => {
  const db = getDb();
  const { mobile, otp, name, fcmToken, intent } = req.body;
  const row = db.prepare(`SELECT * FROM otp_challenges
    WHERE mobile = ? AND used = 0 ORDER BY created_at DESC LIMIT 1`).get(mobile);

  if (!row || row.expires_at < Date.now()) {
    otpMatches(mobile, otp, hashOtp(mobile, '000000'));
    return res.status(401).json({ ok: false, error: 'That code is incorrect or has expired.' });
  }
  if (row.attempts >= config.otpMaxAttempts) {
    db.prepare('UPDATE otp_challenges SET used = 1 WHERE id = ?').run(row.id);
    return res.status(401).json({ ok: false, error: 'Too many attempts. Request a new code.' });
  }
  if (!otpMatches(mobile, otp, row.code_hash)) {
    db.prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return res.status(401).json({ ok: false, error: 'That code is incorrect or has expired.' });
  }

  if (req.body.account === 'provider') {
    const existing = db.prepare('SELECT id, active FROM professionals WHERE phone = ?').get(mobile);
    if (intent === 'signin' && !existing) {
      return res.status(404).json({ ok: false, error: 'No account for this number. Sign up.' });
    }
    if (intent === 'signup' && existing) {
      return res.status(409).json({ ok: false, error: 'This number is already registered. Sign in.' });
    }
    if (intent === 'signup' && (!name || !req.body.skill)) {
      return res.status(400).json({ ok: false, error: 'Add your name and skill to sign up.' });
    }
    if (existing && !existing.active) {
      return res.status(403).json({ ok: false, error: 'This provider account is inactive.' });
    }
    db.prepare('UPDATE otp_challenges SET used = 1 WHERE id = ?').run(row.id);
    return res.json(signInProvider(db, {
      mobile,
      name: intent === 'signup' ? name : undefined,
      skill: intent === 'signup' ? req.body.skill : undefined,
      fcmToken,
    }));
  }

  const existingCustomer = db.prepare('SELECT * FROM customers WHERE mobile = ?').get(mobile);
  if (intent === 'signin' && !existingCustomer) {
    return res.status(404).json({ ok: false, error: 'No account for this number. Sign up.' });
  }
  if (intent === 'signup' && existingCustomer) {
    return res.status(409).json({ ok: false, error: 'This number is already registered. Sign in.' });
  }
  if (intent === 'signup' && !name) {
    return res.status(400).json({ ok: false, error: 'Add your name to sign up.' });
  }

  db.prepare('UPDATE otp_challenges SET used = 1 WHERE id = ?').run(row.id);

  let customer = existingCustomer;
  if (!customer) {
    const id = randomUUID();
    db.prepare(`INSERT INTO customers (id, mobile, name, address_line, city, pincode, fcm_token, token_version, created_at)
      VALUES (?, ?, ?, '', '', '', ?, 1, ?)`).run(id, mobile, name, fcmToken || null, nowIso());
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  } else if (fcmToken) {
    db.prepare('UPDATE customers SET fcm_token = ? WHERE id = ?').run(fcmToken, customer.id);
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
  }

  const token = signToken({ sub: customer.id, role: 'customer', ver: customer.token_version });
  res.set('Cache-Control', 'no-store');
  return res.json({ ok: true, role: 'customer', token, customer: mapCustomer(customer) });
});

function signInProvider(db, { mobile, name, skill, fcmToken }) {
  let provider = db.prepare('SELECT * FROM professionals WHERE phone = ?').get(mobile);
  if (!provider) {
    const id = randomUUID();
    db.prepare(`INSERT INTO professionals (id, name, skill, phone, active, fcm_token, token_version)
      VALUES (?, ?, ?, ?, 1, ?, 1)`).run(id, name, skill, mobile, fcmToken || null);
    provider = db.prepare('SELECT * FROM professionals WHERE id = ?').get(id);
  } else {
    db.prepare('UPDATE professionals SET name = COALESCE(?, name), skill = COALESCE(?, skill), fcm_token = COALESCE(?, fcm_token) WHERE id = ?').run(
      name || null,
      skill || null,
      fcmToken || null,
      provider.id,
    );
    provider = db.prepare('SELECT * FROM professionals WHERE id = ?').get(provider.id);
  }
  const token = signToken({ sub: provider.id, role: 'provider', ver: provider.token_version });
  return { ok: true, role: 'provider', token, provider: mapProfessional(provider) };
}

router.get('/me', requireAuth('customer'), (req, res) => {
  const customer = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.auth.sub);
  return res.json({ ok: true, customer: mapCustomer(customer) });
});

router.post('/logout', requireAuth('customer'), (req, res) => {
  getDb().prepare('UPDATE customers SET token_version = token_version + 1 WHERE id = ?').run(req.auth.sub);
  return res.json({ ok: true });
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name should be at least 2 characters.').max(40).optional(),
  addressLine: z.string().trim().max(200).optional(),
  city: z.string().trim().max(60).optional(),
  pincode: z.string().trim().regex(/^$|^[A-Za-z0-9 -]{3,12}$/, 'Enter a valid postal code.').optional(),
  fcmToken: z.string().trim().max(512).nullable().optional(),
});

router.patch('/me', requireAuth('customer'), validate(profileSchema), (req, res) => {
  const db = getDb();
  const current = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.auth.sub);
  const next = {
    name: req.body.name ?? current.name,
    addressLine: req.body.addressLine ?? current.address_line,
    city: req.body.city ?? current.city,
    pincode: req.body.pincode ?? current.pincode,
    fcmToken: req.body.fcmToken === undefined ? current.fcm_token : req.body.fcmToken,
  };
  db.prepare('UPDATE customers SET name = ?, address_line = ?, city = ?, pincode = ?, fcm_token = ? WHERE id = ?').run(
    next.name,
    next.addressLine,
    next.city,
    next.pincode,
    next.fcmToken,
    current.id,
  );
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(current.id);
  return res.json({ ok: true, customer: mapCustomer(customer) });
});

export default router;
