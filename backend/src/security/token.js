import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(input) {
  return createHmac('sha256', config.jwtSecret).update(input).digest('base64url');
}

export function signToken(payload) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.tokenTtlSec,
  });
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== 'customer' && payload.role !== 'provider' && payload.role !== 'admin') return null;
    if (typeof payload.ver !== 'number' || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}
