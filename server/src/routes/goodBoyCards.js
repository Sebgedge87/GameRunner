const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { broadcastSSE } = require('../services/notifications');

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function notifyUser(userId, payload) {
  broadcastSSE(userId, payload);
}

function broadcastToGms(db, campaignId, payload) {
  const gms = db.prepare(
    "SELECT user_id FROM campaign_members WHERE campaign_id = ? AND role = 'gm'"
  ).all(campaignId);
  for (const g of gms) broadcastSSE(g.user_id, payload);
}

// ── GET /api/good-boy-cards/definitions ───────────────────────────────────
router.get('/definitions', requireAuth, (_req, res) => {
  const defs = getDb().prepare('SELECT * FROM good_boy_card_defs ORDER BY type, tier, id').all();
  res.json({ defs });
});

// ── GET /api/good-boy-cards/my-cards ──────────────────────────────────────
// Returns the calling user's cards for the active campaign (unplayed first)
router.get('/my-cards', requireAuth, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No active campaign' });

  const cards = db.prepare(`
    SELECT pc.*, d.type, d.tier, d.name, d.effect,
           u.character_name AS awarded_by_name
    FROM player_good_boy_cards pc
    JOIN good_boy_card_defs d ON d.id = pc.card_def_id
    LEFT JOIN users u ON u.id = pc.awarded_by
    WHERE pc.campaign_id = ? AND pc.user_id = ?
    ORDER BY pc.played_at IS NOT NULL, pc.awarded_at DESC
  `).all(cid, req.user.id);

  res.json({ cards });
});

// ── GET /api/good-boy-cards/all — GM: all players' cards in campaign ──────
router.get('/all', requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No active campaign' });

  const cards = db.prepare(`
    SELECT pc.*, d.type, d.tier, d.name, d.effect,
           u.character_name AS player_name, u.username AS player_username,
           ab.character_name AS awarded_by_name
    FROM player_good_boy_cards pc
    JOIN good_boy_card_defs d ON d.id = pc.card_def_id
    JOIN users u ON u.id = pc.user_id
    LEFT JOIN users ab ON ab.id = pc.awarded_by
    WHERE pc.campaign_id = ?
    ORDER BY pc.played_at IS NOT NULL, u.character_name, pc.awarded_at DESC
  `).all(cid);

  res.json({ cards });
});

// ── POST /api/good-boy-cards/award — GM awards a card to a player ─────────
// Body: { user_id, type: 'good'|'bad', card_def_id? }
// If card_def_id is omitted, a random card of the given type is selected.
router.post('/award', requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No active campaign' });

  const { user_id, type, card_def_id } = req.body;
  if (!user_id || !type) return res.status(400).json({ error: 'user_id and type required' });
  if (!['good', 'bad'].includes(type)) return res.status(400).json({ error: 'type must be good or bad' });

  // Verify player is in this campaign
  const member = db.prepare('SELECT 1 FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(cid, user_id);
  if (!member) return res.status(404).json({ error: 'Player not in campaign' });

  let defId = card_def_id;
  if (!defId) {
    // Pick a random card of the given type using weighted tiers
    // 50% low, 30% mid, 15% high, 5% huge
    const rand = Math.random();
    const tier = rand < 0.50 ? 'low' : rand < 0.80 ? 'mid' : rand < 0.95 ? 'high' : 'huge';
    const options = db.prepare('SELECT id FROM good_boy_card_defs WHERE type = ? AND tier = ?').all(type, tier);
    if (!options.length) return res.status(500).json({ error: 'No cards of that type/tier' });
    defId = options[Math.floor(Math.random() * options.length)].id;
  }

  const def = db.prepare('SELECT * FROM good_boy_card_defs WHERE id = ?').get(defId);
  if (!def) return res.status(404).json({ error: 'Card definition not found' });

  const r = db.prepare(`
    INSERT INTO player_good_boy_cards (campaign_id, user_id, card_def_id, awarded_by)
    VALUES (?, ?, ?, ?)
  `).run(cid, user_id, defId, req.user.id);

  const card = db.prepare(`
    SELECT pc.*, d.type, d.tier, d.name, d.effect,
           ab.character_name AS awarded_by_name
    FROM player_good_boy_cards pc
    JOIN good_boy_card_defs d ON d.id = pc.card_def_id
    LEFT JOIN users ab ON ab.id = pc.awarded_by
    WHERE pc.id = ?
  `).get(r.lastInsertRowid);

  // Notify the player that they received a card
  notifyUser(user_id, {
    type: 'card_awarded',
    card,
    message: type === 'good'
      ? `You've been awarded a Good Boy Card: ${def.name}!`
      : `You've been awarded a Bad Boy Card: ${def.name}. Ouch.`,
  });

  res.json({ card });
});

// ── POST /api/good-boy-cards/:id/play — player plays a card ──────────────
// Body: { note? }  (optional flavour text from the player)
router.post('/:id/play', requireAuth, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  if (!cid) return res.status(400).json({ error: 'No active campaign' });

  const pc = db.prepare(
    'SELECT pc.*, d.name, d.effect, d.type, d.tier FROM player_good_boy_cards pc JOIN good_boy_card_defs d ON d.id = pc.card_def_id WHERE pc.id = ?'
  ).get(req.params.id);

  if (!pc) return res.status(404).json({ error: 'Card not found' });
  if (pc.user_id !== req.user.id) return res.status(403).json({ error: 'Not your card' });
  if (pc.campaign_id !== cid) return res.status(403).json({ error: 'Wrong campaign' });
  if (pc.played_at) return res.status(409).json({ error: 'Card already played' });

  db.prepare('UPDATE player_good_boy_cards SET played_at = CURRENT_TIMESTAMP, played_note = ? WHERE id = ?')
    .run(req.body.note || null, req.params.id);

  const player = db.prepare('SELECT character_name, username FROM users WHERE id = ?').get(req.user.id);
  const playerLabel = player.character_name || player.username;

  // Notify all GMs
  broadcastToGms(db, cid, {
    type: 'card_played',
    card_id: pc.id,
    card_name: pc.name,
    card_effect: pc.effect,
    card_type: pc.type,
    card_tier: pc.tier,
    player_name: playerLabel,
    note: req.body.note || null,
    message: `${playerLabel} played ${pc.type === 'good' ? '🐶 Good Boy' : '😈 Bad Boy'} Card: ${pc.name} — ${pc.effect}`,
  });

  res.json({ ok: true });
});

// ── DELETE /api/good-boy-cards/:id — GM removes an unplayed card ──────────
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  const cid = getCampaignId(req);
  const pc = db.prepare('SELECT * FROM player_good_boy_cards WHERE id = ?').get(req.params.id);
  if (!pc || pc.campaign_id !== cid) return res.status(404).json({ error: 'Card not found' });
  db.prepare('DELETE FROM player_good_boy_cards WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
