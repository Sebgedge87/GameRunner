const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { createNotification, broadcastSSE } = require('../services/notifications');

const router = express.Router();

// GET /api/messages — inbox + sent for current user, scoped to active campaign
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const rows = db.prepare(`
    SELECT m.*,
           fu.username AS from_username,
           fu.character_name AS from_character,
           tu.username AS to_username,
           tu.character_name AS to_character
    FROM messages m
    LEFT JOIN users fu ON m.from_user_id = fu.id
    LEFT JOIN users tu ON m.to_user_id = tu.id
    WHERE (m.to_user_id = ? OR m.from_user_id = ? OR m.to_user_id IS NULL)
      AND m.campaign_id = ?
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, campId);

  // Strip secret flag body from players if they are not the recipient
  const filtered = rows.map(m => {
    if (m.is_secret && !req.user.isGm && m.to_user_id !== req.user.id) {
      return { ...m, body: '[secret]' };
    }
    return m;
  });
  res.json({ messages: filtered });
});

// DELETE /api/messages/:id — sender or GM can delete
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.from_user_id !== req.user.id && !req.user.isGm) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('UPDATE messages SET reply_to_id = NULL WHERE reply_to_id = ?').run(msg.id);
  db.prepare('DELETE FROM messages WHERE id = ?').run(msg.id);
  res.json({ success: true });
});

// POST /api/messages — any authenticated user can send
router.post('/', requireAuth, (req, res) => {
  const { to_user_id, to_username, subject, body, is_secret = false, requires_ack = false, reply_to_id = null } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'subject and body are required' });

  // Players cannot send secret messages
  if (is_secret && !req.user.isGm) {
    return res.status(403).json({ error: 'Only the GM can send secret messages' });
  }

  const db = getDb();
  const campId = getCampaignId(req);
  let recipientId = to_user_id || null;

  if (!recipientId && to_username) {
    const recipient = db.prepare('SELECT id FROM users WHERE username = ?').get(to_username);
    if (!recipient) return res.status(404).json({ error: `User "${to_username}" not found` });
    recipientId = recipient.id;
  }

  const result = db.prepare(`
    INSERT INTO messages (from_user_id, to_user_id, subject, body, is_secret, requires_ack, reply_to_id, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, recipientId, subject, body, is_secret ? 1 : 0, requires_ack ? 1 : 0, reply_to_id || null, campId);

  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

  // Notify recipient via SSE + persistent notification
  if (recipientId) {
    const sender = req.user.character_name || req.user.username;
    createNotification(db, recipientId, 'message', `Message from ${sender}`, subject, `/messages/${msg.id}`);
    broadcastSSE(recipientId, { type: 'new_message', message_id: msg.id, from: sender, subject });
  }

  res.status(201).json({ message: msg });
});

// PUT /api/messages/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  const db = getDb();
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.to_user_id !== null && msg.to_user_id !== req.user.id && !req.user.isGm) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = ?').run(msg.id);
  res.json({ success: true });
});

// PUT /api/messages/:id/ack — acknowledge a message that requires_ack
router.put('/:id/ack', requireAuth, (req, res) => {
  const db = getDb();
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.to_user_id !== req.user.id && !req.user.isGm) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('UPDATE messages SET acked_at = CURRENT_TIMESTAMP, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = ?').run(msg.id);
  if (msg.from_user_id) {
    broadcastSSE(msg.from_user_id, { type: 'message_acked', message_id: msg.id, from: req.user.character_name || req.user.username });
  }
  res.json({ success: true });
});

module.exports = router;
