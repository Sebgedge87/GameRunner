const express = require('express');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  const hiddenClause = req.user.role === 'gm' ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const maps = campId
    ? db.prepare(`SELECT * FROM maps WHERE (campaign_id = ? OR campaign_id IS NULL) ${hiddenClause} ORDER BY created_at DESC`).all(campId)
    : db.prepare(`SELECT * FROM maps WHERE 1=1 ${hiddenClause} ORDER BY created_at DESC`).all();
  res.json({ maps });
});

router.put('/:id/hidden', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, hidden FROM maps WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const newVal = row.hidden ? 0 : 1;
  db.prepare('UPDATE maps SET hidden = ? WHERE id = ?').run(newVal, req.params.id);
  res.json({ hidden: newVal });
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
