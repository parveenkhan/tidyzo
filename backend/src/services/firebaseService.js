import fs from 'node:fs';
import { config } from '../config.js';

let messaging = null;

export async function initFirebase() {
  if (!config.firebaseAccountPath) {
    console.log('Firebase: service account not set. Customers still receive in-app and local notifications.');
    return;
  }
  if (!fs.existsSync(config.firebaseAccountPath)) {
    console.warn(`Firebase: file not found at ${config.firebaseAccountPath}`);
    return;
  }
  const admin = (await import('firebase-admin')).default;
  const account = JSON.parse(fs.readFileSync(config.firebaseAccountPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(account) });
  }
  messaging = admin.messaging();
  console.log('Firebase: push delivery is active.');
}

export async function sendPush(token, title, body, data) {
  if (!token) return { status: 'no_token' };
  if (!messaging) return { status: 'in_app' };
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, String(value ?? '')])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    return { status: 'sent' };
  } catch (error) {
    console.warn('Firebase push failed:', error.message);
    return { status: 'failed' };
  }
}
