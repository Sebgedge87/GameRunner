const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const jobs = campId
    ? db.prepare(`SELECT * FROM jobs WHERE (campaign_id = ? OR campaign_id IS NULL) ${hiddenClause} ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC`).all(campId)
    : db.prepare(`SELECT * FROM jobs WHERE 1=1 ${hiddenClause} ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, created_at DESC`).all();
  res.json({ jobs });
});

makeHiddenToggle(router, 'jobs');

router.post('/', requireGm, (req, res) => {
  const { title, description, reward, difficulty = 'medium', posted_by, location, expires_at, campaign_id, requires_contact = false } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO jobs (campaign_id, title, description, reward, difficulty, posted_by, location, expires_at, requires_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(campaign_id || null, title, description || null, reward || null, difficulty, posted_by || null, location || null, expires_at || null, requires_contact ? 1 : 0);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ job });
});

router.put('/:id', requireGm, (req, res) => {
  const { title, description, reward, difficulty, posted_by, location, status, expires_at, promoted_quest_id } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE jobs SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      reward = COALESCE(?, reward),
      difficulty = COALESCE(?, difficulty),
      posted_by = COALESCE(?, posted_by),
      location = COALESCE(?, location),
      status = COALESCE(?, status),
      expires_at = COALESCE(?, expires_at),
      promoted_quest_id = COALESCE(?, promoted_quest_id)
    WHERE id = ?
  `).run(title, description, reward, difficulty, posted_by, location, status, expires_at, promoted_quest_id, req.params.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json({ job });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
