import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { app } from './app.js';
import { config } from './config.js';
import { initDb } from './db.js';
import { initFirebase } from './services/firebaseService.js';

initDb();
await initFirebase();

if (!fs.existsSync(config.sslKey) || !fs.existsSync(config.sslCert)) {
  console.error('SSL certificate missing. From the repo root run: npm run cert');
  process.exit(1);
}

const server = https.createServer(
  {
    key: fs.readFileSync(config.sslKey),
    cert: fs.readFileSync(config.sslCert),
    minVersion: 'TLSv1.2',
  },
  app,
);

server.listen(config.port, () => {
  console.log(`TidyZo API listening on https://localhost:${config.port}`);
  if (config.allowDebugOtp) {
    console.log('Demo OTP is included in /api/v1/auth/otp/request responses.');
    console.log('Admin login: admin@tidyzo.app / Admin@12345');
  }
});

if (config.nodeEnv !== 'production') {
  http.createServer(app).listen(8080, () => {
    console.log('Phone and simulator API listening on http://localhost:8080');
  });
}
