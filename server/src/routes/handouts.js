const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { createNotification, broadcastSSE } = require('../services/notifications');

const router = express.Router();

// GET /api/handouts — player sees only their shared handouts; GM sees all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'gm') {
    const handouts = db.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM handout_permissions hp WHERE hp.handout_id = h.id) as shared_count
      FROM handouts h ORDER BY h.created_at DESC
    `).all();
    const withPerms = handouts.map(h => {
      const perms = db.prepare(`
        SELECT hp.*, u.username, u.character_name, u.id as uid
        FROM handout_permissions hp
        JOIN users u ON hp.user_id = u.id
        WHERE hp.handout_id = ?
      `).all(h.id);
      return { ...h, permissions: perms };
    });
    return res.json({ handouts: withPerms });
  }
  const handouts = db.prepare(`
    SELECT h.*, hp.shared_at, hp.acked_at, hp.can_reshare
    FROM handouts h
    JOIN handout_permissions hp ON hp.handout_id = h.id
    WHERE hp.user_id = ?
    ORDER BY h.created_at DESC
  `).all(req.user.id);
  res.json({ handouts });
});

// POST /api/handouts — GM creates handout
router.post('/', requireGm, (req, res) => {
  const { title, description, body, file_path, file_type = 'text', requires_ack = false, campaign_id, share_with } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO handouts (title, description, body, file_path, file_type, created_by, requires_ack, campaign_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || null, body || null, file_path || null, file_type, req.user.id, requires_ack ? 1 : 0, campaign_id || null);
  const handout = db.prepare('SELECT * FROM handouts WHERE id = ?').get(result.lastInsertRowid);

  // Share immediately if share_with provided
  if (Array.isArray(share_with) && share_with.length > 0) {
    for (const userId of share_with) {
      db.prepare(`
        INSERT OR IGNORE INTO handout_permissions (handout_id, user_id, shared_by)
        VALUES (?, ?, ?)
      `).run(handout.id, userId, req.user.id);
      createNotification(db, userId, 'handout', `New handout: ${title}`, description || '', `/handouts/${handout.id}`);
      broadcastSSE(userId, { type: 'new_handout', handout_id: handout.id, title });
    }
  }

  res.status(201).json({ handout });
});

// POST /api/handouts/:id/share — share with user(s)
router.post('/:id/share', requireAuth, (req, res) => {
  const db = getDb();
  const handout = db.prepare('SELECT * FROM handouts WHERE id = ?').get(req.params.id);
  if (!handout) return res.status(404).json({ error: 'Not found' });

  // Players can only share if they have can_reshare permission
  if (req.user.role !== 'gm') {
    const perm = db.prepare('SELECT * FROM handout_permissions WHERE handout_id = ? AND user_id = ?').get(handout.id, req.user.id);
    if (!perm || !perm.can_reshare) return res.status(403).json({ error: 'Cannot reshare this handout' });
  }

  const { user_ids } = req.body;
  if (!Array.isArray(user_ids) || !user_ids.length) return res.status(400).json({ error: 'user_ids required' });

  for (const userId of user_ids) {
    db.prepare(`
      INSERT OR IGNORE INTO handout_permissions (handout_id, user_id, shared_by)
      VALUES (?, ?, ?)
    `).run(handout.id, userId, req.user.id);
    createNotification(db, userId, 'handout', `${req.user.character_name || req.user.username} shared: ${handout.title}`, '', `/handouts/${handout.id}`);
    broadcastSSE(userId, { type: 'new_handout', handout_id: handout.id, title: handout.title });
  }

  // Check if all players now have access → auto-promote
  const players = db.prepare("SELECT id FROM users WHERE role = 'player'").all();
  const permCount = db.prepare('SELECT COUNT(*) as c FROM handout_permissions WHERE handout_id = ?').get(handout.id).c;
  if (permCount >= players.length) {
    broadcastSSE('all', { type: 'handout_group', handout_id: handout.id, title: handout.title });
  }

  res.json({ success: true });
});

// PUT /api/handouts/:id/ack — acknowledge handout
router.put('/:id/ack', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE handout_permissions SET acked_at = CURRENT_TIMESTAMP WHERE handout_id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
