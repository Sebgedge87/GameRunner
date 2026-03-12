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
| Quests | All | Main/side/delivery quests with images, progress, detail panels |
| NPCs | All | NPC cards with portraits, disposition, detail panels |
| Locations | All | Location cards with art, danger level, detail panels |
| Hooks | All | Story hooks/clues with type tags, detail panels |
| Maps | All | Uploaded map images with pan/zoom |
| Inventory | All | Party inventory — GM manages, players view |
| Key Items | All | Quest/story-critical items with images and significance |
| Handouts | All | Per-player documents, images, letters. Forward-sharing system |
| Sessions | All | Per-session log/recap. GM writes, players can add notes |
| Factions | All | Faction cards with party reputation tracker |
| Timeline | All | In-world calendar, events pinned by date |
| Character Sheets | All | Per-player stats, HP, abilities, level |
| Theory Board | Players | Personal D3 mindmap — private nodes, custom connections, theory-craft |
| GM Dashboard | GM only | Create/edit all content, manage handouts, view shared notes |

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

### Campaign Switcher

- Multiple campaigns in one install (D&D, Alien, etc.)
- Each campaign: own vault folder, player roster, colour theme
- GM selects active campaign from top bar

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
- [ ] New DB tables: inventory, key_items, campaign, maps, handouts, handout_permissions, sessions, factions, faction_reputation, timeline_events, agenda_cards, character_sheets, theory_nodes, theory_edges, notifications
- [ ] GM write routes for NPCs, Quests, Hooks, Locations (POST/PUT/DELETE)
- [ ] Image/file upload (multer → vault/Assets/)
- [ ] Static file serving for uploads
- [ ] Bidirectional messages (player → GM)
- [ ] New routes: inventory, key-items, campaign, maps, handouts, sessions, factions, timeline, agenda, characters, theory-board, search, notifications
- [ ] SSE endpoint (/api/events)
- [ ] Rate limiting on auth

**Frontend:**
- [ ] Complete portal rewrite
- [ ] All new pages (Home, Inventory, Key Items, Maps, Handouts, Sessions, Factions, Timeline, Character Sheets, Theory Board, GM Dashboard)
- [ ] Messages + Notifications as right-side flyout panels
- [ ] Top bar with search (Cmd+K), messages icon, bell icon
- [ ] Toast notification system
- [ ] Detail panels for all item types (image, full description, linked navigation)
- [ ] GM create/edit modals for all content types
- [ ] Image upload UI
- [ ] Mindmap node popout card
- [ ] Editable player theory board
- [ ] Campaign switcher
- [ ] Backup/export button (GM only)
- [ ] Mobile responsive layout

### 🔲 Phase 4 — Security + Hosting
- [ ] Tailscale setup guide
- [ ] JWT refresh tokens
- [ ] Brute-force rate limiting (done in Phase 3)

### 🔲 Phase 5 — Desktop App (Tauri)
- [ ] Wrap frontend as native app
- [ ] Direct vault file system access
- [ ] GM-only desktop build

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
