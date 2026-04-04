const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle, slug } = require('../utils/routeHelpers');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');

const router = express.Router();

function getMapsDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Maps') : path.join(vaultPath, 'Maps');
}

function enrichMap(db, r) {
  let fm = {};
  try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) {}
  
  return {
    id: r.id,
    path: r.path,
    title: r.title,
    description: fm.description || '',
    image_path: fm.image_path || '',
    map_type: fm.map_type || 'world',
    gm_notes: fm.gm_notes || '',
    linked_location_id: fm.linked_location_id || null,
    connected_to: fm.connected_to || null,
    hidden: r.hidden || 0,
    created_at: r.created_at || new Date().toISOString()
  };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ maps: [] });
  
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'map' AND campaign_id = ? ${hiddenClause} ORDER BY title`).all(campId);
  res.json({ maps: rows.map(r => enrichMap(db, r)) });
});

makeHiddenToggle(router, 'vault_files');

router.post('/', requireGm, (req, res) => {
  const { title, description, image_path, map_type = 'world', gm_notes, linked_location_id, connected_to, hidden } = req.body;
  if (!title || !image_path) return res.status(400).json({ error: 'title and image_path are required' });
  
  const filename = `${slug(title)}-${Date.now()}.md`;
  const fm = { type: 'map', title, description, image_path, map_type, gm_notes, linked_location_id, connected_to };
  
  const content = matter.stringify(description || '', fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getMapsDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Maps/${filename}` : `Maps/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  if (hidden && row) {
    db2.prepare('UPDATE vault_files SET hidden = 1 WHERE id = ?').run(row.id);
    row.hidden = 1;
  }
  
  const map = row ? enrichMap(db2, row) : { ...fm, id: null, hidden: hidden ? 1 : 0 };
  res.status(201).json({ map });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='map'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { title, description, map_type, image_path, gm_notes, linked_location_id, connected_to, hidden } = req.body;
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  const fm = { ...existing };
  
  if (title !== undefined) fm.title = title;
  if (description !== undefined) fm.description = description;
  if (map_type !== undefined) fm.map_type = map_type;
  if (image_path !== undefined) fm.image_path = image_path;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (linked_location_id !== undefined) fm.linked_location_id = linked_location_id;
  if (connected_to !== undefined) fm.connected_to = connected_to;

  if (hidden !== undefined) {
    db.prepare('UPDATE vault_files SET hidden = ? WHERE id = ?').run(hidden ? 1 : 0, req.params.id);
  }

  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ map: enrichMap(db, updatedRow) });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  res.json({ success: true });
});

module.exports = router;
