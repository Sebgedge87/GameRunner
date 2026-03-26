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

const VAULT_DIR = path.join(vaultPath, 'Quests');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const router = express.Router();

// GET /api/quests
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const offset = parseInt(req.query.offset) || 0;
  let rows;
  if (!campId) return res.json({ quests: [], total: 0 });
  if (req.user.isGm) {
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'quest' AND campaign_id = ? ORDER BY synced_at DESC LIMIT ? OFFSET ?`).all(campId, limit, offset);
  } else {
    const visClause = `AND (hidden IS NULL OR hidden = 0 OR EXISTS (SELECT 1 FROM item_shares WHERE item_type='quest' AND item_id=vault_files.id AND user_id=?))`;
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'quest' ${visClause} AND campaign_id = ? ORDER BY synced_at DESC LIMIT ? OFFSET ?`).all(req.user.id, campId, limit, offset);
  }
  const quests = rows.map((r) => {
    let fm = {};
    try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) { console.warn(`[quests] Bad frontmatter for ${r.path}:`, e.message); }
    return { id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0, parent_quest_id: r.parent_quest_id || null, ...fm };
  });
  res.json({ quests, limit, offset });
});

// POST /api/quests
router.post('/', requireGm, (req, res) => {
  const {
    title, description = '', status = 'active', quest_type = 'main', parent_quest_id,
    reward_gold, reward_xp, reward_items, urgency, deadline, gm_notes,
    connected_location, connected_locations, connected_npcs, connected_factions, image_url,
  } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const fm = { title, description, status, quest_type };
  if (parent_quest_id) fm.parent_quest_id = parent_quest_id;
  if (reward_gold !== undefined) fm.reward_gold = reward_gold;
  if (reward_xp !== undefined) fm.reward_xp = reward_xp;
  if (reward_items !== undefined) fm.reward_items = reward_items;
  if (urgency !== undefined) fm.urgency = urgency;
  if (deadline !== undefined) fm.deadline = deadline;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (connected_locations !== undefined) fm.connected_locations = connected_locations;
  else if (connected_location !== undefined) fm.connected_location = connected_location;
  if (connected_factions !== undefined) fm.connected_factions = connected_factions;
  if (connected_npcs !== undefined) fm.connected_npcs = connected_npcs;
  if (image_url !== undefined) fm.image_url = image_url;
  const content = matter.stringify(description, fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'Quests') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Quests/${filename}` : `Quests/${filename}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  // Store parent_quest_id on the vault_file row for fast lookups
  if (row && parent_quest_id) {
    try { db2.prepare('UPDATE vault_files SET parent_quest_id = ? WHERE id = ?').run(parent_quest_id, row.id); } catch (_) {}
  }
  const quest = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}') } : { title, status, quest_type };
  auditLog(req, 'create', 'quest', row?.id ?? null, title);
  res.status(201).json({ quest });
});

// PUT /api/quests/:id
router.put('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  if (req.body.client_synced_at && fs.existsSync(fullPath)) {
    const fileMtime = fs.statSync(fullPath).mtimeMs;
    const clientSynced = new Date(req.body.client_synced_at).getTime();
    if (fileMtime > clientSynced + 2000) {
      return res.status(409).json({ error: 'File was modified externally. Reload before saving.', file_mtime: new Date(fileMtime).toISOString() });
    }
  }
  const existing = JSON.parse(row.frontmatter || '{}');
  const merged = { ...existing, ...req.body };
  const {
    title, description, status, quest_type, parent_quest_id,
    reward_gold, reward_xp, reward_items, urgency, deadline, gm_notes,
    connected_location, connected_locations, connected_npcs, connected_factions, image_url,
  } = merged;
  const fm = { title, description: description || '', status, quest_type };
  if (parent_quest_id !== undefined) fm.parent_quest_id = parent_quest_id || null;
  if (reward_gold !== undefined) fm.reward_gold = reward_gold;
  if (reward_xp !== undefined) fm.reward_xp = reward_xp;
  if (reward_items !== undefined) fm.reward_items = reward_items;
  if (urgency !== undefined) fm.urgency = urgency;
  if (deadline !== undefined) fm.deadline = deadline;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (connected_locations !== undefined) fm.connected_locations = connected_locations;
  else if (connected_location !== undefined) fm.connected_location = connected_location;
  if (connected_factions !== undefined) fm.connected_factions = connected_factions;
  if (connected_npcs !== undefined) fm.connected_npcs = connected_npcs;
  if (image_url !== undefined) fm.image_url = image_url;
  const content = matter.stringify(description || '', fm);
  fs.writeFileSync(fullPath, content, 'utf8');
  if (parent_quest_id !== undefined) {
    try { getDb().prepare('UPDATE vault_files SET parent_quest_id = ? WHERE id = ?').run(parent_quest_id || null, req.params.id); } catch (_) {}
  }
  auditLog(req, 'update', 'quest', Number(req.params.id), title);
  res.json({ success: true });
});

// DELETE /api/quests/:id
router.delete('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  auditLog(req, 'delete', 'quest', Number(req.params.id), row.title);
  res.json({ success: true });
});

module.exports = router;
