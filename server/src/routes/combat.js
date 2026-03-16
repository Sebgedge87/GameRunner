const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { broadcastSSE } = require('../services/notifications');

const router = express.Router();

function getEncounterWithCombatants(db, encounterId, userId, role) {
  const encounter = db.prepare('SELECT * FROM combat_encounters WHERE id = ?').get(encounterId);
  if (!encounter) return null;
  const combatants = role === 'gm'
    ? db.prepare('SELECT * FROM combat_combatants WHERE encounter_id = ? ORDER BY sort_order ASC, initiative DESC').all(encounterId)
    : db.prepare('SELECT * FROM combat_combatants WHERE encounter_id = ? AND is_hidden = 0 ORDER BY sort_order ASC, initiative DESC').all(encounterId);
  return {
    ...encounter,
    combatants: combatants.map(c => ({ ...c, conditions: tryParse(c.conditions) }))
  };
}

function tryParse(str) {
  try { return JSON.parse(str); } catch { return []; }
}

// GET /api/combat — list encounters
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const encounters = db.prepare('SELECT * FROM combat_encounters ORDER BY active DESC, created_at DESC').all();
  res.json({ encounters });
});

// GET /api/combat/active — get active encounter with combatants
router.get('/active', requireAuth, (req, res) => {
  const db = getDb();
  const encounter = db.prepare('SELECT * FROM combat_encounters WHERE active = 1 LIMIT 1').get();
  if (!encounter) return res.json({ encounter: null });
  res.json({ encounter: getEncounterWithCombatants(db, encounter.id, req.user.id, req.user.role) });
});

// GET /api/combat/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const enc = getEncounterWithCombatants(db, req.params.id, req.user.id, req.user.role);
  if (!enc) return res.status(404).json({ error: 'Not found' });
  res.json({ encounter: enc });
});

// POST /api/combat — GM creates encounter
router.post('/', requireGm, (req, res) => {
  const { name = 'Encounter', campaign_id } = req.body;
  const db = getDb();
  // Deactivate others
  db.prepare('UPDATE combat_encounters SET active = 0').run();
  const result = db.prepare('INSERT INTO combat_encounters (campaign_id, name, active) VALUES (?, ?, 1)')
    .run(campaign_id || null, name);
  const enc = getEncounterWithCombatants(db, result.lastInsertRowid, req.user.id, 'gm');
  broadcastSSE('all', { type: 'combat_start', encounter: enc });
  res.status(201).json({ encounter: enc });
});

// POST /api/combat/:id/combatants — add combatant
router.post('/:id/combatants', requireGm, (req, res) => {
  const { name, initiative = 0, hp_current, hp_max, ac = 10, is_player = false, is_hidden = false, user_id, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO combat_combatants (encounter_id, name, initiative, hp_current, hp_max, ac, is_player, is_hidden, user_id, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, name, initiative, hp_current || hp_max || 0, hp_max || 0, ac, is_player ? 1 : 0, is_hidden ? 1 : 0, user_id || null, sort_order);
  const combatant = db.prepare('SELECT * FROM combat_combatants WHERE id = ?').get(result.lastInsertRowid);
  broadcastSSE('all', { type: 'combat_update', encounter_id: Number(req.params.id) });
  res.status(201).json({ combatant: { ...combatant, conditions: tryParse(combatant.conditions) } });
});

// PUT /api/combat/:id/combatants/:cid — update combatant (HP, conditions, initiative)
router.put('/:id/combatants/:cid', requireAuth, (req, res) => {
  const db = getDb();
  const combatant = db.prepare('SELECT * FROM combat_combatants WHERE id = ? AND encounter_id = ?').get(req.params.cid, req.params.id);
  if (!combatant) return res.status(404).json({ error: 'Not found' });

  // Players can only update their own combatant's HP/conditions
  if (!req.user.isGm && combatant.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorised' });
  }

  const { hp_current, hp_max, ac, initiative, conditions, is_hidden, sort_order } = req.body;
  db.prepare(`
    UPDATE combat_combatants SET
      hp_current = COALESCE(?, hp_current),
      hp_max = COALESCE(?, hp_max),
      ac = COALESCE(?, ac),
      initiative = COALESCE(?, initiative),
      conditions = COALESCE(?, conditions),
      is_hidden = COALESCE(?, is_hidden),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    hp_current !== undefined ? hp_current : null,
    hp_max !== undefined ? hp_max : null,
    ac !== undefined ? ac : null,
    initiative !== undefined ? initiative : null,
    conditions !== undefined ? JSON.stringify(conditions) : null,
    is_hidden !== undefined ? (is_hidden ? 1 : 0) : null,
    sort_order !== undefined ? sort_order : null,
    req.params.cid
  );
  const updated = db.prepare('SELECT * FROM combat_combatants WHERE id = ?').get(req.params.cid);
  broadcastSSE('all', { type: 'combat_update', encounter_id: Number(req.params.id) });
  res.json({ combatant: { ...updated, conditions: tryParse(updated.conditions) } });
});

// PUT /api/combat/:id/round — advance round (GM)
router.put('/:id/round', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE combat_encounters SET round = round + 1 WHERE id = ?').run(req.params.id);
  const enc = getEncounterWithCombatants(db, req.params.id, req.user.id, 'gm');
  broadcastSSE('all', { type: 'combat_update', encounter_id: Number(req.params.id) });
  res.json({ encounter: enc });
});

// DELETE /api/combat/:id/combatants/:cid
router.delete('/:id/combatants/:cid', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM combat_combatants WHERE id = ?').run(req.params.cid);
  broadcastSSE('all', { type: 'combat_update', encounter_id: Number(req.params.id) });
  res.json({ success: true });
});

// DELETE /api/combat/:id — end encounter
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE combat_encounters SET active = 0 WHERE id = ?').run(req.params.id);
  broadcastSSE('all', { type: 'combat_end', encounter_id: Number(req.params.id) });
  res.json({ success: true });
});

module.exports = router;
