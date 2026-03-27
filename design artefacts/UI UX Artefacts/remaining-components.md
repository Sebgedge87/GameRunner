# Component: ConfirmDialog

**Status:** ⬜ TODO
**Priority:** High — must exist before OverflowMenu delete action works

---

## What it is
A modal dialog that appears before any destructive action.
Prevents accidental deletes by requiring explicit confirmation.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls visibility |
| `entityType` | string | Yes | e.g. "quest", "NPC", "faction" |
| `entityName` | string | Yes | The entity's actual name |
| `onConfirm` | function | Yes | Called when Delete is clicked |
| `onCancel` | function | Yes | Called when Cancel is clicked or overlay/Escape pressed |

## Anatomy

```
┌──────────────────────────────────────┐
│  Delete quest?                        │  ← heading: "Delete [entityType]?"
│                                       │
│  "The Burning Keep" will be           │  ← body: entity name in quotes
│  permanently deleted. This cannot    │
│  be undone.                           │
│                                       │
│  [      Cancel      ] [   Delete   ]  │  ← footer
└──────────────────────────────────────┘
```

## Rules
- Cancel button has default focus when dialog opens (prevents Enter-key accident).
- Delete button uses `--color-text-danger` and `--color-border-danger`.
- Entity name is shown in quotes in the body text.
- Clicking overlay → same as Cancel.
- Pressing Escape → same as Cancel.
- Max width: 400px. Centred in viewport.

---
---

# Component: EmptyState

**Status:** ⬜ TODO
**Priority:** High — fixes layout on every list page

---

## What it is
The zero-content placeholder shown when a list has no entities.
Always centred. Always includes a CTA.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | ReactNode | Yes | 32px icon, muted colour |
| `heading` | string | Yes | e.g. "No factions yet" |
| `description` | string | Yes | One line, GM-directed context |
| `ctaLabel` | string | Yes | e.g. "+ Add faction" |
| `onCta` | function | Yes | Triggers the create action |

## Layout

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-8);
  gap: var(--space-3);
  width: 100%;
  /* Takes full height of its container */
  min-height: 300px;
}
```

## Rules
- NEVER position bottom-right. Always centred in ContentArea.
- Icon: 32px, `--color-text-secondary`, opacity 0.5.
- Heading: `--text-lg`, `--weight-medium`, `--color-text-primary`, sentence case.
- Description: `--text-sm`, `--color-text-secondary`, sentence case.
- CTA button: outline style, `--color-text-accent` border and text.
- CTA label always starts with "+".

---
---

# Component: ListPage

**Status:** ⬜ TODO
**Priority:** High — fixes layout on every list page

---

## What it is
The standard page shell for all entity list pages.
Provides the header, search, filters, and content area.

## Props / Slots

| Slot | Description |
|------|-------------|
| `title` | Page heading string (ALL CAPS via CSS) |
| `subtitle` | Optional one-line description |
| `ctaLabel` | "+ Add [Entity]" button label |
| `onCta` | Function triggered by the add button |
| `searchPlaceholder` | e.g. "Search factions..." |
| `onSearch` | Search handler |
| `tabs` | Array of FilterTab items (optional) |
| `activeTab` | Currently active tab value |
| `onTabChange` | Tab change handler |
| `children` | Card grid or EmptyState |

## Layout

```
┌────────────────────────────────────────────────────┐
│ PageHeader                                          │
│  [h1 title]                    [+ Add Entity btn]  │
├────────────────────────────────────────────────────┤
│ Controls                                            │
│  [SearchInput        ]                              │
│  [FilterTabs — if tabs provided]                    │
├────────────────────────────────────────────────────┤
│ ContentArea                                         │
│  children (card grid or EmptyState)                 │
└────────────────────────────────────────────────────┘
```

## Rules
- The "+ Add [Entity]" CTA is ALWAYS in PageHeader, top-right. Never in ContentArea.
- If `tabs` prop is empty or undefined, the FilterTabs row is not rendered.
- ContentArea has `min-height: 400px` so EmptyState has room to centre.

---
---

# Component: FilterTabs

**Status:** ⬜ TODO

---

## What it is
A horizontal row of filter buttons (All / Active / Delivered / etc.)
used on list pages to filter entity cards by status or type.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | Tab[] | Array of `{ label, value, count? }` |
| `active` | string | Currently active tab value |
| `onChange` | function | Called with new value on click |

## Visual spec

```css
.filter-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-tab {
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  /* All tabs same height — never let label length affect height */
  height: 28px;
  display: flex;
  align-items: center;
}

.filter-tab.active {
  border-color: var(--color-border-active);
  color: var(--color-text-accent);
  background: rgba(212, 98, 26, 0.10);
}

.filter-tab:hover:not(.active) {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
```

## Rules
- Tab labels are sentence case (not ALL CAPS, not Title Case).
- All tabs are the same height (28px) regardless of label length.
- "All" tab is always first and always present.
- Optional count badge: `[Active (3)]` — count in muted colour inside the tab.

---
---

# Component: Dropzone

**Status:** ⬜ TODO
**Priority:** High — replaces all native file inputs

---

## What it is
A styled file/image upload area. Replaces every `<input type="file">` in the app.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `accept` | string | e.g. "image/*" |
| `value` | File \| string \| null | Current value (File object or URL string) |
| `onChange` | function | Called with File on upload |
| `onRemove` | function | Called when × is clicked |
| `label` | string | e.g. "Upload portrait" |
| `hint` | string | e.g. "PNG, JPG up to 5MB" |
| `variant` | 'square' \| 'banner' | square = portrait, banner = wide image |

## States

### Empty state
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [↑ icon]
  Click or drag to upload          ← --color-text-secondary
  PNG, JPG up to 5MB               ← --color-text-hint, --text-xs
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### Filled state (image uploaded)
```
┌─────────────────────────────┐
│                             │
│   [image preview]        [×]│  ← × removes the image
│                             │
└─────────────────────────────┘
```

### Drag-over state
```
Border changes to --color-border-active
Background: rgba(212, 98, 26, 0.06)
```

## CSS

```css
.dropzone {
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--duration-fast), background var(--duration-fast);
  background: transparent;
}
.dropzone.square { width: 180px; height: 180px; }
.dropzone.banner { width: 100%; height: 120px; }
.dropzone:hover, .dropzone.drag-over {
  border-color: var(--color-border-active);
  background: rgba(212, 98, 26, 0.06);
}
```

## Rules
- `<input type="file">` must NEVER appear directly in any component.
- Always use Dropzone instead.
- Dropzone handles the hidden `<input type="file">` internally.
- After an image is selected, show a preview — never just show a filename.
- The × remove button is always visible when an image is loaded.

---
---

# Component: StatusBadge

**Status:** ⬜ TODO

---

## What it is
A small pill showing an entity's current status.
Used on collapsed OverlayCards and in table rows (GM Dashboard players table).

## Props

| Prop | Type | Description |
|------|------|-------------|
| `status` | string | Status value — see table below |
| `size` | 'sm' \| 'md' | Default: 'sm' |

## Status → colour mapping

| Status value | Text | Bg token | Border token |
|-------------|------|----------|--------------|
| `active` | Active | `--color-status-active-bg` | `--color-status-active` |
| `completed` | Completed | `--color-status-done-bg` | `--color-status-done` |
| `delivered` | Delivered | `--color-status-done-bg` | `--color-status-done` |
| `missed` | Missed | `--color-status-missed-bg` | `--color-status-missed` |
| `expired` | Expired | `--color-status-missed-bg` | `--color-status-missed` |
| `hostile` | Hostile | `--color-hostile-bg` | `--color-hostile` |
| `neutral` | Neutral | `--color-neutral-bg` | `--color-neutral` |
| `allied` | Allied | `--color-allied-bg` | `--color-allied` |
| `true` | True | `--color-allied-bg` | `--color-allied` |
| `false` | False | `--color-hostile-bg` | `--color-hostile` |
| `exposed` | Exposed | `--color-status-done-bg` | `--color-status-done` |

## Rules
- Status text is ALWAYS sentence case ("Active", not "ACTIVE").
- Badge uses `--radius-pill` border radius.
- Font size: `--text-xs` (11px).
- Never use arbitrary colours — always map to the table above.

---
---

# Component: StickyFormFooter

**Status:** ⬜ TODO
**Priority:** High — fixes all long create/edit forms

---

## What it is
A sticky footer inside modal forms and full-page forms.
Always shows Cancel and the primary action (Create / Save).
Always visible regardless of scroll position within the form.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `primaryLabel` | string | "Create" or "Save" |
| `onPrimary` | function | Submit handler |
| `onCancel` | function | Cancel handler |
| `isLoading` | boolean | Shows loading state on primary button |
| `isDisabled` | boolean | Disables primary button |

## CSS

```css
.sticky-form-footer {
  position: sticky;
  bottom: 0;
  padding: var(--space-4) var(--space-6);
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-default);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-start;
  align-items: center;
  /* Ensure footer sits above scrolling content */
  z-index: 1;
}
```

## Rules
- Cancel is always left, primary action always right — wait, actually: Cancel left, Create right,
  but both left-aligned in the footer (not space-between). This matches the existing button placement.
- Cancel: transparent background, `--color-border-default` border, `--color-text-secondary` text.
- Primary (Create/Save): `--color-border-active` border, `--color-text-accent` text.
- Both buttons use sentence case labels.
- When `isLoading` is true: primary button shows a spinner, is non-interactive.
- The footer must be inside the scrollable modal/form container, not fixed to the viewport.
  `position: sticky; bottom: 0` achieves this correctly.

---
---

# Component: RichTextField

**Status:** ⬜ TODO

---

## What it is
A wrapper that decides whether to render a rich text editor (with toolbar)
or a plain `<textarea>` based on the field name/type.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `fieldType` | RichFieldType \| PlainFieldType | Determines which editor renders |
| `value` | string | Current content |
| `onChange` | function | Change handler |
| `placeholder` | string | Placeholder text |
| `minHeight` | number | Minimum height in px |

## Field type decision table

```ts
type RichFieldType =
  | 'biography'
  | 'description'
  | 'lore'
  | 'briefing'
  | 'gm-notes'
  | 'private-notes'
  | 'content'       // Handouts
  | 'body'          // Notes page

type PlainFieldType =
  | 'goals'
  | 'player-notes'
  | 'summary'
  | 'significance'
  | 'rumour-text'
  | 'source'
  | 'notes'         // short notes fields
  | 'title'
  | 'name'
  | 'reward'
  | 'item-description'
```

Rich text editor renders for `RichFieldType`.
Plain `<textarea>` renders for `PlainFieldType`.

## Rules
- Never show the rich text toolbar on plain field types.
- The toolbar buttons (B I H2 H3 etc.) are the same across all rich text fields.
- Plain textareas auto-resize vertically to their content (use `rows` attribute or auto-resize JS).
- Rich text fields have a fixed minimum height of 120px with internal scrolling.
