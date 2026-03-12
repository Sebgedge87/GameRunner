const express = require('express');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');

const router = express.Router();

/**
 * GET /api/mindmap
 * Builds a graph of nodes + links from vault_files frontmatter.
 * Nodes: NPCs, locations, quests, hooks
 * Links: derived from connected_to arrays in frontmatter
 */
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM vault_files WHERE type IN ('npc', 'location', 'quest', 'hook') ORDER BY type, title
  `).all();

  const nodes = [];
  const linkMap = new Map(); // "a|b" -> { source, target, label }

  for (const row of rows) {
    const fm = JSON.parse(row.frontmatter || '{}');
    nodes.push({
      id: row.path,
      label: row.title,
      type: row.type,
      location: fm.location,
      disposition: fm.disposition,
      status: fm.status,
      faction: fm.faction,
    });

    // Build links from connected_to
    const connections = Array.isArray(fm.connected_to) ? fm.connected_to : [];
    for (const target of connections) {
      // Find matching node by title
      const targetRow = rows.find(
        (r) => r.title === target || r.title.includes(target) || target.includes(r.title)
      );
      if (!targetRow) continue;
      const key = [row.path, targetRow.path].sort().join('|');
      if (!linkMap.has(key)) {
        linkMap.set(key, { source: row.path, target: targetRow.path, label: 'connected' });
      }
    }
  }

  res.json({ nodes, links: Array.from(linkMap.values()) });
});

module.exports = router;
