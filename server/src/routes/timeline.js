const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { makeHiddenToggle } = require('../utils/routeHelpers');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const hiddenClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  if (!campId) return res.json({ events: [] });
  const events = db.prepare(`SELECT * FROM timeline_events WHERE campaign_id = ? ${hiddenClause} ORDER BY in_world_date ASC, created_at ASC`).all(campId);
  res.json({ events });
});

makeHiddenToggle(router, 'timeline_events');

router.post('/', requireGm, (req, res) => {
  const { title, description, in_world_date, session_number, linked_type, linked_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const db = getDb();
  const campId = getCampaignId(req);
  const result = db.prepare(`
    INSERT INTO timeline_events (campaign_id, title, description, in_world_date, session_number, linked_type, linked_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(campId || null, title, description || null, in_world_date || null, session_number || null, linked_type || null, linked_id || null);
  const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ event });
});

router.put('/:id', requireGm, (req, res) => {
  const { title, description, in_world_date, session_number } = req.body;
  const db = getDb();
  db.prepare('UPDATE timeline_events SET title=COALESCE(?,title), description=COALESCE(?,description), in_world_date=COALESCE(?,in_world_date), session_number=COALESCE(?,session_number) WHERE id=?')
    .run(title, description, in_world_date, session_number, req.params.id);
  const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(req.params.id);
  res.json({ event });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM timeline_events WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
