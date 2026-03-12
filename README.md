# GameRunner — The Chronicle

A self-hosted D&D campaign portal. Players connect via a web frontend; the GM runs the server locally. All data lives in an Obsidian vault (markdown files with YAML frontmatter).

---

## Architecture

| Layer | Tool | Notes |
|---|---|---|
| Obsidian Vault | Markdown + YAML frontmatter | Source of truth for quests, NPCs, locations, hooks |
| Backend / API | Node.js + Express + SQLite | Reads/writes vault, auth, messages, notes |
| Player Frontend | `dnd-portal-v2.html` | Single-file portal, served or opened locally |
| Hosting | Tailscale | Free private VPN — no cloud, no ports opened |
| Desktop App | Tauri (Phase 5) | Optional native wrapper with direct vault access |

---

## Vault Structure

```
/vault/
  /Players/
    /[CharacterName]/
      /Notes/
        my-note.md       ← frontmatter: public: false, shared_with_gm: false
  /Quests/
  /NPCs/
  /Locations/
  /Hooks/
  /GM-Only/              ← never served to players
```

---

## Privacy Rules

- Players see: their own notes + notes where `public: true`
- GM sees: notes where `public: true` OR `shared_with_gm: true`
- Private notes are **never** returned by the API to the wrong user — enforced server-side, not just in the UI

---

## Phases

### ✅ Phase 1 — Backend Foundation
- Node.js + Express + SQLite + chokidar vault watcher
- JWT auth (player accounts + GM role)
- `/api/quests`, `/api/npcs`, `/api/locations`, `/api/hooks` — reads from vault
- `/api/notes` — CRUD, writes `.md` with YAML frontmatter to vault
- `/api/messages` — GM sends secrets/broadcasts per player
- Privacy middleware on all routes

### ✅ Phase 2 — Player Portal
- Single-file `dnd-portal-v2.html` — no build step
- Login with session restore
- Dashboard, Quests, NPCs, Locations, Hooks, Mindmap, Messages, Notes
- D3 force graph mindmap (drag, zoom, colour-coded by type)
- Note composer with privacy/category/GM-share controls
- GM compose form (visible only to `role: gm`)

### 🔲 Phase 3 — GM Dashboard
- Dedicated GM view (separate page or route)
- Send secret messages to individual players or the group
- View public notes + notes shared with GM (private notes hidden)
- Create/edit quests, NPCs, hooks directly (writes to vault)
- Message read receipts — see who has read what

### 🔲 Phase 4 — Security + Hosting (Zero Cost)
- Tailscale setup guide
- Server runs on GM's machine
- Players install Tailscale (free, up to 100 devices)
- Access via `http://100.x.x.x:3000` — private, encrypted, no internet exposure

### 🔲 Phase 5 — Desktop App (Optional)
- Tauri wrapper around the frontend
- Direct file system access to Obsidian vault (no HTTP layer needed locally)
- Distributable `.exe` / `.app` for GM machine

---

## Running Locally

```bash
cd server
npm install
node src/db/seed.js   # seed demo data
npm run dev           # starts on http://localhost:3000
```

Open `dnd-portal-v2.html` in a browser and log in.

### Seeded Accounts

| Username | Password | Role |
|---|---|---|
| `dm` | `dm-secret` | GM |
| `aerindel` | `player1` | Player |
| `thorin` | `player2` | Player |
| `seraphine` | `player3` | Player |
| `zyx` | `player4` | Player |
