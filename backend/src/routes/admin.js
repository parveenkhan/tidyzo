import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { BOOKING_STATUSES, nowIso } from '../config.js';
import { getDb } from '../db.js';
import { mapBooking, mapCustomer, mapNotification, mapProfessional, mapService } from '../mappers.js';
import { asyncRoute } from '../middleware/asyncRoute.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyPassword } from '../security/password.js';
import { signToken } from '../security/token.js';
import { deliverNotification, deliverProviderNotification, queueNotification, queueProviderNotification, statusCopy } from '../services/notificationService.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email('Enter the admin email.').transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
});

router.post('/auth/login', validate(loginSchema), (req, res) => {
  const admin = getDb().prepare('SELECT * FROM admins WHERE email = ?').get(req.body.email);
  if (!admin || !verifyPassword(req.body.password, admin.password_hash)) {
    return res.status(401).json({ ok: false, error: 'Email or password is incorrect.' });
  }
  const token = signToken({ sub: admin.id, role: 'admin', ver: admin.token_version });
  res.set('Cache-Control', 'no-store');
  return res.json({ ok: true, token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.post('/auth/logout', requireAuth('admin'), (req, res) => {
  getDb().prepare('UPDATE admins SET token_version = token_version + 1 WHERE id = ?').run(req.auth.sub);
  res.json({ ok: true });
});

router.use(requireAuth('admin'));

const bookingSelect = `SELECT b.*, c.name AS customer_name, c.mobile AS customer_mobile, s.category
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s ON s.id = b.service_id`;

router.get('/dashboard', (_req, res) => {
  const db = getDb();
  const customers = db.prepare('SELECT COUNT(*) AS n FROM customers').get().n;
  const bookings = db.prepare('SELECT COUNT(*) AS n FROM bookings').get().n;
  const pending = db.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'pending'`).get().n;
  const today = nowIso().slice(0, 10);
  const todayCount = db.prepare('SELECT COUNT(*) AS n FROM bookings WHERE scheduled_date = ?').get(today).n;
  const byStatus = db.prepare('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status').all();
  const recent = db.prepare(`${bookingSelect} ORDER BY b.created_at DESC LIMIT 8`).all();
  res.json({
    ok: true,
    stats: {
      customers,
      bookings,
      pending,
      today: todayCount,
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row.n])),
    },
    recentBookings: recent.map(mapBooking),
  });
});

router.get('/customers', (_req, res) => {
  const rows = getDb().prepare(`SELECT c.*, COUNT(b.id) AS booking_count
    FROM customers c LEFT JOIN bookings b ON b.customer_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC`).all();
  res.json({
    ok: true,
    customers: rows.map((row) => ({ ...mapCustomer(row), bookingCount: row.booking_count, createdAt: row.created_at })),
  });
});

router.get('/professionals', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM professionals WHERE active = 1 ORDER BY name').all();
  res.json({ ok: true, professionals: rows.map(mapProfessional) });
});

router.get('/services', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM services ORDER BY active DESC, category, name').all();
  res.json({ ok: true, services: rows.map(mapService) });
});

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(40),
  description: z.string().trim().min(8).max(400),
  price: z.coerce.number().int().min(1).max(100000),
  durationMin: z.coerce.number().int().min(15).max(480),
  imageUrl: z.string().trim().regex(/^https:\/\/.+/i, 'Use an https image URL.'),
  active: z.boolean().optional(),
});

router.post('/services', validate(serviceSchema), (req, res) => {
  const id = `svc-${randomUUID().slice(0, 8)}`;
  const now = nowIso();
  const active = req.body.active === false ? 0 : 1;
  getDb().prepare(`INSERT INTO services
    (id, name, category, description, price, duration_min, image_url, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, req.body.name, req.body.category, req.body.description, req.body.price, req.body.durationMin, req.body.imageUrl, active, now, now,
  );
  const service = getDb().prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json({ ok: true, service: mapService(service) });
});

router.patch('/services/:id', validate(serviceSchema.partial()), (req, res) => {
  const db = getDb();
  const current = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ ok: false, error: 'Service not found.' });
  const next = {
    name: req.body.name ?? current.name,
    category: req.body.category ?? current.category,
    description: req.body.description ?? current.description,
    price: req.body.price ?? current.price,
    durationMin: req.body.durationMin ?? current.duration_min,
    imageUrl: req.body.imageUrl ?? current.image_url,
    active: req.body.active === undefined ? current.active : (req.body.active ? 1 : 0),
  };
  db.prepare(`UPDATE services SET name = ?, category = ?, description = ?, price = ?, duration_min = ?, image_url = ?, active = ?, updated_at = ?
    WHERE id = ?`).run(next.name, next.category, next.description, next.price, next.durationMin, next.imageUrl, next.active, nowIso(), current.id);
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(current.id);
  return res.json({ ok: true, service: mapService(service) });
});

router.delete('/services/:id', (req, res) => {
  const db = getDb();
  const current = db.prepare('SELECT id FROM services WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ ok: false, error: 'Service not found.' });
  const used = db.prepare('SELECT COUNT(*) AS n FROM bookings WHERE service_id = ?').get(current.id).n;
  if (used > 0) {
    db.prepare('UPDATE services SET active = 0, updated_at = ? WHERE id = ?').run(nowIso(), current.id);
    return res.json({ ok: true, removed: 'deactivated' });
  }
  db.prepare('DELETE FROM services WHERE id = ?').run(current.id);
  return res.json({ ok: true, removed: 'deleted' });
});

router.get('/bookings', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const db = getDb();
  const rows = status && BOOKING_STATUSES.includes(status)
    ? db.prepare(`${bookingSelect} WHERE b.status = ? ORDER BY b.created_at DESC LIMIT 200`).all(status)
    : db.prepare(`${bookingSelect} ORDER BY b.created_at DESC LIMIT 200`).all();
  res.json({ ok: true, bookings: rows.map(mapBooking) });
});

const updateBookingSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  professionalId: z.string().trim().min(3).max(80).nullable().optional(),
});

router.patch('/bookings/:id', validate(updateBookingSchema), asyncRoute(async (req, res) => {
  const db = getDb();
  const current = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(req.params.id);
  if (!current) return res.status(404).json({ ok: false, error: 'Booking not found.' });

  let professionalId = req.body.professionalId === undefined ? current.professional_id : req.body.professionalId;
  let professionalName = current.professional_name;
  if (req.body.professionalId) {
    const professional = db.prepare('SELECT * FROM professionals WHERE id = ? AND active = 1').get(req.body.professionalId);
    if (!professional) return res.status(400).json({ ok: false, error: 'Choose an active professional.' });
    professionalId = professional.id;
    professionalName = professional.name;
  }
  if (req.body.professionalId === null) {
    professionalId = null;
    professionalName = null;
  }

  const needsProfessional = ['assigned', 'accepted', 'in_progress', 'completed'].includes(req.body.status);
  if (needsProfessional && !professionalId) {
    return res.status(400).json({ ok: false, error: 'Assign a professional before this status.' });
  }

  const changed = current.status !== req.body.status || current.professional_id !== professionalId;
  if (changed) {
    db.prepare(`UPDATE bookings SET status = ?, professional_id = ?, professional_name = ?, updated_at = ? WHERE id = ?`).run(
      req.body.status, professionalId, professionalName, nowIso(), current.id,
    );
    const copy = statusCopy(req.body.status, current.service_name);
    const notificationId = queueNotification(db, {
      customerId: current.customer_id,
      bookingId: current.id,
      title: copy.title,
      body: professionalName && req.body.status === 'assigned' ? `${professionalName} is assigned to your ${current.service_name} booking.` : copy.body,
    });
    const providerNoteId = professionalId
      ? queueProviderNotification(db, {
        professionalId,
        bookingId: current.id,
        title: 'New job assigned',
        body: `${current.service_name} in ${current.city} was assigned to you.`,
      })
      : null;
    await deliverNotification(db, notificationId);
    await deliverProviderNotification(db, providerNoteId);
  }

  const booking = db.prepare(`${bookingSelect} WHERE b.id = ?`).get(current.id);
  return res.json({ ok: true, booking: mapBooking(booking) });
}));

const notifySchema = z.object({
  customerId: z.string().trim().min(8).max(80),
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(3).max(300),
  bookingId: z.string().trim().min(8).max(80).optional(),
});

router.post('/notifications', validate(notifySchema), asyncRoute(async (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(req.body.customerId);
  if (!customer) return res.status(404).json({ ok: false, error: 'Customer not found.' });
  if (req.body.bookingId) {
    const booking = db.prepare('SELECT id FROM bookings WHERE id = ? AND customer_id = ?').get(req.body.bookingId, customer.id);
    if (!booking) return res.status(400).json({ ok: false, error: 'That booking does not belong to this customer.' });
  }
  const id = queueNotification(db, {
    customerId: customer.id,
    bookingId: req.body.bookingId || null,
    title: req.body.title,
    body: req.body.body,
  });
  await deliverNotification(db, id);
  const note = db.prepare(`SELECT n.*, c.name AS customer_name, c.mobile AS customer_mobile
    FROM notifications n JOIN customers c ON c.id = n.customer_id WHERE n.id = ?`).get(id);
  return res.status(201).json({ ok: true, notification: mapNotification(note) });
}));

router.get('/notifications', (_req, res) => {
  const rows = getDb().prepare(`SELECT n.*, c.name AS customer_name, c.mobile AS customer_mobile
    FROM notifications n JOIN customers c ON c.id = n.customer_id
    ORDER BY n.created_at DESC LIMIT 50`).all();
  res.json({ ok: true, notifications: rows.map(mapNotification) });
});

export default router;
