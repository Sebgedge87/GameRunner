# Component: OverlayCard

**Status:** ⬜ TODO
**Priority:** High — affects Factions, PlotHooks, Handouts, Bestiary, Rumours, Locations, NPCs

---

## What it is
The standard card used to display any world entity in a list view.
Has two visual states (collapsed / expanded) and delegates all actions
to an OverflowMenu — never shows inline action buttons.

---

## Anatomy

```
┌──────────────────────────────────────────────┐
│  [icon]  [Title text]          [StatusBadge] [⋯] │  ← CardHeader
├──────────────────────────────────────────────┤
│  [Body text — max 3 lines, markdown rendered]    │  ← CardBody (expanded only)
│  [Optional: secondary content slot]              │
└──────────────────────────────────────────────┘
   ↑ corner brackets rendered via ::before/::after
```

### Named slots / props

| Slot/Prop | Type | Required | Description |
|-----------|------|----------|-------------|
| `icon` | ReactNode | No | Entity type icon (16×16) |
| `title` | string | Yes | Entity name — NEVER transformed to uppercase |
| `status` | string | No | Passed to StatusBadge component |
| `actions` | ActionItem[] | Yes | Array of actions passed to OverflowMenu |
| `children` | ReactNode | No | Body content shown when expanded |
| `isExpanded` | boolean | No | Controlled expanded state |
| `onToggle` | function | No | Called when header is clicked |
| `isSelected` | boolean | No | Applies --color-border-active border |

---

## States

### Collapsed (default)
```
┌──────────────────────────────────────────────┐
│  🗡  Faction Name              [Active] [⋯]  │
└──────────────────────────────────────────────┘
```
- Shows: icon, title, StatusBadge (if status provided), OverflowMenu trigger
- Border: `1px solid var(--color-border-default)`
- Background: `var(--color-bg-card)`

### Expanded
```
┌──────────────────────────────────────────────┐
│  🗡  Faction Name              [Active] [⋯]  │
├──────────────────────────────────────────────┤
│  Description text up to three lines before   │
│  truncating with a "read more" link...        │
│                                               │
│  [Any secondary content — e.g. slider]        │
└──────────────────────────────────────────────┘
```
- Border: `1px solid var(--color-border-active)`
- Background: `var(--color-bg-card)`

### Selected (e.g. active in a list+detail layout)
- Border: `1px solid var(--color-border-active)`
- Left border accent: `3px solid var(--color-text-accent)`

---

## Corner Brackets

The decorative corner brackets are a key brand element.
Implement as CSS pseudo-elements on the card container:

```css
.overlay-card {
  position: relative;
}
.overlay-card::before,
.overlay-card::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--color-border-bracket);
  border-style: solid;
}
.overlay-card::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}
.overlay-card::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}
```

---

## OverflowMenu actions per entity type

Each entity type passes a specific set of actions to OverflowMenu.
See `components/overflow-menu.md` for OverflowMenu spec.

| Entity | Actions (in order) |
|--------|-------------------|
| Faction | Pin, Share, Edit, — Delete |
| Plot Hook | Pin, Share, Edit, — Delete |
| Handout | Pin, Share, Edit, — Delete |
| Bestiary creature | Pin, Reveal (share with players), Edit, — Delete |
| Rumour | Pin, Share, Edit, — Delete |
| NPC | Pin, Share, Edit, — Delete |
| Location | Pin, Share, Edit, — Delete |

`—` represents a visual divider before Delete.
Delete always triggers ConfirmDialog before executing.

---

## Rules

- NEVER show action buttons (Pin, Share, Edit, Delete) inline in the card body.
- NEVER apply `text-transform: uppercase` to the title prop.
- StatusBadge MUST be visible in collapsed state if a status prop is provided.
- The edit pencil icon may appear on card header hover as a shortcut — this is
  the ONLY inline action permitted, and only on hover.
- Body text renders markdown but strips heading tags (H1–H3 become bold text).
- Body text is capped at 3 lines with overflow hidden and a "show more" toggle.
- Card grid uses CSS grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`

---

## What this replaces

This component replaces the following existing patterns:

1. **Faction card** — currently shows inline "Goals: [text]" in monospace + 
   Pin/Hide/Share/Edit/Delete buttons as separate text buttons below content.

2. **Plot Hook card** — same inline action row pattern.

3. **Handout card** — same inline action row pattern.

4. **Bestiary card** — same with "Reveal" instead of "Share".

5. **Rumour card** — same inline action row pattern.

Migration: Find all instances of inline action button rows and replace with
OverlayCard + OverflowMenu. The card body content (description, goals text, etc.)
becomes the `children` slot.

---

## Example usage

```jsx
<OverlayCard
  icon={<FactionIcon />}
  title={faction.name}
  status={faction.standing > 3 ? 'allied' : faction.standing < -3 ? 'hostile' : 'neutral'}
  actions={[
    { label: 'Pin', icon: <PinIcon />, onClick: handlePin },
    { label: 'Share', icon: <ShareIcon />, onClick: handleShare },
    { label: 'Edit', icon: <EditIcon />, onClick: handleEdit },
    { type: 'divider' },
    { label: 'Delete', icon: <DeleteIcon />, onClick: handleDelete, variant: 'danger' },
  ]}
>
  <p>{faction.description}</p>
  <RelationshipSlider value={faction.standing} onChange={handleStandingChange} />
</OverlayCard>
```
