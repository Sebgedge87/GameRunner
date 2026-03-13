# Local Setup Guide

## Prerequisites

- **Node.js 22.5+** — required for the built-in SQLite module (`node:sqlite`)
  Check your version: `node --version`
  Install via [nodejs.org](https://nodejs.org) or [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`
- **npm** — bundled with Node.js

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd GameRunner

# Install server dependencies (package.json is at the repo root)
npm install
```

---

## 2. Configure environment

Copy the example env file into the server directory and edit it:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set:

```env
PORT=3000

# Change this to a long random string — used to sign JWTs
JWT_SECRET=change-me-to-something-long-and-random

# Path where Obsidian-style markdown files are stored (quests, npcs, locations, hooks)
VAULT_PATH=./vault

# Path to the SQLite database file
DB_PATH=./chronicle.db

# Username for the GM account created on first run
GM_USERNAME=dungeonmaster

# Set to false to prevent new player registrations after initial setup
# REGISTRATION_OPEN=false
```

> **Tip:** Generate a strong JWT secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 3. Run the server

### Development (auto-restarts on file changes)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server starts at **http://localhost:3000** (or whatever `PORT` you set).
Open that URL in your browser — the client portal is served automatically.

---

## 4. First login

On first run, migrations run automatically and a GM account is bootstrapped.

The default GM credentials are:

| Field | Value |
|---|---|
| Username | `dungeonmaster` (or your `GM_USERNAME`) |
| Password | `changeme` |

**Change the password immediately** via the GM Dashboard → Players table → Pwd button.

Players can self-register at the login screen (unless `REGISTRATION_OPEN=false`).

---

## 5. Vault directory (optional)

The Chronicle watches a local vault directory for Obsidian-style markdown files. Any `.md` files placed in the right subdirectory are automatically synced to the database.

Default layout when a campaign is active:

```
vault/
└── <campaign-slug>/
    ├── Quests/
    ├── NPCs/
    ├── Locations/
    ├── Hooks/
    └── GM-Only/     ← never synced to the DB or shown to players
```

Without an active campaign the flat layout (`vault/Quests/`, etc.) is used.

---

## 6. Useful npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot-reload) |
| `npm start` | Start in production mode |
| `npm run seed` | Seed example data into the database |
| `npm run migrate` | Run migrations manually |

---

## Docker (alternative)

If you prefer Docker:

```bash
# Copy and edit the env file
cp server/.env.example .env
# Set JWT_SECRET and GM_USERNAME in .env, then:

docker compose up -d
```

The app will be available at **http://localhost:3000**.

Data is persisted in the `chronicle-data` Docker volume.

To use the included Caddy reverse-proxy with TLS, edit `Caddyfile` to replace `chronicle.local` with your domain, then bring up the full stack including Caddy.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Error: Cannot find module 'node:sqlite'` | Node.js version is below 22.5 — upgrade it |
| Port already in use | Change `PORT` in `server/.env` |
| Blank page / API errors | Check the browser console; confirm the server is running at the expected port |
| GM account missing | Delete `chronicle.db` and restart — migrations will re-bootstrap it |
