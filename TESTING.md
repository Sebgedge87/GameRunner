# Testing Guide

This document explains how to run the test suite for The Chronicle locally.

---

## Prerequisites

- **Node.js ≥ 22.5.0** — required for the built-in SQLite module (`node:sqlite`)
- Check your version: `node --version`

---

## API Tests (Jest + Supertest)

These tests run entirely in-process. No running server or vault is needed — each test file creates its own isolated in-memory database and temporary directory, then cleans up after itself.

### Setup

```bash
cd server
npm install
```

### Run All API Tests

```bash
npm test
```

### Run a Single Test File

```bash
npx jest tests/auth.test.js
```

### Run Tests Matching a Name

```bash
npx jest --testNamePattern="should create a quest"
```

### Watch Mode (re-runs on file save)

```bash
npx jest --watch
```

### Coverage Report

```bash
npx jest --coverage
```

---

## E2E Tests (Playwright + Chromium)

These tests launch a real browser and start the server automatically on port 3000. An isolated database is created at `/tmp/chronicle-e2e.db` — it will not touch any real data.

### Setup (from repo root)

```bash
# Install root-level dependencies
npm install

# Install Playwright's Chromium browser (one-time download, ~150 MB)
npx playwright install chromium
```

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run a Single Spec File

```bash
npx playwright test tests/e2e/auth.spec.js
```

### Run Tests Matching a Name

```bash
npx playwright test --grep "GM can create a campaign"
```

### Run with a Visible Browser Window

```bash
npx playwright test --headed
```

### Open the HTML Report (after a run)

```bash
npm run test:e2e:report
# or directly:
npx playwright show-report
```

### Debug Mode (pauses on each step)

```bash
npx playwright test --debug
```

---

## Test File Locations

| Suite | Location | What it covers |
|---|---|---|
| Auth | `server/tests/auth.test.js` | Registration, login, JWT validation |
| Campaigns | `server/tests/campaigns.test.js` | Create, join, activate, manage members |
| Quests | `server/tests/quests.test.js` | CRUD, status changes, vault writes |
| NPCs | `server/tests/npcs.test.js` | CRUD, visibility, faction linking |
| Locations | `server/tests/locations.test.js` | CRUD, visibility |
| Sessions | `server/tests/sessions.test.js` | Recaps, notes, polls, scheduling |
| Messages | `server/tests/messages.test.js` | Send, read, delete, secret flag |
| Notes | `server/tests/notes.test.js` | CRUD, privacy, vault sync |
| Combat | `server/tests/combat.test.js` | Encounters, combatants, rounds |
| Inventory | `server/tests/inventory.test.js` | CRUD, hidden toggle |
| Character Sheets | `server/tests/character-sheets.test.js` | Upsert, system-specific data |
| Theory Board | `server/tests/theory.test.js` | Nodes, edges, sharing |
| E2E — Auth | `tests/e2e/auth.spec.js` | Login page, registration flow |
| E2E — Campaigns | `tests/e2e/campaign.spec.js` | GM creates & activates campaign |
| E2E — Content | `tests/e2e/gm-content.spec.js` | Quests, polls, messages, theory |

---

## Environment Variables

The server reads from a `.env` file in the `server/` directory. For testing, sensible defaults are used automatically. To customise:

```bash
cp server/.env.example server/.env
# edit as needed
```

Key variables relevant to testing:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | auto-generated | JWT signing secret |
| `DB_PATH` | `./chronicle.db` | SQLite database path |
| `VAULT_PATH` | `./vault` | Obsidian vault directory |
| `REGISTRATION_OPEN` | `false` | Allow new player registrations |

---

## Quick Reference

| Command | What it does |
|---|---|
| `cd server && npm test` | Run all 62+ API tests |
| `npm run test:e2e` | Run all E2E browser tests |
| `npx playwright test --headed` | E2E with visible browser |
| `npx jest --coverage` | API tests with coverage report |
| `npx playwright show-report` | Open last E2E HTML report |
