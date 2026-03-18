const express = require('express');
const { getDb, getCampaignId } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');
const { createNotification } = require('../services/notifications');

const router = express.Router();

// GET /api/theory — all campaign nodes visible to everyone in the campaign
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const campId = getCampaignId(req);
  const nodes = db.prepare(`
    SELECT tn.*, u.username, u.character_name
    FROM theory_nodes tn
    LEFT JOIN users u ON tn.user_id = u.id
    WHERE tn.campaign_id = ?
    ORDER BY tn.created_at
  `).all(campId);
  const edges = db.prepare(`
    SELECT te.*, u.username
    FROM theory_edges te
    LEFT JOIN users u ON te.user_id = u.id
    WHERE te.campaign_id = ?
    ORDER BY te.created_at
  `).all(campId);
  res.json({ nodes, edges });
});

// POST /api/theory/nodes — uses campaign from request header
router.post('/nodes', requireAuth, (req, res) => {
  const { label, node_type = 'theory', vault_ref, notes, x = 0, y = 0 } = req.body;
  if (!label) return res.status(400).json({ error: 'label is required' });
  const campId = getCampaignId(req);
  const db = getDb();
  const result = db.prepare('INSERT INTO theory_nodes (user_id, campaign_id, label, node_type, vault_ref, notes, x, y) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, campId, label, node_type, vault_ref || null, notes || null, x, y);
  const node = db.prepare(`
    SELECT tn.*, u.username, u.character_name
    FROM theory_nodes tn LEFT JOIN users u ON tn.user_id = u.id
    WHERE tn.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json({ node });
});

// PUT /api/theory/nodes/:id — owner or GM can edit
router.put('/nodes/:id', requireAuth, (req, res) => {
  const db = getDb();
  const node = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  if (node.user_id !== req.user.id && !req.user.isGm) return res.status(403).json({ error: 'Not authorised' });
  const { label, node_type, vault_ref, notes, x, y, shared_with_gm } = req.body;
  const wasShared = node.shared_with_gm;
  db.prepare('UPDATE theory_nodes SET label=COALESCE(?,label), node_type=COALESCE(?,node_type), vault_ref=COALESCE(?,vault_ref), notes=COALESCE(?,notes), x=COALESCE(?,x), y=COALESCE(?,y), shared_with_gm=COALESCE(?,shared_with_gm) WHERE id=?')
    .run(label ?? null, node_type ?? null, vault_ref ?? null, notes ?? null, x ?? null, y ?? null, shared_with_gm !== undefined ? (shared_with_gm ? 1 : 0) : null, req.params.id);
  const updated = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  // Notify GM when a node is newly shared with them
  if (shared_with_gm && !wasShared) {
    try {
      const gmUser = db.prepare("SELECT id FROM users WHERE role = 'gm' LIMIT 1").get();
      if (gmUser && gmUser.id !== req.user.id) {
        const sender = req.user.character_name || req.user.username;
        createNotification(db, gmUser.id, 'theory', `${sender} shared a theory node: "${updated.label}"`, updated.notes || '', '');
      }
    } catch (_) {}
  }
  res.json({ node: updated });
});

// DELETE /api/theory/nodes/:id — owner or GM can delete
router.delete('/nodes/:id', requireAuth, (req, res) => {
  const db = getDb();
  const node = db.prepare('SELECT * FROM theory_nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Not found' });
  if (node.user_id !== req.user.id && !req.user.isGm) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM theory_edges WHERE source_id = ? OR target_id = ?').run(req.params.id, req.params.id);
  db.prepare('DELETE FROM theory_nodes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/theory/edges — uses campaign from request header
router.post('/edges', requireAuth, (req, res) => {
  const { source_id, target_id, label } = req.body;
  if (!source_id || !target_id) return res.status(400).json({ error: 'source_id and target_id required' });
  const campId = getCampaignId(req);
  const db = getDb();
  const result = db.prepare('INSERT INTO theory_edges (user_id, campaign_id, source_id, target_id, label) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, campId, source_id, target_id, label || null);
  const edge = db.prepare('SELECT * FROM theory_edges WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ edge });
});

// DELETE /api/theory/edges/:id — owner or GM can delete
router.delete('/edges/:id', requireAuth, (req, res) => {
  const db = getDb();
  const edge = db.prepare('SELECT * FROM theory_edges WHERE id = ?').get(req.params.id);
  if (!edge) return res.status(404).json({ error: 'Not found' });
  if (edge.user_id !== req.user.id && !req.user.isGm) return res.status(403).json({ error: 'Not authorised' });
  db.prepare('DELETE FROM theory_edges WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
