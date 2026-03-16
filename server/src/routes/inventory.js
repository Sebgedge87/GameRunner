const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const items = campId
    ? db.prepare(`SELECT * FROM inventory WHERE (campaign_id = ? OR campaign_id IS NULL) ${hiddenClause} ORDER BY holder, name`).all(campId)
    : db.prepare(`SELECT * FROM inventory WHERE 1=1 ${hiddenClause} ORDER BY holder, name`).all();
  res.json({ inventory: items });
});

makeHiddenToggle(router, 'inventory');

router.post('/', requireGm, (req, res) => {
  const { name, description, quantity = 1, holder = 'party', image_path, campaign_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO inventory (campaign_id, name, description, quantity, holder, image_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(campaign_id || null, name, description || null, quantity, holder, image_path || null);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, quantity, holder, image_path } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE inventory SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      quantity = COALESCE(?, quantity),
      holder = COALESCE(?, holder),
      image_path = COALESCE(?, image_path),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, quantity, holder, image_path, req.params.id);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  res.json({ item });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
