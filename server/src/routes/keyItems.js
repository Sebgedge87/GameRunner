const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ key_items: [] });
  const items = db.prepare(`SELECT * FROM key_items WHERE campaign_id = ? ${hiddenClause} ORDER BY created_at DESC`).all(campId);
  res.json({ key_items: items });
});

makeHiddenToggle(router, 'key_items');

router.post('/', requireGm, (req, res) => {
  const { name, description, significance, image_path, linked_quest } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO key_items (campaign_id, name, description, significance, image_path, linked_quest)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(campId || null, name, description || null, significance || null, image_path || null, linked_quest || null);
  const item = db.prepare('SELECT * FROM key_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, significance, image_path, linked_quest } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE key_items SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      significance = COALESCE(?, significance),
      image_path = COALESCE(?, image_path),
      linked_quest = COALESCE(?, linked_quest)
    WHERE id = ?
  `).run(name, description, significance, image_path, linked_quest, req.params.id);
  const item = db.prepare('SELECT * FROM key_items WHERE id = ?').get(req.params.id);
  res.json({ item });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM key_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
