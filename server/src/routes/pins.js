const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/pins
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const pins = db.prepare('SELECT * FROM pins WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ pins });
});

// POST /api/pins
router.post('/', requireAuth, (req, res) => {
  const { item_type, item_id, item_title } = req.body;
  if (!item_type || !item_id) return res.status(400).json({ error: 'item_type and item_id required' });
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO pins (user_id, item_type, item_id, item_title) VALUES (?, ?, ?, ?)')
    .run(req.user.id, item_type, item_id, item_title || null);
  const pin = db.prepare('SELECT * FROM pins WHERE user_id = ? AND item_type = ? AND item_id = ?').get(req.user.id, item_type, item_id);
  res.status(201).json({ pin });
});

// DELETE /api/pins/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const pin = db.prepare('SELECT * FROM pins WHERE id = ?').get(req.params.id);
  if (!pin || pin.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM pins WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
