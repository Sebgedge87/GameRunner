const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ maps: [] });
  const maps = db.prepare(`SELECT * FROM maps WHERE campaign_id = ? ${hiddenClause} ORDER BY created_at DESC`).all(campId);
  res.json({ maps });
});

makeHiddenToggle(router, 'maps');

router.post('/', requireGm, (req, res) => {
  const { title, description, image_path, map_type = 'world' } = req.body;
  if (!title || !image_path) return res.status(400).json({ error: 'title and image_path are required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO maps (campaign_id, title, description, image_path, map_type)
    VALUES (?, ?, ?, ?, ?)
  `).run(campId || null, title, description || null, image_path, map_type);
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ map });
});

router.put('/:id', requireGm, (req, res) => {
  const { title, description, map_type } = req.body;
  const db = getDb();
  db.prepare(`UPDATE maps SET title = COALESCE(?, title), description = COALESCE(?, description), map_type = COALESCE(?, map_type) WHERE id = ?`)
    .run(title || null, description || null, map_type || null, req.params.id);
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  res.json({ map });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM maps WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
