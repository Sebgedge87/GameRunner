const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');

const VAULT_DIR = path.join(vaultPath, 'Hooks');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  const hiddenFilter = req.user.role === 'gm' ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const campFilter = campId ? 'AND (campaign_id = ? OR campaign_id IS NULL)' : '';
  const rows = campId
    ? db.prepare(`SELECT * FROM vault_files WHERE type = 'hook' ${hiddenFilter} ${campFilter} ORDER BY synced_at DESC`).all(campId)
    : db.prepare(`SELECT * FROM vault_files WHERE type = 'hook' ${hiddenFilter} ORDER BY synced_at DESC`).all();
  const hooks = rows.map((r) => ({ id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0, ...JSON.parse(r.frontmatter || '{}') }));
  res.json({ hooks });
});

router.post('/', requireGm, (req, res) => {
  const { title, description = '', status = 'active' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const content = matter.stringify(description, { title, status });
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'Hooks') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Hooks/${filename}` : `Hooks/${filename}`;
  fs.writeFileSync(path.join(targetDir, filename), content, 'utf8');
  setTimeout(() => {
    const row = getDb().prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
    const hook = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}') } : { title, status };
    res.status(201).json({ hook });
  }, 400);
});

router.put('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const existing = JSON.parse(row.frontmatter || '{}');
  const { title, description, status } = { ...existing, ...req.body };
  const content = matter.stringify(description || '', { title, status });
  fs.writeFileSync(path.join(vaultPath, row.path), content, 'utf8');
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
