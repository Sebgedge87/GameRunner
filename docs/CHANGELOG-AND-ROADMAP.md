# The Chronicle — UI/UX Refactor: Changes & Roadmap

> This document records every change made during the UI/UX refactor,
> and all planned work across the remaining sprints.
> Add this file to `design-artefacts/UI UX Artefacts/` in the repo.

---

## Contents

1. [Completed — Tasks 01–17](#completed-tasks-01-17)
2. [Sprint 1 — Quick wins](#sprint-1-quick-wins)
3. [Sprint 2 — Navigation restructure](#sprint-2-navigation-restructure)
4. [Sprint 3 — Dashboard rebuild](#sprint-3-dashboard-rebuild)
5. [Sprint 4 — Character sheets](#sprint-4-character-sheets)
6. [Sprint 5 — Polish](#sprint-5-polish)
7. [Architectural decisions log](#architectural-decisions-log)
8. [Known issues](#known-issues)

---

## Completed — Tasks 01–17

### Task 01 — Design token system
- Created `client/src/styles/tokens.css` with all CSS custom properties on `:root`
- Replaced all hardcoded hex/rgba colour values across the codebase with tokens
- Added autofill override CSS to prevent browser white-flash on dark inputs
- Added overlay, shadow, and urgency tokens after initial audit found unmapped values
- Added font tokens: `--font-display` (Cinzel Decorative), `--font-sans` (Cinzel), `--font-serif` (Crimson Pro), `--font-mono` (JetBrains Mono)
- Google Fonts import added to `index.html`

### Task 02 — Copy and casing rules
- Removed `text-transform: uppercase` from 32 files
- Added `text-transform: none` to all elements rendering user-generated content (entity names, card titles, descriptions)
- Fixed ALL CAPS button and label text to sentence case across 18 files (30+ instances)
- Restricted monospace font to: in-world dates, numeric stat values, code blocks only
- Empty state messages migrated from monospace to `var(--font-sans)`

### Task 03 — ConfirmDialog component
- Built `ConfirmDialog.vue` — dual-mode: props-based delete dialog + Pinia store confirm/prompt
- Cancel button autofocused via `ref` + `watch` + `nextTick`
- Escape key and backdrop click both wire to cancel
- Three new tokens added: `--color-danger`, `--color-danger-border`, `--color-danger-bg-hover`
- Preserves all existing `ui.confirm()` / `ui.prompt()` call sites unmodified

### Task 04 — OverflowMenu component
- Built `OverflowMenu.vue` with Teleport to body + `position: fixed` popover
- Viewport-aware positioning (flips to `top-end` when bottom overflows)
- Module-level singleton — opening a second menu auto-closes the first
- Full keyboard nav: `↑`/`↓` cycle items, `Home`/`End`, `Esc` closes
- ARIA: `role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`
- Delete pattern: emits `'delete'` event, never calls `onClick` directly — parent wires ConfirmDialog

### Task 05 — OverlayCard component
- Built `OverlayCard.vue` with collapsed/expanded states
- Corner bracket decoration via CSS `::before`/`::after` using `var(--color-border-bracket)`
- StatusBadge visible on collapsed cards
- Edit pencil shown on hover only — the only inline action permitted
- Title: `text-transform: none` explicitly enforced
- `.overlay-card-grid` utility class for parent list containers
- Delete action re-emitted to parent — OverlayCard never handles delete directly

### Task 06 — Migrate entity cards to OverlayCard
- Factions, Plot Hooks, Handouts, Bestiary, Rumours — all migrated to OverlayCard
- All inline Pin/Hide/Share/Edit/Delete button rows removed
- Delete on every page now opens ConfirmDialog with entity type and name
- Status badges correctly mapped per entity type

### Task 07 — EmptyState + ListPage layout
- Built `EmptyState.vue` — centred, min-height 300px, icon + heading + description + CTA
- Removed dashed "Add entity" cards from grids on all 9 list pages
- Added "+ Add [entity]" button to page header top-right on all list pages
- `layout.css` — `.page-header` now `display: flex; justify-content: space-between`
- NPCs delete replaced with ConfirmDialog
- LocationsView Notice Board add-tile left in place (different interaction pattern)

### Task 08 — Dropzone + replace all file inputs
- Built `Dropzone.vue` — square (180×180) and banner (full width × 120px) variants
- Empty / filled / drag-over states
- `watchEffect` manages object URL lifecycle — no memory leaks
- All `<input type="file">` replaced across `GmEditModal.vue` and `GmDashboardView.vue`
- Edit mode prefills Dropzone from existing image data

### Task 09 — StickyFormFooter
- Built `StickyFormFooter.vue` — `position: sticky; bottom: 0` inside scroll container
- Loading spinner via `@keyframes` wrapped in `prefers-reduced-motion`
- Applied to 6 form locations: GmEditModal, CharactersView, HomeView, CalendarView, InventoryView, GoodBoyCardsView

### Task 10 — EntityForm shell + migrate all forms
- Built `EntityForm.vue` — slot-based layout: `#name-field`, `#banner-image`, `#sidebar-image`, `#sidebar-details`, `#main-content`, `#gm-section`
- Sidebar auto-hidden when neither `#sidebar-image` nor `#sidebar-details` are provided
- GmEditModal.vue migrated for all 11 entity types: Quest, NPC, Location, Faction, Map, Bestiary, Handout, Hook, Rumour, Inventory, Key-item
- RichTextField (MarkdownEditor) used only on biography/description/gm-notes fields
- Plain `<textarea>` on all other text fields
- Autofill override CSS applied to all inputs within EntityForm

### Task 11 — Polish pass
- `FilterTabs.vue` — pill shape, 28px fixed height, sentence case, equal sizing. Applied to 7 list pages.
- `StatusBadge.vue` — semantic colour mapping from TOKENS.md, sentence case. Wired into OverlayCard replacing placeholder span.
- `RichTextField.vue` — wraps MarkdownEditor for rich types, auto-resizing textarea for plain types. Audited all forms.
- `RelationshipSlider.vue` — gradient track (hostile→neutral→allied), dynamic thumb colour, always-visible labels. Applied to Faction card.

### Task 12 — Combat Tracker, Theory Board, Mindmap
- Combat Tracker: dark theme on all inputs, Next Turn as primary CTA, active combatant row highlight
- Theory Board: node labels visible at all times (truncated at 20 chars), double-click to create node, right panel becomes inspector on node select, shared nodes have eye icon indicator
- Mindmap: slide-out panel on node click with entity type, name, description, "Open [type] →" navigation button

### Task 13 — Settings + Messages cleanup
- Settings grouped into card sections: Profile, Appearance, Accessibility, Data, Account
- Theme swatches show system name label at all times, active swatch has `--color-border-active` ring
- Autofill override applied to password fields
- Messages compose form collapsed behind "+ New Message" button
- Helper text added to Secret and Needs ack checkboxes
- Notifications empty state explains what will appear

### Task 14 — Theme system Phase 1
- `themes.css` created with 8 theme classes: `.theme-none`, `.theme-default`, `.theme-dnd5e`, `.theme-cthulhu`, `.theme-alien`, `.theme-coriolis`, `.theme-dune`, `.theme-achtung`
- `campaign.js` `applyTheme()` applies three-layer class system to `<html>`: `theme-*` + `fx-*` + `dynamic-*`
- `.theme-none` applied on home/login screen (blue-slate — no campaign context)
- `.theme-cthulhu` sets `--font-serif: 'EB Garamond'`
- `.theme-achtung` sets `--font-serif: 'Lora'`

### Task 15 — Theme FX Phase 2
- `.fx-crt` — Alien RPG: scanlines, phosphor flicker on h1, monospace nav/field labels
- `.fx-grain` — Dune: noise texture, wider heading letter-spacing
- `.fx-desaturate` — Cthulhu: ink bleed on cards, colour drains on hover, typewriter body font
- `.fx-parchment` — Achtung!: aged paper texture, stamp-style badges, CLASSIFIED watermark on GM sections
- `.fx-stars` — Coriolis: star field background, holographic card hover
- `.fx-vignette` — D&D 5e: parchment vignette on cards, illuminated drop cap on descriptions
- All animations wrapped in `@media (prefers-reduced-motion: no-preference)`

### Task 16 — Token loose ends
- Tag palette tokens added: `--color-tag-{colour}-bg/border/text` for gold, blue, green, purple, red, grey
- `--color-title` token added per theme for page title colour overrides
- All TODO comments in `tokens.css` resolved

### Task 17 — Dynamic theme layers (Phase 3)
- **Task 17a — Dune houses**: `.dynamic-house-atreides/harkonnen/fremen/bene-gesserit` — full thematic shift per house (colours + border radius). House selector in GM Dashboard Settings tab. Live preview on select, persists on Save. `dune_house TEXT` column added.
- **Task 17b — Alien threat level**: `.dynamic-threat-0` through `.dynamic-threat-5` — accent shifts from cyan toward red, UI desaturates at high threat. Threat level control on GM Dashboard Overview. `threat_level INTEGER DEFAULT 0` column added.
- **Task 17c — Cthulhu sanity**: `.dynamic-sanity-0` through `.dynamic-sanity-4` — progressive desaturation down to greyscale+sepia at 0 SAN. Manual sanity input on GM Dashboard. `avg_sanity INTEGER DEFAULT 100` column added.
- **Task 17d — D&D settings/planes**: `.dynamic-setting-ravenloft/spelljammer/eberron` — colour overrides per setting. Setting/Plane selector in GM Dashboard Settings. `dnd_setting TEXT` column added.

---

## Sprint 1 — Quick wins

**Status:** ⬜ In progress

### S1-1 Remove floating FAB button
- Remove the floating `+` circle button (bottom-right) from all pages
- It duplicates the page header "+ Add [entity]" button added in Task 07
- Find by component name or CSS class, remove globally

### S1-2 Fix ALL CAPS empty state headings
Source text fixes in view files:

| Current | Fix to |
|---------|--------|
| "NO FACTIONS YET" | "No factions yet" |
| "BESTIARY EMPTY" | "No creatures yet" |
| "NO MAPS YET" | "No maps yet" |
| "NO HOOKS YET" | "No hooks yet" |
| "NO RUMOURS YET" | "No rumours yet" |
| "NO KEY ITEMS YET" | "No key items yet" |
| "NO ITEMS YET" | "No items yet" |
| "NO TIMELINE EVENTS YET" | "No timeline events yet" |

### S1-3 Fix "Inherited from campaign: ALIEN" casing
- New Character modal — system name rendered via CSS uppercase
- Use `SYSTEM_META` display name or remove transform from that label

### S1-4 Fix Handout card title uppercase
- "HANDOUT 1" showing in ALL CAPS on the Handouts list
- Find residual `text-transform: uppercase` on HandoutsView card title

### S1-5 Move Bestiary to World nav group
- Bestiary moves from Player section to World section
- New World order: NPCs · Locations · Factions · **Bestiary** · Timeline · Calendar · Maps · Mindmap

---

## Sprint 2 — Navigation restructure

**Status:** ⬜ Planned

### S2-1 Merge Hooks + Rumours → Rumours
- Add `type` column to rumours table: `'hook'` | `'rumour'`
- Migrate existing hooks data into rumours table with `type='hook'`
- Drop hooks table
- Remove `/hooks` route
- Update RumoursView to handle both types
- FilterTabs: All / Hook / Rumour / Delivered / Expired
- Update all entity connection fields that referenced hooks

### S2-2 Remove Job Board from navigation
- Remove Job Board from sidebar nav
- Job Board page stays accessible via `/jobs` for deep linking
- Entry point moves to: Dashboard Notice Board widget + Location Notice Board tab

### S2-3 Current location on campaign
- Add `current_location_id INTEGER` to campaigns table
- Add "Current location" control to GM Dashboard
- `applyCurrentLocation()` in campaign store — sets location, triggers Notice Board widget refresh

### S2-4 GM Controls strip on Dashboard
- Dashboard detects `campaign.isGm` and renders GM Controls at top
- GM Controls: current location picker (searchable dropdown of all locations) + session agenda text input
- Players never see GM Controls — `v-if="campaign.isGm"`
- Current location badge visible in page header for all users when set

### S2-5 Notice Board widget on Dashboard
- Shows jobs posted at `current_location_id`
- Empty state if no location set: "The GM hasn't set a current location yet"
- Empty state if no jobs: "No jobs posted here"
- "View all jobs →" links to `/jobs`
- GM can add a job directly from the widget

### S2-6 Rename GM Dashboard → Campaign Management
- Nav label: "GM Dashboard" → "Campaign Management"
- Route stays `/gm-dashboard` (no redirect needed — not a public URL)
- Page title: "CAMPAIGN MANAGEMENT"

### S2-7 Move Cards to Campaign Management tab
- Good Boy Cards moves from nav to a "Cards" tab inside Campaign Management
- Tabs: Overview / Cards / Settings / Stats
- Remove Cards from sidebar navigation

### S2-8 Regroup navigation
Final nav structure:

```
CAMPAIGN
  Dashboard
  Quests
  Sessions

WORLD
  NPCs
  Locations
  Factions
  Bestiary
  Timeline
  Calendar
  Maps
  Mindmap

PLAYER
  Characters
  Notes
  Theory Board
  Handouts
  Inventory
  Rumours

GM
  Campaign Management
  Combat

Settings
Logout
```

---

## Sprint 3 — Dashboard rebuild

**Status:** ⬜ Planned

### S3-1 Player Dashboard widgets
Replace the current sparse dashboard with a widget grid:
- Active quests (list, max 3, "View all →" link)
- Next session (date, time, session number, countdown)
- Notice Board (jobs at current location — read only for players)
- Recent handouts (last 3 shared, "View all →")
- Pinned items (existing pinned entities)
- Character quick-stats (HP, key stat from system sheet)

### S3-2 GM Dashboard layer
Same widget grid as player view, plus GM Controls strip at top:
- Current location picker
- Session agenda
- Quick actions row: + Quest, + NPC, + Location, + Hook, + Handout, + Session, Combat Tracker

### S3-3 Calendar — full width + taller cells
- Calendar stretches to full content width (remove fixed ~670px constraint)
- Day cells: minimum 80px height
- Controls (Generate Weather, Advance Date) in a proper toolbar row
- Month navigation centred with year and season visible

### S3-4 Theory Board — empty canvas affordance
- Centred empty state on blank canvas: "Double-click anywhere to add a node"
- Faint dot-grid background to signal the canvas is interactive

### S3-5 Mindmap — empty state + controls
- Empty state centred on canvas when no entities linked
- Visible filter controls for entity type visibility
- "Click a node to inspect" hint always visible at bottom

---

## Sprint 4 — Character sheets

**Status:** ⬜ Planned

### S4-0 Inventory existing sheets
Before building: read the `sheets/` folder in the repo and document what already exists.

### S4-1 D&D 5e — link + PDF display
- Character sheet shows two options: D&D Beyond URL field OR PDF upload
- URL field: opens D&D Beyond character in new tab
- PDF upload: displays PDF in an `<iframe>` (or `<embed>`) within the character sheet view
- No custom field template needed — D&D Beyond handles all sheet complexity

### S4-2 Alien RPG sheet
- Fields: Strength / Agility / Wits / Empathy (base stats)
- Stress track, HP (Current/Max), Conditions (Starving/Dehydrated/Exhausted/Freezing)
- Consumables: Air / Food / Water / Power
- Skills per stat, Talents, Specialisations
- Apply `.theme-alien` visual tokens — dark, terminal aesthetic, no light parchment

### S4-3 Call of Cthulhu sheet
- Fields: STR / DEX / INT / POW / CON / APP / SIZ / EDU (+ half and fifth values)
- Sanity (Current/Max/Starting), HP (Current/Max), Luck, Magic Points
- Occupation, Age, Skills (investigator + occupation + hobby)
- Apply `.theme-cthulhu` visual tokens

### S4-4 Coriolis sheet
- Fields: Strength / Agility / Wits / Empathy
- HP (Mind Points), Encumbrance
- Skills, Talents, Icon (patron deity)
- Faction/ship affiliation
- Apply `.theme-coriolis` visual tokens

### S4-5 Dune sheet
- Fields: Body / Mind / Spirit (drives and approach)
- Skills, Traits, Drives
- House affiliation (links to Dune house system)
- Apply `.theme-dune` / `.dynamic-house-*` visual tokens

### S4-6 Achtung! Cthulhu sheet
- Extends CoC base stats
- Additional fields: Military rank, Unit, Security clearance
- Stress / Trauma tracks
- Apply `.theme-achtung` visual tokens

### S4-7 CharacterSheetView routing
- Detect `campaign.activeCampaign.system`
- Render correct sheet component per system
- Remove standalone light/parchment styling from CharacterSheetView
- Sheet inherits campaign theme tokens like every other page

---

## Sprint 5 — Polish

**Status:** ⬜ Planned

### S5-1 Sessions page restructure
- Remove Polls section or move to a collapsible tab
- Session Log is the primary feature — should dominate the page
- Scheduling row works well — keep as-is

### S5-2 Notes — linked navigation
- `[[wiki-style links]]` in note body — autocomplete on `[[`
- Backlinks panel — shows which notes link to the current note
- Note graph view (future) — similar to Mindmap but for notes

### S5-3 Create Map — banner Dropzone position
- Banner Dropzone should span full width above the two-column split
- Currently rendering in sidebar position — fix EntityForm Map variant

### S5-4 Timeline — EmptyState component
- Replace floating text "No timeline events yet" with proper EmptyState component
- Centred, with icon, description, and "+ Add event" CTA button

---

## Architectural decisions log

| Decision | Rationale | Date |
|----------|-----------|------|
| Token-first CSS — no hardcoded values | Enables full theme system — one token change cascades everywhere | Refactor start |
| Three-layer theme architecture (base / FX / dynamic) | Each layer is additive, never destructive. Base tokens work without FX. | Task 14 |
| Cinzel + Crimson Pro typography | Cinzel reads as ancient/authoritative at small sizes. Crimson Pro has excellent dark-bg legibility and proper italic cuts for flavour text. | Task 01 |
| Semantic colours fixed across all themes | Status (hostile/allied/active/expired) must be universally readable regardless of system. | Task 01 |
| OverlayCard + OverflowMenu pattern | Eliminates inline action rows (Pin/Delete side by side). One component fixes 6+ pages. Delete always requires ConfirmDialog. | Task 05–06 |
| EntityForm slot-based shell | 11 entity types, 4 previous inconsistent layouts → one shell. Sidebar auto-hides when unused. | Task 10 |
| Hooks + Rumours → Rumours | Both are GM-managed information drips. A Hook is a Rumour the GM wants players to act on. One entity, one page, one nav item. type field distinguishes them. | Sprint 2 |
| Job Board → Location Notice Board + Dashboard widget | Jobs are location-specific. Detaching them from their physical context loses the immersion. Current location on campaign enables contextual job display everywhere. | Sprint 2 |
| One Dashboard, two modes (player + GM layer) | GM runs sessions from the dashboard, not a separate admin page. GM Controls strip adds session management without removing player context. | Sprint 3 |
| D&D 5e sheet — link + PDF, no custom template | D&D Beyond already solves sheet complexity for 5e. Building a duplicate is wasted effort and will always be inferior. | Sprint 4 |
| System-specific character sheets | A character sheet IS the game system. Showing CoC fields in an Alien campaign breaks immersion and is mechanically wrong. Each system needs its own template. | Sprint 4 |
| Bestiary in World nav group | Bestiary is world knowledge (GM creates/reveals). Players consume it, they don't author it. Belongs alongside NPCs/Locations/Factions. | Sprint 1 |

---

## Known issues

| Issue | Priority | Sprint |
|-------|----------|--------|
| Floating FAB button duplicates header add button on all pages | High | S1 |
| ALL CAPS empty state headings in several view files | High | S1 |
| Handout card title showing in uppercase | High | S1 |
| "Inherited from campaign: ALIEN" uppercased in New Character modal | Medium | S1 |
| Create Map banner Dropzone in wrong position (sidebar instead of full-width) | Medium | S5 |
| Calendar constrained to ~670px, day cells too small | Medium | S3 |
| Theory Board canvas has no empty state or interactive affordance | Medium | S3 |
| Mindmap has no empty state when no entities exist | Medium | S3 |
| Character sheet shows CoC layout regardless of campaign system | Critical | S4 |
| Character sheet uses light parchment styling — doesn't inherit campaign theme | Medium | S4 |
| Sessions page has three unrelated sections — Polls feels weak | Low | S5 |
| Timeline EmptyState not using the EmptyState component | Low | S5 |
| Notes lacks wiki-style linked note navigation | Low | S5 |
| Dune house theme not applying on select (console.log added as debug — remove if still present) | High | Hotfix |
