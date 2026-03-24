const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { jwtSecret, registrationOpen } = require('../config');
const { requireAuth } = require('./authMiddleware');
const { auditLog } = require('../utils/auditLog');
const { verifyCode } = require('../utils/totp');

const router = express.Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
// Blocked when REGISTRATION_OPEN=false in env (unless no users exist — first-run GM setup)
router.post('/register', (req, res) => {
  const { username, password, character_name, character_class } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  // If registration is closed, only allow the very first user (GM bootstrap)
  if (!registrationOpen) {
    const count = getDb().prepare('SELECT COUNT(*) as n FROM users').get().n;
    if (count > 0) return res.status(403).json({ error: 'Registration is closed. Ask your GM for access.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password must be 128 characters or fewer' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = db
    .prepare(`INSERT INTO users (username, password_hash, character_name, character_class, role)
              VALUES (?, ?, ?, ?, 'player')`)
    .run(username, password_hash, character_name || null, character_class || null);

  const user = db
    .prepare('SELECT id, username, character_name, character_class, character_level, role FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    auditLog(req, 'login_failed', 'user', null, `Failed login attempt for username: ${username}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // If 2FA is enabled, require totp_token in the same request.
  // On first attempt without it, return requires_totp so the client can prompt.
  if (user.totp_enabled) {
    const { totp_token } = req.body;
    if (!totp_token) {
      return res.status(200).json({ requires_totp: true });
    }
    if (!verifyCode(user.totp_secret, totp_token)) {
      auditLog(req, 'login_failed', 'user', user.id, `Invalid 2FA code for ${username}`);
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }
  }

  req.user = user;
  auditLog(req, 'login', 'user', user.id, `User logged in: ${user.username}`);

  const token = jwt.sign({ userId: user.id, tv: user.token_version ?? 0 }, jwtSecret, { expiresIn: '30d' });
  const { password_hash, totp_secret, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// POST /api/auth/logout — invalidates all tokens for the current user
router.post('/logout', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET token_version = token_version + 1 WHERE id = ?').run(req.user.id);
  auditLog(req, 'logout', 'user', req.user.id);
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
