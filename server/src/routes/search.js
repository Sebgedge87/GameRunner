const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/search?q=term
router.get('/', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim().slice(0, 200);
  if (!q || q.length < 2) return res.json({ results: [] });
  const db = getDb();
  const like = `%${q}%`;
  const results = [];

  const visClause = req.user.isGm ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const quests = db.prepare(`SELECT id, title, json_extract(frontmatter,'$.status') as subtitle, 'quest' as type FROM vault_files WHERE type='quest' ${visClause} AND title LIKE ? LIMIT 5`).all(like);
  const npcs = db.prepare(`SELECT id, title, json_extract(frontmatter,'$.role') as subtitle, 'npc' as type FROM vault_files WHERE type='npc' ${visClause} AND title LIKE ? LIMIT 5`).all(like);
  const locations = db.prepare(`SELECT id, title, json_extract(frontmatter,'$.status') as subtitle, 'location' as type FROM vault_files WHERE type='location' ${visClause} AND title LIKE ? LIMIT 5`).all(like);
  const hooks = db.prepare(`SELECT id, title, json_extract(frontmatter,'$.type') as subtitle, 'hook' as type FROM vault_files WHERE type='hook' ${visClause} AND title LIKE ? LIMIT 5`).all(like);
  const items = db.prepare("SELECT id, name as title, holder as subtitle, 'inventory' as type FROM inventory WHERE name LIKE ? LIMIT 5").all(like);
  const keyItems = db.prepare("SELECT id, name as title, significance as subtitle, 'key-item' as type FROM key_items WHERE name LIKE ? LIMIT 5").all(like);
  const factions = db.prepare("SELECT id, name as title, '' as subtitle, 'faction' as type FROM factions WHERE name LIKE ? LIMIT 5").all(like);

  let notes = [];
  if (req.user.isGm) {
    notes = db.prepare("SELECT id, title, category as subtitle, 'note' as type FROM notes WHERE title LIKE ? LIMIT 5").all(like);
  } else {
    notes = db.prepare("SELECT id, title, category as subtitle, 'note' as type FROM notes WHERE (user_id = ? OR privacy = 'public') AND title LIKE ? LIMIT 5").all(req.user.id, like);
  }

  const sessions = db.prepare("SELECT id, title, played_at as subtitle, 'session' as type FROM sessions WHERE title LIKE ? OR summary LIKE ? LIMIT 5").all(like, like);
  const jobs = db.prepare("SELECT id, title, difficulty as subtitle, 'job' as type FROM jobs WHERE title LIKE ? LIMIT 5").all(like);

  results.push(...quests, ...npcs, ...locations, ...hooks, ...items, ...keyItems, ...factions, ...notes, ...sessions, ...jobs);
  res.json({ results: results.slice(0, 30) });
});

module.exports = router;
