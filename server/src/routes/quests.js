const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { slug } = require('../utils/routeHelpers');

const VAULT_DIR = path.join(vaultPath, 'Quests');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const router = express.Router();

// GET /api/quests
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  let rows;
  if (!campId) return res.json({ quests: [] });
  if (req.user.isGm) {
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'quest' AND campaign_id = ? ORDER BY synced_at DESC`).all(campId);
  } else {
    const visClause = `AND (hidden IS NULL OR hidden = 0 OR EXISTS (SELECT 1 FROM item_shares WHERE item_type='quest' AND item_id=vault_files.id AND user_id=?))`;
    rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'quest' ${visClause} AND campaign_id = ? ORDER BY synced_at DESC`).all(req.user.id, campId);
  }
  const quests = rows.map((r) => ({ id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0, ...JSON.parse(r.frontmatter || '{}') }));
  res.json({ quests });
});

// POST /api/quests
router.post('/', requireGm, (req, res) => {
  const { title, description = '', status = 'active', quest_type = 'main' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const content = matter.stringify(description, { title, description, status, quest_type });
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'Quests') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Quests/${filename}` : `Quests/${filename}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const quest = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}') } : { title, status, quest_type };
  res.status(201).json({ quest });
});

// PUT /api/quests/:id
router.put('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const existing = JSON.parse(row.frontmatter || '{}');
  const { title, description, status, quest_type } = { ...existing, ...req.body };
  const content = matter.stringify(description || '', { title, description: description || '', status, quest_type });
  fs.writeFileSync(path.join(vaultPath, row.path), content, 'utf8');
  res.json({ success: true });
});

// DELETE /api/quests/:id
router.delete('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const fullPath = path.join(vaultPath, row.path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  res.json({ success: true });
});

module.exports = router;
