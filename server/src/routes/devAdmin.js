/**
 * /api/dev-admin — Developer administration endpoints.
 *
 * Authenticated by a static key header (X-Dev-Key) that matches the
 * DEV_ADMIN_KEY env variable (falls back to the same hardcoded value used
 * in the client portal so no extra env config is needed for local dev).
 *
 * These routes sit completely outside the normal JWT auth flow.
 */

const express = require('express')
const bcrypt  = require('bcryptjs')
const { getDb } = require('../db/database')

const router = express.Router()
const SALT_ROUNDS = 10

// Hardcoded fallback matches the portal credentials hash — change via env in prod
const DEV_KEY = process.env.DEV_ADMIN_KEY || 'dev-chronicle-admin-Akthos12'

function requireDevKey(req, res, next) {
  const key = req.headers['x-dev-key']
  if (!key || key !== DEV_KEY) {
    return res.status(401).json({ error: 'Unauthorised' })
  }
  next()
}

// GET /api/dev-admin/users — list every user in the database
router.get('/users', requireDevKey, (req, res) => {
  const db = getDb()
  const users = db.prepare(`
    SELECT id, username, role, character_name, character_class, character_level,
           totp_enabled, last_seen, created_at
    FROM users
    ORDER BY role, username
  `).all()
  res.json({ users })
})

// PUT /api/dev-admin/users/:id/password — force-set any user's password
router.put('/users/:id/password', requireDevKey, (req, res) => {
  const { password } = req.body
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const db = getDb()
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const hash = bcrypt.hashSync(password, SALT_ROUNDS)
  // Also bump token_version to invalidate existing sessions
  db.prepare('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?')
    .run(hash, req.params.id)
  res.json({ success: true })
})

// DELETE /api/dev-admin/users/:id — remove any user (including GMs)
router.delete('/users/:id', requireDevKey, (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true, removed: user.username })
})

// POST /api/dev-admin/query — run a read-only SELECT query
router.post('/query', requireDevKey, (req, res) => {
  const { sql } = req.body
  if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'sql required' })

  // Strip comments and whitespace, then check it's a SELECT
  const clean = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
  if (!/^SELECT\b/i.test(clean)) {
    return res.status(400).json({ error: 'Only SELECT statements are allowed' })
  }
  // Block any attempts to chain writes via semicolons
  if (/;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA)\b/i.test(clean)) {
    return res.status(400).json({ error: 'Write statements are not permitted' })
  }

  try {
    const db = getDb()
    const stmt = db.prepare(clean)
    const rows = stmt.all()
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []
    res.json({ columns, rows, count: rows.length })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
