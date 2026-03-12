const chokidar = require('chokidar');
const path = require('path');
const matter = require('gray-matter');
const fs = require('fs');
const { vaultPath } = require('../config');
const { getDb } = require('../db/database');

const TYPE_MAP = {
  Quests: 'quest',
  NPCs: 'npc',
  Locations: 'location',
  Hooks: 'hook',
  Players: 'note',
};

function detectType(relPath) {
  const firstDir = relPath.split(path.sep)[0];
  return TYPE_MAP[firstDir] || 'other';
}

function syncFile(fullPath) {
  if (!fullPath.endsWith('.md')) return;

  const relPath = path.relative(vaultPath, fullPath);
  let parsed;
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    parsed = matter(raw);
  } catch {
    return;
  }

  const db = getDb();
  const type = detectType(relPath);
  const title = parsed.data.title || path.basename(relPath, '.md');
  const frontmatterJson = JSON.stringify(parsed.data);

  db.prepare(`
    INSERT INTO vault_files (path, type, title, frontmatter, synced_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(path) DO UPDATE SET
      type = excluded.type,
      title = excluded.title,
      frontmatter = excluded.frontmatter,
      synced_at = CURRENT_TIMESTAMP
  `).run(relPath, type, title, frontmatterJson);
}

function removeFile(fullPath) {
  if (!fullPath.endsWith('.md')) return;
  const relPath = path.relative(vaultPath, fullPath);
  getDb().prepare('DELETE FROM vault_files WHERE path = ?').run(relPath);
  console.log(`🗑️  Vault: removed ${relPath}`);
}

function startVaultWatcher() {
  const watcher = chokidar.watch(vaultPath, {
    ignored: /(^|[/\\])\../,  // ignore dotfiles
    persistent: true,
    ignoreInitial: false,
  });

  watcher
    .on('add', (p) => { syncFile(p); })
    .on('change', (p) => { syncFile(p); console.log(`🔄 Vault: synced ${path.relative(vaultPath, p)}`); })
    .on('unlink', removeFile)
    .on('ready', () => console.log('👁️  Vault watcher active:', vaultPath));

  return watcher;
}

module.exports = { startVaultWatcher };
