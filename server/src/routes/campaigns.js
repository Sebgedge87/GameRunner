const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { broadcastSSE } = require('../services/notifications');
const { vaultPath } = require('../config');

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
    WHERE cm.user_id = ?
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
  const { name, system = 'dnd5e', subtitle, description, theme, max_players, invite_code, cover_image,
          bg_image: rawBgImage, playlist_url: rawPlaylistUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const bg_image = rawBgImage == null ? null : (/^https?:\/\//i.test(rawBgImage) ? rawBgImage : (rawBgImage.startsWith('/') ? rawBgImage : null));
  const playlist_url = rawPlaylistUrl == null ? null : (/^https?:\/\//i.test(rawPlaylistUrl) ? rawPlaylistUrl : null);

  // Auto-generate invite code if not provided
  const code = invite_code
    ? invite_code.trim().toUpperCase()
    : crypto.randomBytes(3).toString('hex').toUpperCase();

  const db = getDb();
  // Ensure uniqueness
  const taken = db.prepare('SELECT id FROM campaigns WHERE invite_code = ?').get(code);
  if (taken) return res.status(409).json({ error: 'Invite code already in use, choose another' });

  const result = db.prepare(`
    INSERT INTO campaigns (name, system, subtitle, description, theme, max_players, invite_code, cover_image, bg_image, playlist_url, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(name, system, subtitle || null, description || null, theme || system,
         max_players ? parseInt(max_players) : 4, code, cover_image || null, bg_image || null, playlist_url || null);

  const campaignId = result.lastInsertRowid;
  // Only add the creator as GM — players join via invite code
  db.prepare('INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)').run(campaignId, req.user.id, 'gm');
  // Promote campaign creators to global GM role as well.
  db.prepare("UPDATE users SET role='gm' WHERE id=? AND role <> 'gm'").run(req.user.id);

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
  res.status(201).json({ campaign });
});

// PUT /api/campaigns/:id — campaign GM updates details
router.put('/:id', requireGm, (req, res) => {
  const db = getDb();
  const { name, system, subtitle, description, theme, current_scene, current_weather, current_time,
          music_url: rawMusicUrl, music_label, session_count, max_players, invite_code, cover_image,
          bg_image: rawBgImage, playlist_url: rawPlaylistUrl, dune_house, avg_sanity, dnd_setting } = req.body;
  const music_url = rawMusicUrl == null ? null : (/^https?:\/\//i.test(rawMusicUrl) ? rawMusicUrl : null);
  const bg_image = rawBgImage == null ? null : (/^https?:\/\//i.test(rawBgImage) ? rawBgImage : (rawBgImage.startsWith('/') ? rawBgImage : null));
  const playlist_url = rawPlaylistUrl == null ? null : (/^https?:\/\//i.test(rawPlaylistUrl) ? rawPlaylistUrl : null);
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
      bg_image = COALESCE(?, bg_image),
      playlist_url = COALESCE(?, playlist_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name ?? null, system ?? null, subtitle ?? null, description ?? null, theme ?? null,
         current_scene ?? null, current_weather ?? null, current_time ?? null,
         music_url ?? null, music_label ?? null, session_count ?? null,
         max_players ? parseInt(max_players) : null,
         code, cover_image ?? null, bg_image ?? null, playlist_url ?? null, req.params.id);
  // dune_house handled separately so an explicit null/empty can clear the value
  if (dune_house !== undefined) {
    db.prepare('UPDATE campaigns SET dune_house = ? WHERE id = ?').run(dune_house || null, req.params.id);
  }
  // avg_sanity handled separately to allow explicit null (resets to default 100)
  if (avg_sanity !== undefined) {
    db.prepare('UPDATE campaigns SET avg_sanity = ? WHERE id = ?').run(avg_sanity != null ? parseInt(avg_sanity) : 100, req.params.id);
  }
  // dnd_setting handled separately so an explicit null/empty can clear the value
  if (dnd_setting !== undefined) {
    db.prepare('UPDATE campaigns SET dnd_setting = ? WHERE id = ?').run(dnd_setting || null, req.params.id);
  }
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// DELETE /api/campaigns/:id — GM deletes a campaign and all associated data
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT id, name FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Delete physical vault files for this campaign
  const files = db.prepare('SELECT path FROM vault_files WHERE campaign_id = ?').all(req.params.id);
  for (const f of files) {
    try { fs.unlinkSync(path.join(vaultPath, f.path)); } catch {}
  }

  // Remove vault_files records, rumours, members, then the campaign row
  db.prepare('DELETE FROM vault_files WHERE campaign_id = ?').run(req.params.id);
  db.prepare('DELETE FROM rumours WHERE campaign_id = ?').run(req.params.id);
  db.prepare('DELETE FROM campaign_members WHERE campaign_id = ?').run(req.params.id);
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

// PUT /api/campaigns/:id/activate
router.put('/:id/activate', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE campaigns SET active = 0').run();
  db.prepare('UPDATE campaigns SET active = 1 WHERE id = ?').run(req.params.id);
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

// GET /api/campaigns/:id/stats — GM overview stats
router.get('/:id/stats', requireGm, (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const playerCount = db.prepare("SELECT COUNT(*) as n FROM campaign_members WHERE campaign_id = ? AND role = 'player'").get(id).n;
  const sessionCount = db.prepare('SELECT COUNT(*) as n FROM sessions WHERE campaign_id = ?').get(id).n;
  const handoutCount = db.prepare('SELECT COUNT(*) as n FROM handouts WHERE campaign_id = ?').get(id).n;
  const messageCount = db.prepare('SELECT COUNT(*) as n FROM messages WHERE campaign_id = ?').get(id).n;
  const xpTotal = db.prepare('SELECT COALESCE(SUM(amount),0) as t FROM xp_awards WHERE campaign_id = ?').get(id).t;
  const questCount = db.prepare("SELECT COUNT(*) as n FROM vault_files WHERE campaign_id = ? AND type = 'quest'").get(id).n;
  const activeQuestCount = db.prepare("SELECT COUNT(*) as n FROM vault_files WHERE campaign_id = ? AND type = 'quest' AND json_extract(frontmatter,'$.status') = 'active'").get(id).n;

  res.json({
    stats: {
      player_count: playerCount,
      session_count: sessionCount,
      handout_count: handoutCount,
      message_count: messageCount,
      xp_total: xpTotal,
      quest_count: questCount,
      active_quest_count: activeQuestCount,
    }
  });
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

// PUT /api/campaigns/:id/timer — GM sets/starts/pauses/resets the session timer
// Body: { action: 'set'|'start'|'pause'|'reset', label?: string, duration?: number (seconds) }
router.put('/:id/timer', requireGm, (req, res) => {
  const db = getDb();
  const { action, label, duration } = req.body;
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  let timer_label = campaign.timer_label;
  let timer_end = campaign.timer_end;
  let timer_remaining = campaign.timer_remaining;
  let timer_running = campaign.timer_running;

  if (action === 'set') {
    // Set new timer without starting it
    timer_label = label ?? timer_label;
    timer_remaining = duration != null ? duration : timer_remaining;
    timer_end = null;
    timer_running = 0;
  } else if (action === 'start') {
    // Start or resume from remaining
    if (label != null) timer_label = label;
    if (duration != null) timer_remaining = duration;
    const secs = timer_running ? (timer_end - Math.floor(Date.now() / 1000)) : timer_remaining;
    timer_end = Math.floor(Date.now() / 1000) + Math.max(secs, 0);
    timer_running = 1;
  } else if (action === 'pause') {
    if (timer_running) {
      timer_remaining = Math.max((timer_end || 0) - Math.floor(Date.now() / 1000), 0);
    }
    timer_end = null;
    timer_running = 0;
  } else if (action === 'reset') {
    timer_end = null;
    timer_remaining = duration != null ? duration : 0;
    timer_running = 0;
    if (label != null) timer_label = label;
  }

  db.prepare(`
    UPDATE campaigns SET timer_label=?, timer_end=?, timer_remaining=?, timer_running=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(timer_label, timer_end, timer_remaining, timer_running, req.params.id);

  // Broadcast to all campaign members via SSE
  const members = db.prepare('SELECT user_id FROM campaign_members WHERE campaign_id=?').all(req.params.id);
  const payload = { type: 'timer_update', campaign_id: Number(req.params.id), timer: { label: timer_label, end: timer_end, remaining: timer_remaining, running: !!timer_running } };
  for (const m of members) broadcastSSE(m.user_id, payload);

  res.json({ timer: payload.timer });
});

// PUT /api/campaigns/:id/party-location — any member sets current party location
// Body: { location_id: <number|"TRAVELING"> }
router.put('/:id/party-location', requireAuth, (req, res) => {
  const { location_id } = req.body;
  if (location_id === undefined) return res.status(400).json({ error: 'location_id required' });
  const value = location_id === 'TRAVELING' || location_id === null ? String(location_id ?? 'TRAVELING') : String(location_id);
  const db = getDb();
  db.prepare('UPDATE campaigns SET current_party_location_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(value, req.params.id);
  res.json({ success: true, current_party_location_id: value });
});

module.exports = router;
