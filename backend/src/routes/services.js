import { Router } from 'express';
import { getDb } from '../db.js';
import { mapService } from '../mappers.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = getDb().prepare('SELECT * FROM services WHERE active = 1 ORDER BY category, name').all();
  res.json({ ok: true, services: rows.map(mapService) });
});

export default router;
