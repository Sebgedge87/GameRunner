const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

function tryParse(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

function canAccess(req, character) {
  return req.user.isGm || character.user_id === req.user.id;
}

// GET /api/characters — list characters for current campaign
// Players see only their own; GMs see all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campaignId = req.headers['x-campaign-id'] ? parseInt(req.headers['x-campaign-id'], 10) : null;
  let rows;
  if (req.user.isGm) {
    rows = campaignId
      ? db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.campaign_id = ? ORDER BY c.name`).all(campaignId)
      : db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id ORDER BY c.name`).all();
  } else {
    rows = campaignId
      ? db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.campaign_id = ? AND c.user_id = ? ORDER BY c.name`).all(campaignId, req.user.id)
      : db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.user_id = ? ORDER BY c.name`).all(req.user.id);
  }
  res.json({ characters: rows.map(r => ({ ...r, sheet_data: tryParse(r.sheet_data) })) });
});

// GET /api/characters/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(req, row)) return res.status(403).json({ error: 'Not authorised' });
  res.json({ character: { ...row, sheet_data: tryParse(row.sheet_data) } });
});

// POST /api/characters — create new character
router.post('/', requireAuth, (req, res) => {
  const { campaign_id, name = 'New Character', system = 'dnd5e', portrait_url, sheet_data = {} } = req.body;
  // Players can only create characters for themselves; GMs can specify user_id
  const userId = (req.user.isGm && req.body.user_id) ? req.body.user_id : req.user.id;
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO characters (user_id, campaign_id, name, system, portrait_url, sheet_data) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, campaign_id || null, name, system, portrait_url || null, JSON.stringify(sheet_data));
  const character = db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ character: { ...character, sheet_data: tryParse(character.sheet_data) } });
});

// PUT /api/characters/:id — update character
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(req, existing)) return res.status(403).json({ error: 'Not authorised' });

  const { name, system, portrait_url, sheet_data, campaign_id } = req.body;
  db.prepare(`
    UPDATE characters SET
      name = COALESCE(?, name),
      system = COALESCE(?, system),
      portrait_url = COALESCE(?, portrait_url),
      sheet_data = COALESCE(?, sheet_data),
      campaign_id = COALESCE(?, campaign_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ?? null,
    system ?? null,
    portrait_url !== undefined ? portrait_url : null,
    sheet_data !== undefined ? JSON.stringify(sheet_data) : null,
    campaign_id ?? null,
    req.params.id
  );
  const character = db.prepare(`SELECT c.*, u.username FROM characters c JOIN users u ON c.user_id = u.id WHERE c.id = ?`).get(req.params.id);
  res.json({ character: { ...character, sheet_data: tryParse(character.sheet_data) } });
});

// DELETE /api/characters/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!canAccess(req, existing)) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
