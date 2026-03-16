const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/sessions
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const sessions = campId
    ? db.prepare('SELECT * FROM sessions WHERE (campaign_id = ? OR campaign_id IS NULL) ORDER BY number DESC').all(campId)
    : db.prepare('SELECT * FROM sessions ORDER BY number DESC').all();
  const withNotes = sessions.map(s => {
    const notes = req.user.isGm
      ? db.prepare('SELECT sn.*, u.character_name FROM session_notes sn LEFT JOIN users u ON sn.player_id = u.id WHERE sn.session_id = ?').all(s.id)
      : db.prepare("SELECT sn.*, u.character_name FROM session_notes sn LEFT JOIN users u ON sn.player_id = u.id WHERE sn.session_id = ? AND (sn.player_id = ? OR sn.privacy = 'public')").all(s.id, req.user.id);
    return { ...s, notes };
  });
  res.json({ sessions: withNotes });
});

// POST /api/sessions — GM creates session recap
router.post('/', requireGm, (req, res) => {
  const { campaign_id, number, title, summary, played_at, in_world_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO sessions (campaign_id, number, title, summary, played_at, in_world_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(campaign_id || null, number || null, title, summary || null, played_at || null, in_world_date || null);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ session });
});

// POST /api/sessions/:id/notes — player adds session note
router.post('/:id/notes', requireAuth, (req, res) => {
  const { body, privacy = 'private' } = req.body;
  if (!body) return res.status(400).json({ error: 'body is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO session_notes (session_id, player_id, body, privacy) VALUES (?, ?, ?, ?)')
    .run(req.params.id, req.user.id, body, privacy);
  const note = db.prepare('SELECT * FROM session_notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ note });
});

// ── Polls ──────────────────────────────────────────────────────────────────────
router.get('/polls', requireAuth, (req, res) => {
  const db = getDb();
  const polls = db.prepare('SELECT * FROM session_polls ORDER BY created_at DESC').all();
  const result = polls.map(p => {
    const votes = db.prepare('SELECT * FROM poll_votes WHERE poll_id = ?').all(p.id);
    const myVote = votes.find(v => v.user_id === req.user.id);
    return {
      ...p,
      options: JSON.parse(p.options),
      vote_count: votes.length,
      my_vote: myVote ? myVote.option_index : null,
      votes: req.user.isGm || p.results_public ? votes : null,
    };
  });
  res.json({ polls: result });
});

router.post('/polls', requireGm, (req, res) => {
  const { campaign_id, question, options } = req.body;
  if (!question || !Array.isArray(options)) return res.status(400).json({ error: 'question and options[] required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO session_polls (campaign_id, question, options, created_by) VALUES (?, ?, ?, ?)')
    .run(campaign_id || null, question, JSON.stringify(options), req.user.id);
  const poll = db.prepare('SELECT * FROM session_polls WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ poll: { ...poll, options: JSON.parse(poll.options) } });
});

router.post('/polls/:id/vote', requireAuth, (req, res) => {
  const { option_index } = req.body;
  if (option_index === undefined) return res.status(400).json({ error: 'option_index required' });
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, option_index);
  res.json({ success: true });
});

router.put('/polls/:id/reveal', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE session_polls SET results_public = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/polls/:id/close', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE session_polls SET closed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/polls/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM poll_votes WHERE poll_id = ?').run(req.params.id);
  db.prepare('DELETE FROM session_polls WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Scheduling ─────────────────────────────────────────────────────────────────
router.get('/scheduling', requireAuth, (req, res) => {
  const db = getDb();
  const dates = db.prepare('SELECT * FROM session_scheduling ORDER BY proposed_date ASC').all();
  const withResponses = dates.map(d => {
    const responses = db.prepare('SELECT sr.*, u.character_name, u.username FROM scheduling_responses sr JOIN users u ON sr.user_id = u.id WHERE sr.scheduling_id = ?').all(d.id);
    const myResponse = responses.find(r => r.user_id === req.user.id);
    return { ...d, responses, my_response: myResponse ? myResponse.availability : null };
  });
  res.json({ scheduling: withResponses });
});

router.post('/scheduling', requireGm, (req, res) => {
  const { campaign_id, proposed_date, title } = req.body;
  if (!proposed_date) return res.status(400).json({ error: 'proposed_date required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO session_scheduling (campaign_id, proposed_date, title, created_by) VALUES (?, ?, ?, ?)')
    .run(campaign_id || null, proposed_date, title || null, req.user.id);
  const date = db.prepare('SELECT * FROM session_scheduling WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ date });
});

router.post('/scheduling/:id/respond', requireAuth, (req, res) => {
  const { availability } = req.body;
  if (!['yes', 'maybe', 'no'].includes(availability)) return res.status(400).json({ error: 'availability must be yes/maybe/no' });
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO scheduling_responses (scheduling_id, user_id, availability) VALUES (?, ?, ?)')
    .run(req.params.id, req.user.id, availability);
  res.json({ success: true });
});

router.put('/scheduling/:id/confirm', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE session_scheduling SET confirmed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});


// PUT /api/sessions/:sessionId/notes/:noteId — player edits own note
router.put('/:sessionId/notes/:noteId', requireAuth, (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM session_notes WHERE id = ?').get(req.params.noteId);
  if (!note) return res.status(404).json({ error: 'Not found' });
  if (note.player_id !== req.user.id && !req.user.isGm) return res.status(403).json({ error: 'Not authorised' });
  const { body, privacy } = req.body;
  db.prepare('UPDATE session_notes SET body = COALESCE(?, body), privacy = COALESCE(?, privacy) WHERE id = ?')
    .run(body || null, privacy || null, req.params.noteId);
  const updated = db.prepare('SELECT * FROM session_notes WHERE id = ?').get(req.params.noteId);
  res.json({ note: updated });
});

// DELETE /api/sessions/:sessionId/notes/:noteId — player deletes own note
router.delete('/:sessionId/notes/:noteId', requireAuth, (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM session_notes WHERE id = ?').get(req.params.noteId);
  if (!note) return res.status(404).json({ error: 'Not found' });
  if (note.player_id !== req.user.id && !req.user.isGm) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM session_notes WHERE id = ?').run(req.params.noteId);
  res.json({ success: true });
});

// PUT /api/sessions/:id — GM edits session
router.put('/:id', requireGm, (req, res) => {
  const { title, summary, played_at, in_world_date } = req.body;
  const db = getDb();
  db.prepare('UPDATE sessions SET title = COALESCE(?, title), summary = COALESCE(?, summary), played_at = COALESCE(?, played_at), in_world_date = COALESCE(?, in_world_date), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title || null, summary || null, played_at || null, in_world_date || null, req.params.id);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  res.json({ session });
});

// DELETE /api/sessions/:id — GM deletes session
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM session_notes WHERE session_id = ?').run(req.params.id);
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
