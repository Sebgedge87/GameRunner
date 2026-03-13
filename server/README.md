# The Chronicle — Backend Server

Node.js + Express REST API for the D&D Campaign Portal.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and set at minimum:
- `JWT_SECRET` — a long random string (e.g. `openssl rand -hex 32`)
- `VAULT_PATH` — path to your Obsidian vault root (default: `./vault`)
- `DB_PATH` — where to store the SQLite database (default: `./chronicle.db`)

### 3. Run migrations (creates tables)
```bash
npm run migrate
```

### 4. Seed example data
```bash
npm run seed
```
This creates:
- 1 GM user (`dm` / `dm-secret`)
- 4 player users (`aerindel`, `thorin`, `seraphine`, `zyx` — all password `playerN`)
- 3 quests, 6 NPCs, 6 locations, 5 plot hooks as vault `.md` files
- 3 example messages (2 GM secrets, 1 party broadcast)

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

API runs at **http://localhost:3000**

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new player |
| POST | `/api/auth/login` | Login → returns JWT token |
| GET | `/api/auth/me` | Get current user (requires auth) |

### Notes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notes` | List notes (privacy-filtered) |
| POST | `/api/notes` | Create note + write `.md` to vault |
| PUT | `/api/notes/:id` | Update note + update `.md` in vault |
| DELETE | `/api/notes/:id` | Soft delete (adds `deleted: true` to frontmatter) |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages` | Get messages for current user |
| POST | `/api/messages` | Send message (GM only) |
| PUT | `/api/messages/:id/read` | Mark message as read |

### Campaign Data (read from vault)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quests` | All quests from vault |
| GET | `/api/npcs` | All NPCs from vault |
| GET | `/api/locations` | All locations from vault |
| GET | `/api/hooks` | All plot hooks from vault |
| GET | `/api/mindmap` | Nodes + links for force graph |

---

## Privacy Model

Enforced server-side in `src/middleware/privacyFilter.js`:

- **Players** see: their own notes + any `privacy: public` notes
- **GM** sees: `privacy: public` notes + notes with `shared_with_gm: true`
- **Secret messages** (`is_secret: 1`) are only returned to the specific `to_user_id` recipient
- Private notes are **never** exposed to other players or the GM unless explicitly shared

---

## Obsidian Vault Integration

The server watches the `./vault` directory with **chokidar**. Any `.md` file the GM edits directly in Obsidian is automatically synced into the SQLite `vault_files` table.

Vault structure:
```
vault/
  Players/
    Aerindel/
      Notes/
      NPCs/
      Locations/
  Quests/
  NPCs/
  Locations/
  Hooks/
  GM-Only/
```

Every `.md` file uses YAML frontmatter. See `vault/Quests/` for examples.

---

## Remote Player Access (Tailscale)

To let players connect from outside your local network:

1. Install [Tailscale](https://tailscale.com) (free) on your machine
2. Have each player install Tailscale and join your tailnet
3. Share your Tailscale IP with players — they connect to `http://<your-tailscale-ip>:3000`
4. No port forwarding or public internet exposure needed

---

## Project Structure

```
server/
  src/
    index.js              # Express app entry point
    config.js             # Env vars
    db/
      database.js         # SQLite connection
      migrations.js       # Table creation
      seed.js             # Example data
    auth/
      authRoutes.js       # POST /api/auth/*
      authMiddleware.js   # JWT verification
    vault/
      vaultWatcher.js     # chokidar file watcher
      vaultReader.js      # Read + parse .md files
      vaultWriter.js      # Write .md with frontmatter
    routes/
      notes.js            # /api/notes
      messages.js         # /api/messages
      quests.js           # /api/quests
      npcs.js             # /api/npcs
      locations.js        # /api/locations
      hooks.js            # /api/hooks
      mindmap.js          # /api/mindmap
    middleware/
      privacyFilter.js    # Server-side privacy enforcement
  vault/                  # Obsidian vault root
  .env.example
  package.json
```
