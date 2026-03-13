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

Two layouts are supported. **Campaign-scoped** (preferred for multi-campaign):

```
/vault/
  /[campaign-slug]/       ← e.g. "curse-of-strahd", matched against campaigns.name
    /Quests/
    /NPCs/
    /Locations/
    /Hooks/
  /Players/               ← player notes (global, no campaign scope)
    /[CharacterName]/
      /Notes/
        my-note.md        ← frontmatter: public: false, shared_with_gm: false
  /GM-Only/               ← never served to players
```

**Flat layout** (legacy / single-campaign):

```
/vault/
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
  /Jobs/
  /Bestiary/
  /Rumours/
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

## Implementation Status & Gap Analysis

> Last audited: 2026-03-13 (updated). Tracks what is actually built vs. what the spec requires.

### Legend
`✅` Done — server + client UI
`🟡` Partial — backend exists, client UI incomplete
`❌` Missing — not built

---

### GM Capabilities: Create / Edit / Delete / Hide / Share

| Resource | Create | Edit | Delete | Hide/Unhide | Share to Player |
|---|---|---|---|---|---|
| Quests | ✅ modal + vault write | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ no `hidden` field | ❌ no share endpoint |
| NPCs | ✅ modal + vault write | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ no `hidden` field | ❌ no share endpoint |
| Locations | ✅ modal + vault write | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ no `hidden` field | ❌ no share endpoint |
| Hooks | ✅ modal + vault write | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ no `hidden` field | ❌ no share endpoint |
| Handouts | ✅ modal + file upload | ✅ edit button on card | ✅ delete button on card | ❌ | ✅ share to player(s), reshare |
| Maps | ✅ modal + file upload | 🟡 API exists, no edit button | ✅ delete button on card | ❌ no `hidden` field | ❌ no share endpoint |
| Sessions | ✅ modal | ✅ edit button on card | ✅ delete button on card | ❌ | ❌ |
| Factions | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ | ❌ |
| Timeline | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ | ❌ |
| Inventory | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ | ❌ |
| Key Items | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ❌ | ❌ |
| Jobs | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | 🟡 status field exists, no toggle button | ❌ |
| Bestiary | 🟡 API exists, no create form | 🟡 API exists, no edit button | 🟡 API exists, no delete button | ✅ reveal/hide endpoint, no button | ❌ |
| Rumours | 🟡 API exists, no create form | ❌ no PUT endpoint | ✅ API + no button | ✅ expose endpoint, no button | ✅ expose model |
| Notes | ✅ | ✅ own notes | ✅ own notes | ✅ private/public flag | ✅ shared_with_gm flag |
| Messages | ✅ via flyout | N/A | ❌ | ✅ secret flag | ✅ targeted send |
| Character Sheets | N/A | ✅ view all | N/A | N/A | N/A |
| Combat | ✅ start encounter | ✅ manage HP/conditions | ✅ end encounter | ✅ combatant is_hidden | N/A |

---

### Player Capabilities: Create / Edit / Share (own content only)

| Resource | Create | Edit Own | Delete Own | Share / Visibility |
|---|---|---|---|---|
| Notes | ✅ create form | ✅ inline edit + save | ✅ delete button | ✅ privacy toggle + share_with_gm checkbox |
| Session Notes | ✅ add to session | ✅ inline edit + save | ✅ delete button | ✅ private/public toggle |
| Theory Board | ✅ add nodes + edges | ✅ inline edit label/type | ✅ delete node | ✅ Share with GM checkbox |
| Messages | ✅ compose via flyout | N/A | ❌ | N/A |
| Character Sheet | N/A | ✅ edit own sheet | N/A | N/A |
| Ship Sheet | N/A | ✅ edit own | N/A | N/A |
| Handouts | ❌ players cannot create | N/A | N/A | ✅ reshare button shown when can_reshare=true |
| Pins | ✅ pin any item | N/A | ✅ unpin | N/A |
| Polls / Scheduling | ❌ view + vote only | N/A | N/A | N/A |

---

### Prioritised Change List

The following changes are needed to reach full GM management and player self-management. Listed in priority order.

#### Priority 1 — Inline Edit + Delete buttons on all vault resources (Client)
These routes are fully built on the server. The client just needs edit/delete buttons on each card and a populated edit modal.

- [ ] **Quests** — add Edit button (opens pre-filled modal) + Delete button with confirm
- [ ] **NPCs** — add Edit button + Delete button with confirm
- [ ] **Locations** — add Edit button + Delete button with confirm
- [ ] **Hooks** — add Edit button + Delete button with confirm
- [ ] **Maps** — add Edit button (title/description/type only, no re-upload needed)
- [ ] **Handouts** — add Edit button + DELETE `/api/handouts/:id` endpoint + delete button
- [ ] **Sessions** — add Edit button + DELETE `/api/sessions/:id` endpoint + delete button

#### Priority 2 — Missing create forms (Client + GM modal)
Server routes exist; just need `GM_FORMS` entries and `gmModalSave` cases added.

- [ ] **Factions** — create form: name, description, goals, image
- [ ] **Timeline** — create form: title, description, in_world_date, linked_quest (optional)
- [ ] **Inventory** — create form: name, quantity, holder, description
- [ ] **Key Items** — create form: name, description, significance, linked_quest, image
- [ ] **Jobs** — create form: title, reward, difficulty, posted_by, location, expiry
- [ ] **Bestiary** — create form: name, description, stats (CR/AC/HP), image
- [ ] **Rumours** — create form: content, is_true, source_npc, source_location

Also add Edit + Delete buttons to client cards for all of the above once forms exist.

#### Priority 3 — Hide/Unhide visibility toggle (Server + Client)
All vault resources currently send all records to all logged-in users. Need a `hidden` field so GMs can hide things from players mid-session without deleting them.

- [ ] Add `hidden BOOLEAN DEFAULT 0` column to `vault_files` table (migration)
- [ ] Filter `hidden = 0` from GET responses for non-GM users (quests, npcs, locations, hooks)
- [ ] Add `PUT /api/quests/:id/visibility`, same for npcs, locations, hooks — toggle `hidden`
- [ ] Add `hidden` column + filter + toggle to: maps, factions, timeline, inventory, jobs, key_items
- [ ] Client: add Eye/EyeOff toggle button on each GM card (calls visibility endpoint)
- [ ] Bestiary: wire existing reveal button in client UI (endpoint exists at `PUT /api/bestiary/:id/reveal`)
- [ ] Rumours: wire existing expose button in client UI (endpoint exists at `POST /api/rumours/:id/expose`)

#### Priority 4 — Share individual items to players (Server + Client)
Currently only Handouts support targeted sharing. NPCs, Locations, Quests etc. are all-or-nothing.

- [ ] Add a generic `item_shares` table: `(item_type, item_id, user_id, shared_at)` — or reuse the handout_permissions model
- [ ] `POST /api/quests/:id/share` — share with specific player(s)
- [ ] `POST /api/npcs/:id/share` — share with specific player(s)
- [ ] `POST /api/locations/:id/share` — share with specific player(s)
- [ ] GET endpoints respect share list: players only see items where `hidden=0` OR they are in `item_shares`
- [ ] Client: "Share" button on GM quest/npc/location cards → player picker dialog

#### Priority 5 — Player session notes edit + theory board sharing ✅

- [x] `PUT /api/sessions/:sessionId/notes/:noteId` — edit own session note
- [x] `DELETE /api/sessions/:sessionId/notes/:noteId` — delete own session note
- [x] Client: edit/delete buttons on own session notes (inline edit via textarea swap)
- [x] Theory board "Share with GM" checkbox — wired to `PUT /api/theory/nodes/:id` with `shared_with_gm` field; GM sees shared nodes at `GET /api/theory/shared`
- [x] Handout reshare button — shown on player cards when `can_reshare=true`

#### Priority 6 — Campaign switcher + multi-campaign data isolation
Without this, all content bleeds across games regardless of which campaign is active.

- [x] **Campaign switcher UI** — clickable top-bar dropdown listing all campaigns; click → `PUT /api/campaigns/:id/activate`; reloads all scoped data
- [x] **Create new campaign** — `GM_FORMS.campaign` (name, system, subtitle) + `gmModalSave` case → `POST /api/campaigns`; accessible from switcher dropdown "New Campaign" link
- [x] **Vault per-campaign scoping** — new files written to `vault/[campaign-slug]/Quests/` etc. when a campaign is active; vaultWatcher detects campaign from top-level folder slug and tags `vault_files.campaign_id`; flat layout still supported for legacy files
- [x] **GET route filtering** — all vault routes (quests, npcs, locations, hooks), maps, sessions, factions, timeline, jobs, inventory, key_items, bestiary, rumours now filter by `WHERE campaign_id = <active> OR campaign_id IS NULL`
- [x] **Fix GM Dashboard campaign data bug** — `loadGmDashboard()` now correctly reads `(await cR.json()).campaigns`

#### Priority 7 — Card detail panels ✅

- [x] `openDetail(type, id)` function — renders rich detail modal from local data store (image, full description, all fields, GM-only sections for gm_notes and rumour truth)
- [x] Wired on: quest, npc, location, hook, faction, timeline, inventory key-items, job, bestiary, rumour cards
- [x] GM actions (Edit + Delete) are included in the detail modal footer
- [ ] Linked fields (e.g. `linked_quest`, `source_npc`) navigate to that item's detail on click

#### Priority 8 — GM-Only vault folder privacy boundary
Currently `vault/GM-Only/` files are synced to DB just like everything else and are accessible to any authenticated user.

- [ ] **vaultWatcher**: skip files whose path starts with `GM-Only/` — never write them to `vault_files`
- [ ] Alternatively: sync them but set a `gm_only = 1` flag and filter from all non-GM GET responses
- [ ] Ensure no route accidentally exposes these files

#### Priority 9 — Missing GM tools with existing backend

- [ ] **Agenda / Secret Objective Cards** — add `GM_FORMS.agenda` (player select, title, content) + `gmModalSave` case → `POST /api/agenda`; currently route has full CRUD but no UI entry point
- [ ] **Stress/Sanity adjust** — add GM control in player table on GM Dashboard to set stress per player → `PUT /api/stress/:userId`; currently API-only
- [ ] **Bestiary reveal button** — wire `PUT /api/bestiary/:id/reveal` in client; endpoint exists, no button
- [ ] **Rumours expose button** — wire `POST /api/rumours/:id/expose` in client; endpoint exists, no button
- [ ] **Job → Quest promotion** — add "Promote to Quest" button on job cards → `PUT /api/jobs/:id` with `promoted_quest_id`; field exists in DB, no UI
- [ ] **Rumours PUT** — add `PUT /api/rumours/:id` server route; currently rumours cannot be edited after creation

#### Priority 10 — User / player management

- [ ] **GM can remove players** — add `DELETE /api/users/:id` (GM only); currently no way to remove an account
- [ ] **GM can reset player password** — add `PUT /api/users/:id/password` (GM only)
- [ ] **Registration is open** — `POST /api/auth/register` is publicly accessible; for a private group install this should require a GM-issued invite code or be GM-only
- [ ] **Client UI** — add Remove and Reset Password buttons to the Players table in GM Dashboard

#### Priority 11 — XP / Milestone tracker ✅

- [x] `xp_awards` table: `(campaign_id, awarded_to, amount, reason, awarded_by, awarded_at)`
- [x] `GET /api/xp`, `POST /api/xp` (GM awards to one or more players), `DELETE /api/xp/:id` (GM)
- [x] D&D 5e XP level thresholds — auto-detect level from total XP, notify player on level-up via SSE
- [x] Client: XP panel on GM Dashboard with multi-player award form + totals table + award log
- [x] Players table in GM Dashboard now shows XP total and current level per player

---

### What Works End-to-End Today

- Login / JWT auth / role enforcement
- GM create modal with FAB `+` button wired to current page type
- Quests, NPCs, Locations, Hooks: create writes to vault, watcher syncs to DB, cards render
- Handouts: create, share to player, acknowledge, SSE push
- Maps: upload image, create record, view full-screen overlay, delete
- Notes: full CRUD + privacy for players and GM
- Messages: compose, send, read, acknowledge, SSE push
- Character sheets: player edit own, GM view all
- Theory board: full personal D3 graph editor
- Combat tracker: GM runs encounter, players see live updates
- Sessions: GM creates/edits/deletes, players add/edit/delete own notes + vote polls + respond to scheduling
- Pins: pin/unpin any item to dashboard
- Bestiary, Rumours, Factions, Timeline, Inventory, Jobs: full CRUD (create/edit/delete) via GM modal
- Campaign switcher: top-bar dropdown; GM can create new campaigns + switch active campaign; all GET routes filter by active campaign
- Theory board: Share with GM checkbox; GM can view all shared nodes at `/api/theory/shared`
- Handouts: player reshare button when `can_reshare=true`

---

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
