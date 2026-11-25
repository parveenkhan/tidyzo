import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { TIME_SLOTS, isPastSlot, nowIso } from '../config.js';
import { getDb } from '../db.js';
import { mapBooking } from '../mappers.js';
import { asyncRoute } from '../middleware/asyncRoute.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deliverNotification, deliverProviderNotification, queueAreaProviderNotifications, queueNotification, statusCopy } from '../services/notificationService.js';
import { isListedCountry, isValidPostal } from '../postal.js';
import { paymentSplit } from '../fees.js';

const router = Router();
router.use(requireAuth('customer'));

const createSchema = z.object({
  serviceId: z.string().trim().min(3).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.'),
  time: z.string().refine((value) => TIME_SLOTS.includes(value), 'Choose a listed time slot.'),
  addressLine: z.string().trim().min(8, 'Add a fuller address.').max(200),
  city: z.string().trim().min(2).max(60),
  country: z.string().trim().min(2).max(40),
  pincode: z.string().trim().max(12),
  notes: z.string().trim().max(300).optional(),
  paymentMethod: z.enum(['upi', 'card']),
}).superRefine((value, ctx) => {
  if (!isListedCountry(value.country)) {
    ctx.addIssue({ code: 'custom', path: ['country'], message: 'Choose a listed country.' });
    return;
  }
  if (!isValidPostal(value.country, value.pincode)) {
    ctx.addIssue({ code: 'custom', path: ['pincode'], message: 'Enter a postal code that matches that country.' });
  }
});

const bookingSelect = `SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile, s.category
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s ON s.id = b.service_id`;

router.get('/', (req, res) => {
  const rows = getDb().prepare(`${bookingSelect} WHERE b.customer_id = ? ORDER BY b.created_at DESC LIMIT 200`).all(req.auth.sub);
  res.json({ ok: true, bookings: rows.map(mapBooking) });
});

router.get('/:id', (req, res) => {
  const row = getDb().prepare(`${bookingSelect} WHERE b.id = ? AND b.customer_id = ?`).get(req.params.id, req.auth.sub);
  if (!row) return res.status(404).json({ ok: false, error: 'Booking not found.' });
  return res.json({ ok: true, booking: mapBooking(row) });
});

router.post('/', validate(createSchema), asyncRoute(async (req, res) => {
  const db = getDb();
  const { serviceId, date, time, addressLine, city, pincode, notes, paymentMethod } = req.body;
  if (isPastSlot(date, time)) {
    return res.status(400).json({ ok: false, error: 'Choose a time at least 30 minutes from now.' });
  }
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(serviceId);
  if (!service) return res.status(404).json({ ok: false, error: 'That service is not available.' });
  const split = paymentSplit(service.price);

  const id = randomUUID();
  const now = nowIso();
  const customerId = req.auth.sub;
  db.exec('BEGIN');
  let notificationId;
  let providerNoteIds = [];
  try {
    db.prepare(`INSERT INTO bookings (
      id, customer_id, service_id, service_name, scheduled_date, scheduled_time,
      address_line, city, pincode, notes, status, professional_id, professional_name,
      price, payment_method, payment_status, platform_fee, provider_amount, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?, 'paid', ?, ?, ?, ?)`).run(
      id, customerId, service.id, service.name, date, time, addressLine, city, pincode, notes || '', service.price, paymentMethod, split.platformFee, split.providerAmount, now, now,
    );
    db.prepare('UPDATE customers SET address_line = ?, city = ?, pincode = ? WHERE id = ?').run(addressLine, city, pincode, customerId);
    const copy = statusCopy('pending', service.name);
    notificationId = queueNotification(db, { customerId, bookingId: id, title: copy.title, body: copy.body });
    const saved = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(id);
    providerNoteIds = queueAreaProviderNotifications(db, saved);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  await deliverNotification(db, notificationId);
  for (const noteId of providerNoteIds) await deliverProviderNotification(db, noteId);
  const booking = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(id);
  return res.status(201).json({ ok: true, booking: mapBooking(booking) });
}));

export default router;
