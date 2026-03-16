const express = require('express');
const path = require('path');
const { getDb } = require('../db/database');
const { requireAuth } = require('../auth/authMiddleware');
const { writeVaultFile, softDeleteVaultFile } = require('../vault/vaultWriter');
const { readVaultFile } = require('../vault/vaultReader');
const { buildNoteFilter } = require('../middleware/privacyFilter');

const router = express.Router();

// GET /api/notes — list notes for current user (respects privacy rules)
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const filter = buildNoteFilter(req.user);

  const notes = db.prepare(`
    SELECT n.*, u.username, u.character_name
    FROM notes n
    LEFT JOIN users u ON n.player_id = u.id
    WHERE ${filter} AND (n.shared_with_gm = 0 OR n.privacy != 'private' OR n.player_id = ?)
    ORDER BY n.updated_at DESC
  `).all(req.user.id);

  // Re-apply strict filter: never leak private notes to wrong users
  const safe = notes.filter((note) => {
    if (req.user.isGm) {
      return note.privacy === 'public' || note.shared_with_gm === 1;
    }
    return note.player_id === req.user.id || note.privacy === 'public';
  });

  res.json({ notes: safe });
});

// POST /api/notes — create note + write .md to vault
router.post('/', requireAuth, (req, res) => {
  const { title, body = '', category = 'Notes', privacy = 'private', shared_with_gm = false } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const db = getDb();
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
  const relPath = `Players/${req.user.character_name || req.user.username}/${category}/${slug}.md`;

  const frontmatter = {
    title,
    player: req.user.character_name || req.user.username,
    category,
    privacy,
    shared_with_gm: shared_with_gm === true || shared_with_gm === 'true' || shared_with_gm === 1,
  };

  writeVaultFile(relPath, frontmatter, body);

  const result = db.prepare(`
    INSERT INTO notes (vault_path, title, player_id, category, privacy, shared_with_gm, obsidian_synced)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(relPath, title, req.user.id, category, privacy, frontmatter.shared_with_gm ? 1 : 0);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ note, vault_path: relPath });
});

// PUT /api/notes/:id — update note + update .md in vault
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (note.player_id !== req.user.id && !req.user.isGm) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { title, body, category, privacy, shared_with_gm } = req.body;
  const updates = {
    title: title ?? note.title,
    category: category ?? note.category,
    privacy: privacy ?? note.privacy,
    shared_with_gm: shared_with_gm !== undefined ? (shared_with_gm ? 1 : 0) : note.shared_with_gm,
  };

  // Re-read existing vault file to get current frontmatter
  const existing = readVaultFile(note.vault_path) || { data: {}, content: '' };
  const frontmatter = { ...existing.data, ...updates, title: updates.title };
  const newBody = body !== undefined ? body : existing.content;

  writeVaultFile(note.vault_path, frontmatter, newBody);

  db.prepare(`
    UPDATE notes SET title=?, category=?, privacy=?, shared_with_gm=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(updates.title, updates.category, updates.privacy, updates.shared_with_gm, note.id);

  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(note.id);
  res.json({ note: updated });
});

// DELETE /api/notes/:id — soft delete (add deleted:true to frontmatter)
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  if (note.player_id !== req.user.id && !req.user.isGm) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  softDeleteVaultFile(note.vault_path);

  db.prepare('UPDATE notes SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(note.id);

  res.json({ success: true, message: 'Note marked as deleted in vault' });
});

module.exports = router;
