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

function getInventoryDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Inventory') : path.join(vaultPath, 'Inventory');
}

function enrichInventory(db, r) {
  let fm = {};
  try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) {}
  
  return {
    id: r.id,
    path: r.path,
    name: r.title,
    description: fm.description || '',
    quantity: fm.quantity || 1,
    holder: fm.holder || 'party',
    image_path: fm.image_path || '',
    owner_id: fm.owner_id || null,
    hidden: r.hidden || 0,
    created_at: r.created_at || new Date().toISOString()
  };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ inventory: [] });
  
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'inventory' AND campaign_id = ? ${hiddenClause}`).all(campId);
  const inventory = rows.map(r => enrichInventory(db, r)).sort((a, b) => {
    const holdA = (a.holder || '').toLowerCase();
    const holdB = (b.holder || '').toLowerCase();
    if (holdA < holdB) return -1;
    if (holdA > holdB) return 1;
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });
  res.json({ inventory });
});

makeHiddenToggle(router, 'vault_files');

router.post('/', requireGm, (req, res) => {
  const { name, description, quantity = 1, holder = 'party', image_path, owner_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const filename = `${slug(name)}-${Date.now()}.md`;
  const fm = { type: 'inventory', title: name, description, quantity, holder, image_path, owner_id };
  
  const content = matter.stringify(description || '', fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getInventoryDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Inventory/${filename}` : `Inventory/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const item = row ? enrichInventory(db2, row) : { ...fm, id: null };
  res.status(201).json({ item });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='inventory'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { name, description, quantity, holder, image_path, owner_id } = req.body;
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  const fm = { ...existing };
  
  if (name !== undefined) fm.title = name;
  if (description !== undefined) fm.description = description;
  if (quantity !== undefined) fm.quantity = quantity;
  if (holder !== undefined) fm.holder = holder;
  if (image_path !== undefined) fm.image_path = image_path;
  if (owner_id !== undefined) fm.owner_id = owner_id || null;

  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ item: enrichInventory(db, updatedRow) });
});

router.put('/:id/transfer', requireAuth, (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id required' });
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='inventory'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Item not found' });
  
  const existing = JSON.parse(row.frontmatter || '{}');
  if (!req.user.isGm && existing.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only transfer items you own' });
  }
  
  const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(target_user_id);
  if (!target) return res.status(404).json({ error: 'Target user not found' });
  
  existing.owner_id = target_user_id;
  existing.holder = target.username;
  
  const fullPath = path.join(vaultPath, row.path);
  const content = matter.stringify(existing.description || '', existing);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  res.json({ success: true, new_owner: target.username });
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
