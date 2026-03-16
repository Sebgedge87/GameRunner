const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

function playerCount(db, campaignId) {
  return db.prepare("SELECT COUNT(*) as n FROM campaign_members WHERE campaign_id=?").get(campaignId)?.n || 0;
}

// GET /api/campaigns — campaigns the current user is a member of, with role + player count
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campaigns = db.prepare(`
    SELECT c.*, COALESCE(cm.role, 'player') AS my_role
    FROM campaigns c
    LEFT JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
    WHERE cm.user_id = ? OR NOT EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = c.id)
    ORDER BY c.active DESC, c.created_at DESC
  `).all(req.user.id, req.user.id);

  const result = campaigns.map(c => ({
    ...c,
    player_count: playerCount(db, c.id)
  }));
  res.json({ campaigns: result });
});

// GET /api/campaigns/active
router.get('/active', requireAuth, (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE active = 1 LIMIT 1').get();
  res.json({ campaign: campaign || null });
});

// POST /api/campaigns/join — redeem an invite code
router.post('/join', requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE invite_code = ?').get(code.trim().toUpperCase());
  if (!campaign) return res.status(404).json({ error: 'Invalid invite code' });

  // Check existing membership
  const existing = db.prepare('SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?').get(campaign.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'You are already in this campaign', campaign });

  // Check capacity
  const count = playerCount(db, campaign.id);
  if (campaign.max_players && count >= campaign.max_players) {
    return res.status(403).json({ error: 'Campaign is full' });
  }

  db.prepare('INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)').run(campaign.id, req.user.id, 'player');
  res.json({ campaign, joined: true });
});

// POST /api/campaigns — any authenticated user can create; becomes GM
router.post('/', requireAuth, (req, res) => {
  const { name, system = 'dnd5e', subtitle, description, theme, max_players, invite_code, cover_image } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  // Auto-generate invite code if not provided
  const code = invite_code
    ? invite_code.trim().toUpperCase()
    : crypto.randomBytes(3).toString('hex').toUpperCase();

  const db = getDb();
  // Ensure uniqueness
  const taken = db.prepare('SELECT id FROM campaigns WHERE invite_code = ?').get(code);
  if (taken) return res.status(409).json({ error: 'Invite code already in use, choose another' });

  const result = db.prepare(`
    INSERT INTO campaigns (name, system, subtitle, description, theme, max_players, invite_code, cover_image, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(name, system, subtitle || null, description || null, theme || system,
         max_players ? parseInt(max_players) : 4, code, cover_image || null);

  const campaignId = result.lastInsertRowid;
  // Only add the creator as GM — players join via invite code
  db.prepare('INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)').run(campaignId, req.user.id, 'gm');

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  res.status(201).json({ campaign });
});

// PUT /api/campaigns/:id — campaign GM updates details
router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const { name, system, subtitle, description, theme, current_scene, current_weather, current_time,
          music_url: rawMusicUrl, music_label, session_count, max_players, invite_code, cover_image } = req.body;
  const music_url = rawMusicUrl == null ? null : (/^https?:\/\//i.test(rawMusicUrl) ? rawMusicUrl : null);
  const code = invite_code != null ? invite_code.trim().toUpperCase() || null : null;
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
      max_players = COALESCE(?, max_players),
      invite_code = COALESCE(?, invite_code),
      cover_image = COALESCE(?, cover_image),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name ?? null, system ?? null, subtitle ?? null, description ?? null, theme ?? null,
         current_scene ?? null, current_weather ?? null, current_time ?? null,
         music_url ?? null, music_label ?? null, session_count ?? null,
         max_players ? parseInt(max_players) : null,
         code, cover_image ?? null, req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// PUT /api/campaigns/:id/activate
router.put('/:id/activate', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE campaigns SET active = 0').run();
  db.prepare('UPDATE campaigns SET active = 1 WHERE id = ?').run(req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// GET /api/campaigns/:id/members
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

// POST /api/campaigns/:id/members — GM adds a member
router.post('/:id/members', requireGm, (req, res) => {
  const { user_id, role = 'player' } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  db.prepare('INSERT OR REPLACE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)').run(req.params.id, user_id, role);
  res.json({ success: true });
});

// DELETE /api/campaigns/:id/members/:userId
router.delete('/:id/members/:userId', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM campaign_members WHERE campaign_id=? AND user_id=?').run(req.params.id, req.params.userId);
  res.json({ success: true });
});

module.exports = router;
