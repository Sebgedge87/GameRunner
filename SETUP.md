# GameRunner — Setup & User Guide

## Requirements

- **Node.js v22.5 or later** — required for the built-in SQLite module (`node:sqlite`)
  ```bash
  node --version   # must be v22.5.0 or higher
  ```
  Install via [nodejs.org](https://nodejs.org) or nvm:
  ```bash
  nvm install 22 && nvm use 22
  ```
- **npm** — bundled with Node.js
- A modern browser (Chrome, Firefox, Edge, Safari)

---

## Local Setup

### 1. Install dependencies

All server code lives in `server/` — install from there:

```bash
cd GameRunner/server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3000
NODE_ENV=development

# Generate a real secret:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=replace-with-a-long-random-string

DB_PATH=./chronicle.db
VAULT_PATH=./vault
GM_USERNAME=dungeonmaster

# true  = anyone can register
# false = only the very first user can register (GM bootstrap), then locked
REGISTRATION_OPEN=true
```

The only value that **must** be changed for any real use is `JWT_SECRET`. Everything else works out of the box for local development.

### 3. Start the server

From `GameRunner/server/`:

```bash
npm run dev    # development — auto-restarts on file changes
# or
npm start      # production
```

Open **http://localhost:3000** — the app is served directly from the same process, no separate web server needed.

### 4. First login

**Option A — Seed demo data (recommended for a first look):**

```bash
npm run seed
```

This populates example campaigns, NPCs, quests, sessions, and two accounts:

| Username | Password | Role |
|---|---|---|
| `dungeonmaster` | `changeme` | GM |
| `player1` | `changeme` | Player |

Log in as `dungeonmaster` first, then change the password from **GM Dashboard → Players**.

**Option B — Clean start:**

1. Open http://localhost:3000 and register your first account (any username/password)
2. Promote it to GM via the Node REPL:
   ```bash
   node -e "
   const {DatabaseSync}=require('node:sqlite');
   const db=new DatabaseSync('./chronicle.db');
   db.prepare(\"UPDATE users SET role='gm' WHERE username=?\").run('your-username');
   console.log('Done');
   "
   ```
3. Log out and back in — GM features will now appear in the sidebar and header

Players can self-register at http://localhost:3000 as long as `REGISTRATION_OPEN=true`.

---

## Key Concepts

### Roles

| Role | Can do |
|---|---|
| **GM** | Create and edit all content, manage players, run combat, send handouts, reveal hidden items, switch campaigns |
| **Player** | View visible content, write notes, manage their own character sheet, send and receive messages |

The first user who registers when no users exist can register freely even if `REGISTRATION_OPEN=false` — this is the GM bootstrap path. All subsequent registrations are gated by that flag.

### Campaigns

- A GM creates campaigns from **GM Dashboard → Campaigns**
- Only one campaign is **active** at a time; all players see that campaign's content
- Switch the active campaign from the dropdown in the sidebar header
- Each campaign gets its own subfolder in the vault

### The Vault

Content (NPCs, quests, locations, hooks) is stored as Markdown files with YAML frontmatter and watched live by the server:

```
vault/
└── <campaign-slug>/
    ├── Quests/       ← quest-name.md
    ├── NPCs/         ← npc-name.md
    ├── Locations/    ← location-name.md
    ├── Hooks/        ← hook-name.md
    └── GM-Only/      ← NEVER synced to players
```

You can edit these files directly in Obsidian and the server picks up changes instantly. Creating content from within the app also writes files here.

---

## Environment Variables — Full Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | *(must be set)* | Signs auth tokens — generate with `openssl rand -hex 32` |
| `DB_PATH` | `./chronicle.db` | Path to SQLite database file |
| `VAULT_PATH` | `./vault` | Path to the markdown vault directory |
| `GM_USERNAME` | `dungeonmaster` | Username reserved for the GM account |
| `REGISTRATION_OPEN` | `true` | Set to `false` to lock player self-registration |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | CORS origins — add your domain in production (comma-separated) |
| `NODE_ENV` | — | Set to `production` to reduce console noise |

---

## npm Scripts

Run these from `GameRunner/server/`:

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot-reload on file changes) |
| `npm start` | Start in production mode |
| `npm run seed` | Populate example data including demo accounts |
| `npm run migrate` | Run database migrations manually |

---

## Cloud Deployment

The server serves the client HTML itself — no separate web server required. You need somewhere to run Node.js 22 with a persistent filesystem for the database and vault.

### Option A — Railway (easiest, ~$5/mo)

1. Push the repo to GitHub
2. [railway.app](https://railway.app) → **New Project → Deploy from GitHub** → select this repo
3. Railway auto-detects Node.js
4. Set environment variables under **Variables**:
   ```
   JWT_SECRET=<generate with: openssl rand -hex 32>
   GM_USERNAME=dungeonmaster
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-app.up.railway.app
   ```
5. Add a **Volume** → mount path `/data`, then add:
   ```
   DB_PATH=/data/chronicle.db
   VAULT_PATH=/data/vault
   ```
6. Railway gives you a public URL immediately — open it and log in

### Option B — Render (free tier available)

1. Push to GitHub → [render.com](https://render.com) → **New → Web Service**
2. Connect the repo and set:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** `22`
3. Add environment variables (same as Railway above)
4. Add a **Persistent Disk** at `/data`, then set `DB_PATH=/data/chronicle.db` and `VAULT_PATH=/data/vault`

> **Note:** Render free tier sleeps after 15 min of inactivity — use a paid plan or Railway for always-on access.

### Option C — Fly.io (best for SQLite persistence)

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
cd GameRunner
fly launch        # detects Dockerfile; creates fly.toml
```

Edit the generated `fly.toml` to add a volume mount:
```toml
[mounts]
  source = "chronicle_data"
  destination = "/data"
```

Set secrets:
```bash
fly secrets set JWT_SECRET="$(openssl rand -hex 32)"
fly secrets set GM_USERNAME="dungeonmaster"
fly secrets set DB_PATH="/data/chronicle.db"
fly secrets set VAULT_PATH="/data/vault"
fly secrets set ALLOWED_ORIGINS="https://your-app.fly.dev"
```

```bash
fly volumes create chronicle_data --size 1
fly deploy
fly open
```

### Option D — VPS with Docker (full control)

SSH into your VPS, clone the repo, then:

```bash
# 1. Create env file
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
GM_USERNAME=dungeonmaster
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
DB_PATH=/data/chronicle.db
VAULT_PATH=/data/vault
EOF

# 2. Start
docker compose up -d

# 3. Verify
curl http://localhost:3000/api/health
```

**Nginx reverse proxy** (required for HTTPS + SSE):
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection '';
        # Required for SSE (real-time notifications):
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

**Caddy** (auto-HTTPS, config already included in repo):
Edit `Caddyfile` — replace `chronicle.local` with your domain, then:
```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d
```

---

## Project Structure

```
GameRunner/
├── client/
│   └── index.html          ← Entire frontend (single file, served by the server)
├── server/
│   ├── .env                ← Your local config (not committed)
│   ├── .env.example        ← Config template — copy this to .env
│   ├── chronicle.db        ← SQLite database (auto-created on first run)
│   ├── vault/              ← Markdown content files (auto-created)
│   ├── uploads/            ← User-uploaded images
│   └── src/
│       ├── index.js        ← Server entry point
│       ├── config.js       ← Environment variable definitions
│       ├── auth/           ← Login, register, JWT middleware
│       ├── db/             ← Database connection, migrations, seed data
│       ├── routes/         ← All API endpoints
│       ├── vault/          ← File watcher and vault sync
│       └── utils/          ← Shared helpers
├── Dockerfile
├── docker-compose.yml
└── Caddyfile
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'node:sqlite'` | Node.js < 22.5 — run `nvm install 22 && nvm use 22` |
| Port 3000 already in use | Change `PORT` in `server/.env` |
| Blank page at localhost:3000 | Confirm you ran `npm run dev` from `GameRunner/server/`, not the repo root |
| Login always fails | Check `JWT_SECRET` is set in `server/.env` and the server restarted after editing it |
| CORS errors in browser console | Add your domain to `ALLOWED_ORIGINS` in your env config |
| Real-time updates not working | Ensure your proxy has `proxy_buffering off` and `proxy_read_timeout 24h` — both required for SSE |
| Data lost between restarts (cloud) | `DB_PATH` and `VAULT_PATH` must point to a persistent volume, not the container filesystem |
| GM features not visible after promotion | Log out and back in — role is read from the JWT which needs to be reissued |
| `npm install` fails with permission errors | Run from `GameRunner/server/`, not the repo root — there is no root `package.json` |
