# The Chronicle — Copy & Typography Rules

These rules apply globally across every component and page.
This is the highest-impact, lowest-risk file to implement first —
it is pure CSS/class changes with no structural modifications required.

---

## Text Casing Rules

| Element | Rule | CSS |
|---------|------|-----|
| Page title (h1) | ALL CAPS allowed — brand voice | `text-transform: uppercase` |
| Section headers (h2, h3) | Sentence case — never uppercase | `text-transform: none` |
| Form field labels | Sentence case — never uppercase | `text-transform: none` |
| Filter tab labels | Sentence case | `text-transform: none` |
| Button labels | Sentence case | `text-transform: none` |
| Card titles (user content) | **NEVER transform** — render as stored | `text-transform: none !important` |
| Empty state headings | Sentence case | `text-transform: none` |
| Status badges | Sentence case | `text-transform: none` |
| Navigation items | Sentence case | `text-transform: none` |
| Section group headers (CAMPAIGN, WORLD, PLAYER, GM) | ALL CAPS allowed — structural chrome | `text-transform: uppercase` |

### The cardinal rule
```
text-transform: uppercase must NEVER be applied to any element
that contains or could contain user-generated content.
```

User-generated content includes: entity names, descriptions, notes,
quest titles, NPC names, faction names, hook titles, creature names,
rumour text, session titles, handout titles, calendar event names.

---

## Font Family Rules

| Context | Font | Token |
|---------|------|-------|
| All UI chrome | Sans | `var(--font-sans)` |
| User-generated prose | Sans | `var(--font-sans)` |
| In-world dates / numeric codes | Mono | `var(--font-mono)` |
| Code blocks in notes | Mono | `var(--font-mono)` |
| Decorative headings (optional) | Serif | `var(--font-serif)` |

### Forbidden font patterns
```
NEVER use monospace on:
  - Empty state messages ("No inventory items found.")
  - Any sentence or paragraph of user content
  - Field placeholder text
  - Error messages

ONLY use monospace on:
  - In-world date values (e.g. "1320 AE", "Day 42")
  - Numeric stat values displayed as data (e.g. CR, AC, HP in Combat Tracker)
  - Actual code blocks inside rich text content
```

---

## Font Size Usage

| Context | Size token | Actual size |
|---------|-----------|-------------|
| Page title | `--text-page` | 28px |
| Card title / entity name | `--text-lg` | 16px |
| Body / form labels | `--text-base` | 13px |
| Secondary info / subtitles | `--text-sm` | 12px |
| Badges / pills / tiny labels | `--text-xs` | 11px |

Minimum font size anywhere in the app: **11px**. Never go below this.

---

## Font Weight Rules

Only two weights are used in the entire app:

- `--weight-regular` (400) — body text, labels, descriptions
- `--weight-medium` (500) — headings, card titles, active states, primary labels

**Forbidden weights: 600, 700, 800, 900.**
Heavy weights look wrong against the dark, atmospheric aesthetic.
If something feels like it needs to be bold, it usually needs size or colour instead.

---

## Placeholder Text

Placeholder text should be:
- Evocative and context-appropriate, not generic
- In sentence case
- Using `--color-text-hint` colour

Good examples (already in the app — keep these):
- "e.g. Ancient Red Dragon..."
- "They say the blacksmith..."
- "Describe this location — its sights, smells, inhabitants, history..."
- "Secret information, tactics, hidden motivations..."

Bad pattern to fix:
- "Enter character name..." → "Character name"
- Generic "Type here..." → replace with context-specific hint

---

## Label Formatting

Form field labels follow this pattern:
```
[Label text]          ← sentence case, --color-text-secondary, --text-sm
[input / textarea]    ← --color-text-primary, --text-base
```

Optional fields must be labelled:
```
Description (optional)   ← append "(optional)" in the label, same styling
```

Required fields use a subtle asterisk, not a red star:
```
Character name *         ← asterisk in --color-text-accent, no separate indicator
```

---

## Empty State Copy Pattern

Every empty state follows this structure:

```
[Icon — 32px, --color-text-secondary opacity 0.5]

[Heading — sentence case, --text-lg, --weight-medium]
[One-line description — sentence case, --text-sm, --color-text-secondary]

[CTA button — "+ Add [entity type]"]
```

The description line should:
- Tell the GM what they can do here (not just what's missing)
- Be specific to the entity type
- Keep the existing voice ("GM: plant whispers — some true, some false.")

---

## Button Label Conventions

| Action | Label |
|--------|-------|
| Create new entity | `Create` |
| Save changes | `Save` |
| Close without saving | `Cancel` |
| Confirm deletion | `Delete` |
| Add to a list | `Add` |
| Remove from a list | `Remove` |
| Upload a file | `Upload image` or `Upload portrait` |
| Proceed | `Continue` |

Never use: OK, Submit, Yes, No, Confirm (except in ConfirmDialog — see component spec).
