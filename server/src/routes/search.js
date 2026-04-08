const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/search?q=term
router.get('/', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 200);
  if (!q || q.length < 2) return res.json({ results: [] });

  const rawCampId = req.headers['x-campaign-id'];
  const campId = rawCampId ? parseInt(rawCampId, 10) : null;
  if (!campId || isNaN(campId)) return res.json({ results: [] });

  const db = getDb();
  const like = `%${q}%`;
  const results = [];

  const visClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';

  // ── vault_files entries ────────────────────────────────────────────────────
  const quests = db.prepare(
    `SELECT id, title, json_extract(frontmatter,'$.status') as subtitle, 'quest' as type
     FROM vault_files WHERE campaign_id=? AND type='quest' ${visClause} AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const npcs = db.prepare(
    `SELECT id, title, json_extract(frontmatter,'$.role') as subtitle, 'npc' as type
     FROM vault_files WHERE campaign_id=? AND type='npc' ${visClause} AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const locations = db.prepare(
    `SELECT id, title, json_extract(frontmatter,'$.location_type') as subtitle, 'location' as type
     FROM vault_files WHERE campaign_id=? AND type='location' ${visClause} AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const hooks = db.prepare(
    `SELECT id, title, json_extract(frontmatter,'$.type') as subtitle, 'hook' as type
     FROM vault_files WHERE campaign_id=? AND type='hook' ${visClause} AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const factions = db.prepare(
    `SELECT id, title, '' as subtitle, 'faction' as type
     FROM vault_files WHERE campaign_id=? AND type='faction' ${visClause} AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const items = db.prepare(
    `SELECT id, title, '' as subtitle, 'inventory' as type
     FROM vault_files WHERE campaign_id=? AND type='inventory' AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const keyItems = db.prepare(
    `SELECT id, title, '' as subtitle, 'key-item' as type
     FROM vault_files WHERE campaign_id=? AND type='key-item' AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const maps = db.prepare(
    `SELECT id, title, '' as subtitle, 'map' as type
     FROM vault_files WHERE campaign_id=? AND type='map' AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const jobs = db.prepare(
    `SELECT id, title, json_extract(frontmatter,'$.difficulty') as subtitle, 'job' as type
     FROM vault_files WHERE campaign_id=? AND type='job' AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  // ── own tables ─────────────────────────────────────────────────────────────
  const bestiary = db.prepare(
    `SELECT id, name as title, NULL as subtitle, 'bestiary' as type
     FROM bestiary WHERE campaign_id=? AND name LIKE ? LIMIT 5`
  ).all(campId, like);

  const rumours = db.prepare(
    `SELECT id, text as title, source_npc as subtitle, 'rumour' as type
     FROM rumours WHERE campaign_id=? AND text LIKE ? LIMIT 5`
  ).all(campId, like);

  const handouts = db.prepare(
    `SELECT id, title, file_type as subtitle, 'handout' as type
     FROM handouts WHERE campaign_id=? AND title LIKE ? LIMIT 5`
  ).all(campId, like);

  const sessions = db.prepare(
    `SELECT id, title, played_at as subtitle, 'session' as type
     FROM sessions WHERE campaign_id=? AND (title LIKE ? OR summary LIKE ?) LIMIT 5`
  ).all(campId, like, like);

  let notes = [];
  if (req.user.isGm) {
    notes = db.prepare(
      `SELECT id, title, category as subtitle, 'note' as type
       FROM notes WHERE title LIKE ? LIMIT 5`
    ).all(like);
  } else {
    notes = db.prepare(
      `SELECT id, title, category as subtitle, 'note' as type
       FROM notes WHERE (player_id = ? OR privacy = 'public') AND title LIKE ? LIMIT 5`
    ).all(req.user.id, like);
  }

  results.push(
    ...quests, ...npcs, ...locations, ...hooks, ...factions,
    ...items, ...keyItems, ...maps, ...jobs,
    ...bestiary, ...rumours, ...handouts, ...sessions, ...notes
  );
  res.json({ results: results.slice(0, 30) });
});

module.exports = router;
