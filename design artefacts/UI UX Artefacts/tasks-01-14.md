# Prompts: Refactor Tasks (run in order)

Run these tasks in sequence. Each prompt assumes the previous ones are complete.
Always start with the session-start prompt (00-session-start.md) before any task.

---

## Task 01 — Apply design tokens globally

```
Read /design-artefacts/TOKENS.md.

Create a new file at [your tokens file path, e.g. src/styles/tokens.css] containing
all CSS custom properties defined in TOKENS.md, applied to :root.

Then find every hardcoded colour value in the codebase (hex values like #1c1510,
rgba values, and CSS named colours like 'white', 'black', 'gray') and replace each
one with its corresponding token from TOKENS.md.

Also add the autofill override rules from TOKENS.md to the global stylesheet
so browser autofill never renders white/light backgrounds on dark inputs.

Do not change any layout or component structure in this task — only token replacement.

When done: confirm how many hardcoded values were replaced.
```

---

## Task 02 — Apply copy and casing rules

```
Read /design-artefacts/COPY_RULES.md.

This is a CSS and class-name only task — do not change any component structure.

1. Find every instance of text-transform: uppercase in the codebase.
   - Keep it on: page title h1 elements, sidebar section group headers
     (CAMPAIGN, WORLD, PLAYER, GM), and the Details card section label.
   - Remove it from: form field labels, section headers, filter tabs,
     button labels, status badges, empty state text, and any element
     that renders user-generated content (entity names, descriptions, etc).

2. Find every element rendering user-generated content (entity names in cards,
   card titles, handout titles, etc.) and ensure text-transform: none is
   explicitly set so parent rules cannot cascade down.

3. Find every empty state message and any UI prose using a monospace font class.
   Change these to use var(--font-sans).

4. Find every button label and form field label that uses ALL CAPS text in the
   JSX/HTML source (not via CSS). Change these to sentence case.

List every file changed.
```

---

## Task 03 — Build ConfirmDialog

```
Read /design-artefacts/components/remaining-components.md (the ConfirmDialog section).

Build the ConfirmDialog component at [your components path]/ConfirmDialog.tsx (or .jsx).

Requirements:
- Props: isOpen, entityType, entityName, onConfirm, onCancel
- Body text: "[entityName] will be permanently deleted. This cannot be undone."
  with entityName displayed in quotes.
- Cancel button has autofocus when dialog opens.
- Delete button uses --color-text-danger and --color-border-danger tokens.
- Clicking overlay calls onCancel.
- Escape key calls onCancel.
- Uses --color-bg-elevated background, --color-border-active border.
- Max width: 400px, centred in viewport using --z-modal z-index.
- Corner bracket decoration (CSS ::before/::after) matching the app's modal style.

Write a brief usage example in a comment at the top of the file.
Update /design-artefacts/COMPONENTS.md to set ConfirmDialog status to ✅ BUILT.
```

---

## Task 04 — Build OverflowMenu

```
Read /design-artefacts/components/overflow-menu.md.
ConfirmDialog must be ✅ BUILT before this task.

Build the OverflowMenu component at [your components path]/OverflowMenu.tsx.

Requirements from spec:
- Trigger: ⋯ button, 28×28px, hidden (opacity 0) by default, visible on parent hover
  or when menu is open.
- Popover: positioned bottom-end of trigger, flips to top-end if it would overflow viewport.
- Action items: icon + label, hover highlight, danger variant in --color-text-danger.
- Divider type: renders a 1px horizontal rule.
- Only one menu open at a time (close others when opening a new one).
- Keyboard: Escape closes menu, arrow keys navigate items, Enter/Space activates item.
- Accessibility: aria-label="More actions", aria-haspopup="true" on trigger,
  role="menu" on popover, role="menuitem" on each action.
- When a danger-variant item labelled "Delete" is clicked, the OverflowMenu closes
  but does NOT execute the onClick. The onClick is the caller's responsibility
  (they should open ConfirmDialog).

Update /design-artefacts/COMPONENTS.md to set OverflowMenu status to ✅ BUILT.
```

---

## Task 05 — Build OverlayCard

```
Read /design-artefacts/components/overlay-card.md.
OverflowMenu must be ✅ BUILT before this task.

Build the OverlayCard component at [your components path]/OverlayCard.tsx.

Requirements from spec:
- Props: icon, title, status, actions, children, isExpanded, onToggle, isSelected.
- Collapsed state: header only (icon + title + StatusBadge + OverflowMenu trigger).
- Expanded state: header + children slot.
- Corner bracket decoration via CSS ::before/::after.
- Border: --color-border-default default, --color-border-active when expanded or selected.
- Title: NEVER apply text-transform. Render exactly as passed.
- StatusBadge must be visible in collapsed state when status prop is provided.
- Edit pencil icon on card header hover only (not always visible).
- Card grid layout: grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)).

Do NOT yet migrate existing pages to use OverlayCard — that is Task 06.

Update /design-artefacts/COMPONENTS.md to set OverlayCard status to ✅ BUILT.
```

---

## Task 06 — Migrate entity cards to OverlayCard

```
OverlayCard and OverflowMenu must be ✅ BUILT before this task.
Read /design-artefacts/components/overlay-card.md for the actions table per entity type.

Migrate the following pages to use OverlayCard, replacing all inline action button rows:

1. Factions page — FactionCard or equivalent
2. Plot Hooks page — HookCard or equivalent
3. Handouts page — HandoutCard or equivalent
4. Bestiary page — BestiaryCard or equivalent
5. Rumours page — RumourCard or equivalent

For each page:
- Replace the card component with OverlayCard.
- Move all actions (Pin, Share/Reveal, Edit, Delete) into the actions prop as an array.
- Delete action must set a state variable to open ConfirmDialog — it must NOT
  directly call the delete function.
- Wire ConfirmDialog with the entity's type and name.
- Confirm the entity name title is passed as-is with no text transformation.
- Confirm StatusBadge is showing the correct status value.

List all files changed. List any actions that didn't have a clear mapping and
describe what you did.
```

---

## Task 07 — Build EmptyState and fix ListPage layout

```
Read /design-artefacts/components/remaining-components.md (EmptyState section).
Read /design-artefacts/components/list-page.md (or the ListPage section in remaining-components.md).
Read /design-artefacts/PATTERNS.md sections 1 and 2.

Part A — Build EmptyState component:
Build EmptyState at [your components path]/EmptyState.tsx.
Props: icon, heading, description, ctaLabel, onCta.
It must be centred in its container (flexbox column, align/justify center).
Min-height: 300px. Never positioned bottom-right.

Part B — Fix list page layouts:
For every list page that currently has a dashed "ADD [ENTITY]" card in the grid:
  NPCs, Locations, Factions, Plot Hooks, Maps, Bestiary, Rumours, Inventory,
  Timeline, Handouts

1. Remove the dashed add card from the grid.
2. Move the add action to a "+ Add [Entity]" button in the page header, top-right.
3. When the entity list is empty, render EmptyState centred in the content area.
   Use the existing empty state copy (icon, heading, description) if it exists.
   Add a ctaLabel and onCta prop wired to the same create action as the header button.

Update /design-artefacts/COMPONENTS.md to set EmptyState and ListPage status to ✅ BUILT.
```

---

## Task 08 — Build Dropzone and replace all file inputs

```
Read /design-artefacts/components/remaining-components.md (Dropzone section).

Part A — Build Dropzone:
Build Dropzone at [your components path]/Dropzone.tsx.
Props: accept, value, onChange, onRemove, label, hint, variant ('square' | 'banner').
- square: 180×180px
- banner: full width, 120px height
- Empty state: dashed border, upload icon, "Click or drag to upload", hint text below.
- Filled state: image preview with × remove button top-right.
- Drag-over state: --color-border-active border, tinted background.
- The actual <input type="file"> is hidden inside Dropzone — never exposed directly.

Part B — Replace all file inputs:
Find every <input type="file"> in the codebase and replace with <Dropzone>.
Locations known to have native file inputs:
  - Create Quest (banner image)
  - Create Key-item (image)
  - Any other form with "Choose file" / "No file chosen" text

For portrait/icon uploads that currently use an image placeholder + "Upload Portrait"
button (Create NPC, Create Faction, Create Location, Create Bestiary):
  Replace the placeholder + button with Dropzone variant="square".

Update /design-artefacts/COMPONENTS.md to set Dropzone status to ✅ BUILT.
```

---

## Task 09 — Build StickyFormFooter and fix all forms

```
Read /design-artefacts/components/remaining-components.md (StickyFormFooter section).

Part A — Build StickyFormFooter:
Build StickyFormFooter at [your components path]/StickyFormFooter.tsx.
Props: primaryLabel, onPrimary, onCancel, isLoading, isDisabled.
- position: sticky; bottom: 0 inside the scrollable modal container.
- Cancel left, primary action right (but both left-to-right, not space-between).
- Loading state shows spinner on primary button.

Part B — Apply to all forms:
Add StickyFormFooter to every create and edit form in the app.
The footer must be inside the modal/form scroll container so it sticks to the
bottom of the modal, not the bottom of the viewport.

Remove any existing Cancel/Create button rows that are not sticky.

Known forms to update:
Create Quest, Create Job, Create NPC, Create Location, Create Faction,
Create Map, Create Bestiary, Create Handout, Create Hook, Create Rumour,
Create Inventory, Create Key-item, Create Session, Create Rumour,
Add Event (Calendar), New Character, any other create/edit form.

Update /design-artefacts/COMPONENTS.md to set StickyFormFooter status to ✅ BUILT.
```

---

## Task 10 — Build EntityForm shell and migrate all forms

```
Read /design-artefacts/components/entity-form.md.
All previous tasks (01–09) should be ✅ BUILT before this task.

Part A — Build EntityForm shell:
Build EntityForm at [your components path]/EntityForm.tsx.
Slots: entityType, nameField, sidebarImage, sidebarDetails, mainContent, gmSection.
Props: onSubmit, onCancel, primaryLabel.
- Name field is always full width, always first.
- Sidebar is 240px fixed, main content flex: 1.
- On viewport < 640px: sidebar stacks above main content.
- GmOnlySection (dark bg, red border, lock icon) renders at bottom of main content.
- StickyFormFooter renders at the bottom of the modal.
- Corner bracket decoration on the modal container.
- Autofill override CSS applied to all inputs within the form.

Part B — Migrate forms:
Using the migration table in entity-form.md, migrate each form to use EntityForm.
Prioritise in this order:
  1. Create Quest (biggest inconsistency — single column)
  2. Create Hook (minimal form — good test case)
  3. Create Handout
  4. Create Rumour
  5. Create Inventory / Create Key-item
  6. Any remaining forms

For each migration, confirm:
- Name/title field is full width and first.
- Sidebar has the correct content (portrait or metadata or neither).
- RichTextField is only used on rich field types (biography, description, gm-notes, etc).
- Plain textarea is used on all other text fields.
- GmOnlySection is last, with dark bg and red border.
- StickyFormFooter is present and sticky.
- No native file inputs remain.

Update /design-artefacts/COMPONENTS.md to set EntityForm status to ✅ BUILT.
```

---

## Task 11 — Polish pass (FilterTabs, StatusBadge, RichTextField, RelationshipSlider)

```
Read /design-artefacts/components/remaining-components.md for all remaining component specs.

Build and apply in order:

1. FilterTabs — sentence case labels, equal 28px height, pill shape.
   Apply to: NPCs (All/Friendly/Neutral/Hostile), Plot Hooks (All/Active/Delivered/Missed/Expired),
   Locations (All/City/Dungeon/Wilderness), Job Board (All/Open/Active/Completed),
   Inventory (All/Weapon/Armour/Gear/Consumable), Handouts (All/Text/Image/Map/Letter),
   Rumours (All/True/False/Exposed), Bestiary (no tabs currently — no change needed).

2. StatusBadge — sentence case, semantic colours from TOKENS.md.
   Ensure all OverlayCards show the correct StatusBadge using the colour table.

3. RichTextField — apply the field type decision table.
   Audit every form: Goals, Player Notes, Summary, Significance, Rumour Text,
   Source fields → change to plain textarea if currently using rich text editor.

4. RelationshipSlider (Faction card) — colour-coded track:
   Left end (Hostile): --color-hostile.
   Middle (Neutral): --color-neutral.
   Right end (Allied): --color-allied.
   Thumb/handle must be visible and clearly interactive.
   Labels "Hostile", "Neutral", "Allied" at fixed positions, always visible.

Update /design-artefacts/COMPONENTS.md for all four components to ✅ BUILT.
```

---

## Task 12 — Combat Tracker, Theory Board, Mindmap polish

```
These are targeted fixes to specific complex features.

Combat Tracker:
1. Apply dark theme to all inputs in the Add Combatant row.
   NAME, INIT, HP, AC fields must use --color-bg-input, --color-text-primary,
   --color-border-default. No white/light backgrounds.
2. Make "Next Turn" the visually dominant button:
   - Next Turn: filled style, --color-text-accent colour, prominent size.
   - Start: outline style.
   - Close: text-only style, --color-text-secondary.
3. When combat is active, the current combatant's row must have a clear
   active state: left border in --color-text-accent, slightly brighter background.

Theory Board:
1. Each node must display its label text at all times (not just on click).
   Show truncated label (max 20 chars + ellipsis) beneath or inside the node circle.
2. Enable double-click on the canvas to create a new node at that position.
   The node's creation position should match where the user double-clicked.
3. The right-side panel becomes the inspector for the selected node,
   not just the creation form. When a node is selected, pre-fill the panel
   with that node's current label, type, and notes.
4. Shared nodes (Share with GM = checked) should have a distinct visual
   indicator on the node itself (e.g. a small eye icon, or a brighter border colour).

Mindmap:
1. When a node is clicked, replace the minimal "FACTION / name / Close" popover
   with a slide-out panel on the right side showing:
   - Entity type label
   - Entity name (larger)
   - One-line summary (description truncated)
   - "Open [entity type] →" button that navigates to the entity detail page
   - "Close" button
```

---

## Task 13 — Settings and Messages cleanup

```
Settings page:
1. Group settings into card sections with clear headings:
   - "Profile" section (Character Name, Character Class, Save Profile, Font Size)
   - "Appearance" section (Theme swatches)
   - "Accessibility" section (High Contrast, Reduce Motion, Disable Effects)
   - "Data" section (Download Backup)
   - "Account" section (Change Password)
   Each section is a card with --color-bg-card background and --color-border-default border.

2. Theme swatches: show the system name as a text label beneath each swatch at all times
   (not just for the selected one). Current selected swatch has --color-border-active ring.

3. Fix browser autofill on password fields — apply the autofill override CSS from TOKENS.md.

Messages panel:
1. Collapse the compose form behind a "+ New Message" button at the top of the panel.
   The panel should default to showing the message list.
   Clicking "+ New Message" expands the compose form.

2. Add helper text beneath "Secret" and "Needs ack" checkboxes:
   - Secret: "Recipient won't see your name"
   - Needs ack: "You'll be notified when read"

3. The empty state for Notifications should explain what will appear:
   "You'll see alerts when players send messages, share notes, or respond to
   scheduling polls." — centred, using EmptyState component (no CTA needed).
```

---

## Task 14 — Implement the theme system (Phase 1)

```
Read /design-artefacts/THEMES.md and /design-artefacts/TOKENS.md.

This task implements Phase 1 of the theme system — base token overrides only.
Do NOT implement FX classes (Phase 2) or dynamic classes (Phase 3) in this task.

Follow the "Claude Code prompt for Phase 1" section at the bottom of THEMES.md exactly.

Summary of what to build:
1. Create [your styles path]/themes.css with all Layer 0 and Layer 1 theme classes.
2. Apply theme-none to the home/campaign-selection page container.
3. On campaign load, read campaign.system and apply the matching theme class.
4. Only one theme class active at a time — remove previous before applying new.
5. Semantic colour tokens (--color-success, --color-danger, --color-warning,
   --color-gm) must NOT appear in any theme class.

After completing, verify by manually switching between campaigns of different
systems and confirming the correct accent colour, background, and text colour
appear for each. Confirm the home screen uses theme-none (blue-slate, not amber).
```

---

## Task 15 — Ambient FX layer (Phase 2, run once per theme)

Run this task once for each FX class. Replace [FX CLASS] with the target class.

```
Read /design-artefacts/THEMES.md, section "Layer 2 — Ambient FX classes".

Task 14 (Phase 1 theme tokens) must be complete before this task.

Implement the [FX CLASS] from the THEMES.md spec and add it to themes.css.
Apply it to the correct campaign container alongside the base theme class.

FX class → theme mapping:
  .fx-crt        → .theme-alien
  .fx-grain      → .theme-dune
  .fx-desaturate → .theme-cthulhu
  .fx-parchment  → .theme-achtung
  .fx-stars      → .theme-coriolis
  .fx-vignette   → .theme-dnd5e

Rules from spec:
- All CSS animations inside @media (prefers-reduced-motion: no-preference)
- CSS only — no JavaScript
- FX class must not affect semantic badge colours
- Verify body text contrast ratio still passes WCAG AA with FX active

Confirm the FX class works correctly with and without the base theme class.
```
