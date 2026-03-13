const express = require('express');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  const hiddenClause = req.user.role === 'gm' ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const items = campId
    ? db.prepare(`SELECT * FROM key_items WHERE (campaign_id = ? OR campaign_id IS NULL) ${hiddenClause} ORDER BY created_at DESC`).all(campId)
    : db.prepare(`SELECT * FROM key_items WHERE 1=1 ${hiddenClause} ORDER BY created_at DESC`).all();
  res.json({ key_items: items });
});

router.put('/:id/hidden', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, hidden FROM key_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const newVal = row.hidden ? 0 : 1;
  db.prepare('UPDATE key_items SET hidden = ? WHERE id = ?').run(newVal, req.params.id);
  res.json({ hidden: newVal });
});

router.post('/', requireGm, (req, res) => {
  const { name, description, significance, image_path, linked_quest, campaign_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO key_items (campaign_id, name, description, significance, image_path, linked_quest)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(campaign_id || null, name, description || null, significance || null, image_path || null, linked_quest || null);
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
