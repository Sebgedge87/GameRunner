const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/stress — player sees own; GM sees all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = req.user.isGm
    ? db.prepare('SELECT s.*, u.username, u.character_name FROM stress_sanity s JOIN users u ON s.user_id = u.id').all()
    : db.prepare('SELECT * FROM stress_sanity WHERE user_id = ?').all(req.user.id);
  res.json({ stress: rows });
});

// PUT /api/stress/:userId — upsert stress/sanity for a user
router.put('/:userId', requireAuth, (req, res) => {
  if (!req.user.isGm && req.user.id !== Number(req.params.userId)) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  const { campaign_id, stress, stress_max, sanity, sanity_max, exhaustion, panic_threshold, indefinite_insanity } = req.body;
  const db = getDb();
  db.prepare(`INSERT INTO stress_sanity (user_id, campaign_id, stress, stress_max, sanity, sanity_max, exhaustion, panic_threshold, indefinite_insanity, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, campaign_id) DO UPDATE SET
      stress = COALESCE(excluded.stress, stress),
      stress_max = COALESCE(excluded.stress_max, stress_max),
      sanity = COALESCE(excluded.sanity, sanity),
      sanity_max = COALESCE(excluded.sanity_max, sanity_max),
      exhaustion = COALESCE(excluded.exhaustion, exhaustion),
      panic_threshold = COALESCE(excluded.panic_threshold, panic_threshold),
      indefinite_insanity = COALESCE(excluded.indefinite_insanity, indefinite_insanity),
      updated_at = CURRENT_TIMESTAMP`)
    .run(req.params.userId, campaign_id || null, stress ?? null, stress_max ?? null, sanity ?? null, sanity_max ?? null, exhaustion ?? null, panic_threshold ?? null, indefinite_insanity ? 1 : 0);
  const row = db.prepare('SELECT * FROM stress_sanity WHERE user_id = ?').get(req.params.userId);
  res.json({ stress: row });
});

module.exports = router;
