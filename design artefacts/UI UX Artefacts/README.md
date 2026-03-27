# The Chronicle — Design Artefacts

This folder is the single source of truth for all UI decisions in The Chronicle.
Claude Code reads these files before every session. Never implement patterns
that contradict the specs here.

---

## Quick start

1. Copy the prompt in `prompts/00-session-start.md` and paste it at the start
   of every Claude Code session.

2. Run tasks from `prompts/tasks-01-14.md` in order.
   Each task is self-contained and references the relevant spec files.

3. After each task completes, mark the component ✅ BUILT in COMPONENTS.md.

---

## File map

```
design-artefacts/
│
├── README.md                          ← you are here
│
├── COMPONENTS.md                      ← master index of all components + build status
├── TOKENS.md                          ← all CSS custom properties (colours, spacing, type)
├── THEMES.md                          ← all 7 theme token overrides + FX + dynamic layers
├── COPY_RULES.md                      ← text casing, font usage, label conventions
├── PATTERNS.md                        ← interaction rules (empty states, forms, actions)
│
├── components/
│   ├── overlay-card.md                ← OverlayCard (entity card with overflow menu)
│   ├── overflow-menu.md               ← OverflowMenu (⋯ trigger + action popover)
│   ├── entity-form.md                 ← EntityForm (standard create/edit form shell)
│   └── remaining-components.md        ← ConfirmDialog, EmptyState, ListPage, FilterTabs,
│                                         Dropzone, StatusBadge, StickyFormFooter,
│                                         RichTextField (all in one file)
│
└── prompts/
    ├── 00-session-start.md            ← paste this at the start of every session
    └── tasks-01-14.md                 ← all refactor tasks in order with full prompts
```

---

## The 8 core problems this refactor fixes

| # | Problem | Fix | Task |
|---|---------|-----|------|
| 1 | Inline card action buttons (Pin/Delete side by side) | OverlayCard + OverflowMenu | 05–06 |
| 2 | "Add entity" dashed card in grid | ListPage header button | 07 |
| 3 | User content displayed in ALL CAPS | COPY_RULES.md enforcement | 02 |
| 4 | Native file inputs breaking dark theme | Dropzone component | 08 |
| 5 | 4 different form layouts for same purpose | EntityForm shell | 10 |
| 6 | Sticky form footer missing | StickyFormFooter | 09 |
| 7 | Hardcoded colours, no token system | TOKENS.md + Task 01 | 01 |
| 8 | Theme system undiscoverable | Campaign creation + card theming | 14 |

---

## Theme architecture (summary — see THEMES.md for full spec)

Three phases, additive layers, one CSS class per layer on the campaign container:

```
Phase 1 (now)   — Base tokens     .theme-{name}          5 CSS variables per theme
Phase 2 (next)  — Ambient FX      .fx-{effect}           CSS-only, motion-safe
Phase 3 (later) — Dynamic data    .dynamic-{key}-{value} JS-driven from campaign state
```

Themes: `theme-none` (home), `theme-default`, `theme-dnd5e`, `theme-cthulhu`,
`theme-alien`, `theme-coriolis`, `theme-dune`, `theme-achtung`

Semantic colours (success/danger/warning/gm) are fixed on `:root` and never
overridden by any theme. Players must always be able to read status information.

---

## Rules for Claude Code

1. Read COMPONENTS.md, TOKENS.md, COPY_RULES.md, and PATTERNS.md before every session.
2. Never hardcode a colour value — always use a token.
3. Never create a new pattern for something that has a named component.
4. Never apply text-transform: uppercase to user-generated content.
5. Never use `<input type="file">` — always use Dropzone.
6. After completing a component, update its status in COMPONENTS.md.
7. If a task requires a component that is not yet ✅ BUILT, stop and ask.

---

## Component build status (keep this updated)

| Component | Status |
|-----------|--------|
| OverlayCard | ⬜ TODO |
| OverflowMenu | ⬜ TODO |
| ConfirmDialog | ⬜ TODO |
| EntityForm | ⬜ TODO |
| Dropzone | ⬜ TODO |
| EmptyState | ⬜ TODO |
| ListPage | ⬜ TODO |
| FilterTabs | ⬜ TODO |
| RichTextField | ⬜ TODO |
| StickyFormFooter | ⬜ TODO |
| StatusBadge | ⬜ TODO |
| RelationshipSlider | ⬜ TODO |
