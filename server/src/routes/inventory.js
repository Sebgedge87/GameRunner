const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ inventory: [] });
  const items = db.prepare(`SELECT * FROM inventory WHERE campaign_id = ? ${hiddenClause} ORDER BY holder, name`).all(campId);
  res.json({ inventory: items });
});

makeHiddenToggle(router, 'inventory');

router.post('/', requireGm, (req, res) => {
  const { name, description, quantity = 1, holder = 'party', image_path, owner_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO inventory (campaign_id, name, description, quantity, holder, image_path, owner_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(campId || null, name, description || null, quantity, holder, image_path || null, owner_id || null, req.user.id);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, quantity, holder, image_path, owner_id } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE inventory SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      quantity = COALESCE(?, quantity),
      holder = COALESCE(?, holder),
      image_path = COALESCE(?, image_path),
      owner_id = COALESCE(?, owner_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, quantity, holder, image_path, owner_id, req.params.id);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  res.json({ item });
});

// PUT /api/inventory/:id/transfer — player gives item to another user
router.put('/:id/transfer', requireAuth, (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  const db = getDb();
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  // Only the owner or GM can transfer
  if (!req.user.isGm && item.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only transfer items you own' });
  }
  const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(target_user_id);
  if (!target) return res.status(404).json({ error: 'Target user not found' });
  db.prepare(`UPDATE inventory SET owner_id = ?, holder = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(target_user_id, target.username, req.params.id);
  res.json({ success: true, new_owner: target.username });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
