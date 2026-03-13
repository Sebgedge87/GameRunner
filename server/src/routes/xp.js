const express = require('express');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { createNotification } = require('../services/notifications');

const router = express.Router();

// XP level thresholds (D&D 5e defaults — system-agnostic label used otherwise)
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

function levelFor(xp) {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1; else break;
  }
  return level;
}

// GET /api/xp — totals per player (+ award history for GM)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  const campClause = campId ? 'AND (xa.campaign_id = ? OR xa.campaign_id IS NULL)' : '';
  const params = campId ? [campId] : [];

  const awards = db.prepare(`
    SELECT xa.*, u.username, u.character_name
    FROM xp_awards xa
    JOIN users u ON xa.awarded_to = u.id
    WHERE 1=1 ${campClause}
    ORDER BY xa.awarded_at DESC
  `).all(...params);

  // Build per-player totals
  const totals = {};
  awards.forEach(a => {
    if (!totals[a.awarded_to]) totals[a.awarded_to] = { user_id: a.awarded_to, username: a.username, character_name: a.character_name, total: 0 };
    totals[a.awarded_to].total += a.amount;
  });
  Object.values(totals).forEach(t => { t.level = levelFor(t.total); });

  res.json({
    totals: Object.values(totals),
    awards: req.user.role === 'gm' ? awards : awards.filter(a => a.awarded_to === req.user.id),
  });
});

// POST /api/xp — GM awards XP to one or more players
router.post('/', requireGm, (req, res) => {
  const { user_ids, amount, reason } = req.body;
  if (!user_ids || !amount) return res.status(400).json({ error: 'user_ids and amount required' });
  const ids = Array.isArray(user_ids) ? user_ids : [user_ids];
  if (!ids.length || !Number.isInteger(Number(amount))) return res.status(400).json({ error: 'Invalid input' });
  const db = getDb();
  const campId = getActiveCampaignId();

  const insert = db.prepare('INSERT INTO xp_awards (campaign_id, awarded_to, amount, reason, awarded_by) VALUES (?, ?, ?, ?, ?)');
  const awards = [];
  for (const uid of ids) {
    const r = insert.run(campId || null, uid, Number(amount), reason || null, req.user.id);
    awards.push(db.prepare('SELECT * FROM xp_awards WHERE id = ?').get(r.lastInsertRowid));
    // Notify player
    try {
      createNotification(db, uid, 'xp', `+${amount} XP awarded${reason ? `: ${reason}` : ''}`, '', '');
    } catch (_) {}
    // Check level-up: get total for this player
    const total = db.prepare(`SELECT COALESCE(SUM(amount),0) as t FROM xp_awards WHERE awarded_to = ?${campId?' AND (campaign_id=? OR campaign_id IS NULL)':''}`).get(...(campId?[uid,campId]:[uid])).t;
    const prev = total - Number(amount);
    if (levelFor(total) > levelFor(prev)) {
      try { createNotification(db, uid, 'xp', `Level up! You are now level ${levelFor(total)}`, '', ''); } catch (_) {}
    }
  }
  res.status(201).json({ awards });
});

// DELETE /api/xp/:id — GM removes an award
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM xp_awards WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
