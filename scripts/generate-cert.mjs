import { networkInterfaces } from 'node:os';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'certs');
fs.mkdirSync(dir, { recursive: true });

const ips = new Set(['127.0.0.1', '10.0.2.2']);
for (const entries of Object.values(networkInterfaces())) {
  for (const entry of entries || []) {
    if (entry.family === 'IPv4' && !entry.internal) ips.add(entry.address);
  }
}

const san = ['DNS:localhost', ...[...ips].map((ip) => `IP:${ip}`)].join(',');
const key = path.join(dir, 'key.pem');
const cert = path.join(dir, 'cert.pem');

const result = spawnSync('openssl', [
  'req', '-x509', '-newkey', 'rsa:2048',
  '-keyout', key,
  '-out', cert,
  '-days', '825',
  '-nodes',
  '-subj', '/CN=TidyZo Local/O=TidyZo',
  '-addext', `subjectAltName=${san}`,
], { stdio: 'inherit' });

if (result.status !== 0) process.exit(result.status || 1);
fs.chmodSync(key, 0o600);
console.log(`Wrote ${cert}`);
console.log(`Names: ${san}`);
console.log('Private key stays on this machine and is gitignored.');
