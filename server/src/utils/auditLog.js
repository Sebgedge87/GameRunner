const { getDb } = require('../db/database');

/**
 * Write an entry to the audit_log table.
 * Safe to call fire-and-forget — errors are silently swallowed.
 *
 * @param {object} req  - Express request (provides user + IP)
 * @param {string} action - e.g. 'create', 'update', 'delete', 'share', 'invite'
 * @param {string} targetType - e.g. 'quest', 'npc', 'user'
 * @param {number|null} targetId
 * @param {string} [detail] - optional human-readable detail
 */
function auditLog(req, action, targetType, targetId = null, detail = null) {
  try {
    const db = getDb();
    const userId = req?.user?.id ?? null;
    const ip = req?.ip ?? null;
    db.prepare(
      'INSERT INTO audit_log (user_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, action, targetType, targetId, detail, ip);
  } catch (_) { /* never throw from audit logging */ }
}

module.exports = { auditLog };
