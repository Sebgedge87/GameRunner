const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { slug } = require('../utils/routeHelpers');

const VAULT_DIR = path.join(vaultPath, 'Locations');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const offset = parseInt(req.query.offset) || 0;
  let rows;
  if (!campId) return res.json({ locations: [], total: 0 });
  if (req.user.isGm) {
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'location' AND campaign_id = ? ORDER BY title ASC LIMIT ? OFFSET ?`).all(campId, limit, offset);
  } else {
    const visClause = `AND (hidden IS NULL OR hidden = 0 OR EXISTS (SELECT 1 FROM item_shares WHERE item_type='location' AND item_id=vault_files.id AND user_id=?))`;
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${visClause} AND campaign_id = ? ORDER BY title ASC LIMIT ? OFFSET ?`).all(req.user.id, campId, limit, offset);
  }
  const locations = rows.map((r) => {
    let fm = {};
    try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) { console.warn(`[locations] Bad frontmatter for ${r.path}:`, e.message); }
    return { id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0,
             danger_level: r.danger_level, location_type: r.location_type,
             parent_location_id: r.parent_location_id, gm_notes: r.gm_notes,
             player_notes: r.player_notes, ...fm };
  });
  res.json({ locations, limit, offset });
});

router.post('/', requireGm, (req, res) => {
  const { name, description = '', image_url = '', danger_level = 0, location_type = '',
          parent_location_id, gm_notes = '', player_notes = '' } = req.body;
  const title = name || req.body.title;
  if (!title) return res.status(400).json({ error: 'name is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const db = getDb();
  const content = matter.stringify(description, { title, description, image_url, danger_level, location_type, parent_location_id: parent_location_id || null });
  const camp = db.prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'Locations') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Locations/${filename}` : `Locations/${filename}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  const row = db.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  if (row) {
    db.prepare(`UPDATE vault_files SET danger_level=?, location_type=?, parent_location_id=?, gm_notes=?, player_notes=?, created_by=? WHERE id=?`)
      .run(danger_level, location_type || null, parent_location_id || null, gm_notes || null, player_notes || null, req.user?.id || null, row.id);
  }
  const location = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}'), danger_level, location_type, parent_location_id } : { title };
  res.status(201).json({ location });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const existing = JSON.parse(row.frontmatter || '{}');
  const { name, description, image_url, danger_level, location_type, parent_location_id, gm_notes, player_notes } = { ...existing, ...req.body };
  const title = name || req.body.title || existing.title;
  const content = matter.stringify(description || '', { title, description: description || '', image_url, danger_level, location_type, parent_location_id: parent_location_id || null });
  fs.writeFileSync(path.join(vaultPath, row.path), content, 'utf8');
  db.prepare(`UPDATE vault_files SET danger_level=COALESCE(?,danger_level), location_type=COALESCE(?,location_type), parent_location_id=COALESCE(?,parent_location_id), gm_notes=COALESCE(?,gm_notes), player_notes=COALESCE(?,player_notes) WHERE id=?`)
    .run(danger_level ?? null, location_type ?? null, parent_location_id ?? null, gm_notes ?? null, player_notes ?? null, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  res.json({ success: true });
});

module.exports = router;
