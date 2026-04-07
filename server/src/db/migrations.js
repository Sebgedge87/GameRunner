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

    -- ── Legacy Factions table (kept for FK + search compatibility) ────────────
    CREATE TABLE IF NOT EXISTS factions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER REFERENCES campaigns(id),
      name TEXT NOT NULL,
      description TEXT,
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

    -- ── Characters (multi-character per user per campaign) ─────────────────────
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'New Character',
      system TEXT DEFAULT 'dnd5e',
      portrait_url TEXT,
      sheet_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  // Add bg_image and playlist_url to campaigns
  try { db.exec('ALTER TABLE campaigns ADD COLUMN bg_image TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN playlist_url TEXT'); } catch (_) {}
  // Add campaign_id column to vault_files if not already present
  try { db.exec('ALTER TABLE vault_files ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id)'); } catch (_) {}
  // Add max_players and invite_code to campaigns
  try { db.exec('ALTER TABLE campaigns ADD COLUMN max_players INTEGER DEFAULT 4'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN invite_code TEXT'); } catch (_) {}


  // campaign scoping for messages
  try { db.exec('ALTER TABLE messages ADD COLUMN campaign_id INTEGER REFERENCES campaigns(id)'); } catch (_) {}
  // reply_to_id for message threading
  try { db.exec('ALTER TABLE messages ADD COLUMN reply_to_id INTEGER REFERENCES messages(id)'); } catch (_) {}
  // title label for scheduling entries
  try { db.exec('ALTER TABLE session_scheduling ADD COLUMN title TEXT'); } catch (_) {}
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

  // Death saves columns on combat_combatants
  try { db.exec('ALTER TABLE combat_combatants ADD COLUMN death_saves_success INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE combat_combatants ADD COLUMN death_saves_failure INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE combat_combatants ADD COLUMN is_stable INTEGER DEFAULT 0'); } catch (_) {}

  // NPC relationships table
  db.exec(`CREATE TABLE IF NOT EXISTS npc_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    npc_id INTEGER NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
    related_npc_id INTEGER NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'associated',
    notes TEXT,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(npc_id, related_npc_id)
  )`);

  // Profile columns on users (guard for DBs created before these were in the schema)
  try { db.exec('ALTER TABLE users ADD COLUMN character_name TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE users ADD COLUMN character_class TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE users ADD COLUMN character_level INTEGER DEFAULT 1'); } catch (_) {}

  // TOTP secret column on users
  try { db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0'); } catch (_) {}

  // Quest chain: parent_quest_id on vault_files
  try { db.exec('ALTER TABLE vault_files ADD COLUMN parent_quest_id INTEGER REFERENCES vault_files(id)'); } catch (_) {}

  // Bestiary gm_notes and player_notes columns (added with bestiary redesign)
  try { db.exec('ALTER TABLE bestiary ADD COLUMN gm_notes TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE bestiary ADD COLUMN player_notes TEXT'); } catch (_) {}

  // ── World-Engine Phase 1: Relational schema additions ──────────────────────

  // vault_files: ownership + relational FK columns for npcs and locations
  try { db.exec('ALTER TABLE vault_files ADD COLUMN created_by INTEGER REFERENCES users(id)'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN gm_notes TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN player_notes TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (_) {}
  // NPC-specific
  try { db.exec('ALTER TABLE vault_files ADD COLUMN race TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN disposition TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN faction_id INTEGER REFERENCES factions(id)'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN home_location_id INTEGER REFERENCES vault_files(id)'); } catch (_) {}
  // Location-specific
  try { db.exec('ALTER TABLE vault_files ADD COLUMN danger_level INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN location_type TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE vault_files ADD COLUMN parent_location_id INTEGER REFERENCES vault_files(id)'); } catch (_) {}

  // faction_members junction table
  db.exec(`CREATE TABLE IF NOT EXISTS faction_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faction_id INTEGER NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
    npc_id INTEGER NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faction_id, npc_id)
  )`);

  // timeline_entity_links: multi-entity connections for timeline events
  db.exec(`CREATE TABLE IF NOT EXISTS timeline_entity_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, entity_type, entity_id)
  )`);

  // ── Session timer (GM-settable, all-visible) ───────────────────────────────
  try { db.exec('ALTER TABLE campaigns ADD COLUMN timer_label TEXT'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN timer_end INTEGER DEFAULT NULL'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN timer_remaining INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE campaigns ADD COLUMN timer_running INTEGER DEFAULT 0'); } catch (_) {}

  // ── Calendar system ────────────────────────────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS campaign_calendars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
    config TEXT NOT NULL DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    era_index INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'event',
    color TEXT DEFAULT '#c9a84c',
    weather_icon TEXT,
    is_gm_only INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Good Boy / Bad Boy Cards ───────────────────────────────────────────────
  db.exec(`CREATE TABLE IF NOT EXISTS good_boy_card_defs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('good', 'bad')),
    tier TEXT NOT NULL CHECK(tier IN ('low', 'mid', 'high', 'huge')),
    name TEXT NOT NULL,
    effect TEXT NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS player_good_boy_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_def_id INTEGER NOT NULL REFERENCES good_boy_card_defs(id),
    awarded_by INTEGER REFERENCES users(id),
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    played_at DATETIME,
    played_note TEXT
  )`);

  // Seed card definitions (idempotent — only inserts if table is empty)
  const cardCount = db.prepare('SELECT COUNT(*) as n FROM good_boy_card_defs').get();
  if (cardCount.n === 0) {
    const ins = db.prepare('INSERT INTO good_boy_card_defs (type, tier, name, effect) VALUES (?, ?, ?, ?)');
    const CARDS = [
      // ── GOOD — low ─────────────────────────────────────────────────────────
      ['good','low','Lucky Charm',          'Add +1 to your next ability check.'],
      ['good','low','Swift Feet',           'Your movement speed increases by 10ft for one turn.'],
      ['good','low','Fortified',            'Gain 5 temporary hit points immediately.'],
      ['good','low','Keen Eye',             'Advantage on your next Perception check.'],
      ['good','low','Silver Tongue',        'Add +2 to your next Persuasion or Deception check.'],
      ['good','low','Quick Draw',           'Add +2 to your next Initiative roll.'],
      ['good','low','Steady Nerves',        'Advantage on your next Constitution saving throw.'],
      ['good','low','Nimble Dodge',         'Advantage on your next Dexterity saving throw.'],
      ['good','low','Ironclad Stomach',     'Immune to the poisoned condition until your next short rest.'],
      ['good','low','Hunter\'s Mark',       'Advantage on your next Survival or Tracking check.'],
      ['good','low','Scholar\'s Glance',    'Automatically succeed on your next History or Arcana check (DC 12 or lower).'],
      ['good','low','Battlefield Awareness','You cannot be surprised until the end of your next long rest.'],
      ['good','low','Careful Step',         'You leave no tracks and make no sound for the next hour.'],
      ['good','low','Lucky Break',          'Ignore one instance of disadvantage on any single roll.'],
      ['good','low','Taunt',                'One enemy within 30ft must make a DC 13 Wisdom save or target only you on their next turn.'],
      // ── GOOD — mid ─────────────────────────────────────────────────────────
      ['good','mid','Second Chance',        'Reroll any one die you just rolled and take the better result.'],
      ['good','mid','Adrenaline Rush',      'Take one additional bonus action on your next turn.'],
      ['good','mid','Spell Reserve',        'Recover one expended 1st-level spell slot.'],
      ['good','mid','Battle Cry',           'All allies within 30ft gain +1 to their next attack roll and damage roll.'],
      ['good','mid','Arcane Surge',         'Maximise the damage dice of your next spell (before modifiers).'],
      ['good','mid','Shield of Fate',       'The next attack that would hit you misses instead (declare after hit is announced).'],
      ['good','mid','Healing Word',         'Heal one creature within 60ft for 2d6+4 HP as a bonus action (no spell slot required).'],
      ['good','mid','Momentary Invincibility','Damage from the next single hit you take is reduced to 1.'],
      ['good','mid','True Strike',          'Your next attack roll is made with advantage and the hit counts as magical.'],
      ['good','mid','Bless',                'Gain +1d4 to all attack rolls and saving throws until the end of your next turn.'],
      ['good','mid','Phantom Step',         'Move up to 15ft without triggering opportunity attacks (once).'],
      ['good','mid','Counterstroke',        'Immediately after an enemy misses you, make one free weapon attack as a reaction.'],
      ['good','mid','War Cry',              'One ally you can see may immediately use their reaction to make one weapon attack.'],
      ['good','mid','Arcane Shield',        'Gain resistance to the next instance of spell damage you take.'],
      ['good','mid','Rapid Recovery',       'Remove one level of exhaustion immediately.'],
      // ── GOOD — high ────────────────────────────────────────────────────────
      ['good','high','Echo Spell',          'Cast any spell you know of 2nd level or lower without expending a spell slot (once).'],
      ['good','high','Unstoppable',         'You cannot be reduced below 1 HP by any single attack until the end of your next turn.'],
      ['good','high','Warpstep',            'Teleport to any unoccupied space within 60ft you can see as a bonus action.'],
      ['good','high','Turn the Tide',       'Up to three allies within 30ft each regain 1d8+4 HP immediately.'],
      ['good','high','Champion\'s Surge',   'Make one additional weapon attack as part of your Attack action on your next turn.'],
      ['good','high','Moment of Clarity',   'Remove one condition from yourself: frightened, charmed, stunned, or paralysed.'],
      ['good','high','Arcane Mastery',      'Your next spell is cast as if using a spell slot two levels higher (no extra slot required).'],
      ['good','high','Divine Ward',         'You and all allies within 15ft have advantage on all saving throws until the start of your next turn.'],
      ['good','high','Tactical Genius',     'Your side wins the next Initiative contest automatically; all allies act before all enemies.'],
      ['good','high','Resilience',          'Regain one expended use of any class feature that recharges on a short rest.'],
      ['good','high','Legendary Luck',      'Add 1d10 to any single d20 roll this session (declare after seeing the result, before outcome is described).'],
      ['good','high','Inspiration',         'You and one ally of your choice each gain a Bardic Inspiration die (d8) immediately.'],
      // ── GOOD — huge ────────────────────────────────────────────────────────
      ['good','huge','Phoenix Heart',       'The next time you drop to 0 HP this session, you drop to 1 HP instead.'],
      ['good','huge','Critical Surge',      'Your next attack is automatically a critical hit (roll damage dice twice).'],
      ['good','huge','Ascendant Moment',    'Gain the full benefits of a Short Rest instantly.'],
      ['good','huge','Fated Negation',      'Completely negate any one spell or effect targeting you (no reaction required, declare after target is announced).'],
      ['good','huge','Dragon\'s Fortune',   'Roll all dice with advantage for the next 3 rounds.'],
      ['good','huge','Hero\'s Moment',      'Automatically succeed on any one ability check, attack roll, or saving throw (declare before rolling).'],
      ['good','huge','Gift of the Gods',    'Regain one expended use of your most powerful once-per-long-rest class feature.'],
      ['good','huge','Mythic Surge',        'Double your proficiency bonus on all rolls for the duration of the current encounter.'],
      // ── BAD — low ──────────────────────────────────────────────────────────
      ['bad','low','Butterfingers',         'Drop whatever you\'re holding; retrieving it costs your bonus action next turn.'],
      ['bad','low','Stumble',               'Your speed is reduced by 10ft on your next turn.'],
      ['bad','low','Rattled',               '-1 to your next ability check.'],
      ['bad','low','Stubbed Toe',           'Take 1 point of bludgeoning damage. It\'s embarrassing.'],
      ['bad','low','Clumsy Oaf',            'Disadvantage on your next Dexterity check.'],
      ['bad','low','Loose Lips',            'DC 12 Stealth check or your group\'s position is revealed to nearby enemies.'],
      ['bad','low','Bad Hair Day',          'Disadvantage on your next Persuasion or Performance check.'],
      ['bad','low','Distracted',            'You cannot use your reaction until the start of your next turn.'],
      ['bad','low','Twisted Ankle',         'Your movement speed is halved until the end of your next turn.'],
      ['bad','low','Bad Omen',              'The next ally who uses the Help action to assist you rolls with disadvantage instead.'],
      ['bad','low','Overconfident',         'You must attempt the most direct, least cautious approach to the next obstacle you face.'],
      ['bad','low','Spooked',               'Disadvantage on your next saving throw against the frightened condition.'],
      ['bad','low','Wet Boots',             'All Stealth checks you make for the next hour are made at disadvantage.'],
      ['bad','low','Muscle Cramp',          'Your next melee attack is made at a -2 penalty.'],
      ['bad','low','Blurry Vision',         'All ranged attacks you make until the end of your next turn are made at disadvantage.'],
      // ── BAD — mid ──────────────────────────────────────────────────────────
      ['bad','mid','Fumble',                'Reroll your next attack roll and take the lower result.'],
      ['bad','mid','Spell Fizzle',          'Your next spell fails and the spell slot is wasted anyway.'],
      ['bad','mid','Off Balance',           'You are knocked prone. Standing up costs half your movement.'],
      ['bad','mid','Cursed Dice',           'Disadvantage on all Initiative rolls until your next long rest.'],
      ['bad','mid','Wild Magic Surge',      'Roll on the Wild Magic Surge table (or DM improvises something appropriately chaotic).'],
      ['bad','mid','Fumbled Weapon',        'Your weapon skitters 10ft in a random direction (d8 × 45°); retrieving it costs your movement.'],
      ['bad','mid','Haunted Hands',         'A minor spirit interferes; disadvantage on all Sleight of Hand and thieves\' tools checks until next short rest.'],
      ['bad','mid','Backlash',              'Your next spell deals half its rolled damage to you as psychic damage.'],
      ['bad','mid','Brittle Guard',         'Your armour or shield\'s AC bonus is reduced by 1 until repaired (long rest).'],
      ['bad','mid','Loudmouth',             'All creatures within 60ft are aware of your exact location until the end of your next turn.'],
      ['bad','mid','Marked',               'One enemy of the DM\'s choice has advantage on their next attack against you.'],
      ['bad','mid','Shaken',               'Disadvantage on your next saving throw against being stunned or paralysed.'],
      ['bad','mid','Rattling Bones',        'Undead creatures within 30ft sense your presence for the next hour.'],
      ['bad','mid','Sticky Fingers',        'The next potion or item you attempt to use takes twice as long (costs both action and bonus action).'],
      ['bad','mid','Exposed Flank',         'The next attack against you has advantage and ignores your shield bonus (if any).'],
      // ── BAD — high ─────────────────────────────────────────────────────────
      ['bad','high','Open Wound',           'You are bleeding; lose 1d4 HP at the start of each of your turns until a DC 12 Medicine check or magic heals you.'],
      ['bad','high','Shattered Focus',      'Any concentration spell you are maintaining ends immediately.'],
      ['bad','high','Drained',              'Lose one 2nd-level (or lower) spell slot until your next long rest.'],
      ['bad','high','Sapped',               'Lose one use of a class feature that recharges on a short rest.'],
      ['bad','high','Compelled',            'You must move toward the nearest enemy on your next turn and make a melee attack if possible.'],
      ['bad','high','Friends to Enemies',   'One friendly NPC present becomes hostile; their attitude drops to unfriendly until you make amends.'],
      ['bad','high','Cruel Fate',           'The DM may immediately change one environmental detail to your disadvantage.'],
      ['bad','high','Unlucky Star',         'Disadvantage on all ability checks for the next hour.'],
      ['bad','high','Chain Fumble',         'The fumble cascades; one ally within 5ft must make a DC 12 Dex save or take 1d6 bludgeoning damage.'],
      ['bad','high','Bad Dream',            'The next time you take a long rest, you recover no HP and cannot recover spell slots above 1st level.'],
      ['bad','high','Villain\'s Fortune',   'The primary antagonist gains one extra legendary action or lair action of the DM\'s choosing this session.'],
      ['bad','high','Cosmic Debt',          'The next natural 20 you roll is treated as an 18 instead (still a hit, just not a critical).'],
      // ── BAD — huge ─────────────────────────────────────────────────────────
      ['bad','huge','Nemesis Born',         'A recurring enemy targeting you personally is introduced or significantly empowered by the DM.'],
      ['bad','huge','Cursed Touch',         'The next magical item you touch becomes cursed until end of session (DM\'s choice of curse).'],
      ['bad','huge','Divine Displeasure',   'Your deity or patron is displeased; lose access to one class feature until you complete an in-game act of atonement.'],
      ['bad','huge','Catastrophic Failure', 'Your action not only fails but makes the situation demonstrably worse; DM determines the full consequence.'],
      ['bad','huge','Sunder',               'One non-plot-critical item you carry is destroyed outright (DM\'s choice).'],
      ['bad','huge','Doomed',               'Disadvantage on all death saving throws until your next long rest.'],
      ['bad','huge','Mark of Shame',        'All enemies within 30ft sense your misfortune and gain 5 temporary HP (they are emboldened).'],
      ['bad','huge','The Worst Timing',     'The DM may interrupt your next successful plan with a narrative complication of their choosing.'],
    ];
    for (const [type, tier, name, effect] of CARDS) ins.run(type, tier, name, effect);
  }

  // Token revocation: increment to invalidate all issued JWTs for a user
  try { db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0'); } catch (_) {}
  // User preferences (theme, custom colors, etc.) persisted server-side
  try { db.exec('ALTER TABLE users ADD COLUMN preferences TEXT'); } catch (_) {}
  // Dune house selection for Layer 3 dynamic theme
  try { db.exec('ALTER TABLE campaigns ADD COLUMN dune_house TEXT'); } catch (_) {}
  // Average party sanity for Cthulhu sanity atmosphere (Layer 3 dynamic theme)
  try { db.exec('ALTER TABLE campaigns ADD COLUMN avg_sanity INTEGER DEFAULT 100'); } catch (_) {}
  // D&D 5e setting/plane for Layer 3 dynamic theme
  try { db.exec('ALTER TABLE campaigns ADD COLUMN dnd_setting TEXT'); } catch (_) {}

  console.log('✅ Migrations complete.');
}

runMigrations();
module.exports = { runMigrations };
