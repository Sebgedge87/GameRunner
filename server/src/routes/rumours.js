const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/rumours — return rumours the current user has been exposed to
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'gm') {
    const rumours = db.prepare('SELECT * FROM rumours ORDER BY created_at DESC').all();
    return res.json({ rumours });
  }
  const rumours = db.prepare(`
    SELECT r.*, re.exposed_at
    FROM rumours r
    JOIN rumour_exposure re ON re.rumour_id = r.id
    WHERE re.user_id = ?
    ORDER BY re.exposed_at DESC
  `).all(req.user.id);
  // Never expose is_true to players
  const safe = rumours.map(({ is_true, ...r }) => r);
  res.json({ rumours: safe });
});

// POST /api/rumours — GM creates rumour
router.post('/', requireGm, (req, res) => {
  const { text, is_true = false, source_npc, source_location, campaign_id } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO rumours (campaign_id, text, is_true, source_npc, source_location) VALUES (?, ?, ?, ?, ?)')
    .run(campaign_id || null, text, is_true ? 1 : 0, source_npc || null, source_location || null);
  const rumour = db.prepare('SELECT * FROM rumours WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ rumour });
});

// POST /api/rumours/:id/expose — GM exposes rumour to one or more players
router.post('/:id/expose', requireGm, (req, res) => {
  const { user_ids } = req.body;
  if (!Array.isArray(user_ids) || !user_ids.length) return res.status(400).json({ error: 'user_ids required' });
  const db = getDb();
  for (const uid of user_ids) {
    db.prepare('INSERT OR IGNORE INTO rumour_exposure (rumour_id, user_id) VALUES (?, ?)').run(req.params.id, uid);
  }
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM rumour_exposure WHERE rumour_id = ?').run(req.params.id);
  db.prepare('DELETE FROM rumours WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
