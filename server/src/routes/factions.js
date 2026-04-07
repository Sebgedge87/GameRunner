const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle, slug } = require('../utils/routeHelpers');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { auditLog } = require('../utils/auditLog');

const router = express.Router();

function getFactionsDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Factions') : path.join(vaultPath, 'Factions');
}

function enrichFaction(db, f) {
  let fm = {};
  try { fm = JSON.parse(f.frontmatter || '{}'); } catch (e) {}
  
  // Backwards compatibility with frontmatter fields mapping to top level
  // and reputation mapping vs standing.
  const standing = fm.standing || 0;
  
  const members = db.prepare(`
    SELECT vf.id, vf.title AS name FROM faction_members fm
    JOIN vault_files vf ON fm.npc_id = vf.id
    WHERE fm.faction_id = ?
    ORDER BY vf.title
  `).all(f.id);
  
  const leader = fm.leader_npc_id
    ? db.prepare('SELECT id, title AS name FROM vault_files WHERE id = ?').get(fm.leader_npc_id)
    : null;
    
  const hq = fm.hq_location_id
    ? db.prepare('SELECT id, title AS name FROM vault_files WHERE id = ?').get(fm.hq_location_id)
    : null;
    
  return { 
    id: f.id, 
    path: f.path,
    name: f.title, 
    description: fm.description || '', 
    goals: fm.goals || '', 
    image_path: fm.image_path || '', 
    standing, 
    reputation: standing,
    influence: fm.influence || 3, 
    leader_npc_id: fm.leader_npc_id || null, 
    hq_location_id: fm.hq_location_id || null, 
    gm_notes: fm.gm_notes || '', 
    player_notes: fm.player_notes || '',
    members, 
    leader, 
    hq,
    hidden: f.hidden || 0
  };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ factions: [] });
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'faction' AND campaign_id = ? ${hiddenClause} ORDER BY title`).all(campId);
  res.json({ factions: rows.map(r => enrichFaction(db, r)) });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM vault_files WHERE type='faction' AND id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ faction: enrichFaction(db, row) });
});

router.post('/', requireGm, (req, res) => {
  const { name, description = '', goals, image_path, standing = 0, influence = 3, leader_npc_id, hq_location_id, gm_notes, player_notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const filename = `${slug(name)}-${Date.now()}.md`;
  const fm = { type: 'faction', title: name, description, goals: goals || null, standing, influence, image_path: image_path || null, gm_notes: gm_notes || null, player_notes: player_notes || null };
  if (leader_npc_id) fm.leader_npc_id = leader_npc_id;
  if (hq_location_id) fm.hq_location_id = hq_location_id;
  
  const content = matter.stringify(description || '', fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getFactionsDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Factions/${filename}` : `Factions/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  
  const faction = row ? enrichFaction(db2, row) : { id: null, name, status: 'synced', description, standing };
  auditLog(req, 'create', 'faction', row?.id ?? null, name);
  res.status(201).json({ faction });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='faction'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  // Map incoming body
  const { name, description, goals, image_path, standing, influence, leader_npc_id, hq_location_id, gm_notes, player_notes } = req.body;
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  
  const fm = { ...existing };
  if (name !== undefined) fm.title = name;
  if (description !== undefined) fm.description = description;
  if (goals !== undefined) fm.goals = goals;
  if (image_path !== undefined) fm.image_path = image_path;
  if (standing !== undefined) fm.standing = standing;
  if (influence !== undefined) fm.influence = influence;
  
  if (leader_npc_id !== undefined) fm.leader_npc_id = leader_npc_id || null;
  if (hq_location_id !== undefined) fm.hq_location_id = hq_location_id || null;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (player_notes !== undefined) fm.player_notes = player_notes;
  
  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  
  auditLog(req, 'update', 'faction', Number(req.params.id), fm.title || row.title);
  
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ faction: enrichFaction(db, updatedRow) });
});

makeHiddenToggle(router, 'vault_files');

router.put('/:id/reputation', requireGm, (req, res) => {
  const { score } = req.body;
  if (score === undefined) return res.status(400).json({ error: 'score required' });
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  existing.standing = Math.max(-3, Math.min(3, score));
  
  const content = matter.stringify(existing.description || '', existing);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  res.json({ success: true, faction: enrichFaction(db, db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id)) });
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
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  
  db.prepare('DELETE FROM faction_members WHERE faction_id = ?').run(req.params.id);
  auditLog(req, 'delete', 'faction', Number(req.params.id), row.title);
  res.json({ success: true });
});

module.exports = router;
