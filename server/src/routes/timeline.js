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

function getTimelineDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Timeline') : path.join(vaultPath, 'Timeline');
}

function enrichTimelineEvent(db, r) {
  let fm = {};
  try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) {}
  
  return {
    id: r.id,
    path: r.path,
    title: r.title,
    description: fm.description || '',
    in_world_date: fm.in_world_date || '',
    session_number: fm.session_number || null,
    linked_type: fm.linked_type || null,
    linked_id: fm.linked_id || null,
    significance: fm.significance || 'minor',
    gm_notes: fm.gm_notes || '',
    player_notes: fm.player_notes || '',
    hidden: r.hidden || 0,
    created_at: r.created_at || new Date().toISOString()
  };
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ events: [] });
  
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'timeline_event' AND campaign_id = ? ${hiddenClause}`).all(campId);
  const events = rows.map(r => enrichTimelineEvent(db, r));
  events.sort((a, b) => {
    const d1 = a.in_world_date || '';
    const d2 = b.in_world_date || '';
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return a.id - b.id;
  });
  
  res.json({ events });
});

makeHiddenToggle(router, 'vault_files');

router.post('/', requireGm, (req, res) => {
  const { title, description, in_world_date, session_number, linked_type, linked_id,
          significance = 'minor', gm_notes, player_notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  
  const filename = `${slug(title)}-${Date.now()}.md`;
  const fm = { type: 'timeline_event', title, description: description || null, in_world_date: in_world_date || null, session_number: session_number || null, linked_type: linked_type || null, linked_id: linked_id || null, significance, gm_notes: gm_notes || null, player_notes: player_notes || null };
  
  const content = matter.stringify(description || '', fm);
  const campId = getCampaignId(req);
  const camp = campId ? getDb().prepare('SELECT id, name FROM campaigns WHERE id = ?').get(campId) : null;
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getTimelineDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Timeline/${filename}` : `Timeline/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const event = row ? enrichTimelineEvent(db2, row) : { ...fm, id: null };
  res.status(201).json({ event });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='timeline_event'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { title, description, in_world_date, session_number, significance, gm_notes, player_notes } = req.body;
  
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  const fm = { ...existing };
  
  if (title !== undefined) fm.title = title;
  if (description !== undefined) fm.description = description;
  if (in_world_date !== undefined) fm.in_world_date = in_world_date;
  if (session_number !== undefined) fm.session_number = session_number;
  if (significance !== undefined) fm.significance = significance;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (player_notes !== undefined) fm.player_notes = player_notes;

  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ event: enrichTimelineEvent(db, updatedRow) });
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
