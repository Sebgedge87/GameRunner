const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

// GET /api/theory — get player's own nodes + edges
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const nodes = db.prepare('SELECT * FROM theory_nodes WHERE user_id = ? ORDER BY created_at').all(req.user.id);
  const edges = db.prepare('SELECT * FROM theory_edges WHERE user_id = ? ORDER BY created_at').all(req.user.id);
  res.json({ nodes, edges });
});

// POST /api/theory/nodes
router.post('/nodes', requireAuth, (req, res) => {
  const { label, node_type = 'theory', vault_ref, notes, x = 0, y = 0, campaign_id } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO theory_nodes (user_id, campaign_id, label, node_type, vault_ref, notes, x, y) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, campaign_id || null, label, node_type, vault_ref || null, notes || null, x, y);
  const node = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ node });
});

// PUT /api/theory/nodes/:id
router.put('/nodes/:id', requireAuth, (req, res) => {
  const db = getDb();
  const node = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  if (!node || node.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorised' });
  const { label, node_type, vault_ref, notes, x, y } = req.body;
  db.prepare('UPDATE theory_nodes SET label=COALESCE(?,label), node_type=COALESCE(?,node_type), vault_ref=COALESCE(?,vault_ref), notes=COALESCE(?,notes), x=COALESCE(?,x), y=COALESCE(?,y) WHERE id=?')
    .run(label, node_type, vault_ref, notes, x, y, req.params.id);
  const updated = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  res.json({ node: updated });
});

// DELETE /api/theory/nodes/:id
router.delete('/nodes/:id', requireAuth, (req, res) => {
  const db = getDb();
  const node = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  if (!node || node.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM theory_edges WHERE source_id = ? OR target_id = ?').run(req.params.id, req.params.id);
  db.prepare('DELETE FROM theory_nodes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/theory/edges
router.post('/edges', requireAuth, (req, res) => {
  const { source_id, target_id, label, campaign_id } = req.body;
  if (!source_id || !target_id) return res.status(400).json({ error: 'source_id and target_id required' });
  const db = getDb();
  const result = db.prepare('INSERT INTO theory_edges (user_id, campaign_id, source_id, target_id, label) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, campaign_id || null, source_id, target_id, label || null);
  const edge = db.prepare('SELECT * FROM theory_edges WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ edge });
});

// DELETE /api/theory/edges/:id
router.delete('/edges/:id', requireAuth, (req, res) => {
  const db = getDb();
  const edge = db.prepare('SELECT * FROM theory_edges WHERE id = ?').get(req.params.id);
  if (!edge || edge.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM theory_edges WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
