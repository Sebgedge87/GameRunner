# The Chronicle — Product Reference

> Technical reference for developers and contributors. Describes what the
> application does, how it is structured, and why key decisions were made.
> For visual and component specifications see `docs/design-system.md`.

---

## Contents

1. [App overview](#1-app-overview)
2. [Navigation structure](#2-navigation-structure)
3. [GM features](#3-gm-features)
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

---

## 3. GM features

### 3.1 GM Dashboard (`GmDashboardView.vue`)

The GM Dashboard (`/gm-dashboard`) is the GM's primary command centre. It is split into three tabs: **Overview**, **Settings**, and **Stats**. Only users with the GM role on the active campaign can reach this route.

#### 3.1.1 Overview tab

The Overview tab is the default landing state. It contains five sections laid out in a two-column grid.

**Players table** — a full-width table listing every non-GM campaign member. Columns vary by game system:

| Column | Shown when |
|--------|-----------|
| Character name / username | Always |
| Level stepper (−/+) | System uses milestone levelling (`usesMilestone`) |
| XP total | System uses XP (`usesXP`) |
| Stress | System has stress (`hasStress`) — Alien RPG, Coriolis |
| Sanity | System has sanity (`hasSanity`) — Call of Cthulhu, Achtung! Cthulhu |
| Last seen | Always |
| Message / Reset password / Delete buttons | Always |

The GM can edit stress and sanity values inline in the table and save them per player. The message button pre-populates the compose flyout with that player's details. Reset password and Delete user are dangerous actions: delete requires a confirm dialog.

**Award XP panel** (XP systems only) — form with amount, optional reason, and a player checkbox list (with a "select all" toggle). Submits to `POST /api/xp`. Shows a status message inline.

**Milestone levelling panel** (milestone systems only) — shows a description of how to adjust levels per player using the stepper buttons in the table, plus a "Level Up All Players" button that increments every player who is not yet at the system maximum level.

**Average party sanity widget** (Call of Cthulhu only) — a number input (0–100) plus a "Set" button. Persists to `avg_sanity` on the campaign record and calls `applyTheme()` to update the CSS filter class (`dynamic-sanity-0` through `dynamic-sanity-4`) in real time, shifting the UI's colour saturation to reflect the party's collective mental state.

**Active Quests** — card grid of quests with `status = 'active'`. Uses the `QuestCard` component. Tapping a card expands it.

**Session Agenda** — list of agenda cards from `GET /api/agenda`. Each card shows its title and body. An "+ Add Agenda Item" button opens the GM edit modal with `type = 'agenda'`.

**Unread Messages** — list of messages where the recipient has not yet read them (from `GET /api/messages?unread=true`). Displays sender, subject, body preview, and timestamp.

**Quick Actions** — a row of shortcut buttons that open the GM edit modal for common entity types: Quest, NPC, Location, Hook, Handout, Session. Also links to the Combat Tracker and a "Backup" button that triggers a full campaign JSON export (`GET /api/backup`).

#### 3.1.2 Settings tab

The Settings tab is a campaign configuration form. Fields:

| Field | Notes |
|-------|-------|
| Name | Campaign display name |
| System | Dropdown selecting the game system (7 options — see §3.1.4) |
| Great House | Visible only when system = `dune`; selects the Dune house sub-theme |
| Setting / Plane | Visible only when system = `dnd5e`; selects a D&D setting sub-theme (Ravenloft, Spelljammer, Eberron) |
| Subtitle | Optional campaign tagline |
| Playlist URL | Spotify or YouTube URL displayed on the player dashboard |
| Description | Multi-line plain textarea |
| Background image | Dropzone upload or paste-a-URL; sets the campaign background |
| Invite code | Editable code (max 12 chars, auto-uppercased); "Regenerate" randomises it; "Copy" writes it to clipboard |

The Great House and Setting dropdowns call `previewHouse()` / `previewSetting()` on change — these immediately write the new value to `activeCampaign` in the store and call `applyTheme()` so the GM sees a live preview of the theme change. If the GM switches away from the Settings tab without saving, these previews are reverted to the last-persisted values by a `watch(activeTab)` hook.

Saving calls `PUT /api/campaigns/:id` with the full form payload, then calls `loadCampaigns()` and `applyBgImage()` to refresh the store and background.

#### 3.1.3 Stats tab

The Stats tab aggregates campaign-wide metrics. It loads on demand from `GET /api/campaigns/:id/stats`.

**Stat strip** — a row of pill widgets showing: Sessions, Players, Quests, Active Quests, Handouts, Messages, Total XP Awarded.

**Player Progression grid** — one card per non-GM user showing: character name (username as sub-label), total XP, current level, an XP progress bar to the next level threshold (using the D&D 5e XP threshold table), and a "last seen" relative timestamp.

**Recent Activity audit log** — a chronological list of audit log entries from `GET /api/users/audit`. Each row shows: username, action description, optional detail, and formatted timestamp.

#### 3.1.4 Supported game systems

The campaign system field controls which theme, which columns, and which widgets appear throughout the app. `useSystemFeatures()` is a composable that derives per-system flags from `activeCampaign.system`.

| System key | Display name | Theme | XP/Milestone | Stress | Sanity |
|-----------|-------------|-------|-------------|--------|--------|
| `dnd5e` | D&D 5e | `theme-dnd5e` | XP (default) or milestone | — | — |
| `coc` | Call of Cthulhu | `theme-cthulhu` | — | — | ✓ |
| `alien` | Alien RPG | `theme-alien` | — | ✓ | — |
| `coriolis` | Coriolis | `theme-coriolis` | — | ✓ | — |
| `dune` | Dune | `theme-dune` | — | — | — |
| `achtung` | Achtung! Cthulhu | `theme-achtung` | — | ✓ | ✓ |
| `custom` | Custom | `theme-custom` | — | — | — |

---

### 3.2 GM edit modal (`GmEditModal.vue`)

`GmEditModal` is the single create/edit form component used everywhere in the GM-facing interface. It is rendered in `AppLayout.vue` and controlled by `ui.gmEditModal` state in the UI store (`client/src/stores/ui.js`).

Any component can open it by calling:

```js
ui.openGmEdit(type, id, data)
// type  — entity type key (string)
// id    — entity id for edits, null for creates
// data  — pre-populated form values object
```

#### 3.2.1 Supported entity types

| Type key | Entity | API endpoint | Width |
|----------|--------|-------------|-------|
| `quest` | Quest | `/api/quests` | 720px |
| `npc` | NPC | `/api/npcs` | 720px |
| `location` | Location | `/api/locations` | 720px |
| `hook` | Plot hook | `/api/hooks` | 720px |
| `handout` | Handout | `/api/handouts` | 720px |
| `faction` | Faction | `/api/factions` | 720px |
| `map` | Map | `/api/maps` | 720px |
| `bestiary` | Bestiary entry | `/api/bestiary` | 720px |
| `rumour` | Rumour | `/api/rumours` | 720px |
| `inventory` | Inventory item | `/api/inventory` | 720px |
| `key-item` | Key item | `/api/key-items` | 720px |
| `session` | Session | `/api/sessions` | 520px |
| `job` | Side job | `/api/jobs` | 520px |
| `timeline` | Timeline event | `/api/timeline` | 520px |
| `agenda` | Agenda card | `/api/agenda` | 520px |
| `poll` | Session poll | `/api/sessions/polls` | 520px |
| `schedule` | Scheduling event | `/api/sessions/scheduling` | 520px |
| `message` | GM→player message | `/api/messages` | 520px |

Types flagged as "migrated" (`quest`, `npc`, `location`, `faction`, `map`, `bestiary`, `handout`, `hook`, `rumour`, `inventory`, `key-item`) render inside the `EntityForm` two-column layout component and suppress the default modal title bar (the form's own header provides the title). All other types use a simpler single-column layout with the standard `modal-title` bar.

#### 3.2.2 Create vs edit flow

The modal uses `isEdit = !!ui.gmEditModal?.id` to determine mode. On open, a `watch(ui.gmEditModal)` resets all form fields, then prefills from `modal.data` if provided. The submit handler POSTs (create) or PUTs (edit) to the entity's API endpoint, calls the appropriate `TYPE_RELOAD` function to refresh the Pinia data store, shows a success toast, and closes the modal.

#### 3.2.3 File upload within the modal

Entity types that accept images (NPCs, locations, maps, handouts, bestiary entries, quests, factions, key items) use the `Dropzone` component in the `sidebar-image` slot of `EntityForm`. On file selection, the file is uploaded to `POST /api/uploads` immediately; the returned URL is stored in the form field. A thumbnail preview with a remove button is shown until the form is submitted or cancelled.

#### 3.2.4 Linked entity selectors

Several forms include relationship fields that use `SearchSelect` — a typeahead component backed by the existing Pinia store data (no extra API call). Examples: Quest → connected NPCs, locations, factions, parent quest; NPC → faction memberships; Faction → leader NPC, HQ location, member list. These multi-select fields serialise to/from comma-delimited ID strings for storage.

