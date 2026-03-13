const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { getDb } = require('../db/database');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = getDb()
    .prepare('SELECT id, username, character_name, character_class, character_level, role FROM users WHERE id = ?')
    .get(payload.userId);

  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user = user;
  next();
}

function requireGm(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'gm') {
      return res.status(403).json({ error: 'GM access required' });
    }
    next();
  });
}

module.exports = { requireAuth, requireGm };
