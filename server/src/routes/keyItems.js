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

function getItemsDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Items') : path.join(vaultPath, 'Items');
}

function enrichKeyItem(db, r) {
  let fm = {};
  try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) {}
  
  return {
    id: r.id,
    path: r.path,
    name: r.title,
    description: fm.description || '',
    significance: fm.significance || '',
    image_path: fm.image_path || '',
    linked_quest: fm.linked_quest || '',
    hidden: r.hidden || 0,
    created_at: r.created_at || new Date().toISOString()
  };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ key_items: [] });
  
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'key_item' AND campaign_id = ? ${hiddenClause} ORDER BY title`).all(campId);
  res.json({ key_items: rows.map(r => enrichKeyItem(db, r)) });
});

makeHiddenToggle(router, 'vault_files');

router.post('/', requireGm, (req, res) => {
  const { name, description, significance, image_path, linked_quest } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const filename = `${slug(name)}-${Date.now()}.md`;
  const fm = { type: 'key_item', title: name, description, significance, image_path, linked_quest };
  
  const content = matter.stringify(description || '', fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getItemsDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Items/${filename}` : `Items/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const item = row ? enrichKeyItem(db2, row) : { ...fm, id: null };
  res.status(201).json({ item });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='key_item'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { name, description, significance, image_path, linked_quest } = req.body;
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  const fm = { ...existing };
  
  if (name !== undefined) fm.title = name;
  if (description !== undefined) fm.description = description;
  if (significance !== undefined) fm.significance = significance;
  if (image_path !== undefined) fm.image_path = image_path;
  if (linked_quest !== undefined) fm.linked_quest = linked_quest;

  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ item: enrichKeyItem(db, updatedRow) });
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
