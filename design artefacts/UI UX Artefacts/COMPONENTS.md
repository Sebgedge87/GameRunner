# The Chronicle — Component Index

This is the single source of truth for all UI components in The Chronicle.
Claude Code must read this file at the start of every session before making any changes.

## Rule: One component, one spec
Every named component below has exactly one spec file. When implementing or modifying
any UI element, find its canonical name here first, then read its spec file.
Never create a new component for something that matches an existing name.

---

## Component Registry

| Component | File | Status | Replaces |
|-----------|------|--------|----------|
| `OverlayCard` | components/overlay-card.md | ✅ BUILT | Inline action rows on Factions, PlotHooks, Handouts, Bestiary, Rumours |
| `OverflowMenu` | components/overflow-menu.md | ✅ BUILT | Inline Pin/Hide/Share/Edit/Delete buttons |
| `ConfirmDialog` | components/confirm-dialog.md | ✅ BUILT | No existing confirm — adds missing safety layer |
| `EntityForm` | components/entity-form.md | ✅ BUILT | 4 different form layouts across all entity create/edit screens |
| `Dropzone` | components/dropzone.md | ✅ BUILT | All `<input type="file">` elements |
| `EmptyState` | components/empty-state.md | ✅ BUILT | Floating bottom-right empty messages |
| `ListPage` | components/list-page.md | ✅ BUILT | Dashed "Add entity" card in grid position |
| `FilterTabs` | components/filter-tabs.md | ✅ BUILT | Inconsistently sized filter tab rows |
| `RichTextField` | components/rich-text-field.md | ⬜ TODO | Rich text editor applied to wrong field types |
| `StickyFormFooter` | components/sticky-form-footer.md | ✅ BUILT | Scrolling Cancel/Create buttons |
| `StatusBadge` | components/status-badge.md | ✅ BUILT | Various inline status labels |
| `RelationshipSlider` | components/relationship-slider.md | ⬜ TODO | Faction Hostile→Allied slider |

## Status flags
After a component is built and merged, update its Status to: ✅ BUILT
This tells Claude Code to import the existing component rather than recreate it.

---

## Build Order
Follow this sequence. Later components depend on earlier ones.

1. TOKENS.md — all later components reference tokens
2. COPY_RULES.md — pure CSS, zero structural risk, high visual impact
3. `ConfirmDialog` — needed before OverflowMenu can include Delete
4. `OverflowMenu` — needed before OverlayCard
5. `OverlayCard` — migrate all 6 entity list pages
6. `EmptyState` + `ListPage` — fixes all list page layouts
7. `Dropzone` — replaces all native file inputs
8. `StickyFormFooter` — fixes all long forms
9. `EntityForm` — standardises all create/edit forms
10. `FilterTabs`, `StatusBadge`, `RichTextField`, `RelationshipSlider` — polish pass
