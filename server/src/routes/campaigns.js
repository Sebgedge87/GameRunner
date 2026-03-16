const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/campaigns — list campaigns the current user is a member of (plus any with no members yet)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  // Return all campaigns the user belongs to, with their role in each
  const campaigns = db.prepare(`
    SELECT c.*, COALESCE(cm.role, 'player') AS my_role
    FROM campaigns c
    LEFT JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
    WHERE cm.user_id = ? OR NOT EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = c.id)
    ORDER BY c.active DESC, c.created_at DESC
  `).all(req.user.id, req.user.id);
  res.json({ campaigns });
});

// GET /api/campaigns/active — get active campaign (must be defined before /:id routes)
router.get('/active', requireAuth, (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE active = 1 LIMIT 1').get();
  res.json({ campaign: campaign || null });
});

// POST /api/campaigns — any authenticated user can create a campaign; they become its GM
router.post('/', requireAuth, (req, res) => {
  const { name, system = 'dnd5e', subtitle, description, theme } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO campaigns (name, system, subtitle, description, theme, active)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(name, system, subtitle || null, description || null, theme || system);
  const campaignId = result.lastInsertRowid;
  // Add all existing users as players, creator as gm
  const allUsers = db.prepare('SELECT id FROM users').all();
  const ins = db.prepare('INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)');
  for (const u of allUsers) {
    ins.run(campaignId, u.id, u.id === req.user.id ? 'gm' : 'player');
  }
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  res.status(201).json({ campaign });
});

// PUT /api/campaigns/:id — campaign GM updates campaign details
router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const { name, system, subtitle, description, theme, current_scene, current_weather, current_time, music_url: rawMusicUrl, music_label, session_count } = req.body;
  const music_url = rawMusicUrl == null ? null : (/^https?:\/\//i.test(rawMusicUrl) ? rawMusicUrl : null);
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

// PUT /api/campaigns/:id/activate — campaign GM switches active campaign
router.put('/:id/activate', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE campaigns SET active = 0').run();
  db.prepare('UPDATE campaigns SET active = 1 WHERE id = ?').run(req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// GET /api/campaigns/:id/members — list members (campaign GM only)
router.get('/:id/members', requireGm, (req, res) => {
  const db = getDb();
  const members = db.prepare(`
    SELECT u.id, u.username, u.character_name, u.character_class, u.character_level, cm.role, cm.joined_at
    FROM campaign_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.campaign_id = ?
    ORDER BY cm.role DESC, u.username
  `).all(req.params.id);
  res.json({ members });
});

// POST /api/campaigns/:id/members — GM adds a player to the campaign
router.post('/:id/members', requireGm, (req, res) => {
  const { user_id, role = 'player' } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('INSERT OR REPLACE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)').run(req.params.id, user_id, role);
  res.json({ success: true });
});

// DELETE /api/campaigns/:id/members/:userId — GM removes a player
router.delete('/:id/members/:userId', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM campaign_members WHERE campaign_id=? AND user_id=?').run(req.params.id, req.params.userId);
  res.json({ success: true });
});

module.exports = router;
