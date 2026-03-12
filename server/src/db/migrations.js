const { getDb } = require('./database');

function runMigrations() {
  const db = getDb();

  db.exec(`
    -- Users (players + GM)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      character_name TEXT,
      character_class TEXT,
      character_level INTEGER DEFAULT 1,
      role TEXT DEFAULT 'player',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notes metadata (mirrors frontmatter, for fast queries)
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vault_path TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      player_id INTEGER REFERENCES users(id),
      category TEXT DEFAULT 'Notes',
      privacy TEXT DEFAULT 'private',
      shared_with_gm INTEGER DEFAULT 0,
      obsidian_synced INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages (GM secrets + party messages)
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_secret INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vault file cache (for mindmap relationships)
    CREATE TABLE IF NOT EXISTS vault_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      type TEXT,
      title TEXT,
      frontmatter TEXT,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Migrations complete.');
}

runMigrations();

module.exports = { runMigrations };
