const express = require('express');
const { getDb } = require('../db/database');
const { requireGm } = require('../auth/authMiddleware');

const router = express.Router();

// PUT /api/vault/:id/hidden — toggle hidden flag on a vault_file record
router.put('/:id/hidden', requireGm, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT id, hidden FROM vault_files WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const newVal = row.hidden ? 0 : 1;
  db.prepare('UPDATE vault_files SET hidden = ? WHERE id = ?').run(newVal, req.params.id);
  res.json({ hidden: newVal });
});

module.exports = router;
