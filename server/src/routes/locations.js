const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');

const VAULT_DIR = path.join(vaultPath, 'Locations');
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
    ? db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${hiddenFilter} ${campFilter} ORDER BY title ASC`).all(campId)
    : db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${hiddenFilter} ORDER BY title ASC`).all();
  const locations = rows.map((r) => ({ id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0, ...JSON.parse(r.frontmatter || '{}') }));
  res.json({ locations });
});

router.post('/', requireGm, (req, res) => {
  const { name, description = '', image_url = '' } = req.body;
  const title = name || req.body.title;
  if (!title) return res.status(400).json({ error: 'name is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const content = matter.stringify(description, { title, image_url });
  fs.writeFileSync(path.join(VAULT_DIR, filename), content, 'utf8');
  setTimeout(() => {
    const row = getDb().prepare(`SELECT * FROM vault_files WHERE path = ?`).get(`Locations/${filename}`);
    const location = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}') } : { title };
    res.status(201).json({ location });
  }, 400);
});

router.put('/:id', requireGm, (req, res) => {
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const existing = JSON.parse(row.frontmatter || '{}');
  const { name, description, image_url } = { ...existing, ...req.body };
  const title = name || req.body.title || existing.title;
  const content = matter.stringify(description || '', { title, image_url });
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
