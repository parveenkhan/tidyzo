import { Router } from 'express';
import { getDb } from '../db.js';
import { mapNotification } from '../mappers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth('customer'));

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM notifications WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100`).all(req.auth.sub);
  const unread = db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE customer_id = ? AND is_read = 0').get(req.auth.sub).n;
  res.json({ ok: true, notifications: rows.map(mapNotification), unread });
});

router.post('/read-all', (req, res) => {
  getDb().prepare('UPDATE notifications SET is_read = 1 WHERE customer_id = ? AND is_read = 0').run(req.auth.sub);
  res.json({ ok: true });
});

router.post('/:id/read', (req, res) => {
  const result = getDb().prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND customer_id = ?').run(req.params.id, req.auth.sub);
  if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Notification not found.' });
  return res.json({ ok: true });
});

export default router;
