const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/campaigns — list all campaigns
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY active DESC, created_at DESC').all();
  res.json({ campaigns });
});

// GET /api/campaigns/active — get active campaign
router.get('/active', requireAuth, (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE active = 1 LIMIT 1').get();
  res.json({ campaign: campaign || null });
});

// POST /api/campaigns — GM creates campaign
router.post('/', requireGm, (req, res) => {
  const { name, system = 'dnd5e', subtitle, description, theme } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO campaigns (name, system, subtitle, description, theme, active)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(name, system, subtitle || null, description || null, theme || system);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ campaign });
});

// PUT /api/campaigns/:id — GM updates campaign
router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const { name, system, subtitle, description, theme, current_scene, current_weather, current_time, music_url, music_label, session_count } = req.body;
  db.prepare(`
    UPDATE campaigns SET
      name = COALESCE(?, name),
      system = COALESCE(?, system),
      subtitle = COALESCE(?, subtitle),
      description = COALESCE(?, description),
      theme = COALESCE(?, theme),
      current_scene = COALESCE(?, current_scene),
      current_weather = COALESCE(?, current_weather),
      current_time = COALESCE(?, current_time),
      music_url = COALESCE(?, music_url),
      music_label = COALESCE(?, music_label),
      session_count = COALESCE(?, session_count),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, system, subtitle, description, theme, current_scene, current_weather, current_time, music_url, music_label, session_count, req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// PUT /api/campaigns/:id/activate — switch active campaign
router.put('/:id/activate', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE campaigns SET active = 0').run();
  db.prepare('UPDATE campaigns SET active = 1 WHERE id = ?').run(req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

module.exports = router;
