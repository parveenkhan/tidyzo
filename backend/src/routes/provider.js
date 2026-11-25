import { Router } from 'express';
import { z } from 'zod';
import { nowIso } from '../config.js';
import { getDb } from '../db.js';
import { mapBooking, mapProfessional, mapProviderNotification } from '../mappers.js';
import { asyncRoute } from '../middleware/asyncRoute.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deliverNotification, queueNotification, statusCopy } from '../services/notificationService.js';
import { MIN_RANGE_KM, MAX_RANGE_KM, distanceKm, locate, providerPoint, withinRange } from '../places.js';

const router = Router();
router.use(requireAuth('provider'));

const bookingSelect = `SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile, s.category
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s ON s.id = b.service_id`;

const nextStatus = {
  pending: ['accepted', 'rejected'],
  assigned: ['accepted', 'rejected'],
  accepted: ['in_progress'],
  in_progress: ['completed'],
};

router.get('/me', (req, res) => {
  const provider = getDb().prepare('SELECT * FROM professionals WHERE id = ?').get(req.auth.sub);
  res.json({ ok: true, provider: mapProfessional(provider) });
});

router.post('/logout', (req, res) => {
  getDb().prepare('UPDATE professionals SET token_version = token_version + 1 WHERE id = ?').run(req.auth.sub);
  res.json({ ok: true });
});

router.get('/notifications', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM provider_notifications WHERE professional_id = ? ORDER BY created_at DESC LIMIT 100').all(req.auth.sub);
  const unread = db.prepare('SELECT COUNT(*) AS n FROM provider_notifications WHERE professional_id = ? AND is_read = 0').get(req.auth.sub).n;
  res.json({ ok: true, notifications: rows.map(mapProviderNotification), unread });
});

router.get('/bookings', (req, res) => {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM professionals WHERE id = ?').get(req.auth.sub);
  const mine = db.prepare(`${bookingSelect} WHERE b.professional_id = ? ORDER BY b.scheduled_date, b.scheduled_time`).all(provider.id);
  const declined = new Set(
    db.prepare('SELECT booking_id FROM provider_declines WHERE professional_id = ?').all(provider.id).map((row) => row.booking_id),
  );
  const open = db.prepare(`${bookingSelect}
    WHERE b.status IN ('pending', 'approved') AND (b.professional_id IS NULL OR b.professional_id = '')
    ORDER BY b.scheduled_date, b.scheduled_time LIMIT 200`).all();
  const nearby = open.filter((row) => !declined.has(row.id) && skillMatches(provider, row) && withinRange(provider, row.city));
  const seen = new Set();
  const rows = [];
  for (const row of [...mine, ...nearby]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    rows.push(row);
  }
  res.json({ ok: true, bookings: rows.map((row) => mapBooking(withDistance(row, provider))) });
});

const areaSchema = z.object({
  city: z.string().trim().min(2).max(60),
  rangeKm: z.number().int().min(MIN_RANGE_KM).max(MAX_RANGE_KM),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

router.patch('/me', validate(areaSchema), (req, res) => {
  const db = getDb();
  db.prepare('UPDATE professionals SET city = ?, range_km = ?, latitude = ?, longitude = ? WHERE id = ?').run(
    req.body.city,
    req.body.rangeKm,
    req.body.latitude,
    req.body.longitude,
    req.auth.sub,
  );
  const provider = db.prepare('SELECT * FROM professionals WHERE id = ?').get(req.auth.sub);
  return res.json({ ok: true, provider: mapProfessional(provider) });
});

const updateSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'in_progress', 'completed']),
});

router.patch('/bookings/:id', validate(updateSchema), asyncRoute(async (req, res) => {
  const db = getDb();
  const provider = db.prepare('SELECT * FROM professionals WHERE id = ?').get(req.auth.sub);
  const current = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(req.params.id);
  if (!current) return res.status(404).json({ ok: false, error: 'That job was not found.' });
  const mine = current.professional_id === provider.id;
  const open = !current.professional_id && (current.status === 'pending' || current.status === 'approved');
  if (!mine && !open) return res.status(404).json({ ok: false, error: 'That job is not available to you.' });

  const deciding = req.body.status === 'accepted' || req.body.status === 'rejected';
  const canDecide = open || (mine && (current.status === 'pending' || current.status === 'assigned'));
  if (deciding && !canDecide) return res.status(400).json({ ok: false, error: 'This job cannot move to that status.' });
  if (!deciding) {
    const allowed = nextStatus[current.status] || [];
    if (!mine || !allowed.includes(req.body.status)) {
      return res.status(400).json({ ok: false, error: 'This job cannot move to that status.' });
    }
  }
  if (open && deciding && (!skillMatches(provider, current) || !withinRange(provider, current.city))) {
    return res.status(400).json({ ok: false, error: 'This job is outside your skill or location range.' });
  }

  if (req.body.status === 'rejected') {
    db.prepare('INSERT OR IGNORE INTO provider_declines (professional_id, booking_id, created_at) VALUES (?, ?, ?)').run(provider.id, current.id, nowIso());
    if (mine) {
      const restored = current.status === 'assigned' ? 'approved' : 'pending';
      db.prepare(`UPDATE bookings SET status = ?, professional_id = NULL, professional_name = NULL, updated_at = ? WHERE id = ?`).run(restored, nowIso(), current.id);
    }
  } else if (req.body.status === 'accepted') {
    const claimed = db.prepare(`UPDATE bookings
      SET status = 'accepted', professional_id = ?, professional_name = ?, updated_at = ?
      WHERE id = ? AND (professional_id IS NULL OR professional_id = ?) AND status IN ('pending', 'approved', 'assigned')`).run(
      provider.id, provider.name, nowIso(), current.id, provider.id,
    );
    if (!claimed.changes) return res.status(409).json({ ok: false, error: 'Another professional already took this job.' });
  } else {
    db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(req.body.status, nowIso(), current.id);
  }
  if (req.body.status === 'rejected' && !mine) {
    const booking = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(current.id);
    return res.json({ ok: true, booking: mapBooking(withDistance(booking, provider)) });
  }
  const copy = req.body.status === 'rejected'
    ? { title: 'Assignment declined', body: `A professional could not take your ${current.service_name} visit. TidyZo will keep looking.` }
    : statusCopy(req.body.status, current.service_name);
  const notificationId = queueNotification(db, {
    customerId: current.customer_id,
    bookingId: current.id,
    title: copy.title,
    body: copy.body,
  });
  await deliverNotification(db, notificationId);
  const booking = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(current.id);
  return res.json({ ok: true, booking: mapBooking(withDistance(booking, provider)) });
}));

function skillMatches(provider, row) {
  return String(row.category || '').toLowerCase() === String(provider.skill || '').toLowerCase();
}

function withDistance(row, provider) {
  const origin = providerPoint(provider);
  const target = locate(row.city);
  const distance = origin && target ? distanceKm(origin, target) : null;
  return { ...row, distance_km: distance };
}

export default router;
