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

  // Determine per-campaign GM status from X-Campaign-Id header.
  // Global role='gm' always wins; otherwise check campaign_members.
  if (user.role === 'gm') {
    user.isGm = true;
  } else {
    const campaignId = req.headers['x-campaign-id'];
    if (campaignId) {
      const parsed = parseInt(campaignId, 10);
      const member = !isNaN(parsed)
        ? getDb().prepare('SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?').get(parsed, user.id)
        : null;
      user.isGm = member?.role === 'gm';
    } else {
      user.isGm = false;
    }
  }

  req.user = user;
  next();
}

function requireGm(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isGm) {
      return res.status(403).json({ error: 'GM access required' });
    }
    next();
  });
}

module.exports = { requireAuth, requireGm };
