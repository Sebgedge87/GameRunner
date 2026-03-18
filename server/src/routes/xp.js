const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { createNotification } = require('../services/notifications');

const router = express.Router();

// XP level thresholds per system
const XP_THRESHOLDS = {
  // D&D 5e — 20 levels
  dnd5e: [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
    85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],
  // Call of Cthulhu — advances via percentile skill checks, no XP levels; approximate milestones
  coc: [0, 10, 25, 50, 80, 120, 170, 230, 300, 380, 470],
  // Alien RPG — uses career rank (1-5), thresholds are approximate XP milestones
  alien: [0, 50, 150, 300, 500],
  // Coriolis — same 5-rank structure
  coriolis: [0, 50, 150, 300, 500],
  // Dune Adventures in the Imperium — 5 ranks
  dune: [0, 50, 150, 300, 500],
  // Default fallback (generic)
  default: [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500],
};

function thresholdsFor(system) {
  return XP_THRESHOLDS[system] || XP_THRESHOLDS.default;
}

function levelFor(xp, system) {
  const thresholds = thresholdsFor(system);
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1; else break;
  }
  return level;
}

// GET /api/xp — totals per player (+ award history for GM)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  if (!campId) return res.json({ totals: [], awards: [] });

  const awards = db.prepare(`
    SELECT xa.*, u.username, u.character_name
    FROM xp_awards xa
    JOIN users u ON xa.awarded_to = u.id
    WHERE xa.campaign_id = ?
    ORDER BY xa.awarded_at DESC
  `).all(campId);

  // Determine campaign system for level calculation
  const campaign = campId ? db.prepare('SELECT system FROM campaigns WHERE id = ?').get(campId) : null;
  const system = campaign?.system || 'default';

  // Build per-player totals
  const totals = {};
  awards.forEach(a => {
    if (!totals[a.awarded_to]) totals[a.awarded_to] = { user_id: a.awarded_to, username: a.username, character_name: a.character_name, total: 0 };
    totals[a.awarded_to].total += a.amount;
  });
  Object.values(totals).forEach(t => { t.level = levelFor(t.total, system); });

  res.json({
    totals: Object.values(totals),
    awards: req.user.isGm ? awards : awards.filter(a => a.awarded_to === req.user.id),
  });
});

// POST /api/xp — GM awards XP to one or more players
router.post('/', requireGm, (req, res) => {
  const { user_ids, amount, reason } = req.body;
  if (!user_ids || !amount) return res.status(400).json({ error: 'user_ids and amount required' });
  const ids = Array.isArray(user_ids) ? user_ids : [user_ids];
  if (!ids.length || !Number.isInteger(Number(amount))) return res.status(400).json({ error: 'Invalid input' });
  const db = getDb();
  const campId = getCampaignId(req);

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
    const campSys = campId ? (db.prepare('SELECT system FROM campaigns WHERE id = ?').get(campId)?.system || 'default') : 'default';
    const total = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM xp_awards WHERE awarded_to = ? AND campaign_id = ?').get(uid, campId).t;
    const prev = total - Number(amount);
    if (levelFor(total, campSys) > levelFor(prev, campSys)) {
      try { createNotification(db, uid, 'xp', `Level up! You are now level ${levelFor(total, campSys)}`, '', ''); } catch (_) {}
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
