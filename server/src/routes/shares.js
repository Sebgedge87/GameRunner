const express = require('express');
const { getDb } = require('../db/database');
const { requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/shares/:type/:id — return user_ids this item is shared with (GM)
router.get('/:type/:id', requireGm, (req, res) => {
  const user_ids = getDb()
    .prepare('SELECT user_id FROM item_shares WHERE item_type = ? AND item_id = ?')
    .all(req.params.type, req.params.id)
    .map(r => r.user_id);
  res.json({ user_ids });
});

// POST /api/shares — set shares for an item, replacing any existing (GM)
// Body: { item_type, item_id, user_ids: [] }
router.post('/', requireGm, (req, res) => {
  const { item_type, item_id, user_ids } = req.body;
  if (!item_type || item_id == null) return res.status(400).json({ error: 'item_type and item_id required' });
  const db = getDb();
  db.prepare('DELETE FROM item_shares WHERE item_type = ? AND item_id = ?').run(item_type, item_id);
  if (Array.isArray(user_ids) && user_ids.length) {
    const insert = db.prepare('INSERT OR IGNORE INTO item_shares (item_type, item_id, user_id) VALUES (?, ?, ?)');
    for (const uid of user_ids) insert.run(item_type, item_id, uid);
  }
  res.json({ success: true });
});

module.exports = router;
