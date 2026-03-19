const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (j.hidden IS NULL OR j.hidden = 0)';
  if (!campId) return res.json({ jobs: [] });
  const locationId = req.query.location_id;
  const locationClause = locationId ? 'AND j.source_location_id = ?' : '';
  const params = locationId ? [campId, locationId] : [campId];
  const jobs = db.prepare(`
    SELECT j.*, vf.title AS source_location_name, u.username AS accepted_by_name
    FROM jobs j
    LEFT JOIN vault_files vf ON j.source_location_id = vf.id
    LEFT JOIN users u ON j.accepted_by_id = u.id
    WHERE j.campaign_id = ? ${hiddenClause} ${locationClause}
    ORDER BY CASE j.status WHEN 'open' THEN 0 ELSE 1 END, j.created_at DESC
  `).all(...params);
  res.json({ jobs });
});

makeHiddenToggle(router, 'jobs');

router.post('/', requireGm, (req, res) => {
  const { title, description, reward, difficulty = 'medium', posted_by, location, source_location_id,
          expires_at, requires_contact = false, job_type = 'bounty', gm_notes, player_notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO jobs (campaign_id, title, description, reward, difficulty, posted_by, location, source_location_id,
                      expires_at, requires_contact, job_type, gm_notes, player_notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(campId || null, title, description || null, reward || null, difficulty,
     posted_by || null, location || null, source_location_id || null, expires_at || null,
     requires_contact ? 1 : 0, job_type, gm_notes || null, player_notes || null, req.user.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ job });
});

router.put('/:id', requireGm, (req, res) => {
  const { title, description, reward, difficulty, posted_by, location, source_location_id,
          status, expires_at, promoted_quest_id, job_type, gm_notes, player_notes } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE jobs SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      reward = COALESCE(?, reward),
      difficulty = COALESCE(?, difficulty),
      posted_by = COALESCE(?, posted_by),
      location = COALESCE(?, location),
      source_location_id = COALESCE(?, source_location_id),
      status = COALESCE(?, status),
      expires_at = COALESCE(?, expires_at),
      promoted_quest_id = COALESCE(?, promoted_quest_id),
      job_type = COALESCE(?, job_type),
      gm_notes = COALESCE(?, gm_notes),
      player_notes = COALESCE(?, player_notes)
    WHERE id = ?
  `).run(title, description, reward, difficulty, posted_by, location, source_location_id,
     status, expires_at, promoted_quest_id, job_type, gm_notes, player_notes, req.params.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  res.json({ job });
});

// PUT /api/jobs/:id/accept — any authenticated player accepts an open job
router.put('/:id/accept', requireAuth, (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'open') return res.status(409).json({ error: 'Job is not available' });
  db.prepare(`UPDATE jobs SET status = 'active', accepted_by_id = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(req.user.id, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
