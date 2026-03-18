const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { requireAuth, requireGm } = require('../auth/authMiddleware');
const { auditLog } = require('../utils/auditLog');
const { generateSecret, verifyCode, buildOtpAuthUri } = require('../utils/totp');

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
  auditLog(req, 'delete', 'user', Number(req.params.id), `deleted ${user.username}`);
  res.json({ success: true });
});

// POST /api/users/invite — GM creates a player account (onboarding wizard)
router.post('/invite', requireGm, (req, res) => {
  const { username, role = 'player', password = 'changeme' } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already taken' });
  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(username, password_hash, role === 'gm' ? 'player' : role);
  const user = db.prepare('SELECT id, username, character_name, character_class, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  auditLog(req, 'invite', 'user', user.id, `invited ${username}`);
  res.status(201).json({ user, initial_password: password });
});

// POST /api/users/me/totp/setup — generate a new TOTP secret for the current user
router.post('/me/totp/setup', requireAuth, (req, res) => {
  const db = getDb();
  const secret = generateSecret();
  db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secret, req.user.id);
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id);
  const otpauth = buildOtpAuthUri(secret, user.username);
  res.json({ secret, otpauth_uri: otpauth });
});

// POST /api/users/me/totp/verify — confirm TOTP code and enable 2FA
router.post('/me/totp/verify', requireAuth, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const db = getDb();
  const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.user.id);
  if (!user?.totp_secret) return res.status(400).json({ error: 'Run /totp/setup first' });
  if (!verifyCode(user.totp_secret, token)) return res.status(400).json({ error: 'Invalid code' });
  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.user.id);
  auditLog(req, 'totp_enable', 'user', req.user.id);
  res.json({ success: true });
});

// DELETE /api/users/me/totp — disable 2FA
router.delete('/me/totp', requireAuth, (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required to disable 2FA' });
  const db = getDb();
  const user = db.prepare('SELECT totp_secret, totp_enabled FROM users WHERE id = ?').get(req.user.id);
  if (!user?.totp_enabled) return res.json({ success: true }); // already disabled
  if (!verifyCode(user.totp_secret, token)) return res.status(400).json({ error: 'Invalid code' });
  db.prepare('UPDATE users SET totp_secret = NULL, totp_enabled = 0 WHERE id = ?').run(req.user.id);
  auditLog(req, 'totp_disable', 'user', req.user.id);
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
