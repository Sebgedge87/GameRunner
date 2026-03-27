# The Chronicle — Interaction Patterns

Behavioural rules that apply across the entire app.
When in doubt about how something should behave, find the rule here.

---

## 1. List Page Layout

Every list page (NPCs, Locations, Factions, Plot Hooks, Maps, Bestiary,
Rumours, Inventory, Timeline, Handouts) follows this exact structure:

```
┌─────────────────────────────────────────────────────┐
│  [Page title]                    [+ Add Entity btn]  │  ← PageHeader
├─────────────────────────────────────────────────────┤
│  [Search input]                                      │  ← SearchBar
│  [FilterTabs]                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Entity cards grid]                                 │  ← ContentArea
│  — or —                                              │
│  [EmptyState]                                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Rules
- The "+ Add [Entity]" button lives in the PageHeader top-right. ALWAYS.
- The dashed "ADD ENTITY" card in the grid position is FORBIDDEN.
- When zero entities exist, ContentArea shows EmptyState (not an add card).
- When entities exist, ContentArea shows a card grid. Add button remains in header.
- The EmptyState CTA button triggers the same action as the header "+ Add" button.

---

## 2. Empty State

Every zero-content section uses the EmptyState component.
See `components/empty-state.md` for full spec.

### Rules
- EmptyState is always centred horizontally and vertically within ContentArea.
- EmptyState is NEVER positioned in the bottom-right of the viewport.
- EmptyState always includes a CTA that creates the missing entity type.
- Empty state copy is always contextual — see COPY_RULES.md.

---

## 3. Destructive Actions (Delete)

Any action that permanently removes data follows this exact flow:

```
User clicks Delete in OverflowMenu
        ↓
ConfirmDialog opens (see components/confirm-dialog.md)
        ↓
Dialog shows: "Delete [entity type] '[entity name]'? This cannot be undone."
        ↓
Two buttons: [Cancel] (default focus) and [Delete] (danger style)
        ↓
Cancel → closes dialog, no action
Delete → executes deletion, closes dialog, shows success toast
```

### Rules
- Delete is NEVER executed on first click. ConfirmDialog is mandatory.
- ConfirmDialog must name the entity type AND the entity name.
- Cancel must be the default-focused button (prevents accidental Enter-key delete).
- After successful delete, show a brief toast: "[Entity name] deleted."

---

## 4. Card Expansion & Actions

Entity cards use the OverlayCard component (see `components/overlay-card.md`).

### Rules
- Cards have two states: collapsed (header only) and expanded (header + body).
- Click anywhere on a collapsed card → expands it.
- Click again → collapses it.
- Actions (Pin, Share, Edit, Delete) live ONLY in the OverflowMenu (⋯).
- OverflowMenu trigger is always top-right of the card header.
- No action buttons are ever shown inline in the card body.
- The edit pencil icon (shortcut to Edit) may appear on card header hover — this
  is the only inline action permitted, and only as a hover affordance.

---

## 5. Form Footers

All create and edit forms have a sticky footer.

```
[        Cancel        ] [        Create / Save        ]
```

### Rules
- Footer is sticky at the bottom of the form container, always visible.
- This applies to both modal forms and full-page forms.
- Cancel is always left, primary action always right.
- Primary action label: "Create" for new entities, "Save" for edits.
- Both buttons use sentence case (see COPY_RULES.md).
- See `components/sticky-form-footer.md` for implementation.

---

## 6. File / Image Upload

All file upload interactions use the Dropzone component.
`<input type="file">` is FORBIDDEN anywhere in the app.

### Rules
- Any field that accepts an image or file uses `<Dropzone>`.
- Dropzone shows: icon + "Click or drag to upload" + accepted format hint.
- After upload: show thumbnail preview with a remove (×) button.
- See `components/dropzone.md` for full spec.

---

## 7. Rich Text vs Plain Textarea

Rich text editor (with toolbar: B I H2 H3 • □ " </> —) is used ONLY on:
- `Biography` fields
- `Description` / `Description / Lore` fields
- `Briefing` fields
- `GM Notes` / `Private Notes` fields
- `Content` fields (Handouts)
- `Body` fields (Notes)

Plain `<textarea>` is used on ALL other text fields, including:
- Goals
- Player Notes (short)
- Summary
- Significance
- Rumour Text
- Source fields
- Any field with a short expected input

See `components/rich-text-field.md` for the full decision rule.

---

## 8. GM-Only Sections

Any section containing information hidden from players follows this pattern:

```
┌─────────────────────────────────────────────────────┐  ← --color-border-gm
│  🔒 GM ONLY    Private Notes                        │  ← header with lock + label
│                                                      │
│  [content field]                                     │
└─────────────────────────────────────────────────────┘
```

### Rules
- GM-only sections use `--color-bg-gm` background and `--color-border-gm` border.
- The 🔒 icon and "GM ONLY" badge are always visible.
- GM-only sections always appear at the bottom of forms, after all player-visible fields.
- The label "Private Notes" uses sentence case with a capital P only.
- Never use ALL CAPS on "PRIVATE NOTES" — "GM ONLY" badge is the visual differentiator.

---

## 9. Modals

Create and Edit forms open as modals (except Notes, which uses inline panel).

### Rules
- Modal uses corner-bracket decoration (CSS ::before/::after on the container).
- Modal has `--color-bg-elevated` background.
- Modal border: `--color-border-active`.
- Modal max-width: 760px for complex forms, 480px for simple forms.
- Modal is always scrollable internally — the footer is sticky within the modal.
- Background overlay: `rgba(0, 0, 0, 0.65)`.
- Clicking the overlay closes the modal (same as Cancel).
- Escape key closes the modal (same as Cancel).

---

## 10. Tooltips & Helper Text

When a control's purpose is not obvious from its label:

```
[Label]  ⓘ
[input]
[helper text — one line, --text-sm, --color-text-secondary]
```

### Rules
- Helper text appears below the input, not above.
- Helper text is always one line maximum.
- Use helper text for: "Secret — recipient won't see your name",
  "Needs ack — you'll be notified when read", "(−10 = hostile, +10 = allied)"
- Do not use tooltips-on-hover as the only way to communicate important info.

---

## 11. Status Badges

All entity statuses use the StatusBadge component.
See `components/status-badge.md` for colours per status value.

### Rules
- Status badges are always visible on collapsed OverlayCards.
- Status badges use sentence case ("Active", not "ACTIVE").
- Status badges use semantic colours from TOKENS.md (not arbitrary colours).

---

## 12. Notifications / Toast Messages

After any create, save, delete, or share action, show a brief toast.

```
[✓ Entity name created.]    ← success, 3 second auto-dismiss, top-right
[✕ Something went wrong.]   ← error, stays until dismissed
```

### Rules
- Toast uses `--z-toast` z-index.
- Success toasts auto-dismiss after 3000ms.
- Error toasts require manual dismissal.
- Toast text is sentence case.
- Maximum one toast visible at a time (queue additional ones).
