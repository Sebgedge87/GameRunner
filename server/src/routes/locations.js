const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { slug } = require('../utils/routeHelpers');

const VAULT_DIR = path.join(vaultPath, 'Locations');
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  let rows;
  if (req.user.role === 'gm') {
    const campClause = campId ? 'AND (campaign_id = ? OR campaign_id IS NULL)' : '';
    rows = campId
      ? db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${campClause} ORDER BY title ASC`).all(campId)
      : db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ORDER BY title ASC`).all();
  } else {
    const visClause = `AND (hidden IS NULL OR hidden = 0 OR EXISTS (SELECT 1 FROM item_shares WHERE item_type='location' AND item_id=vault_files.id AND user_id=?))`;
    rows = campId
      ? db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${visClause} AND (campaign_id = ? OR campaign_id IS NULL) ORDER BY title ASC`).all(req.user.id, campId)
      : db.prepare(`SELECT * FROM vault_files WHERE type = 'location' ${visClause} ORDER BY title ASC`).all(req.user.id);
  }
  const locations = rows.map((r) => ({ id: r.id, path: r.path, title: r.title, hidden: r.hidden || 0, ...JSON.parse(r.frontmatter || '{}') }));
  res.json({ locations });
});

router.post('/', requireGm, (req, res) => {
  const { name, description = '', image_url = '' } = req.body;
  const title = name || req.body.title;
  if (!title) return res.status(400).json({ error: 'name is required' });
  const filename = `${slug(title)}-${Date.now()}.md`;
  const content = matter.stringify(description, { title, image_url });
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = campSlug ? path.join(vaultPath, campSlug, 'Locations') : VAULT_DIR;
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Locations/${filename}` : `Locations/${filename}`;
  const fullPath = path.join(targetDir, filename);
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  const row = getDb().prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const location = row ? { id: row.id, path: row.path, title: row.title, ...JSON.parse(row.frontmatter || '{}') } : { title };
  res.status(201).json({ location });
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
