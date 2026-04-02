# The Chronicle — Product Reference

> Technical reference for developers and contributors. Describes what the
> application does, how it is structured, and why key decisions were made.
> For visual and component specifications see `docs/design-system.md`.

---

## Contents

1. [App overview](#1-app-overview)
2. [Navigation structure](#2-navigation-structure)
3. GM features *(coming)*
4. Player features *(coming)*
5. Entity reference *(coming)*
6. Data flow *(coming)*
7. Key design decisions *(coming)*

---

## 1. App overview

### 1.1 What The Chronicle is

The Chronicle is a TTRPG (tabletop role-playing game) campaign management web application. It gives Game Masters a single workspace to build and run a campaign — tracking NPCs, locations, factions, quests, sessions, handouts, and world lore — while giving players a shared view of the information the GM chooses to reveal.

It is built as a Vue 3 single-page application backed by a Node.js/Express API with a SQLite database. All state is server-persisted; the client holds a runtime copy in Pinia stores. The app is self-hosted — there is no SaaS layer.

### 1.2 Who uses it

**Game Masters (GMs)** own and run campaigns. They have access to all pages and all data, including GM-only sections hidden from players. A GM creates the campaign, invites players via an invite code, and controls what information is shared. One GM per campaign is the standard model, though the server supports per-campaign GM role grants.

**Players** join a campaign via invite code. They see the player-facing pages (quests, characters, notes, theory board, handouts, bestiary, locations, inventory, rumours, calendar, timeline, maps, sessions) but cannot see GM-only fields, private notes, or the GM Dashboard. They cannot access Combat Tracker or GM Edit modals.

A user can be a GM in one campaign and a player in another. Role is per-campaign, not per-user globally (though a global `role='gm'` flag on the user record bypasses per-campaign checks for server admin purposes).

### 1.3 What problem it solves

Running a TTRPG campaign generates a large, interconnected body of information: dozens of NPCs with motivations and secrets, locations with histories, faction relationships, quest chains, session notes, player handouts, rumours of varying truth, and a world calendar. This information lives in a GM's head, on paper, or scattered across notes apps — none of which allow the GM to share selective information with players in real time.

The Chronicle centralises that information, enforces the GM/player visibility split, and gives players a living document of their campaign world that the GM populates and curates as play progresses.

### 1.4 Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 (`<script setup>`), Vite, Vue Router, Pinia |
| Styling | Plain CSS with custom properties (no CSS framework) |
| Backend | Node.js, Express |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (stored in localStorage), per-route navigation guards |
| Real-time | Server-Sent Events (SSE) for timer broadcasts |
| File upload | Multipart form upload to local `/api/uploads` endpoint |

---

## 2. Navigation structure

### 2.1 Route guard logic

Three meta flags control route access:

| Flag | Meaning | Redirect on fail |
|------|---------|-----------------|
| `auth: true` | User must be logged in (JWT present) | `/login` |
| `requiresCampaign: true` | An active campaign must be selected | `/home` |
| `gm: true` | Active campaign role must be GM | `/home` |

Guards are evaluated in order: auth → campaign → GM. The GM Dashboard and Combat Tracker are the only routes with `gm: true`. All campaign pages require both `auth` and `requiresCampaign`. Home and Settings require only `auth`.

The router also uses the native View Transitions API (where available and `prefers-reduced-motion` is not set) to animate page changes as physical turns.

### 2.2 Route table

| Path | View | Auth | Campaign | GM only | Purpose |
|------|------|------|----------|---------|---------|
| `/` | — | — | — | — | Redirects to `/home` |
| `/home` | `HomeView` | ✓ | — | — | Campaign selection, join, create |
| `/dashboard` | `DashboardView` | ✓ | ✓ | — | Player-facing campaign overview |
| `/quests` | `QuestsView` | ✓ | ✓ | — | Quest log — active, completed, missed |
| `/jobs` | `JobsView` | ✓ | ✓ | — | Side jobs / one-shot contracts |
| `/npcs` | `NpcsView` | ✓ | ✓ | — | NPC roster with GM-private fields |
| `/locations` | `LocationsView` | ✓ | ✓ | — | Location index with GM notes |
| `/hooks` | `HooksView` | ✓ | ✓ | — | Plot hooks for the GM to manage |
| `/factions` | `FactionsView` | ✓ | ✓ | — | Factions with disposition slider |
| `/timeline` | `TimelineView` | ✓ | ✓ | — | Chronological event timeline |
| `/calendar` | `CalendarView` | ✓ | ✓ | — | In-world calendar with events |
| `/maps` | `MapsView` | ✓ | ✓ | — | Campaign maps with party location pin |
| `/mindmap` | `MindmapView` | ✓ | ✓ | — | Freeform relationship mindmap |
| `/handouts` | `HandoutsView` | ✓ | ✓ | — | GM-to-player document handouts |
| `/inventory` | `InventoryView` | ✓ | ✓ | — | Party inventory and key items |
| `/bestiary` | `BestiaryView` | ✓ | ✓ | — | Creature roster; GM can reveal entries |
| `/rumours` | `RumoursView` | ✓ | ✓ | — | Rumour mill — true, false, exposed |
| `/sessions` | `SessionsView` | ✓ | ✓ | — | Session log and recaps |
| `/characters` | `CharactersView` | ✓ | ✓ | — | Party character sheet overview |
| `/character-sheet` | `CharacterSheetView` | ✓ | ✓ | — | Individual character sheet |
| `/notes` | `NotesView` | ✓ | ✓ | — | Player personal notes |
| `/theory-board` | `TheoryBoardView` | ✓ | ✓ | — | Player speculation / evidence board |
| `/gm-dashboard` | `GmDashboardView` | ✓ | ✓ | ✓ | GM campaign management hub |
| `/combat` | `CombatView` | ✓ | ✓ | ✓ | Initiative and combat tracker |
| `/good-boy-cards` | `GoodBoyCardsView` | ✓ | ✓ | — | Player reward / inspiration cards |
| `/settings` | `SettingsView` | ✓ | — | — | User preferences and custom theme |
| `/dev-admin` | `DeveloperConfigView` | — | — | — | Developer-only admin panel; not linked in any nav |

### 2.3 Access patterns by role

**Not logged in:** Only `/login` and `/dev-admin` are reachable. All other routes redirect to `/login`.

**Logged in, no active campaign:** Only `/home` and `/settings` are reachable. All `requiresCampaign` routes redirect to `/home`.

**Logged in, player in active campaign:** All routes except `/gm-dashboard` and `/combat` are accessible. GM-only fields within pages are hidden at the component level, not the route level — the route is reachable but private fields are not rendered.

**Logged in, GM in active campaign:** All routes are accessible.

### 2.4 The home screen

`HomeView` is the campaign hub. A logged-in user without an active campaign lands here and can:

- View all campaigns they are a member of (as tiles)
- Switch to a different campaign (triggers the `/api/campaigns/:id/activate` endpoint)
- Create a new campaign (opens a multi-step wizard)
- Join an existing campaign via invite code

Selecting a campaign sets `activeCampaign` in the Pinia store, applies the campaign's theme class to `<html>`, and unlocks all `requiresCampaign` routes.
