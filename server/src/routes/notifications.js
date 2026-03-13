const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/notifications — user's notifications, unread first
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY read_at IS NOT NULL, created_at DESC LIMIT 50').all(req.user.id);
  const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL').get(req.user.id).c;
  res.json({ notifications: notifs, unread });
});

// PUT /api/notifications/read-all — must come before /:id/read to avoid collision
router.put('/read-all', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL').run(req.user.id);
  res.json({ success: true });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
