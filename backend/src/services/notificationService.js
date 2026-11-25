import { randomUUID } from 'node:crypto';
import { nowIso } from '../config.js';
import { sendPush } from './firebaseService.js';
import { withinRange } from '../places.js';

export function queueNotification(db, { customerId, bookingId = null, title, body }) {
  const id = randomUUID();
  const createdAt = nowIso();
  db.prepare(`INSERT INTO notifications
    (id, customer_id, booking_id, title, body, is_read, push_status, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'pending', ?)`).run(id, customerId, bookingId, title, body, createdAt);
  return id;
}

export async function deliverNotification(db, id) {
  const row = db.prepare(`SELECT n.id, n.title, n.body, n.booking_id, c.fcm_token
    FROM notifications n JOIN customers c ON c.id = n.customer_id WHERE n.id = ?`).get(id);
  if (!row) return;
  const result = await sendPush(row.fcm_token, row.title, row.body, {
    notificationId: row.id,
    bookingId: row.booking_id || '',
  });
  db.prepare('UPDATE notifications SET push_status = ? WHERE id = ?').run(result.status, id);
}

export function queueProviderNotification(db, { professionalId, bookingId = null, title, body }) {
  if (bookingId) {
    const existing = db.prepare('SELECT id FROM provider_notifications WHERE professional_id = ? AND booking_id = ?').get(professionalId, bookingId);
    if (existing) return null;
  }
  const id = randomUUID();
  db.prepare(`INSERT INTO provider_notifications
    (id, professional_id, booking_id, title, body, is_read, push_status, created_at)
    VALUES (?, ?, ?, ?, ?, 0, 'pending', ?)`).run(id, professionalId, bookingId, title, body, nowIso());
  return id;
}

export function queueAreaProviderNotifications(db, booking) {
  const providers = db.prepare('SELECT * FROM professionals WHERE active = 1').all();
  const ids = [];
  for (const provider of providers) {
    const sameSkill = String(provider.skill || '').toLowerCase() === String(booking.category || '').toLowerCase();
    if (!sameSkill || !withinRange(provider, booking.city)) continue;
    const id = queueProviderNotification(db, {
      professionalId: provider.id,
      bookingId: booking.id,
      title: 'New job nearby',
      body: `${booking.service_name} in ${booking.city} is inside your range.`,
    });
    if (id) ids.push(id);
  }
  return ids;
}

export async function deliverProviderNotification(db, id) {
  if (!id) return;
  const row = db.prepare(`SELECT n.id, n.title, n.body, n.booking_id, p.fcm_token
    FROM provider_notifications n JOIN professionals p ON p.id = n.professional_id WHERE n.id = ?`).get(id);
  if (!row) return;
  const result = await sendPush(row.fcm_token, row.title, row.body, {
    notificationId: row.id,
    bookingId: row.booking_id || '',
  });
  db.prepare('UPDATE provider_notifications SET push_status = ? WHERE id = ?').run(result.status, id);
}

export function statusCopy(status, serviceName) {
  const name = serviceName || 'service';
  const messages = {
    pending: ['Booking received', `We received your ${name} request. TidyZo will confirm it shortly.`],
    approved: ['Booking approved', `Your ${name} booking is approved.`],
    assigned: ['Professional assigned', `A professional is assigned to your ${name} booking.`],
    accepted: ['Professional accepted', `Your professional accepted the ${name} visit.`],
    in_progress: ['Service started', `Your ${name} visit is in progress.`],
    completed: ['Service completed', `Your ${name} visit is marked completed.`],
    cancelled: ['Booking cancelled', `Your ${name} booking was cancelled.`],
  };
  const [title, body] = messages[status] || ['Booking update', `Your ${name} booking was updated.`];
  return { title, body };
}
