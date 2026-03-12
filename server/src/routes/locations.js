const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/locations
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM vault_files WHERE type = 'location' ORDER BY title ASC
  `).all();

  const locations = rows.map((r) => ({
    id: r.id,
    path: r.path,
    title: r.title,
    ...JSON.parse(r.frontmatter || '{}'),
  }));

  res.json({ locations });
});

module.exports = router;
