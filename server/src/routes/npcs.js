const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { slug } = require('../utils/routeHelpers');
const { auditLog } = require('../utils/auditLog');

const VAULT_DIR = path.join(vaultPath, 'NPCs');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const offset = parseInt(req.query.offset) || 0;
  let rows;
  if (!campId) return res.json({ npcs: [], total: 0 });
  if (req.user.isGm) {
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'npc' AND campaign_id = ? ORDER BY title ASC LIMIT ? OFFSET ?`).all(campId, limit, offset);
  } else {
    const visClause = `AND (hidden IS NULL OR hidden = 0 OR EXISTS (SELECT 1 FROM item_shares WHERE item_type='npc' AND item_id=vault_files.id AND user_id=?))`;
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'npc' ${visClause} AND campaign_id = ? ORDER BY title ASC LIMIT ? OFFSET ?`).all(req.user.id, campId, limit, offset);
  }
  const npcs = rows.map((r) => {
    let fm = {};
    try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) { console.warn(`[npcs] Bad frontmatter for ${r.path}:`, e.message); }
    return { id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0,
             race: r.race, disposition: r.disposition, faction_id: r.faction_id,
             home_location_id: r.home_location_id, gm_notes: r.gm_notes,
             player_notes: r.player_notes, ...fm };
  });
  res.json({ npcs, limit, offset });
});

router.post('/', requireGm, (req, res) => {
  const { name, role = '', description = '', gm_notes = '', player_notes = '', image_url = '',
          race = '', disposition = '', faction_id, home_location_id } = req.body;
  const title = name || req.body.title;
  if (!title) return res.status(400).json({ error: 'name is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const content = matter.stringify(description, { title, description, role, gm_notes, image_url, status: 'active', race, disposition });
  const db = getDb();
  const campId = getCampaignId(req);
  const camp = campId ? db.prepare('SELECT id, name FROM campaigns WHERE id = ?').get(campId) : null;
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'NPCs') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/NPCs/${filename}` : `NPCs/${filename}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  const row = db.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  if (row) {
    db.prepare(`UPDATE vault_files SET race=?, disposition=?, faction_id=?, home_location_id=?, player_notes=?, created_by=? WHERE id=?`)
      .run(race || null, disposition || null, faction_id || null, home_location_id || null, player_notes || null, req.user?.id || null, row.id);
  }
  const npc = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}'), race, disposition, faction_id, home_location_id } : { title, role };
  auditLog(req, 'create', 'npc', row?.id ?? null, title);
  res.status(201).json({ npc });
});

router.put('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  // Conflict detection: reject if file was modified externally after our last sync
  if (req.body.client_synced_at && fs.existsSync(fullPath)) {
    const fileMtime = fs.statSync(fullPath).mtimeMs;
    const clientSynced = new Date(req.body.client_synced_at).getTime();
    if (fileMtime > clientSynced + 2000) {
      return res.status(409).json({ error: 'File was modified externally. Reload before saving.', file_mtime: new Date(fileMtime).toISOString() });
    }
  }
  const db = getDb();
  const existing = JSON.parse(row.frontmatter || '{}');
  const { name, role, description, gm_notes, player_notes, image_url, status, race, disposition, faction_id, home_location_id } = { ...existing, ...req.body };
  const title = name || req.body.title || existing.title;
  const content = matter.stringify(description || '', { title, description: description || '', role, gm_notes, image_url, status, race, disposition });
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  db.prepare(`UPDATE vault_files SET race=COALESCE(?,race), disposition=COALESCE(?,disposition), faction_id=COALESCE(?,faction_id), home_location_id=COALESCE(?,home_location_id), gm_notes=COALESCE(?,gm_notes), player_notes=COALESCE(?,player_notes) WHERE id=?`)
    .run(race ?? null, disposition ?? null, faction_id ?? null, home_location_id ?? null, gm_notes ?? null, player_notes ?? null, req.params.id);
  auditLog(req, 'update', 'npc', Number(req.params.id), title);
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  auditLog(req, 'delete', 'npc', Number(req.params.id), row.title);
  res.json({ success: true });
});

// PUT /api/npcs/:id/reveal — toggle NPC visibility to players (hidden=0 = revealed, hidden=1 = hidden)
router.put('/:id/reveal', requireGm, (req, res) => {
  const db = getDb();
  const revealed = req.body.revealed !== undefined ? Boolean(req.body.revealed) : true;
  // hidden is inverse of revealed for vault_files
  db.prepare('UPDATE vault_files SET hidden = ? WHERE id = ?').run(revealed ? 0 : 1, req.params.id);
  auditLog(req, 'update', 'npc', Number(req.params.id), `reveal=${revealed}`);
  res.json({ success: true });
});

// ── NPC Relationships ──────────────────────────────────────────────────────────

// GET /api/npcs/:id/relationships
router.get('/:id/relationships', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT nr.*, vf.title AS related_name, vf.id AS related_id
    FROM npc_relationships nr
    JOIN vault_files vf ON nr.related_npc_id = vf.id
    WHERE nr.npc_id = ?
    ORDER BY nr.relationship_type, vf.title
  `).all(req.params.id);
  // Also get reverse relationships
  const reverse = db.prepare(`
    SELECT nr.*, vf.title AS related_name, vf.id AS related_id
    FROM npc_relationships nr
    JOIN vault_files vf ON nr.npc_id = vf.id
    WHERE nr.related_npc_id = ?
    ORDER BY nr.relationship_type, vf.title
  `).all(req.params.id);
  res.json({ relationships: rows, reverse_relationships: reverse });
});

// POST /api/npcs/:id/relationships
router.post('/:id/relationships', requireGm, (req, res) => {
  const { related_npc_id, relationship_type = 'associated', notes } = req.body;
  if (!related_npc_id) return res.status(400).json({ error: 'related_npc_id is required' });
  if (Number(related_npc_id) === Number(req.params.id)) return res.status(400).json({ error: 'Cannot relate an NPC to itself' });
  const db = getDb();
  const campId = getCampaignId(req);
  try {
    const result = db.prepare('INSERT INTO npc_relationships (npc_id, related_npc_id, relationship_type, notes, campaign_id) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, related_npc_id, relationship_type, notes || null, campId);
    const rel = db.prepare('SELECT * FROM npc_relationships WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ relationship: rel });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Relationship already exists' });
    throw e;
  }
});

// DELETE /api/npcs/:id/relationships/:relId
router.delete('/:id/relationships/:relId', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM npc_relationships WHERE id = ? AND (npc_id = ? OR related_npc_id = ?)').run(req.params.relId, req.params.id, req.params.id);
  res.json({ success: true });
});

module.exports = router;
