# Component: OverflowMenu

**Status:** ⬜ TODO
**Priority:** High — required by OverlayCard before OverlayCard can be built

---

## What it is
A ⋯ trigger button that opens a small positioned popover containing
a list of actions. Used on every OverlayCard. Replaces all inline
action button rows (Pin / Hide / Share / Edit / Delete).

---

## Anatomy

```
[⋯]  ← trigger button, always top-right of card header

    ┌──────────────┐
    │ 📌 Pin        │
    │ 👁 Share      │
    │ ✏️ Edit       │
    ├──────────────┤  ← divider separates destructive actions
    │ 🗑 Delete     │  ← danger colour
    └──────────────┘
```

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `actions` | ActionItem[] | Yes | List of actions to render |
| `placement` | 'bottom-end' \| 'bottom-start' | No | Default: 'bottom-end' |

### ActionItem type

```ts
type ActionItem =
  | {
      type?: 'action';           // default
      label: string;             // sentence case
      icon: ReactNode;           // 16×16 icon
      onClick: () => void;
      variant?: 'default' | 'danger';  // default: 'default'
      disabled?: boolean;
    }
  | {
      type: 'divider';           // renders a horizontal rule
    }
```

---

## Visual spec

### Trigger button
```css
.overflow-menu-trigger {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;                          /* hidden by default */
  transition: opacity var(--duration-fast) var(--ease-default);
}

/* Show trigger on card hover or when menu is open */
.overlay-card:hover .overflow-menu-trigger,
.overflow-menu-trigger[aria-expanded="true"] {
  opacity: 1;
}

.overflow-menu-trigger:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}
```

### Popover
```css
.overflow-menu-popover {
  position: absolute;
  z-index: var(--z-dropdown);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### Action item
```css
.overflow-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  white-space: nowrap;
}

.overflow-menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.overflow-menu-item.danger {
  color: var(--color-text-danger);
}

.overflow-menu-item.danger:hover {
  background: rgba(220, 80, 60, 0.12);
}
```

### Divider
```css
.overflow-menu-divider {
  height: 1px;
  background: var(--color-border-default);
  margin: 4px 0;
}
```

---

## Behaviour rules

- Popover opens on trigger click.
- Popover closes on: clicking outside, pressing Escape, clicking any action item.
- Popover is positioned with `placement: 'bottom-end'` by default (aligns to right edge of trigger).
- If popover would overflow viewport bottom, flip to `top-end`.
- Only one OverflowMenu can be open at a time — opening a new one closes any existing open menu.
- Trigger button is visually hidden (opacity: 0) until card hover or keyboard focus.
- Trigger must have `aria-label="More actions"` and `aria-haspopup="true"`.
- Popover must have `role="menu"`. Each item must have `role="menuitem"`.

---

## Delete action behaviour

When an action with `variant: 'danger'` and label `'Delete'` is clicked:
1. Close the OverflowMenu popover immediately.
2. Open ConfirmDialog (see `components/confirm-dialog.md`).
3. Only execute the `onClick` callback if the user confirms in ConfirmDialog.

The OverflowMenu itself does NOT handle the confirmation — it delegates to the
parent which is responsible for showing ConfirmDialog.

Recommended pattern:
```jsx
{
  label: 'Delete',
  icon: <DeleteIcon />,
  variant: 'danger',
  onClick: () => setConfirmDeleteOpen(true)  // opens ConfirmDialog, not the delete fn
}
```

---

## What this replaces

Replaces all instances of the inline action pattern:
```jsx
{/* FORBIDDEN — remove this pattern everywhere */}
<div className="card-actions">
  <button>📌 Pin</button>
  <button>👁 Hide</button>
  <button>🔗 Share</button>
  <button>✏️ Edit</button>
  <button className="danger">🗑 Delete</button>
</div>
```

Found on: FactionCard, PlotHookCard, HandoutCard, BestiaryCard, RumourCard, and any other entity card with inline action buttons.
