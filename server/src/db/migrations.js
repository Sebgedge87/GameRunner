const { getDb } = require('./database');

function runMigrations() {
  const db = getDb();

  db.exec(`
    -- ── Users ──────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      character_name TEXT,
      character_class TEXT,
      character_level INTEGER DEFAULT 1,
      role TEXT DEFAULT 'player',
      totp_secret TEXT,
      last_seen DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Campaigns ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      system TEXT DEFAULT 'dnd5e',
      subtitle TEXT,
      description TEXT,
      session_count INTEGER DEFAULT 0,
      current_scene TEXT,
      current_weather TEXT,
      current_time TEXT,
      music_url TEXT,
      music_label TEXT,
      theme TEXT DEFAULT 'dnd5e',
      active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Vault file cache ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS vault_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      type TEXT,
      title TEXT,
      frontmatter TEXT,
      body TEXT,
      image_path TEXT,
      campaign_id INTEGER REFERENCES campaigns(id),
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Notes ──────────────────────────────────────────────────────────────────
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

    -- ── Messages ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_secret INTEGER DEFAULT 0,
      requires_ack INTEGER DEFAULT 0,
      acked_at DATETIME,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Notifications ──────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Handouts ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS handouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      body TEXT,
      file_path TEXT,
      file_type TEXT DEFAULT 'text',
      created_by INTEGER REFERENCES users(id),
      requires_ack INTEGER DEFAULT 0,
      campaign_id INTEGER REFERENCES campaigns(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS handout_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handout_id INTEGER REFERENCES handouts(id),
      user_id INTEGER REFERENCES users(id),
      shared_by INTEGER REFERENCES users(id),
      acked_at DATETIME,
      can_reshare INTEGER DEFAULT 1,
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(handout_id, user_id)
    );

    -- ── Sessions ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      number INTEGER,
      title TEXT,
      summary TEXT,
      played_at DATETIME,
      in_world_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      player_id INTEGER REFERENCES users(id),
      body TEXT,
      privacy TEXT DEFAULT 'private',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS session_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES sessions(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      results_public INTEGER DEFAULT 0,
      closed INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER REFERENCES session_polls(id),
      user_id INTEGER REFERENCES users(id),
      option_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(poll_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS session_scheduling (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      proposed_date DATETIME NOT NULL,
      confirmed INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scheduling_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduling_id INTEGER REFERENCES session_scheduling(id),
      user_id INTEGER REFERENCES users(id),
      availability TEXT DEFAULT 'no',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(scheduling_id, user_id)
    );

    -- ── Factions ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS factions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
      goals TEXT,
      image_path TEXT,
      vault_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faction_reputation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faction_id INTEGER REFERENCES factions(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      score INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(faction_id, campaign_id)
    );

    -- ── Timeline ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      title TEXT NOT NULL,
      description TEXT,
      in_world_date TEXT,
      session_number INTEGER,
      linked_type TEXT,
      linked_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Inventory ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER DEFAULT 1,
      holder TEXT DEFAULT 'party',
      image_path TEXT,
      vault_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Key Items ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS key_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
      significance TEXT,
      image_path TEXT,
      linked_quest TEXT,
      vault_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Maps ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      title TEXT NOT NULL,
      description TEXT,
      image_path TEXT NOT NULL,
      map_type TEXT DEFAULT 'world',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Bestiary ───────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS bestiary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
      stats TEXT DEFAULT '{}',
      image_path TEXT,
      revealed INTEGER DEFAULT 0,
      vault_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Rumours ────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS rumours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      text TEXT NOT NULL,
      is_true INTEGER DEFAULT 0,
      source_npc TEXT,
      source_location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rumour_exposure (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rumour_id INTEGER REFERENCES rumours(id),
      user_id INTEGER REFERENCES users(id),
      exposed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(rumour_id, user_id)
    );

    -- ── Jobs ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      title TEXT NOT NULL,
      description TEXT,
      reward TEXT,
      difficulty TEXT DEFAULT 'medium',
      posted_by TEXT,
      location TEXT,
      expires_at DATETIME,
      status TEXT DEFAULT 'open',
      image_path TEXT,
      requires_contact INTEGER DEFAULT 0,
      vault_path TEXT,
      promoted_quest_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Combat ─────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS combat_encounters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT DEFAULT 'Encounter',
      round INTEGER DEFAULT 1,
      active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combat_combatants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encounter_id INTEGER REFERENCES combat_encounters(id),
      name TEXT NOT NULL,
      initiative INTEGER DEFAULT 0,
      hp_current INTEGER DEFAULT 0,
      hp_max INTEGER DEFAULT 0,
      ac INTEGER DEFAULT 10,
      conditions TEXT DEFAULT '[]',
      is_player INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      user_id INTEGER REFERENCES users(id),
      sort_order INTEGER DEFAULT 0
    );

    -- ── Character Sheets ───────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS character_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      system TEXT DEFAULT 'dnd5e',
      sheet_data TEXT DEFAULT '{}',
      dnd_beyond_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, campaign_id)
    );

    -- ── Ship / Vehicle ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ship_sheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      system TEXT DEFAULT 'alien',
      sheet_data TEXT DEFAULT '{}',
      image_path TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Agenda Cards ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS agenda_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT,
      revealed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(campaign_id, user_id)
    );

    -- ── Stress / Sanity ─────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS stress_sanity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      stress INTEGER DEFAULT 0,
      stress_max INTEGER DEFAULT 10,
      sanity INTEGER DEFAULT 100,
      sanity_max INTEGER DEFAULT 100,
      exhaustion INTEGER DEFAULT 0,
      panic_threshold INTEGER DEFAULT 7,
      indefinite_insanity INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, campaign_id)
    );

    -- ── Theory Board ───────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS theory_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      label TEXT NOT NULL,
      node_type TEXT DEFAULT 'theory',
      vault_ref TEXT,
      notes TEXT,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS theory_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      campaign_id INTEGER REFERENCES campaigns(id),
      source_id INTEGER REFERENCES theory_nodes(id),
      target_id INTEGER REFERENCES theory_nodes(id),
      label TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ── Pins ───────────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS pins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_type, item_id)
    );

    -- ── Audit Log ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── Campaign Members ─────────────────────────────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS campaign_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'player',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, user_id)
  )`);

  // Backfill: give global GM role='gm' in all existing campaigns; add all players as members
  try {
    const gmUser = db.prepare("SELECT id FROM users WHERE role='gm' LIMIT 1").get();
    if (gmUser) {
      const allCampaigns = db.prepare('SELECT id FROM campaigns').all();
      const allUsers = db.prepare('SELECT id FROM users').all();
      const ins = db.prepare('INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?,?,?)');
      for (const c of allCampaigns) {
        for (const u of allUsers) {
          ins.run(c.id, u.id, u.id === gmUser.id ? 'gm' : 'player');
        }
      }
    }
  } catch (_) {}

  // Add cover_image to campaigns
  try { db.exec('ALTER TABLE campaigns ADD COLUMN cover_image TEXT'); } catch (_) {}
  // Add campaign_id column to vault_files if not already present
  try { db.exec('ALTER TABLE vault_files ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id)'); } catch (_) {}
  // Add max_players and invite_code to campaigns
  try { db.exec('ALTER TABLE campaigns ADD COLUMN max_players INTEGER DEFAULT 4'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN invite_code TEXT'); } catch (_) {}
  // Add hidden column to vault_files if not already present
  try { db.exec('ALTER TABLE vault_files ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  // Add hidden column to maps if not already present
  try { db.exec('ALTER TABLE maps ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  // Add locked column to users if not already present (P10: lock login)
  try { db.exec('ALTER TABLE users ADD COLUMN locked INTEGER DEFAULT 0'); } catch (_) {}
  // Add shared_with_gm column to theory_nodes (P5)
  try { db.exec('ALTER TABLE theory_nodes ADD COLUMN shared_with_gm INTEGER DEFAULT 0'); } catch (_) {}
  // Add hidden column to non-vault tables (P3)
  try { db.exec('ALTER TABLE factions ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE timeline_events ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE inventory ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE key_items ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE jobs ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE bestiary ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE rumours ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  // Per-item sharing table (P4)
  db.exec(`CREATE TABLE IF NOT EXISTS item_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_type, item_id, user_id)
  )`);
  // XP awards table (P11)
  db.exec(`CREATE TABLE IF NOT EXISTS xp_awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES campaigns(id),
    awarded_to INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    awarded_by INTEGER REFERENCES users(id),
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('✅ Migrations complete.');
}

runMigrations();
module.exports = { runMigrations };
