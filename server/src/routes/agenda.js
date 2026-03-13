const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { broadcastSSE } = require('../services/notifications');

const router = express.Router();

// GET /api/agenda — player sees own; GM sees all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const cards = req.user.role === 'gm'
    ? db.prepare('SELECT a.*, u.username, u.character_name FROM agenda_cards a LEFT JOIN users u ON a.user_id = u.id ORDER BY u.character_name').all()
    : db.prepare('SELECT * FROM agenda_cards WHERE user_id = ?').all(req.user.id);
  res.json({ agenda: cards });
});

// POST /api/agenda — GM creates/upserts agenda card for a player
router.post('/', requireGm, (req, res) => {
  const { user_id, title, body, campaign_id } = req.body;
  if (!user_id || !title) return res.status(400).json({ error: 'user_id and title required' });
  const db = getDb();
  db.prepare(`INSERT INTO agenda_cards (user_id, campaign_id, title, body, revealed, updated_at)
    VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(campaign_id, user_id) DO UPDATE SET title=excluded.title, body=excluded.body, updated_at=CURRENT_TIMESTAMP`)
    .run(user_id, campaign_id || null, title, body || null);
  const card = db.prepare('SELECT * FROM agenda_cards WHERE user_id = ? AND campaign_id IS ?').get(user_id, campaign_id || null);
  res.status(201).json({ card });
});

// PUT /api/agenda/:id/reveal — GM reveals agenda to player
router.put('/:id/reveal', requireGm, (req, res) => {
  const db = getDb();
  const card = db.prepare('SELECT * FROM agenda_cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE agenda_cards SET revealed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  broadcastSSE(card.user_id, { type: 'agenda_revealed', card_id: card.id, title: card.title });
  res.json({ success: true });
});

// DELETE /api/agenda/:id
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM agenda_cards WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
