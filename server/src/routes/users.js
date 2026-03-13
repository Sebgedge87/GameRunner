const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');

const router = express.Router();
const SALT_ROUNDS = 10;

// GET /api/users — GM sees all; players see list for messaging
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, username, character_name, character_class, character_level, role, last_seen
    FROM users ORDER BY role, character_name
  `).all();
  res.json({ users });
});

// GET /api/users/me
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, character_name, character_class, character_level, role, last_seen, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// PUT /api/users/me — update own profile
router.put('/me', requireAuth, (req, res) => {
  const { character_name, character_class, character_level } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET character_name=COALESCE(?,character_name), character_class=COALESCE(?,character_class), character_level=COALESCE(?,character_level) WHERE id=?')
    .run(character_name, character_class, character_level, req.user.id);
  const user = db.prepare('SELECT id, username, character_name, character_class, character_level, role, last_seen FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// PUT /api/users/:id — GM updates any user (role, etc.)
router.put('/:id', requireGm, (req, res) => {
  const { character_name, character_class, character_level, role } = req.body;
  const db = getDb();
  db.prepare('UPDATE users SET character_name=COALESCE(?,character_name), character_class=COALESCE(?,character_class), character_level=COALESCE(?,character_level), role=COALESCE(?,role) WHERE id=?')
    .run(character_name, character_class, character_level, role, req.params.id);
  const user = db.prepare('SELECT id, username, character_name, character_class, character_level, role FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

// PUT /api/users/:id/password — GM resets a player's password
router.put('/:id/password', requireGm, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const db = getDb();
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'gm') return res.status(403).json({ error: 'Cannot reset GM password this way' });
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, req.params.id);
  res.json({ success: true });
});

// DELETE /api/users/:id — GM deletes a player account
router.delete('/:id', requireGm, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'gm') return res.status(403).json({ error: 'Cannot delete GM account' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/users/audit — GM audit log
router.get('/audit', requireGm, (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT al.*, u.username FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC LIMIT 200
  `).all();
  res.json({ logs });
});

module.exports = router;
