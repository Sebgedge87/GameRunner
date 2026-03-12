# GameRunner — The Chronicle

A self-hosted campaign portal for tabletop RPGs. GM runs the server locally, players connect via browser over Tailscale. All narrative content lives in an Obsidian vault (markdown + YAML frontmatter).

---

## Architecture

| Layer | Tool | Notes |
|---|---|---|
| Vault | Obsidian markdown + YAML | Source of truth for all narrative content |
| Backend | Node.js + Express + SQLite | API, auth, messages, real-time SSE |
| Frontend | Single-file HTML portal | No build step, served or opened locally |
| Hosting | Tailscale | Free private VPN — no cloud, no open ports |
| Desktop (Phase 5) | Tauri | Optional native wrapper, direct vault access |

---

## Vault Structure

```
/vault/
  /Players/
    /[CharacterName]/
      /Notes/
        my-note.md        ← frontmatter: public: false, shared_with_gm: false
  /Quests/
  /NPCs/
  /Locations/
  /Hooks/
  /Sessions/
  /Handouts/
  /Maps/
  /KeyItems/
  /Inventory/
  /Factions/
  /Timeline/
  /Assets/
    /npcs/
    /locations/
    /maps/
    /handouts/
    /items/
  /Jobs/
  /Bestiary/
  /Rumours/
  /Sessions/
  /GM-Only/               ← never served to players
```

---

## Privacy Rules

- Players see: their own notes + notes where `public: true`
- GM sees: notes where `public: true` OR `shared_with_gm: true`
- Private notes never returned to wrong user — enforced server-side
- Handouts: player only sees what has been explicitly shared with them
- Player theory boards: private by default, optional GM/party share

---

## Full Feature Spec

### Pages (Sidebar Navigation)

| Page | Who | Description |
|---|---|---|
| Home | All | Campaign overview, story summary, session count. GM editable |
| Quests | All | Active quests with images, progress, detail panels |
| Job Board | All | Available work in towns/locations. Accept → becomes Quest |
| NPCs | All | NPC cards with portraits, disposition, detail panels |
| Locations | All | Location cards with art, danger level, detail panels |
| Hooks | All | Story hooks/clues with type tags, detail panels |
| Maps | All | Uploaded map images with pan/zoom |
| Inventory | All | Party inventory — GM manages, players view |
| Key Items | All | Quest/story-critical items with images and significance |
| Bestiary | All | Creature entries. GM reveals to players when encountered |
| Handouts | All | Per-player documents, images, letters. Forward-sharing system |
| Sessions | All | Per-session log/recap, polls, scheduling |
| Factions | All | Faction cards with party reputation tracker |
| Timeline | All | In-world calendar, events pinned by date |
| Rumour Mill | All | GM-planted rumours per NPC/location. True or false — players don't know |
| Character Sheets | All | Per-player stats, HP, stress/sanity, D&D Beyond link. System-specific templates |
| Ship / Vehicle | All | Party ship or vehicle sheet. System-specific |
| Theory Board | Players | Personal D3 mindmap — private nodes, custom connections, theory-craft |
| Combat | All | Initiative tracker, HP, conditions. GM edits, players view read-only |
| GM Dashboard | GM only | Create/edit all content, manage handouts, polls, view shared notes |

### Flyout Panels (persistent, accessible from any page)

| Panel | Trigger | Description |
|---|---|---|
| Messages | Envelope icon (top bar) | Inbox + compose flyout from right. Bidirectional — players can message GM |
| Notifications | Bell icon (top bar) | Log of all activity — new messages, handouts, secrets, broadcasts |

### Cards

- All cards have an image (portrait, thumbnail, map tile)
- Click card → full detail panel (image, description, all connections as clickable links)
- All connection links navigate to that item's detail view
- GM sees edit button on all cards

### Mindmap (Canon — GM graph)

- D3 force graph built from vault `connected_to` frontmatter
- Click node → popout card (image, type, 2-line summary, "Open →" link)
- Read-only for players

### Theory Board (Player — personal)

- Per-player private D3 graph
- Add existing vault items as nodes (NPCs, locations, quests)
- Create custom theory nodes ("Who is the informant?")
- Draw custom connections with labels ("I think these are linked")
- Privacy: private / share with GM / share with party
- Stored in SQLite only — not written to vault (theories ≠ canon)

### Messaging

- GM → player (targeted or broadcast)
- Player → GM (private)
- Messages are secret by default when targeted
- Flyout panel, not a full page
- Toast notification on receipt

### Handouts

- GM creates handout (text, image, or PDF upload)
- GM shares with specific player(s)
- Recipient can forward to one or more other players
- When all players have access → auto-promotes to group handout
- GM sees share status per player on each handout
- Toast fires on receipt

### Agenda / Secret Objective Cards

- GM creates a secret agenda per player (great for Alien, Paranoia, etc.)
- Only that player can see their own agenda
- Displayed as a locked card on their dashboard
- GM can reveal/update at any time

### Notifications

- Toast notifications (bottom-right, auto-dismiss 5s):
  - New message
  - New handout shared
  - New secret / agenda revealed
  - GM broadcast
  - Note saved
- Bell icon → notification history flyout (full log, mark all read)

### Search

- Global search across NPCs, quests, locations, hooks, notes, sessions, items
- Keyboard shortcut (Cmd/Ctrl + K)
- Results grouped by type, click to open detail

### Real-Time (SSE)

- Server-Sent Events on `/api/events` (auth required)
- Events: `new_message`, `new_handout`, `new_broadcast`, `content_updated`
- Frontend subscribes on login, fires toasts + badge updates automatically

### Character Sheets

- Per-player: name, class, level, HP (current/max), stats (STR/DEX/CON/INT/WIS/CHA), notes
- GM can view all sheets
- Player can edit their own
- Displayed on player dashboard as a mini card

### Session Log

- GM writes session recap (title, date, summary, key events)
- Players can add their own session notes (private/public)
- Displayed chronologically, newest first
- Linked to quests/NPCs mentioned

### Factions

- Faction cards with description, known members, goals
- Party reputation slider per faction (−3 hostile → +3 allied)
- GM adjusts reputation, players see current standing

### Timeline

- In-world calendar events (e.g. "Day 14 — Party arrives in Baldur's Gate")
- GM adds events, optionally linked to quests/NPCs
- Visual timeline view, scrollable

### Job Board

- Separate from Quests — Jobs are available work, Quests are active commitments
- GM posts jobs to specific locations (tavern notice board, guild hall, dock master, etc.)
- Each job: title, reward, difficulty rating, posted by (NPC/faction), location, optional expiry date
- GM controls visibility — some jobs require being in that location or having the right contacts
- Players browse available jobs; party accepts → GM promotes to active Quest with one click
- Jobs can expire, be declined, or be completed without becoming a full quest
- Vault file written per job: `Jobs/[slug].md`

### Ambient Scene Tools

- **Atmosphere tracker** — current in-world weather, time of day, visible to all players
- **Sound / music links** — GM attaches a Spotify or YouTube URL to a location or scene, players see a "Now Playing" link they can click to open
- GM can push atmosphere updates mid-session (triggers a subtle notification)

### Initiative & Combat Tracker (GM-side)

- Turn order list, drag to reorder
- HP tracker per combatant (monsters hidden from players, party HP visible to relevant player only)
- Status conditions per combatant
- Round counter
- Visible to players as a read-only "Combat" panel during active encounter

### XP / Milestone Tracker

- GM awards XP or marks milestone
- Threshold per level stored per campaign system
- Auto-notifies players when level-up threshold reached
- Updates character sheet level automatically on milestone

### Between-Session Polls

- GM posts a question with options ("Where do we go next?", "What did your character do between sessions?")
- Players vote, results visible to GM immediately, revealed to party when GM chooses
- Results stored in session log

### Session Scheduling

- GM proposes dates, players mark availability (yes / maybe / no)
- GM confirms session date, all players notified
- Confirmed sessions appear in Timeline automatically

### Bestiary

- Monster/creature entries with stats, description, image
- GM-only by default
- GM can reveal an entry to players when encountered (e.g. after a Nature check)
- Linked to sessions where creature was encountered

### Rumour Mill

- GM creates rumours (true or false) and assigns them to NPCs or locations
- Tracks which players have heard which rumours (via handout or message)
- Players see their rumours as a list — no indication which are true
- GM sees full truth status

### Stress / Sanity Tracker

- System-specific mental health mechanic shown on dashboard
- D&D: optional exhaustion tracker
- Call of Cthulhu: Sanity (current/max), Indefinite Insanity flag
- Alien: Stress dice count, Panic threshold
- Achtung! Cthulhu: both War Stress + Sanity
- Per-player, GM can adjust, player can see their own

### Ship / Vehicle Sheet

- Coriolis, Alien, Dune: separate sheet for the party's ship/vehicle
- Stats vary by system (hull, systems, crew capacity, weapons)
- Linked to party inventory for consumables
- GM and all players can view, GM edits

### Favourites / Pins

- Players pin frequently referenced items (NPCs, locations, quests) to their dashboard
- Pinned items shown as a quick-access row at top of dashboard

### Reading Confirmations

- GM can mark any message or handout as "requires acknowledgement"
- Players see a confirm button; GM dashboard shows who has/hasn't confirmed
- Useful for rule clarifications, session zero agreements, important lore drops

### Last Updated Indicators

- Subtle "updated" badge on cards when content has changed since player's last visit
- Clears when player opens the detail panel

### Campaign Switcher

- Multiple campaigns in one install (D&D, Alien, etc.)
- Each campaign: own vault folder, player roster, colour theme
- GM selects active campaign from top bar

### UI / UX & Theming

#### Responsive Layout
- Mobile-first — sidebar collapses to bottom nav bar on small screens
- Cards stack to single column on mobile
- Flyout panels go full-screen on mobile
- Touch-friendly tap targets throughout

#### Per-System Themes
Each campaign system loads a distinct CSS variable set, font stack, background texture, and animation profile:

| System | Aesthetic | Animations |
|---|---|---|
| D&D 5e | Dark parchment, gold, candlelight | Torch flicker on sidebar, ink-fade page transitions |
| Call of Cthulhu | Sepia, typewriter font, aged paper | Film grain overlay, text glitch on sanity events |
| Alien | Cold corporate green-on-black terminal | Scanline effect, CRT cursor flicker, data readout reveals |
| Coriolis | Deep space blue, Arabic-inspired geometry | Star particle background, shimmer transitions |
| Dune | Desert amber, sand texture, House sigils | Heat haze shimmer, sand particle drift |
| Achtung! Cthulhu | WW2 field report, olive drab + red | Stamped text reveals, paper tear transitions |

#### Per-System Ambient Audio
- Each theme ships with a looping ambient audio track (loaded locally, no external dependency)
- Player can toggle audio on/off with a single button in the top bar
- Volume slider in settings
- GM can also push a scene-specific track mid-session (overrides ambient)
- Tracks stored in `/assets/audio/[system]/` — swappable by the GM

| System | Default Ambient |
|---|---|
| D&D 5e | Tavern ambience / dungeon drip / forest night |
| Call of Cthulhu | 1920s rain on window / asylum corridor |
| Alien | Ship hum / ventilation / deep space silence |
| Coriolis | Station crowd / prayer bells / void wind |
| Dune | Desert wind / Sietch chants / spice harvester drone |
| Achtung! Cthulhu | Battlefield distant artillery / bunker radio static |

#### Other UX Details
- **Skeleton loaders** — cards show animated skeleton instead of blank space while loading
- **Empty state illustrations** — themed empty state per page (not just "No items found")
- **Keyboard navigation** — arrow keys through cards, Esc closes panels, Cmd+K for search
- **Drag and drop** — reorder initiative tracker, sort inventory
- **Onboarding flow** — first-time GM setup wizard: name campaign, pick system, invite players
- **Print styles** — NPC sheets, quest summaries, character sheets print cleanly
- **Accessibility** — ARIA labels, focus management in modals and flyouts

### Backup / Export

- GM one-click export: zips vault folder + SQLite DB
- Download as `.zip`

---

## Build Phases

### ✅ Phase 1 — Backend Foundation
Node.js + Express + SQLite + vault watcher + JWT auth + base routes

### ✅ Phase 2 — Player Portal v1
Single-file HTML — login, dashboard, all base pages, D3 mindmap, messages, notes

### 🔲 Phase 3 — Full Feature Build (current)

**Backend:**
- [ ] New DB tables: inventory, key_items, campaign, maps, handouts, handout_permissions, sessions, session_polls, session_scheduling, factions, faction_reputation, timeline_events, agenda_cards, character_sheets, ship_sheets, theory_nodes, theory_edges, notifications, bestiary, rumours, rumour_exposure, jobs, combat_tracker, stress_sanity, pins, read_confirmations
- [ ] GM write routes for NPCs, Quests, Hooks, Locations, Jobs, Bestiary (POST/PUT/DELETE)
- [ ] Image/file upload (multer → vault/Assets/)
- [ ] Static file serving for uploads
- [ ] Bidirectional messages (player → GM)
- [ ] New routes: inventory, key-items, campaign, maps, handouts, sessions, factions, timeline, agenda, characters, ship, theory-board, search, notifications, bestiary, rumours, jobs, combat, stress, pins, confirmations, atmosphere, polls, scheduling
- [ ] SSE endpoint (/api/events)
- [ ] Rate limiting on auth

**Frontend:**
- [ ] Complete portal rewrite
- [ ] All new pages (Home, Job Board, Inventory, Key Items, Maps, Bestiary, Handouts, Sessions, Factions, Timeline, Rumour Mill, Character Sheets, Ship/Vehicle Sheet, Theory Board, Combat Tracker, GM Dashboard)
- [ ] Messages + Notifications as right-side flyout panels
- [ ] Top bar with search (Cmd+K), messages icon, bell icon
- [ ] Toast notification system
- [ ] Detail panels for all item types (image, full description, linked navigation)
- [ ] GM create/edit modals for all content types
- [ ] Image upload UI
- [ ] Mindmap node popout card
- [ ] Editable player theory board
- [ ] Campaign switcher with system-specific templates (D&D 5e, CoC, Alien, Coriolis, Dune, Achtung! Cthulhu)
- [ ] Per-system CSS themes with animations (torch flicker, CRT scanlines, film grain, etc.)
- [ ] Per-system ambient audio (looping, toggle on/off, volume control, GM can push scene track)
- [ ] Skeleton loaders + themed empty states
- [ ] Onboarding wizard for first-time GM setup
- [ ] Keyboard navigation + drag and drop
- [ ] Print styles for sheets and summaries
- [ ] Accessibility (ARIA, focus management)
- [ ] Stress/sanity tracker on dashboard (system-specific)
- [ ] Atmosphere tracker + scene music links (GM pushes, players see)
- [ ] XP/milestone tracker with auto level-up notification
- [ ] Favourites/pins row on dashboard
- [ ] Reading confirmations on messages/handouts
- [ ] Last-updated indicators on cards
- [ ] Between-session polls + session scheduling
- [ ] Backup/export button (GM only)
- [ ] Mobile responsive layout

### 🔲 Phase 4 — Security + Hosting

**Option A — Private group (Tailscale, free forever)**
- [ ] Tailscale setup guide
- [ ] GM runs server on their machine
- [ ] Players install Tailscale app, join network
- [ ] Access via `http://100.x.x.x:3000` — private, encrypted, no internet exposure

**Option B — Public / multi-group hosting (~€4/month)**
- [ ] Docker + env var config for clean VPS deployment
- [ ] Hetzner CAX11 VPS setup guide (~€4/month, always on)
- [ ] Caddy reverse proxy + Let's Encrypt (automatic HTTPS, free)
- [ ] Cloudflare free tier in front (DDoS protection + SSL termination)

**Security hardening (required for Option B, recommended for Option A):**
- [ ] Helmet.js — HTTP security headers
- [ ] CORS locked to specific origin (not wildcard)
- [ ] File upload validation — type whitelist, size limits, no executable uploads
- [ ] Input sanitisation on all text fields
- [ ] All secrets in environment variables (JWT secret, DB path, never hardcoded)
- [ ] 2FA on GM account
- [ ] Audit log — who accessed what, when
- [ ] JWT refresh tokens
- [ ] Brute-force rate limiting on auth (done in Phase 3)
- [ ] SQLite → PostgreSQL migration path for multi-user scale

### 🔲 Phase 5 — Desktop App (Tauri)
- [ ] Wrap frontend as native app
- [ ] Direct vault file system access (no HTTP layer needed locally)
- [ ] GM-only desktop build
- [ ] Distributable `.exe` / `.app`

---

## Build Plan

### Estimated Scale
| Part | Lines |
|---|---|
| DB migrations (all new tables) | ~300 |
| Backend routes (20+ route files) | ~3,500 |
| Frontend HTML/CSS | ~2,000 |
| Frontend JavaScript | ~4,000 |
| **Total new code** | **~10,000** |

### Session Breakdown
Due to context limits, the build is split into 5 focused sessions — each producing working, committable code:

| Session | Scope |
|---|---|
| 1 | DB migrations + all backend routes |
| 2 | Frontend: structure, CSS, all themes + animations, base pages |
| 3 | Frontend: complex pages (Theory Board, Combat, Character Sheets, GM Dashboard) |
| 4 | Frontend: flyouts, toasts, SSE, search, audio engine |
| 5 | Wiring, seed data for all new tables, testing |

---

## Running Locally

```bash
cd server
npm install
node src/db/seed.js   # seed demo data
npm run dev           # starts on http://localhost:3000
```

Open `dnd-portal-v2.html` in browser and log in.

### Seeded Accounts

| Username | Password | Role |
|---|---|---|
| `dm` | `dm-secret` | GM |
| `aerindel` | `player1` | Player |
| `thorin` | `player2` | Player |
| `seraphine` | `player3` | Player |
| `zyx` | `player4` | Player |
