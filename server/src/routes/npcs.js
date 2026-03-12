const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/npcs
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM vault_files WHERE type = 'npc' ORDER BY title ASC
  `).all();

  const npcs = rows.map((r) => ({
    id: r.id,
    path: r.path,
    title: r.title,
    ...JSON.parse(r.frontmatter || '{}'),
  }));

  res.json({ npcs });
});

module.exports = router;
