# The Chronicle — Product Reference

> Technical reference for developers and contributors. Describes what the
> application does, how it is structured, and why key decisions were made.
> For visual and component specifications see `docs/design-system.md`.

---

## Contents

1. [App overview](#1-app-overview)
2. [Navigation structure](#2-navigation-structure)
3. [GM features](#3-gm-features)
4. [World-building views](#4-world-building-views)
5. [Campaign tools](#5-campaign-tools)
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

---

## 4. World-building views

World-building views are the shared reference layer of the campaign — the places, people, factions, quests, and lore that both the GM and players can browse. All views follow the same structural pattern: a page header with a title and (GM-only) "+ Add" button, a text search bar, optional `FilterTabs` to narrow by status/type, a loading skeleton, an `EmptyState` for a fresh campaign, and the main card grid.

Visibility rules apply across all entity types: records marked `hidden = true` are invisible to players and shown at reduced opacity (0.5) to the GM as a reminder that they are unpublished.

### 4.1 NPCs (`NpcsView.vue`)

Route: `/npcs`

Displays campaign NPCs as a portrait grid (`npc-grid`, `minmax(200px, 1fr)` columns). Each NPC card shows:

- A 160 px portrait image (or a placeholder silhouette emoji if no image is set), with a subtle zoom-on-hover transform
- Name (Cinzel font), role tag, race tag, disposition tag (colour-coded: `tag-active` for friendly/allied, `tag-inactive` for hostile)
- Faction affiliation and current location as metadata lines

Clicking a card **expands** it in-place to reveal a truncated description (4-line clamp) and an action row. Available actions:

| Action | Visible to |
|--------|-----------|
| Pin | All |
| Reveal / Hide | GM only — calls `PUT /api/npcs/:id/reveal` |
| Share | GM only — opens share modal |
| Edit | GM only — opens `GmEditModal` prefilled |
| Delete | GM only — requires `ConfirmDialog` |

Filter tabs: All · Friendly · Neutral · Hostile (filters on `npc.disposition`).

Search fields: name, role, faction, location.

### 4.2 Locations (`LocationsView.vue`)

Route: `/locations`

Locations has two top-level tabs: **Locations** (the default entity list) and **Notice Board** (a jobs board scoped to a specific location).

#### Locations tab

Card grid using the `EntityCard` component. Each card shows location type, danger level (as a warning tag), and a "Party here" badge if the GM has pinned the party to that location. Actions in the expanded card:

| Action | Description |
|--------|-------------|
| Set as party location | Calls `campaign.setPartyLocation(id)` — persists the party's current location to the campaign store; button turns accent-coloured when active |
| Notice Board | Switches to the Notice Board tab pre-filtered to this location |
| Standard entity actions | Pin, Share (GM), Edit (GM), Delete (GM) via `EntityCard` |

The GM can also clear the party location from the page header subtitle (which shows "Party at: \<name\>" when set).

Filter tabs: All · City/Town · Dungeon · Wilderness (filters on `location_type`).

#### Notice Board tab

A jobs board that shows all `job` entities, optionally filtered by a location dropdown. Jobs are displayed as styled cards with a coloured left-border keyed to difficulty:

- Easy — green
- Medium — default border
- Hard — blue
- Deadly — red

Each job card shows: title, difficulty tag, description preview, reward, posted-by name, and status tag. Players see an **Accept** button on open jobs (calls `PUT /api/jobs/:id/accept`). GMs can post new jobs via an "+ Post Job" tile that opens `GmEditModal` with `type = 'job'` pre-seeded with the current board location.

### 4.3 Factions (`FactionsView.vue`)

Route: `/factions`

Card grid using `OverlayCard`. Each faction card shows:

- Description and goals (truncated)
- A **reputation bar** — a 6-point scale from −3 (Hostile) to +3 (Allied), rendered as a progress bar whose fill colour transitions from red through muted to green/accent

Reputation labels: Hostile (≤ −3) · Unfriendly (−2/−1) · Neutral (0) · Friendly (1/2) · Allied (≥ 3).

Actions: Pin · Share (GM) · Edit (GM) · Delete (GM). No filter tabs — search only (name, description, goals).

### 4.4 Quests (`QuestsView.vue`)

Route: `/quests`

Card grid using the `QuestCard` component (also used in the GM Dashboard overview). Filter tabs: All · Active · Completed · Failed.

Search fields: title, quest type, description.

`QuestCard` handles its own expand/collapse, status badge rendering, urgency styling, reward display, and (GM-only) edit/delete actions — the view itself is intentionally thin, delegating all card presentation to the component.

### 4.5 Timeline (`TimelineView.vue`)

Route: `/timeline`

The Timeline is the only view with a custom horizontal layout rather than a card grid. Events are plotted on a centre horizontal rule with cards alternating above and below (even-indexed events above the line, odd-indexed events below), connected by short vertical stems to dot markers.

Dot size and colour reflect significance:

| Significance | Visual |
|-------------|--------|
| `minor` | Small plain dot |
| `major` | Larger accent-coloured dot |
| `world-changing` | Large dot with animated pulse ring |

Each card is clickable and opens the `DetailModal` with the full event record.

**Call of Cthulhu era support**: when the active campaign system is `coc`, the page title shows an era badge (e.g. "🐙 1920s Era") and a date format hint beneath it. Era data comes from the `COC_ERAS` constant exported by `useSystemFeatures`.

Filter tabs: All Sessions · Session 1 · Session 2 · … (dynamically generated from the `session_number` values in the timeline data).

Search: event title and description.

### 4.6 Maps (`MapsView.vue`)

Route: `/maps`

Card grid using `EntityCard`. Each map card shows map type (world/region/city/battle) and an image thumbnail. The `EntityCard` expand row includes a **Fullscreen** button (only shown when the map has an image) that opens a custom overlay: the image is displayed at up to 95 vw × 90 vh with `object-fit: contain`. The overlay can be dismissed by clicking outside it or pressing Escape.

### 4.7 Bestiary (`BestiaryView.vue`)

Route: `/bestiary`

Card grid using `OverlayCard`. Each creature card can display:

- Portrait image (full card width, 180 px max height)
- Stat tags: CR, AC, HP (from a JSON `stats` column)
- Description

Creatures have a Reveal/Hide toggle (GM only), same as NPCs, via `PUT /api/bestiary/:id/reveal`. Revealed status is shown as an `active` status badge on the card.

### 4.8 Plot Hooks (`HooksView.vue`)

Route: `/hooks`

Card grid using `OverlayCard`. Plot hooks are GM planning tools — breadcrumbs and leads that the GM tracks but may not reveal directly to players.

Each card shows: hook type, description, session it was delivered, linked entities.

Filter tabs: All · Active · Delivered · Missed · Expired.

Status badge mapping:
- `active` → green
- `delivered` → done (accent)
- `missed` / `expired` → red

Actions: Pin · Share (GM) · Edit (GM) · Delete (GM).

---

### 4.9 Common patterns across world-building views

All eight views share the same structural skeleton and conventions:

**Loading state** — shown while `data.loading` is true and the store collection is empty. Renders 4–6 skeleton cards matching the real card proportions.

**Empty state** — shown when the store collection has zero items. Uses the `EmptyState` component with an icon, heading, description, and (GM-only) CTA button that calls `openGmEdit`.

**Lazy loading** — each view calls its `data.load*()` method in `onMounted` only if the store collection is already empty (`if (!data.npcs.length) data.loadNpcs()`). If the user navigated away and back, the data is already in the store and no request is made.

**Markdown stripping** — description fields are passed through `stripMd()` from `@/utils/markdown` before display in card previews to avoid rendering raw Markdown syntax in truncated text.

**Pinning** — all entity types support `data.addPin(type, id, name)` which adds a pinned shortcut to the sidebar.

**GM-only controls** — edit, delete, share, and reveal actions are conditionally rendered with `v-if="campaign.isGm"`. Players see only the browsing surface.

---

## 5. Campaign tools

Campaign tools are the operational layer — the views used during and between sessions to run the game, track resources, and communicate. Unlike world-building views (which the GM primarily authors), several campaign tools are interactive for all players.

### 5.1 Sessions (`SessionsView.vue`)

Route: `/sessions`

The Sessions view is a campaign chronicle combined with a scheduling hub. It has three sections on a single scrollable page.

#### Session list

Sessions are sorted newest-first (descending `number`). The latest session is auto-expanded on mount. Each session card expands/collapses on click and shows:

- **Session number** and optional **title** in the header; formatted play date on the right
- **Summary** — rendered as full Markdown (using `renderMd()`, not stripped). Displayed in italic body text with the `.prose` class
- **Player notes** — a list of notes posted by players (and the GM). Each note shows the author's character name and rendered body. A player can edit or delete their own notes; the GM can edit/delete any note. Inline edit uses a textarea that replaces the note in place
- **Add Note** — available to all users; posts to `POST /api/sessions/:id/notes`

GM action bar (visible when expanded): Edit (opens `GmEditModal`) · Delete (with `ui.confirm()`).

#### Polls section

Below the session list. The GM can create a poll via `GmEditModal` (`type = 'poll'`). Poll cards show the question and option list; each option is clickable to vote (`POST /api/sessions/polls/:id/vote`). Vote counts are shown when `results_public` is true or when the viewer is the GM. GM controls: Reveal Results · Close Poll · Delete.

#### Scheduling section

The GM can propose session dates (`type = 'schedule'`). Each scheduling item shows the proposed date/time and a response matrix (per-player yes/maybe/no). All users can respond with yes/maybe/no buttons (`POST /api/sessions/scheduling/:id/respond`). The GM can mark a date as confirmed (`PUT /api/sessions/scheduling/:id/confirm`).

---

### 5.2 Handouts (`HandoutsView.vue`)

Route: `/handouts`

Card grid using `OverlayCard`. Handouts are documents, images, or artefacts the GM shares with players. Each card can show a full-width image preview (180 px max height), a session delivery number, and a description.

Filter tabs: All · Text · Image · Map · Letter (filters on `handout.type`).

Actions: Pin · Share (GM) · Edit (GM) · Delete (GM).

Players see all non-hidden handouts and can pin them. There is no player-specific reveal flow for handouts — visibility is controlled by the `hidden` flag on the record.

---

### 5.3 Notes (`NotesView.vue`)

Route: `/notes`

Notes is the only view with a **two-panel side-by-side layout** (`notes-layout`). The left column is a searchable list; the right column is a compose/edit panel.

**Note list** — each card shows: title, privacy tag (`private` = red, `public` = green), category tag, shared-with-GM indicator, a 120-character stripped body preview, last-updated date, and a Delete button. Clicking a card loads it into the right panel.

**Compose/edit panel** — fields:

| Field | Values |
|-------|--------|
| Title | Free text |
| Body | `MarkdownEditor` component |
| Category | Notes · Clues · Plans · Lore |
| Privacy | Private · Public |
| Share with GM | Checkbox |

Notes are **per-user** — each player only sees their own notes regardless of privacy setting. The `privacy` field controls whether the note is visible to other players (public) or only the author (private). The "Share with GM" checkbox separately flags the note for GM visibility.

Filter tabs: All · Notes · Clues · Plans · Lore.

---

### 5.4 Inventory (`InventoryView.vue`)

Route: `/inventory`

The Inventory view has two distinct sections on one page: **Party Inventory** and **Key Items**.

#### Party inventory

Standard item tracking (weapons, armour, gear, consumables). Card grid using `EntityCard`. Each card shows:

- Item type and rarity tags (rarity is colour-coded: uncommon = green, rare/very rare = blue, legendary = accent, artifact = red)
- Holder tag — shows the player's name when an item is held by a specific player rather than the party
- Quantity, weight, description

**Transfer modal** — any player who owns an item (or the GM for any item) can click "Give ↗" to open a modal with a player selector. Submits to `PUT /api/inventory/:id/transfer`. On success the new owner's name is shown in the toast.

Filter tabs: All · Weapon · Armour · Gear · Consumable.

#### Key items

A separate grid below the party inventory for plot-critical objects (artefacts, quest MacGuffins, unique relics). Uses `EntityCard` with `type = 'key-item'`. Shows linked entities. No filter tabs; search only. No transfer mechanism — key items are not player-holdable.

---

### 5.5 Jobs / Job Board (`JobsView.vue`)

Route: `/jobs`

A standalone card grid view of all campaign jobs (contracts, bounties, escort missions). Mirrors the Notice Board sub-tab of `LocationsView` but without the location filter — it shows all jobs across all locations.

Filter tabs: All · Open · Active · Completed.

Each expanded card shows: description, reward, source location, employer, linked entities, and status tag. Two action-slot buttons:

- **Accept** — visible to players on open jobs; calls `PUT /api/jobs/:id/accept`
- **→ Quest** — visible to GMs on jobs without an associated quest; calls `PUT /api/jobs/:id` with `{ status: 'taken', promoted_quest_id: -1 }` then reloads both jobs and quests. This workflow promotes a job to a tracked quest in one click.

The GM can also post new jobs from the "+ Add Job" tile at the start of the grid.

---

### 5.6 Rumours (`RumoursView.vue`)

Route: `/rumours`

Card grid using `OverlayCard`. Rumours are whispers the GM plants — some true, some false. Players see all non-hidden rumours but cannot tell which are true (the `is_true` field is only surfaced to the GM via status badges).

**GM status badge logic:**
- `exposed` → done (accent)
- `is_true = true`, not exposed → active (green)
- `is_true = false`, not exposed → missed (red)

Card title is auto-generated from the first 60 characters of the rumour text, wrapped in curly quotes.

Each card shows: source NPC, source location, rumour text.

**Expose action** (GM only) — calls `POST /api/rumours/:id/expose`. Once exposed the rumour is publicly acknowledged as resolved, regardless of truth value.

Filter tabs: All · True · False · Exposed (GM can filter to review their deception layer).

---

### 5.7 Calendar (`CalendarView.vue`)

Route: `/calendar`

The Calendar is the most configurable view in the app. It renders a fully custom in-world calendar system — not the real-world Gregorian calendar — making it suitable for fantasy campaigns with invented timekeeping.

#### Grid and navigation

The view displays a standard month grid: day-of-week header row, blank cells to offset the first day, then numbered day cells. Navigation arrows step one month at a time; a ◎ button jumps to the campaign's current in-world date. The header shows the current month name, year, era suffix, and season (with its colour and icon).

Each day cell can display:

- **Moon phase icons** — one per configured moon, computed from the moon's cycle length and reference phase. Each moon has its own colour
- **Events** — rendered as labelled chips with a coloured left border. Weather events use a weather icon instead. GM-only events show an 👁 badge

Clicking a day cell (GM only) opens the event creation form. Clicking an existing event (GM only) opens it for editing.

#### GM toolbar

A bar visible only to GMs with two actions:

- **Generate Weather** — auto-populates the entire current month with weather events based on the season's weighted weather table
- **Advance Date** — inline form to advance the current in-world date by N days, or set it to the first of the viewed month

#### Calendar configuration panel

The ⚙ Configure button opens an in-page settings panel with six tabs:

| Tab | Configures |
|----|-----------|
| General | Epoch weekday offset, active era, current date (year/month/day) |
| Days | Names and short abbreviations for each day of the week |
| Months | Names, short names, and day counts per month |
| Eras | Named historical periods with year ranges and suffix labels (e.g. "AE", "DR") |
| Seasons | Season name, icon, accent colour, and which months belong to each season |
| Moons | Moon name, colour, cycle length (days), reference phase index, and reference date for phase calculation |
| Weather | Per-season weather outcomes — each with a label, icon, and relative weight for the random generator |

All configuration is stored as JSON on the campaign record. Changes are saved to `PUT /api/calendar/config`. This lets a GM model virtually any fantasy calendar — the Forgotten Realms Calendar of Harptos, a homebrew 13-month world, multiple moons with different cycles, etc.



