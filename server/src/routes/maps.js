const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const maps = db.prepare('SELECT * FROM maps ORDER BY created_at DESC').all();
  res.json({ maps });
});

router.post('/', requireGm, (req, res) => {
  const { title, description, image_path, map_type = 'world', campaign_id } = req.body;
  if (!title || !image_path) return res.status(400).json({ error: 'title and image_path are required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO maps (campaign_id, title, description, image_path, map_type)
    VALUES (?, ?, ?, ?, ?)
  `).run(campaign_id || null, title, description || null, image_path, map_type);
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ map });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM maps WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
