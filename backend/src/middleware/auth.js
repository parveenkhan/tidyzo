import { getDb } from '../db.js';
import { verifyToken } from '../security/token.js';

export function requireAuth(role) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const payload = verifyToken(token);
    if (!payload || (role && payload.role !== role)) {
      return res.status(401).json({ ok: false, error: 'Please sign in again.' });
    }

    const db = getDb();
    const tables = { customer: 'customers', provider: 'professionals', admin: 'admins' };
    const table = tables[payload.role];
    const row = table ? db.prepare(`SELECT token_version FROM ${table} WHERE id = ?`).get(payload.sub) : null;
    if (!row || row.token_version !== payload.ver) {
      return res.status(401).json({ ok: false, error: 'Please sign in again.' });
    }

    req.auth = payload;
    return next();
  };
}
