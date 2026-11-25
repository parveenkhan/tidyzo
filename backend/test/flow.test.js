import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';

process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-jwt-secret-should-be-long-enough';
process.env.OTP_PEPPER = 'test-otp-pepper-should-be-long';
process.env.ALLOW_DEBUG_OTP = 'true';
process.env.NODE_ENV = 'test';
process.env.FIREBASE_SERVICE_ACCOUNT_PATH = '';

const { initDb } = await import('../src/db.js');
const { app } = await import('../src/app.js');

initDb();

let base;
let server;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

async function api(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json();
  return { status: response.status, json };
}

test('customer OTP login, booking, admin update, and notification', async () => {
  const health = await api('/health');
  assert.equal(health.json.ok, true);

  const otp = await api('/api/v1/auth/otp/request', { method: 'POST', body: { mobile: '9876543210' } });
  assert.equal(otp.status, 200);
  assert.match(otp.json.debugOtp, /^\d{6}$/);

  const bad = await api('/api/v1/auth/otp/verify', { method: 'POST', body: { mobile: '9876543210', otp: '000000', intent: 'signup', name: 'Asha' } });
  assert.equal(bad.status, 401);

  const verified = await api('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: { mobile: '9876543210', otp: otp.json.debugOtp, intent: 'signup', name: 'Asha' },
  });
  assert.equal(verified.status, 200);
  const customerToken = verified.json.token;

  const services = await api('/api/v1/services');
  assert.ok(services.json.services.length >= 8);
  const service = services.json.services[0];

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const created = await api('/api/v1/bookings', {
    method: 'POST',
    token: customerToken,
    body: {
      serviceId: service.id,
      date,
      time: '10:00',
      addressLine: '12 Residency Road',
      city: 'Bengaluru',
      country: 'India',
      pincode: '560025',
      notes: 'Call on arrival',
      paymentMethod: 'upi',
    },
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.booking.status, 'pending');
  assert.equal(created.json.booking.paymentMethod, 'upi');
  assert.equal(created.json.booking.paymentStatus, 'paid');
  assert.equal(created.json.booking.platformFee + created.json.booking.providerAmount, service.price);

  const mine = await api('/api/v1/bookings', { token: customerToken });
  assert.equal(mine.json.bookings.length, 1);

  const other = await api('/api/v1/bookings', { token: 'not-a-token' });
  assert.equal(other.status, 401);

  const adminLogin = await api('/api/v1/admin/auth/login', {
    method: 'POST',
    body: { email: 'admin@tidyzo.app', password: 'Admin@12345' },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.json.token;

  const forbidden = await api('/api/v1/admin/bookings', { token: customerToken });
  assert.equal(forbidden.status, 401);

  const pros = await api('/api/v1/admin/professionals', { token: adminToken });
  const professional = pros.json.professionals[0];

  const updated = await api(`/api/v1/admin/bookings/${created.json.booking.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'assigned', professionalId: professional.id },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.booking.status, 'assigned');
  assert.equal(updated.json.booking.professionalName, professional.name);

  const notes = await api('/api/v1/notifications', { token: customerToken });
  assert.ok(notes.json.unread >= 2);
  assert.ok(notes.json.notifications.some((item) => item.title === 'Professional assigned'));

  const custom = await api('/api/v1/admin/notifications', {
    method: 'POST',
    token: adminToken,
    body: {
      customerId: verified.json.customer.id,
      bookingId: created.json.booking.id,
      title: 'On the way',
      body: 'Your professional is leaving the hub.',
    },
  });
  assert.equal(custom.status, 201);

  const after = await api('/api/v1/bookings', { token: customerToken });
  assert.equal(after.json.bookings[0].status, 'assigned');

  const providerOtp = await api('/api/v1/auth/otp/request', { method: 'POST', body: { mobile: professional.phone } });
  const providerLogin = await api('/api/v1/auth/otp/verify', {
    method: 'POST',
    body: { mobile: professional.phone, otp: providerOtp.json.debugOtp, account: 'provider', intent: 'signin' },
  });
  assert.equal(providerLogin.status, 200);
  assert.equal(providerLogin.json.role, 'provider');
  const providerToken = providerLogin.json.token;
  const providerNotes = await api('/api/v1/provider/notifications', { token: providerToken });
  assert.equal(providerNotes.status, 200);
  assert.ok(providerNotes.json.notifications.some((item) => item.bookingId === created.json.booking.id));

  const blocked = await api('/api/v1/bookings', { token: providerToken });
  assert.equal(blocked.status, 401);

  const jobs = await api('/api/v1/provider/bookings', { token: providerToken });
  assert.equal(jobs.json.bookings.length, 1);
  assert.equal(jobs.json.bookings[0].customerName, 'Asha');

  const accepted = await api(`/api/v1/provider/bookings/${created.json.booking.id}`, {
    method: 'PATCH',
    token: providerToken,
    body: { status: 'accepted' },
  });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.json.booking.status, 'accepted');

  const started = await api(`/api/v1/provider/bookings/${created.json.booking.id}`, {
    method: 'PATCH',
    token: providerToken,
    body: { status: 'in_progress' },
  });
  assert.equal(started.status, 200);
  assert.equal(started.json.booking.status, 'in_progress');

  const consumerView = await api('/api/v1/bookings', { token: customerToken });
  assert.equal(consumerView.json.bookings[0].status, 'in_progress');
  const startedNotes = await api('/api/v1/notifications', { token: customerToken });
  assert.ok(startedNotes.json.notifications.some((item) => item.title === 'Service started'));
});
