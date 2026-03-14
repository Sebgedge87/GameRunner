const { getDb } = require('../db/database');
const { requireGm } = require('../auth/authMiddleware');

/**
 * Convert a string to a URL-safe slug.
 * e.g. "The Lost City!" -> "the-lost-city"
 */
function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Register a PUT /:id/hidden toggle route on an Express router.
 * @param {import('express').Router} router
 * @param {string} table - DB table name (e.g. 'factions', 'inventory')
 */
function makeHiddenToggle(router, table) {
  router.put('/:id/hidden', requireGm, (req, res) => {
    const db = getDb();
    const row = db.prepare(`SELECT id, hidden FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const newVal = row.hidden ? 0 : 1;
    db.prepare(`UPDATE ${table} SET hidden = ? WHERE id = ?`).run(newVal, req.params.id);
    res.json({ hidden: newVal });
  });
}

module.exports = { slug, makeHiddenToggle };
