const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { filterMessages } = require('../middleware/privacyFilter');

const router = express.Router();

// GET /api/messages — messages for current user
router.get('/', requireAuth, (req, res) => {
  const db = getDb();

  const rows = db.prepare(`
    SELECT m.*,
           fu.username AS from_username,
           fu.character_name AS from_character,
           tu.username AS to_username,
           tu.character_name AS to_character
    FROM messages m
    LEFT JOIN users fu ON m.from_user_id = fu.id
    LEFT JOIN users tu ON m.to_user_id = tu.id
    ORDER BY m.created_at DESC
  `).all();

  const filtered = filterMessages(rows, req.user);
  res.json({ messages: filtered });
});

// POST /api/messages — GM only: send a message to a player or all
router.post('/', requireGm, (req, res) => {
  const { to_username, subject, body, is_secret = false } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'subject and body are required' });

  const db = getDb();
  let to_user_id = null;

  if (to_username) {
    const recipient = db.prepare('SELECT id FROM users WHERE username = ?').get(to_username);
    if (!recipient) return res.status(404).json({ error: `User "${to_username}" not found` });
    to_user_id = recipient.id;
  }

  const result = db.prepare(`
    INSERT INTO messages (from_user_id, to_user_id, subject, body, is_secret)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, to_user_id, subject, body, is_secret ? 1 : 0);

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: msg });
});

// PUT /api/messages/:id/read — mark message as read
router.put('/:id/read', requireAuth, (req, res) => {
  const db = getDb();
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  // Only the recipient (or broadcasts) can mark as read
  if (msg.to_user_id !== null && msg.to_user_id !== req.user.id && req.user.role !== 'gm') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ?').run(msg.id);
  res.json({ success: true });
});

module.exports = router;
