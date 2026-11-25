import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config, nowIso } from './config.js';
import { hashPassword } from './security/password.js';

let database;

const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address_line TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  fcm_token TEXT,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skill TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  fcm_token TEXT,
  token_version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  professional_id TEXT,
  professional_name TEXT,
  price INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  booking_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  push_status TEXT NOT NULL DEFAULT 'in_app',
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_challenges(mobile, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id, created_at);
`;

const SERVICES = [
  ['svc-home-cleaning', 'Home Cleaning', 'Cleaning', 'A 1 BHK tidy-up with dusting, mopping, and kitchen wipe-down.', 499, 90, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80'],
  ['svc-deep-cleaning', 'Deep Cleaning', 'Cleaning', 'Detailed cleaning of floors, bathrooms, kitchen cabinets, and fans.', 1499, 180, 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80'],
  ['svc-bathroom', 'Bathroom Cleaning', 'Cleaning', 'Descaling, stain removal, and sanitizing for two bathrooms.', 699, 75, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'],
  ['svc-plumbing', 'Plumbing Repair', 'Repairs', 'Leak fix, tap replacement, or blockage clearing for one point.', 349, 60, 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1200&q=80'],
  ['svc-electrician', 'Electrician Visit', 'Repairs', 'Switchboard, fan, or light fitting check by a certified electrician.', 299, 60, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80'],
  ['svc-ac', 'AC Service', 'Appliance', 'Filter clean, gas check, and performance test for one split AC.', 599, 75, 'https://images.unsplash.com/photo-1631545806609-35d4ae440431?auto=format&fit=crop&w=1200&q=80'],
  ['svc-salon', 'Salon at Home', 'Beauty', 'Haircut and basic styling at your doorstep.', 799, 60, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80'],
  ['svc-painting', 'Wall Painting', 'Painting', 'One accent wall, paint included up to 120 sq ft.', 2499, 240, 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80'],
];

const PROFESSIONALS = [
  ['pro-raju', 'Raju Kumar', 'Cleaning', '9800000001'],
  ['pro-imran', 'Imran Sheikh', 'Repairs', '9800000002'],
  ['pro-neha', 'Neha Singh', 'Beauty', '9800000003'],
  ['pro-arjun', 'Arjun Das', 'Appliance', '9800000004'],
];

export function getDb() {
  if (!database) throw new Error('Database is not initialised');
  return database;
}

export function initDb() {
  if (database) return database;
  if (config.dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  }
  database = new DatabaseSync(config.dbPath);
  database.exec(SCHEMA);
  migrate(database);
  seed(database);
  return database;
}

function migrate(db) {
  const columns = db.prepare('PRAGMA table_info(professionals)').all();
  const names = new Set(columns.map((column) => column.name));
  if (!names.has('fcm_token')) db.exec('ALTER TABLE professionals ADD COLUMN fcm_token TEXT');
  if (!names.has('token_version')) db.exec('ALTER TABLE professionals ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1');
  if (!names.has('city')) db.exec("ALTER TABLE professionals ADD COLUMN city TEXT NOT NULL DEFAULT ''");
  if (!names.has('range_km')) db.exec('ALTER TABLE professionals ADD COLUMN range_km INTEGER NOT NULL DEFAULT 0');
  if (!names.has('latitude')) db.exec('ALTER TABLE professionals ADD COLUMN latitude REAL');
  if (!names.has('longitude')) db.exec('ALTER TABLE professionals ADD COLUMN longitude REAL');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_professionals_phone ON professionals(phone)');
  const bookingNames = new Set(db.prepare('PRAGMA table_info(bookings)').all().map((column) => column.name));
  if (!bookingNames.has('payment_method')) db.exec("ALTER TABLE bookings ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'");
  if (!bookingNames.has('payment_status')) db.exec("ALTER TABLE bookings ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'");
  if (!bookingNames.has('platform_fee')) db.exec('ALTER TABLE bookings ADD COLUMN platform_fee INTEGER NOT NULL DEFAULT 0');
  if (!bookingNames.has('provider_amount')) db.exec('ALTER TABLE bookings ADD COLUMN provider_amount INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE bookings SET provider_amount = price WHERE provider_amount = 0 AND platform_fee = 0 AND payment_method = \'cash\'');
  db.exec(`CREATE TABLE IF NOT EXISTS provider_declines (
    professional_id TEXT NOT NULL,
    booking_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (professional_id, booking_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS provider_notifications (
    id TEXT PRIMARY KEY,
    professional_id TEXT NOT NULL,
    booking_id TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    push_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES professionals(id)
  )`);
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_notice_booking ON provider_notifications(professional_id, booking_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_provider_notifications ON provider_notifications(professional_id, created_at)');
}

function seed(db) {
  const now = nowIso();
  const admin = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@tidyzo.app');
  if (!admin) {
    db.prepare('INSERT INTO admins (id, email, password_hash, name, token_version, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(
      'admin-root',
      'admin@tidyzo.app',
      hashPassword('Admin@12345'),
      'TidyZo Admin',
      now,
    );
  }

  const insertPro = db.prepare('INSERT OR IGNORE INTO professionals (id, name, skill, phone, active) VALUES (?, ?, ?, ?, 1)');
  for (const row of PROFESSIONALS) insertPro.run(...row);

  const count = db.prepare('SELECT COUNT(*) AS n FROM services').get().n;
  if (count === 0) {
    const insert = db.prepare(`INSERT INTO services
      (id, name, category, description, price, duration_min, image_url, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`);
    for (const row of SERVICES) insert.run(...row, now, now);
  }
}
