const express = require('express');
const { getDb, getActiveCampaignId } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getActiveCampaignId();
  const hiddenClause = req.user.role === 'gm' ? '' : 'AND (hidden IS NULL OR hidden = 0)';
  const factions = campId
    ? db.prepare(`SELECT * FROM factions WHERE (campaign_id = ? OR campaign_id IS NULL) ${hiddenClause} ORDER BY name`).all(campId)
    : db.prepare(`SELECT * FROM factions WHERE 1=1 ${hiddenClause} ORDER BY name`).all();
  const withRep = factions.map(f => {
    const rep = db.prepare('SELECT * FROM faction_reputation WHERE faction_id = ?').get(f.id);
    return { ...f, reputation: rep ? rep.score : 0 };
  });
  res.json({ factions: withRep });
});

router.post('/', requireGm, (req, res) => {
  const { name, description, goals, image_path, campaign_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO factions (campaign_id, name, description, goals, image_path) VALUES (?, ?, ?, ?, ?)')
    .run(campaign_id || null, name, description || null, goals || null, image_path || null);
  db.prepare('INSERT INTO faction_reputation (faction_id, campaign_id, score) VALUES (?, ?, 0)')
    .run(result.lastInsertRowid, campaign_id || null);
  const faction = db.prepare('SELECT * FROM factions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ faction });
});

router.put('/:id', requireGm, (req, res) => {
  const { name, description, goals, image_path } = req.body;
  const db = getDb();
  db.prepare('UPDATE factions SET name=COALESCE(?,name), description=COALESCE(?,description), goals=COALESCE(?,goals), image_path=COALESCE(?,image_path) WHERE id=?')
    .run(name, description, goals, image_path, req.params.id);
  const faction = db.prepare('SELECT * FROM factions WHERE id = ?').get(req.params.id);
  res.json({ faction });
});

router.put('/:id/hidden', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, hidden FROM factions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const newVal = row.hidden ? 0 : 1;
  db.prepare('UPDATE factions SET hidden = ? WHERE id = ?').run(newVal, req.params.id);
  res.json({ hidden: newVal });
});

router.put('/:id/reputation', requireGm, (req, res) => {
  const { score, campaign_id } = req.body;
  if (score === undefined) return res.status(400).json({ error: 'score required' });
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO faction_reputation (faction_id, campaign_id, score, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(req.params.id, campaign_id || null, Math.max(-3, Math.min(3, score)));
  res.json({ success: true });
});

router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM faction_reputation WHERE faction_id = ?').run(req.params.id);
  db.prepare('DELETE FROM factions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
