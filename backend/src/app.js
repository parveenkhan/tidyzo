import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import providerRoutes from './routes/provider.js';
import { errorHandler, notFound } from './middleware/error.js';
import { TIME_SLOTS } from './config.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;
    return callback(null, allowed.test(origin));
  },
}));
app.use(express.json({ limit: '32kb' }));
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Try again shortly.' },
});
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many code requests. Try again shortly.' },
});

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>TidyZo API</title></head>
<body style="font-family:Georgia,serif;background:#F4F7F5;color:#14221E;padding:48px">
<h1>TidyZo API</h1>
<p>HTTPS is active. You can close this tab and return to the app.</p>
</body></html>`);
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tidyzo-api', secure: true });
});

app.get('/api/v1/meta', (_req, res) => {
  res.json({ ok: true, timeSlots: TIME_SLOTS });
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth/otp', otpLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);
