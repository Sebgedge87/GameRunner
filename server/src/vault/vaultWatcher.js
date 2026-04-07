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
  Factions: 'faction',
  Timeline: 'timeline_event',
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Returns { type, campaignId } for a vault-relative path.
// Supports both flat layout (Quests/foo.md) and campaign-scoped
// layout ([campaign-slug]/Quests/foo.md).
function detectTypeAndCampaign(relPath) {
  const parts = relPath.split(path.sep);
  // Flat layout: first segment is a known type folder
  if (TYPE_MAP[parts[0]]) {
    return { type: TYPE_MAP[parts[0]], campaignId: null };
  }
  // Campaign-scoped layout: first segment is a campaign slug, second is type folder
  if (parts.length >= 2 && TYPE_MAP[parts[1]]) {
    const firstSeg = parts[0];
    const db = getDb();
    const campaigns = db.prepare('SELECT id, name FROM campaigns').all();
    const match = campaigns.find(c => slugify(c.name) === firstSeg.toLowerCase() || c.name === firstSeg);
    if (match) {
      return { type: TYPE_MAP[parts[1]], campaignId: match.id };
    }
  }
  return { type: 'other', campaignId: null };
}

function syncFile(fullPath) {
  if (!fullPath.endsWith('.md')) return;

  const relPath = path.relative(vaultPath, fullPath);
  // GM-Only folder is never synced to the shared DB
  if (relPath.startsWith('GM-Only' + path.sep) || relPath.startsWith('GM-Only/')) return;
  let parsed;
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    parsed = matter(raw);
  } catch {
    return;
  }

  const db = getDb();
  // Defensive bootstrap for environments where watcher starts against a DB
  // missing legacy FK parent tables (e.g. reset volumes with partial schema).
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS factions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch (_) {}
  const { type, campaignId } = detectTypeAndCampaign(relPath);
  const title = parsed.data.title || path.basename(relPath, '.md');
  const frontmatterJson = JSON.stringify(parsed.data);

  try {
    db.prepare(`
      INSERT INTO vault_files (path, type, title, frontmatter, campaign_id, synced_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(path) DO UPDATE SET
        type = excluded.type,
        title = excluded.title,
        frontmatter = excluded.frontmatter,
        campaign_id = excluded.campaign_id,
        synced_at = CURRENT_TIMESTAMP
    `).run(relPath, type, title, frontmatterJson, campaignId);
  } catch (err) {
    console.error('⚠️ Vault sync failed:', relPath, err?.message || err);
  }
}

function removeFile(fullPath) {
  if (!fullPath.endsWith('.md')) return;
  const relPath = path.relative(vaultPath, fullPath);
  if (relPath.startsWith('GM-Only' + path.sep) || relPath.startsWith('GM-Only/')) return;
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

module.exports = { startVaultWatcher, syncFile };
