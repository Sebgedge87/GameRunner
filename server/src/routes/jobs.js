const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle, slug } = require('../utils/routeHelpers');
const { vaultPath } = require('../config');
const { syncFile } = require('../vault/vaultWatcher');
const { auditLog } = require('../utils/auditLog');

const router = express.Router();

function getJobsDir(campSlug) {
  return campSlug ? path.join(vaultPath, campSlug, 'Jobs') : path.join(vaultPath, 'Jobs');
}

function enrichJob(db, r) {
  let fm = {};
  try { fm = JSON.parse(r.frontmatter || '{}'); } catch (e) {}
  
  const status = fm.status || 'open';
  let source_location_name = null;
  if (fm.source_location_id) {
    const loc = db.prepare('SELECT title FROM vault_files WHERE id = ?').get(fm.source_location_id);
    if (loc) source_location_name = loc.title;
  }
  
  let accepted_by_name = null;
  if (fm.accepted_by_id) {
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(fm.accepted_by_id);
    if (user) accepted_by_name = user.username;
  }
  
  return {
    id: r.id,
    path: r.path,
    title: r.title,
    description: fm.description || '',
    reward: fm.reward || '',
    difficulty: fm.difficulty || 'medium',
    posted_by: fm.posted_by || '',
    location: fm.location || '',
    source_location_id: fm.source_location_id || null,
    source_location_name,
    status,
    expires_at: fm.expires_at || null,
    promoted_quest_id: fm.promoted_quest_id || null,
    job_type: fm.job_type || 'bounty',
    requires_contact: fm.requires_contact ? 1 : 0,
    accepted_by_id: fm.accepted_by_id || null,
    accepted_at: fm.accepted_at || null,
    accepted_by_name,
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
  if (!campId) return res.json({ jobs: [] });
  
  const locationId = req.query.location_id;
  const rows = db.prepare(`SELECT * FROM vault_files WHERE type = 'job' AND campaign_id = ? ${hiddenClause}`).all(campId);
  
  let jobs = rows.map(r => enrichJob(db, r));
  if (locationId) {
    jobs = jobs.filter(j => j.source_location_id == locationId);
  }
  
  // Custom sort: open first, then created desc. We can use ID or created_at
  jobs.sort((a, b) => {
    const aStat = a.status === 'open' ? 0 : 1;
    const bStat = b.status === 'open' ? 0 : 1;
    if (aStat !== bStat) return aStat - bStat;
    return b.id - a.id;
  });
  
  res.json({ jobs });
});

makeHiddenToggle(router, 'vault_files');

router.post('/', requireGm, (req, res) => {
  const { title, description, reward, difficulty = 'medium', posted_by, location, source_location_id,
          expires_at, requires_contact = false, job_type = 'bounty', gm_notes, player_notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  
  const filename = `${slug(title)}-${Date.now()}.md`;
  const fm = { 
    type: 'job', title, description, reward, difficulty, posted_by, location, 
    source_location_id, expires_at, requires_contact, job_type, gm_notes, player_notes, status: 'open'
  };
  
  const content = matter.stringify(description || '', fm);
  const camp = getDb().prepare('SELECT id, name FROM campaigns WHERE active = 1 LIMIT 1').get();
  const campSlug = camp ? slug(camp.name) : null;
  const targetDir = getJobsDir(campSlug);
  
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const relPath = campSlug ? `${campSlug}/Jobs/${filename}` : `Jobs/${filename}`;
  const fullPath = path.join(targetDir, filename);
  
  fs.writeFileSync(fullPath, content, 'utf8');
  syncFile(fullPath);
  
  const db2 = getDb();
  const row = db2.prepare(`SELECT * FROM vault_files WHERE path = ?`).get(relPath);
  const job = row ? enrichJob(db2, row) : { ...fm, id: null };
  res.status(201).json({ job });
});

router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='job'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { title, description, reward, difficulty, posted_by, location, source_location_id,
          status, expires_at, promoted_quest_id, job_type, gm_notes, player_notes } = req.body;
          
  const fullPath = path.join(vaultPath, row.path);
  const existing = JSON.parse(row.frontmatter || '{}');
  const fm = { ...existing };
  
  if (title !== undefined) fm.title = title;
  if (description !== undefined) fm.description = description;
  if (reward !== undefined) fm.reward = reward;
  if (difficulty !== undefined) fm.difficulty = difficulty;
  if (posted_by !== undefined) fm.posted_by = posted_by;
  if (location !== undefined) fm.location = location;
  if (source_location_id !== undefined) fm.source_location_id = source_location_id || null;
  if (status !== undefined) fm.status = status;
  if (expires_at !== undefined) fm.expires_at = expires_at || null;
  if (promoted_quest_id !== undefined) fm.promoted_quest_id = promoted_quest_id || null;
  if (job_type !== undefined) fm.job_type = job_type;
  if (gm_notes !== undefined) fm.gm_notes = gm_notes;
  if (player_notes !== undefined) fm.player_notes = player_notes;

  const content = matter.stringify(fm.description || existing.description || '', fm);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  const updatedRow = db.prepare(`SELECT * FROM vault_files WHERE id = ?`).get(req.params.id);
  res.json({ job: enrichJob(db, updatedRow) });
});

// PUT /api/jobs/:id/accept — any authenticated player accepts an open job
router.put('/:id/accept', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vault_files WHERE id = ? AND type='job'`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Job not found' });
  
  const existing = JSON.parse(row.frontmatter || '{}');
  if (existing.status !== 'open') return res.status(409).json({ error: 'Job is not available' });
  
  existing.status = 'active';
  existing.accepted_by_id = req.user.id;
  existing.accepted_at = new Date().toISOString();
  
  const fullPath = path.join(vaultPath, row.path);
  const content = matter.stringify(existing.description || '', existing);
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, 'utf8');
    syncFile(fullPath);
  }
  res.json({ success: true });
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
