# Component: EntityForm

**Status:** ⬜ TODO
**Priority:** High — standardises all create/edit forms

---

## What it is
The standard shell for every create and edit form in the app.
All entity creation (NPC, Quest, Location, Faction, Job, Map, Bestiary,
Handout, Rumour, Hook, Key-item, Inventory item) uses this exact layout.

---

## Anatomy

```
┌─────────────────────────────────────────────────────────────────┐  ← Modal container
│  [h2] Create [Entity Type]                                       │  ← FormHeader
├──────────────────┬──────────────────────────────────────────────┤
│                  │  NAME / TITLE field (full width above split) │  ← NameRow
├──────────────────┼──────────────────────────────────────────────┤
│  FormSidebar     │  FormMain                                    │
│  (240px fixed)   │  (flex: 1)                                   │
│                  │                                              │
│  [Dropzone]      │  [Primary content fields]                    │
│  [Upload label]  │  — Description / Biography / Briefing        │
│                  │  — Player-visible fields                     │
│  [Details card]  │                                              │
│  — metadata      │  [GmOnlySection]                             │
│    fields        │  — Private Notes                             │
│  — type          │                                              │
│  — status        │                                              │
│  — numeric       │                                              │
│    stats         │                                              │
├──────────────────┴──────────────────────────────────────────────┤
│  [StickyFormFooter: Cancel | Create]                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Slots / Props

| Slot | Description |
|------|-------------|
| `entityType` | String shown in heading: "Create NPC", "Create Quest" |
| `nameField` | The title/name input — always full width, always first |
| `sidebarImage` | Dropzone variant ('square' or 'banner' or null) |
| `sidebarDetails` | Metadata fields (type, status, standing, etc.) |
| `mainContent` | Primary content fields (description, biography, etc.) |
| `gmSection` | GmOnlySection — always last in mainContent column |
| `onSubmit` | Form submit handler |
| `onCancel` | Cancel handler |
| `primaryLabel` | "Create" or "Save" |

---

## Sidebar variants

### With portrait (NPC, Faction, Bestiary, Location)
- Dropzone `variant="square"` at top of sidebar
- "Upload portrait" / "Upload icon" / "Upload thumbnail" label below
- Details card below with metadata fields

### Without portrait (Quest, Hook, Handout, Rumour, Inventory)
- No Dropzone in sidebar
- Details card takes full sidebar width
- Sidebar may be hidden if there are no metadata fields — mainContent goes full width

### Banner image (Map)
- Dropzone `variant="banner"` spans full width above the sidebar+main split
- Sidebar contains type and GM-only checkbox only

---

## Details card (sidebar metadata)

```
┌─────────────────────┐
│ DETAILS             │  ← section label, uppercase allowed here (UI chrome)
├─────────────────────┤
│ [Field label]       │
│ [Input / Select]    │
│                     │
│ [Field label]       │
│ [Input / Select]    │
└─────────────────────┘
```

CSS:
```css
.details-card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.details-card-title {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}
```

---

## Layout rules

- Name/Title field is ALWAYS full width, ALWAYS the first field.
- Sidebar is always 240px fixed width.
- Main content is flex: 1.
- On viewport < 640px: sidebar stacks above main content (no longer side-by-side).
- GmOnlySection is ALWAYS last in the main content column.
- Form fields inside main content use `gap: var(--space-form-gap)` (16px) between fields.
- Section breaks within main content use `gap: var(--space-form-section)` (28px).

---

## What this replaces

This shell replaces the following inconsistent form layouts:

| Form | Current layout | Replace with EntityForm |
|------|---------------|------------------------|
| Create Quest | Single column scroll in modal | EntityForm (no portrait, sidebar has type/status/urgency/rewards) |
| Create Job | Two-column ad-hoc | EntityForm (no portrait, sidebar has type/difficulty/reward) |
| Create NPC | Portrait-left split | EntityForm (square portrait, sidebar has character metadata) |
| Create Location | Portrait-left split | EntityForm (square portrait, sidebar has type/danger level) |
| Create Faction | Portrait-left split | EntityForm (square portrait, sidebar has standing/influence) |
| Create Map | Two-column ad-hoc | EntityForm (banner image variant) |
| Create Bestiary | Portrait-left split | EntityForm (circular portrait, sidebar has stat block) |
| Create Handout | Single column modal | EntityForm (no portrait, no sidebar — mainContent only) |
| Create Hook | Single column modal | EntityForm (no portrait, minimal sidebar) |
| Create Rumour | Single column modal | EntityForm (no portrait, sidebar has source NPC/location) |
| Create Inventory | Single column modal | EntityForm (no portrait, sidebar has quantity/holder) |
| Create Key-item | Single column modal | EntityForm (square portrait, sidebar has significance/linked quest) |

---

## Native input override (autofill)

All inputs within EntityForm must override browser autofill styles:

```css
.entity-form input:-webkit-autofill,
.entity-form input:-webkit-autofill:hover,
.entity-form input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--color-bg-input) inset;
  -webkit-text-fill-color: var(--color-text-primary);
  caret-color: var(--color-text-primary);
}
```
