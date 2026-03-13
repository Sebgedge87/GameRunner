# Setup Guide

## Prerequisites

- **Node.js 22.5+** — required for the built-in SQLite module (`node:sqlite`)
  ```bash
  node --version   # must be v22.5.0 or higher
  ```
  Install via [nodejs.org](https://nodejs.org) or nvm:
  ```bash
  nvm install 22 && nvm use 22
  ```
- **npm** — bundled with Node.js

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd GameRunner
npm install          # installs from package.json at the repo root
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-string
VAULT_PATH=./vault
DB_PATH=./chronicle.db
GM_USERNAME=dungeonmaster

# Uncomment to lock registration after first run:
# REGISTRATION_OPEN=false
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start the server

```bash
npm run dev    # development — auto-restarts on file changes
# or
npm start      # production
```

Open **http://localhost:3000** — the app is served directly from the same process, no separate web server needed.

### 4. First login

| Field | Value |
|---|---|
| Username | `dungeonmaster` (or your `GM_USERNAME`) |
| Password | `changeme` |

Change the password immediately: **GM Dashboard → Players → Pwd**.

Players can self-register unless `REGISTRATION_OPEN=false` is set.

---

## Cloud Deployment

The server serves the client HTML itself — no separate web server required. You just need somewhere to run Node.js 22 with a persistent filesystem.

### Option A — Railway (easiest, ~$5/mo)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Select this repo; Railway auto-detects Node.js
4. Add environment variables under **Variables**:
   ```
   PORT=3000
   JWT_SECRET=<strong random string>
   GM_USERNAME=dungeonmaster
   NODE_ENV=production
   ```
5. Add a **Volume** (for persistent DB + vault):
   - Mount path: `/data`
   - Then set `DB_PATH=/data/chronicle.db` and `VAULT_PATH=/data/vault`
6. Railway gives you a public URL like `https://your-app.up.railway.app` — open it and log in.

### Option B — Render (free tier available)

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect the repo; set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Node version:** 22
4. Add environment variables (same as Railway above)
5. Add a **Persistent Disk** at `/data`, then set `DB_PATH=/data/chronicle.db` and `VAULT_PATH=/data/vault`
6. Deploy — your public URL is shown in the dashboard.

> ⚠️ Render free tier **sleeps after 15 min of inactivity** — use a paid plan or Railway for always-on access.

### Option C — Fly.io

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch        # auto-detects from Dockerfile; creates fly.toml
```

Edit the generated `fly.toml` to add a volume mount:
```toml
[mounts]
  source = "chronicle_data"
  destination = "/data"
```

Set secrets:
```bash
fly secrets set JWT_SECRET="<strong random string>"
fly secrets set GM_USERNAME="dungeonmaster"
fly secrets set DB_PATH="/data/chronicle.db"
fly secrets set VAULT_PATH="/data/vault"
```

```bash
fly deploy
fly open    # opens browser to your app
```

### Option D — VPS with Docker (full control)

SSH into your VPS, clone the repo, then:

```bash
# 1. Create a .env file
cat > .env <<EOF
JWT_SECRET=$(openssl rand -hex 32)
GM_USERNAME=dungeonmaster
ALLOWED_ORIGINS=https://yourdomain.com
EOF

# 2. Start
docker compose up -d

# 3. Test it
curl http://localhost:3000/api/health
```

The app runs on port 3000. Put Nginx or Caddy in front for HTTPS:

**Nginx (simplest):**
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Required for SSE (real-time updates):
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

**Caddy (auto-HTTPS, included in repo):**
Edit `Caddyfile` — replace `chronicle.local` with your domain, then:
```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d
```

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | *(required)* | Secret for signing JWTs — use a 32+ char random string |
| `DB_PATH` | `./chronicle.db` | Path to SQLite database file |
| `VAULT_PATH` | `./vault` | Path to Obsidian-style markdown vault |
| `GM_USERNAME` | `dungeonmaster` | Username of the GM account created on first run |
| `REGISTRATION_OPEN` | `true` | Set to `false` to prevent new player registrations |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated for production) |
| `NODE_ENV` | — | Set to `production` to silence dev logging |

---

## Vault Directory

The server watches for Obsidian-style markdown files and syncs them automatically.

```
vault/
└── <campaign-slug>/
    ├── Quests/       ← .md files with YAML frontmatter
    ├── NPCs/
    ├── Locations/
    ├── Hooks/
    └── GM-Only/      ← NEVER synced or shown to players
```

---

## Useful npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm start` | Start in production mode |
| `npm run seed` | Seed example data |
| `npm run migrate` | Run migrations manually |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module 'node:sqlite'` | Node.js < 22.5 — run `nvm install 22 && nvm use 22` |
| Port 3000 already in use | Change `PORT` in `server/.env` |
| App loads but API calls fail | Check browser console — if you see CORS errors, set `ALLOWED_ORIGINS` to your domain |
| SSE / real-time updates not working | Ensure your proxy is configured with `proxy_buffering off` and a long `proxy_read_timeout` |
| GM account missing after restart | `DB_PATH` is pointing to a non-persistent location — use a volume mount |
| Blank page | Check browser console for JS errors; confirm server is running (`curl http://localhost:3000/api/health`) |
