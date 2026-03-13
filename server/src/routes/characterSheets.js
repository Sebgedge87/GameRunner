const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();

function tryParse(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

// GET /api/character-sheets — players see their own; GM sees all
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const sheets = req.user.role === 'gm'
    ? db.prepare(`
        SELECT cs.*, u.username, u.character_name
        FROM character_sheets cs
        JOIN users u ON cs.user_id = u.id
        ORDER BY u.character_name
      `).all()
    : db.prepare('SELECT cs.*, u.username, u.character_name FROM character_sheets cs JOIN users u ON cs.user_id = u.id WHERE cs.user_id = ?').all(req.user.id);
  res.json({ sheets: sheets.map(s => ({ ...s, sheet_data: tryParse(s.sheet_data) })) });
});

// GET /api/character-sheets/:userId
router.get('/:userId', requireAuth, (req, res) => {
  if (req.user.role !== 'gm' && req.user.id !== Number(req.params.userId)) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  const db = getDb();
  const sheet = db.prepare(`
    SELECT cs.*, u.username, u.character_name
    FROM character_sheets cs
    JOIN users u ON cs.user_id = u.id
    WHERE cs.user_id = ?
  `).get(req.params.userId);
  if (!sheet) return res.status(404).json({ error: 'Not found' });
  res.json({ sheet: { ...sheet, sheet_data: tryParse(sheet.sheet_data) } });
});

// PUT /api/character-sheets/:userId — upsert sheet
router.put('/:userId', requireAuth, (req, res) => {
  if (req.user.role !== 'gm' && req.user.id !== Number(req.params.userId)) {
    return res.status(403).json({ error: 'Not authorised' });
  }
  const { campaign_id, system = 'dnd5e', sheet_data = {}, dnd_beyond_url } = req.body;
  const db = getDb();
  db.prepare(`
    INSERT INTO character_sheets (user_id, campaign_id, system, sheet_data, dnd_beyond_url, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, campaign_id) DO UPDATE SET
      system = excluded.system,
      sheet_data = excluded.sheet_data,
      dnd_beyond_url = excluded.dnd_beyond_url,
      updated_at = CURRENT_TIMESTAMP
  `).run(req.params.userId, campaign_id || null, system, JSON.stringify(sheet_data), dnd_beyond_url || null);
  const sheet = db.prepare('SELECT * FROM character_sheets WHERE user_id = ?').get(req.params.userId);
  res.json({ sheet: { ...sheet, sheet_data: tryParse(sheet.sheet_data) } });
});

// ── Ship Sheets ────────────────────────────────────────────────────────────────
router.get('/ships/all', requireAuth, (req, res) => {
  const db = getDb();
  const ships = db.prepare('SELECT * FROM ship_sheets ORDER BY name').all();
  res.json({ ships: ships.map(s => ({ ...s, sheet_data: tryParse(s.sheet_data) })) });
});

router.post('/ships', requireGm, (req, res) => {
  const { name, system = 'alien', sheet_data = {}, image_path, campaign_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO ship_sheets (campaign_id, name, system, sheet_data, image_path) VALUES (?, ?, ?, ?, ?)')
    .run(campaign_id || null, name, system, JSON.stringify(sheet_data), image_path || null);
  const ship = db.prepare('SELECT * FROM ship_sheets WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ship: { ...ship, sheet_data: tryParse(ship.sheet_data) } });
});

router.put('/ships/:id', requireAuth, (req, res) => {
  const { name, system, sheet_data, image_path } = req.body;
  const db = getDb();
  db.prepare(`
    UPDATE ship_sheets SET
      name = COALESCE(?, name),
      system = COALESCE(?, system),
      sheet_data = COALESCE(?, sheet_data),
      image_path = COALESCE(?, image_path),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, system, sheet_data !== undefined ? JSON.stringify(sheet_data) : null, image_path, req.params.id);
  const ship = db.prepare('SELECT * FROM ship_sheets WHERE id = ?').get(req.params.id);
  res.json({ ship: { ...ship, sheet_data: tryParse(ship.sheet_data) } });
});

module.exports = router;
