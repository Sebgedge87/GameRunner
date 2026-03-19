const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

function enrichFaction(db, f) {
  const rep = db.prepare('SELECT score FROM faction_reputation WHERE faction_id = ?').get(f.id);
  const members = db.prepare(`
    SELECT vf.id, vf.title AS name FROM faction_members fm
    JOIN vault_files vf ON fm.npc_id = vf.id
    WHERE fm.faction_id = ?
    ORDER BY vf.title
  `).all(f.id);
  const leader = f.leader_npc_id
    ? db.prepare('SELECT id, title AS name FROM vault_files WHERE id = ?').get(f.leader_npc_id)
    : null;
  const hq = f.hq_location_id
    ? db.prepare('SELECT id, title AS name FROM vault_files WHERE id = ?').get(f.hq_location_id)
    : null;
  return { ...f, reputation: rep ? rep.score : 0, members, leader, hq };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ factions: [] });
  const factions = db.prepare(`SELECT * FROM factions WHERE campaign_id = ? ${hiddenClause} ORDER BY name`).all(campId);
  res.json({ factions: factions.map(f => enrichFaction(db, f)) });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const faction = db.prepare('SELECT * FROM factions WHERE id = ?').get(req.params.id);
  if (!faction) return res.status(404).json({ error: 'Not found' });
  res.json({ faction: enrichFaction(db, faction) });
});

router.post('/', requireGm, (req, res) => {
  const { name, description, goals, image_path, standing = 0, influence = 3, leader_npc_id, hq_location_id, gm_notes, player_notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO factions (campaign_id, name, description, goals, image_path, standing, influence, leader_npc_id, hq_location_id, gm_notes, player_notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(campId || null, name, description || null, goals || null, image_path || null,
     standing, influence, leader_npc_id || null, hq_location_id || null, gm_notes || null, player_notes || null, req.user.id);
  db.prepare('INSERT INTO faction_reputation (faction_id, campaign_id, score) VALUES (?, ?, 0)')
    .run(result.lastInsertRowid, campId || null);
  const faction = db.prepare('SELECT * FROM factions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ faction: enrichFaction(db, faction) });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, goals, image_path, standing, influence, leader_npc_id, hq_location_id, gm_notes, player_notes } = req.body;
  const db = getDb();
  const leaderVal = leader_npc_id !== undefined ? (leader_npc_id || null) : undefined;
  const hqVal = hq_location_id !== undefined ? (hq_location_id || null) : undefined;
  db.prepare(`
    UPDATE factions SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      goals = COALESCE(?, goals),
      image_path = COALESCE(?, image_path),
      standing = COALESCE(?, standing),
      influence = COALESCE(?, influence),
      leader_npc_id = CASE WHEN ? IS NOT NULL THEN ? ELSE leader_npc_id END,
      hq_location_id = CASE WHEN ? IS NOT NULL THEN ? ELSE hq_location_id END,
      gm_notes = COALESCE(?, gm_notes),
      player_notes = COALESCE(?, player_notes)
    WHERE id = ?
  `).run(name, description, goals, image_path, standing, influence,
     leaderVal, leaderVal, hqVal, hqVal, gm_notes, player_notes, req.params.id);
  const faction = db.prepare('SELECT * FROM factions WHERE id = ?').get(req.params.id);
  res.json({ faction: enrichFaction(db, faction) });
});

makeHiddenToggle(router, 'factions');

router.put('/:id/reputation', requireGm, (req, res) => {
  const { score } = req.body;
  if (score === undefined) return res.status(400).json({ error: 'score required' });
  const db = getDb();
  const campId = getCampaignId(req);
  db.prepare('INSERT OR REPLACE INTO faction_reputation (faction_id, campaign_id, score, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(req.params.id, campId || null, Math.max(-3, Math.min(3, score)));
  res.json({ success: true });
});

// ── Members ───────────────────────────────────────────────────────────────────

router.post('/:id/members', requireGm, (req, res) => {
  const { npc_id } = req.body;
  if (!npc_id) return res.status(400).json({ error: 'npc_id required' });
  const db = getDb();
  const campId = getCampaignId(req);
  try {
    db.prepare('INSERT INTO faction_members (faction_id, npc_id, campaign_id) VALUES (?, ?, ?)').run(req.params.id, npc_id, campId || null);
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Already a member' });
    throw e;
  }
  res.json({ success: true });
});

router.delete('/:id/members/:npcId', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM faction_members WHERE faction_id = ? AND npc_id = ?').run(req.params.id, req.params.npcId);
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM faction_reputation WHERE faction_id = ?').run(req.params.id);
  db.prepare('DELETE FROM faction_members WHERE faction_id = ?').run(req.params.id);
  db.prepare('DELETE FROM factions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
