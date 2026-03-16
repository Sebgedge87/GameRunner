const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/bestiary — players see only revealed; GM sees all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const campClause = campId ? 'AND (campaign_id = ? OR campaign_id IS NULL)' : '';
  const rows = req.user.isGm
    ? (campId ? db.prepare(`SELECT * FROM bestiary WHERE 1=1 ${campClause} ORDER BY name`).all(campId) : db.prepare('SELECT * FROM bestiary ORDER BY name').all())
    : (campId ? db.prepare(`SELECT * FROM bestiary WHERE revealed = 1 ${campClause} ORDER BY name`).all(campId) : db.prepare('SELECT * FROM bestiary WHERE revealed = 1 ORDER BY name').all());
  const parsed = rows.map(r => ({ ...r, stats: tryParse(r.stats) }));
  res.json({ bestiary: parsed });
});

router.post('/', requireGm, (req, res) => {
  const { name, description, stats = {}, image_path, campaign_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO bestiary (campaign_id, name, description, stats, image_path) VALUES (?, ?, ?, ?, ?)')
    .run(campaign_id || null, name, description || null, JSON.stringify(stats), image_path || null);
  const creature = db.prepare('SELECT * FROM bestiary WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ creature: { ...creature, stats: tryParse(creature.stats) } });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, stats, image_path } = req.body;
  const db = getDb();
  db.prepare('UPDATE bestiary SET name=COALESCE(?,name), description=COALESCE(?,description), stats=COALESCE(?,stats), image_path=COALESCE(?,image_path) WHERE id=?')
    .run(name, description, stats !== undefined ? JSON.stringify(stats) : null, image_path, req.params.id);
  const creature = db.prepare('SELECT * FROM bestiary WHERE id = ?').get(req.params.id);
  res.json({ creature: { ...creature, stats: tryParse(creature.stats) } });
});

router.put('/:id/reveal', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE bestiary SET revealed = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM bestiary WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

function tryParse(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

module.exports = router;
