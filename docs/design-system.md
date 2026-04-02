# The Chronicle — Design System

> **Status:** Living document. Sections are added incrementally.
> Source of truth for all visual and interaction decisions.
> When this document conflicts with ad-hoc code, the document wins.

---

## Contents

1. [Design principles](#1-design-principles)
2. [Colour system](#2-colour-system)
3. [Typography](#3-typography)
4. Spacing & layout *(coming)*
5. Component library *(coming)*
6. Theme system *(coming)*
7. Interaction patterns *(coming)*
8. Writing style *(coming)*

---

## 1. Design principles

### 1.1 Atmosphere over polish

The Chronicle is not a productivity tool. It is a campaign companion — a space that should feel like the world it is running. Every visual decision is evaluated first against the question: *does this serve the fiction?* High-contrast corporate UX patterns (pure whites, heavy drop shadows, loud alerts) are rejected in favour of dark surfaces, muted palettes, and restrained motion that keep the GM and players immersed.

### 1.2 The GM is the author, not the subject

All information architecture treats the GM as a writer with a manuscript, not a user filling out forms. This shapes copy (evocative placeholder text, not generic labels), layout (rich content fields given prominence over metadata fields), and interaction (non-destructive defaults, minimal friction for creation).

### 1.3 Token-first, never hardcoded

No colour, spacing, type size, radius, or motion value is ever written as a literal in component code. Every value references a CSS custom property (token). This is what makes the theme system possible — swapping a campaign's system type rewrites the entire visual identity without touching a single component.

### 1.4 Layered theming — additive, never destructive

The theme architecture has three explicit layers, each building on the last:

- **Layer 1** — Base campaign theme (`.theme-*`) sets colours and fonts for the system being played
- **Layer 2** — Ambient FX (`.fx-*`) adds CSS-only atmospheric effects appropriate to the genre
- **Layer 3** — Dynamic data (`.dynamic-*`) responds to live campaign state (house allegiance, sanity level, threat level, plane of existence)

Each layer is purely additive. A lower layer is never modified to accommodate a higher one. Base tokens must work correctly with no FX or dynamic classes applied.

### 1.5 Two weights, maximum

The entire application uses exactly two font weights: regular (400) and medium (500). Heavier weights (600–900) are permanently forbidden. The dark atmospheric aesthetic requires restraint — if something feels like it needs bold, it usually needs *size* or *colour* instead.

### 1.6 User content is sacred

Any text entered by a GM or player is rendered exactly as stored. `text-transform` is never applied to user-generated content. Entity names, quest titles, NPC names, faction names — all are displayed as written. This is an absolute rule with no exceptions.

### 1.7 Semantic colour is universal

Success, danger, warning, and status colours are defined at `:root` and are **never overridden by any theme**. A hostile faction is always the same shade of red whether the campaign is D&D 5e or Dune. Players must always be able to read status information regardless of the active visual theme.

### 1.8 Accessibility is a floor, not a ceiling

- Minimum font size anywhere in the app: **11px**
- All animations are wrapped in `@media (prefers-reduced-motion: no-preference)`
- Delete actions always require explicit confirmation — keyboard users cannot accidentally trigger them
- Monospace font is used only for data (dates, stat values, codes) — never for readable prose

---

## 2. Colour system

### 2.1 Architecture overview

Colours are organised into four groups:

| Group | Purpose |
|-------|---------|
| **Surfaces** | Page backgrounds, card surfaces, inputs, elevated layers |
| **Borders** | Default, active, hover, GM-only, decorative brackets, danger |
| **Text** | Primary, secondary, hint, accent, danger, success, GM, disabled |
| **Semantic / Status** | Fixed across all themes — disposition, quest status, rumour truth |

A fifth group, **Forbidden values**, lists literal values that must never appear in component code.

### 2.2 Surface tokens

```css
:root {
  --color-bg-page:        #0e0b08;   /* Page background */
  --color-bg-card:        #1c1510;   /* Card / panel surface */
  --color-bg-elevated:    #231a12;   /* Elevated surface (modals, drawers) */
  --color-bg-input:       #2a1f15;   /* Input / field background */
  --color-bg-subtle:      #1a1208;   /* Subtle surface (stat blocks, sidebars) */
  --color-bg-gm:          #1e1008;   /* GM-only section background */
}
```

**Reading order:** `--color-bg-page` is the darkest. Each subsequent surface sits one visual step above the previous. Never place a surface token on a surface that is lighter than it — this breaks depth perception.

### 2.3 Border tokens

```css
:root {
  --color-border-default:  rgba(210, 140, 80, 0.18);  /* Most cards and inputs */
  --color-border-active:   rgba(210, 140, 80, 0.65);  /* Active / selected */
  --color-border-hover:    rgba(210, 140, 80, 0.35);  /* Hover state */
  --color-border-gm:       rgba(200, 60, 60, 0.30);   /* GM-only sections */
  --color-border-bracket:  rgba(210, 140, 80, 0.50);  /* Decorative corner brackets */
  --color-border-danger:   rgba(220, 80, 60, 0.50);   /* Destructive / delete */
}
```

Note that all border tokens use `rgba` — this is deliberate. Transparent borders allow the surface colour to show through and maintain contrast at all saturation levels, including when the sanity or desaturate FX layers are active.

### 2.4 Text tokens

```css
:root {
  --color-text-primary:    #e8d5b5;  /* Primary body text */
  --color-text-secondary:  #a08060;  /* Secondary / muted text */
  --color-text-hint:       #5a4030;  /* Placeholder / hint text */
  --color-text-accent:     #d4621a;  /* Accent / heading text */
  --color-text-danger:     #e05040;  /* Error / danger messages */
  --color-text-success:    #60a860;  /* Success messages */
  --color-text-gm:         #c06050;  /* GM-only label text */
  --color-text-disabled:   #3a2a1a;  /* Disabled controls */
}
```

### 2.5 Semantic / status tokens

These tokens are **fixed across all themes** and must never be overridden in any `.theme-*` class.

```css
:root {
  /* Quest / event status */
  --color-status-active:     #3a6e3a;
  --color-status-active-bg:  rgba(60, 110, 60, 0.20);

  --color-status-done:       #4a6a8a;
  --color-status-done-bg:    rgba(70, 100, 140, 0.20);

  --color-status-missed:     #8a4a30;
  --color-status-missed-bg:  rgba(140, 70, 40, 0.20);

  /* Faction / NPC disposition */
  --color-hostile:           #9a3020;
  --color-hostile-bg:        rgba(160, 50, 30, 0.20);

  --color-neutral:           #7a6a40;
  --color-neutral-bg:        rgba(120, 100, 60, 0.20);

  --color-allied:            #3a6a40;
  --color-allied-bg:         rgba(60, 110, 60, 0.20);
}
```

### 2.6 Tag palette tokens

Tags on entities (gold, blue, green, purple, red, grey) each have a full three-part token set:

```css
:root {
  --color-tag-gold-text:    #c9a84c;
  --color-tag-gold-border:  #7a6230;
  --color-tag-gold-bg:      #1a1500;

  --color-tag-blue-text:    #4c7ac9;
  --color-tag-blue-border:  #2a3a60;
  --color-tag-blue-bg:      #0f1520;

  --color-tag-green-text:   #4caf7d;
  --color-tag-green-border: #2a6040;
  --color-tag-green-bg:     #0f1a12;

  --color-tag-purple-text:  #8b4cc9;
  --color-tag-purple-border:#4a2a70;
  --color-tag-purple-bg:    #140f20;

  --color-tag-red-text:     #c94c4c;
  --color-tag-red-border:   #601a1a;
  --color-tag-red-bg:       #1a0f0f;

  --color-tag-grey-text:    #a09890;
  --color-tag-grey-border:  #3a3830;
  --color-tag-grey-bg:      #111110;
  --color-tag-grey-dim-text:#6a6460;   /* Muted variant for secondary labels */
}
```

### 2.7 Per-theme accent token

Some themes set a `--color-title` token that applies to page title text (`h1`). When not set, it falls back to `--color-accent`. The Alien RPG theme is the primary example: its title colour is a warning amber distinct from the cyan UI accent.

```css
.page-title {
  color: var(--color-title, var(--color-accent));
}
```

### 2.8 Forbidden colour values

The following values must **never** appear in component code. If a browser default injects them, they must be explicitly overridden.

```
FORBIDDEN LITERALS:
  #ffffff        — pure white; breaks all dark themes
  #000000        — pure black; use --color-bg-page instead
  #f0f0f0        — browser default input background
  gray / grey    — CSS named colours; always use a token
  white          — always use a token
  black          — always use a token
```

**Autofill override required** — browser autofill injects a white background into inputs. Override it everywhere:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--color-bg-input) inset;
  -webkit-text-fill-color: var(--color-text-primary);
  caret-color: var(--color-text-primary);
}
```

### 2.9 Theme architecture — how overrides work

The colour tokens above are `:root` defaults, active when no campaign is loaded. When a campaign is active, theme classes on `<html>` override only the tokens that change for that system. All other tokens inherit from `:root` unchanged.

```
:root defaults
  └── .theme-dune        overrides bg, accent, text tokens
        └── .fx-grain    adds CSS-only sand texture (no token changes)
              └── .dynamic-house-atreides   overrides accent + border tokens
```

The full theme system — all seven base themes, all FX classes, and all dynamic data classes — is documented in [Section 6: Theme system](#6-theme-system).

---

## 3. Typography

### 3.1 Font stack

The Chronicle uses three typeface roles:

| Role | Font | Token | Used for |
|------|------|-------|----------|
| Display | Cinzel Decorative | `--font-display` | App logo / wordmark only |
| Sans / UI | Cinzel | `--font-sans` | All UI chrome, navigation, labels |
| Serif / Body | Crimson Pro | `--font-serif` | Body text, descriptions, lore |
| Mono | JetBrains Mono | `--font-mono` | In-world dates, stat values, codes |

```css
:root {
  --font-display: 'Cinzel Decorative', serif;
  --font-sans:    'Cinzel', serif;
  --font-serif:   'Crimson Pro', serif;
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
}
```

**Google Fonts import** (add to `<head>`):
```
https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cinzel+Decorative:wght@400&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400&display=swap
```

### 3.2 Per-theme serif overrides

Some campaign systems override `--font-serif` to reinforce their setting. This is the only font token overridden per theme.

| Theme | Serif override | Rationale |
|-------|---------------|-----------|
| Call of Cthulhu | EB Garamond | More antiquarian than Crimson Pro |
| Achtung! Cthulhu | Lora | Sturdy, slightly military feel |
| All others | Crimson Pro (default) | — |

### 3.3 Type scale

```css
:root {
  --text-xs:    11px;   /* Badges, pills, tiny labels — minimum app size */
  --text-sm:    12px;   /* Secondary info, subtitles, form helper text */
  --text-base:  13px;   /* Body text, form labels, card body */
  --text-md:    14px;   /* Slightly emphasised body */
  --text-lg:    16px;   /* Card titles, entity names */
  --text-xl:    20px;   /* Section headings */
  --text-2xl:   24px;   /* Modal headings */
  --text-page:  28px;   /* Page title h1 */
}
```

**Hard floor: 11px.** No text in the application may be rendered below `--text-xs`. When in doubt, go up a size rather than down.

### 3.4 Usage by context

| Context | Token | Size |
|---------|-------|------|
| Page title (h1) | `--text-page` | 28px |
| Modal / form heading (h2) | `--text-2xl` | 24px |
| Section heading | `--text-xl` | 20px |
| Card title / entity name | `--text-lg` | 16px |
| Body text / form labels | `--text-base` | 13px |
| Secondary info / subtitles | `--text-sm` | 12px |
| Badges / pills / tiny labels | `--text-xs` | 11px |

### 3.5 Font weight

The entire application uses exactly **two weights**:

```css
:root {
  --weight-regular: 400;   /* Body text, labels, descriptions */
  --weight-medium:  500;   /* Headings, card titles, active states */
}
```

**Forbidden weights: 600, 700, 800, 900.** These are never used. If an element feels insufficiently prominent, increase its size or colour — do not increase its weight.

### 3.6 Line height

```css
:root {
  --leading-tight:  1.3;   /* Headings, card titles */
  --leading-normal: 1.6;   /* Body text, form labels */
  --leading-loose:  1.8;   /* Long-form prose, descriptions */
}
```

### 3.7 Font family rules by context

| Context | Font | Token |
|---------|------|-------|
| All UI chrome (nav, labels, buttons, badges) | Sans | `var(--font-sans)` |
| User-generated prose (descriptions, biographies, notes) | Sans | `var(--font-sans)` |
| In-world dates and numeric codes | Mono | `var(--font-mono)` |
| Numeric stat values in data tables (CR, AC, HP) | Mono | `var(--font-mono)` |
| Decorative headings (optional, theme-appropriate) | Serif | `var(--font-serif)` |
| Code blocks inside rich text content | Mono | `var(--font-mono)` |

**Monospace is never used for:**
- Empty state messages
- Sentence or paragraph content
- Field placeholder text
- Error or success messages

### 3.8 Text casing rules

| Element | Rule | Implementation |
|---------|------|----------------|
| Page title (h1) | ALL CAPS | `text-transform: uppercase` |
| Section group headers (CAMPAIGN, WORLD, GM) | ALL CAPS | `text-transform: uppercase` |
| Section headers (h2, h3) | Sentence case | `text-transform: none` |
| Form field labels | Sentence case | `text-transform: none` |
| Filter tab labels | Sentence case | `text-transform: none` |
| Button labels | Sentence case | `text-transform: none` |
| Status badges | Sentence case | `text-transform: none` |
| Navigation items | Sentence case | `text-transform: none` |
| Empty state headings | Sentence case | `text-transform: none` |
| **Card titles / entity names** | **Never transform** | `text-transform: none !important` |

#### The cardinal rule

> `text-transform: uppercase` must **never** be applied to any element that contains or could contain user-generated content.

User-generated content includes: entity names, descriptions, notes, quest titles, NPC names, faction names, hook titles, creature names, rumour text, session titles, handout titles, calendar event names. When in doubt, assume the field contains user content and leave it untransformed.

---

## 4. Spacing & layout

### 4.1 Spacing scale

The spacing scale is a fixed set of tokens defined on `:root`. No other values are used — if a measurement does not exist in this scale, the closest token is used instead. Spacing, unlike colour, is **never overridden by themes**.

```css
:root {
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
}
```

### 4.2 Component-specific spacing tokens

In addition to the base scale, a set of named tokens encode the correct spacing for recurring layout contexts. These must be used instead of the base scale wherever they apply — they make the intent explicit and keep measurements consistent across all pages.

```css
:root {
  --space-form-gap:      16px;   /* Vertical gap between fields within a form section */
  --space-form-section:  28px;   /* Gap between distinct sections within a form */
  --space-card-padding:  16px;   /* Internal padding inside all card surfaces */
  --space-card-gap:      12px;   /* Gap between cards in a grid */
  --space-page-padding:  24px;   /* Left/right padding of page content area */
  --space-sidebar-width: 240px;  /* Fixed width of the EntityForm portrait sidebar */
}
```

### 4.3 Border radius scale

```css
:root {
  --radius-xs:    2px;    /* Input fields */
  --radius-sm:    3px;    /* Buttons, badges */
  --radius-md:    4px;    /* Cards, panels */
  --radius-lg:    6px;    /* Modals, drawers */
  --radius-pill:  100px;  /* Status badges, filter tabs */
}
```

Radius values follow a strict hierarchy: inputs are tightest, modals are loosest, pills are fully rounded. The Dune house system overrides `--radius-card` and `--radius-md` per house to reinforce faction character (e.g. Harkonnen uses `0px` — no mercy).

### 4.4 Motion tokens

All animation durations and easing curves are tokenised. **All animations must be wrapped in `@media (prefers-reduced-motion: no-preference)`** — this is a hard rule with no exceptions.

```css
:root {
  --duration-fast:   120ms;                        /* Hover states, opacity fades */
  --duration-base:   200ms;                        /* Most transitions */
  --duration-slow:   350ms;                        /* Modals, drawers, page transitions */
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1); /* General purpose */
  --ease-in:         cubic-bezier(0.4, 0, 1, 1);   /* Elements leaving the screen */
  --ease-out:        cubic-bezier(0, 0, 0.2, 1);   /* Elements entering the screen */
}
```

### 4.5 Z-index scale

Layering is governed by a fixed six-level scale. Never use arbitrary z-index values.

```css
:root {
  --z-base:      0;    /* Default document flow */
  --z-raised:    10;   /* Cards on hover */
  --z-dropdown:  100;  /* OverflowMenu popovers */
  --z-drawer:    200;  /* Side panels (Timeline detail, Mindmap inspector) */
  --z-modal:     300;  /* EntityForm modals, ConfirmDialog */
  --z-toast:     400;  /* Toast notifications */
  --z-top:       500;  /* Global navigation, FX overlay layers */
}
```

Each level is intentionally spaced by 100 to allow internal stacking within a layer if needed without breaking the global order.

### 4.6 Page structure

Every page in the app follows the same structural skeleton: a fixed global navigation bar on the left, and a scrollable content area to its right.

```
┌──────────────────────────────────────────────────────────┐
│  Global Nav (fixed, left)  │  Page content area          │
│  width: ~56px collapsed    │  padding: --space-page-      │
│         ~200px expanded    │           padding (24px)     │
│                            │                              │
│  [nav items]               │  [PageHeader]                │
│                            │  [Controls / FilterTabs]     │
│                            │  [ContentArea]               │
│                            │                              │
└──────────────────────────────────────────────────────────┘
```

The content area is always scrollable. The nav is always fixed. No page-level layout deviates from this structure.

### 4.7 Card grid layout

All entity list pages display their cards in a responsive CSS grid. The grid is set on the ContentArea container — never on individual card components.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-card-gap);   /* 12px */
}
```

- Minimum card width: **280px**. Cards never shrink below this.
- The grid fills available width and reflows automatically as the viewport changes.
- No fixed column counts — `auto-fill` handles responsive reflow.
- The dashed "Add entity" card inside the grid is **forbidden**. The add action lives in the PageHeader only.

### 4.8 List page structure

All entity list pages (NPCs, Locations, Factions, Plot Hooks, Handouts, Bestiary, Rumours, Inventory, Maps, Timeline) share this exact layout. Deviating from it is not permitted.

```
┌─────────────────────────────────────────────────────┐
│  [Page title h1]               [+ Add Entity btn]   │  ← PageHeader
├─────────────────────────────────────────────────────┤
│  [Search input]                                      │  ← Controls
│  [FilterTabs — if applicable]                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Card grid]                                         │  ← ContentArea
│   — or —                                             │    min-height: 400px
│  [EmptyState — centred]                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

Rules:
- The `+ Add [Entity]` button is **always** in PageHeader top-right. Never inside ContentArea.
- When the list is empty, ContentArea shows `EmptyState` centred within its full height.
- When items exist, ContentArea shows the card grid. The add button remains in PageHeader.
- ContentArea has `min-height: 400px` so EmptyState has vertical room to centre.

### 4.9 EntityForm layout (two-column shell)

All create and edit forms use the EntityForm two-column shell. The layout is fixed — individual forms customise their field content within it, not the shell itself.

```
┌──────────────────────────────────────────────────────────────┐
│  [h2] Create [Entity Type]                                    │  FormHeader
├─────────────────────────────────────────────────────────────-┤
│  [Name / Title field — full width]                            │  NameRow
├──────────────────┬───────────────────────────────────────────┤
│  FormSidebar     │  FormMain                                  │
│  240px fixed     │  flex: 1                                   │
│                  │                                            │
│  [Dropzone]      │  [Description / Biography / Briefing]      │
│  [Upload label]  │  [Other player-visible fields]             │
│                  │                                            │
│  ┌─ DETAILS ───┐ │  ┌─────────────────────────────────────┐  │
│  │ Type        │ │  │  🔒 GM ONLY   Private Notes          │  │
│  │ Status      │ │  │  [GM notes field]                    │  │
│  │ Stats       │ │  └─────────────────────────────────────┘  │
│  └─────────────┘ │                                            │
├──────────────────┴───────────────────────────────────────────┤
│  [Cancel]  [Create / Save]                                    │  StickyFormFooter
└──────────────────────────────────────────────────────────────┘
```

Layout rules:
- **Name/Title** is always the first field, always full width, always above the sidebar split.
- **Sidebar** is always `var(--space-sidebar-width)` (240px) fixed. Never wider, never narrower.
- **Main content** is `flex: 1`, takes all remaining horizontal space.
- **GmOnlySection** is always the last element in the main content column.
- Field gap within a section: `var(--space-form-gap)` (16px).
- Gap between distinct sections: `var(--space-form-section)` (28px).
- On viewports narrower than 640px, the sidebar stacks above main content.
- The `StickyFormFooter` is `position: sticky; bottom: 0` inside the scrollable form container — it scrolls with the form, not fixed to the viewport.

### 4.10 Modal sizing

| Form type | Max width |
|-----------|-----------|
| Complex forms (NPC, Faction, Location, Quest) | 760px |
| Simple forms (Rumour, Hook, Inventory item) | 480px |
| ConfirmDialog | 400px |

All modals are centred in the viewport. Background overlay: `rgba(0, 0, 0, 0.65)`. Clicking the overlay or pressing Escape closes the modal (same as Cancel).

---

## 5. Component library

All components are registered in `COMPONENTS.md`, which is the single source of truth. Every named component has exactly one spec. Never create a new component for something that matches an existing name — import the existing one instead.

### Component registry

| Component | Status | Purpose |
|-----------|--------|---------|
| `OverlayCard` | ✅ Built | Standard entity card — collapsed / expanded, all actions via OverflowMenu |
| `OverflowMenu` | ✅ Built | ⋯ trigger + action popover — replaces all inline action button rows |
| `ConfirmDialog` | ✅ Built | Destructive action confirmation modal |
| `EntityForm` | ✅ Built | Standard create / edit form shell (two-column layout) |
| `Dropzone` | ✅ Built | File / image upload — replaces all `<input type="file">` |
| `EmptyState` | ✅ Built | Zero-content placeholder, always centred |
| `ListPage` | ✅ Built | Standard list page shell (header, search, filters, content area) |
| `FilterTabs` | ✅ Built | Horizontal status / type filter tabs |
| `RichTextField` | ✅ Built | Decides rich editor vs plain textarea by field type |
| `StickyFormFooter` | ✅ Built | Sticky Cancel / Create footer inside forms |
| `StatusBadge` | ✅ Built | Semantic status pill (Active, Hostile, Allied, etc.) |
| `RelationshipSlider` | ✅ Built | Faction Hostile → Allied disposition slider |

---

### 5.1 OverlayCard

The standard card used to display any world entity in a list view. Has two visual states (collapsed / expanded) and delegates all actions to an OverflowMenu — it never shows inline action buttons.

#### Anatomy

```
┌──────────────────────────────────────────────────┐
│  [icon]  [Title text]         [StatusBadge]  [⋯] │  ← CardHeader
├──────────────────────────────────────────────────┤
│  [Body text — max 3 lines, markdown rendered]     │  ← CardBody (expanded only)
│  [Optional: secondary content slot]               │
└──────────────────────────────────────────────────┘
   ↑ corner brackets rendered via CSS ::before/::after
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | node | No | Entity type icon, 16×16 |
| `title` | string | Yes | Entity name — never transformed to uppercase |
| `status` | string | No | Passed directly to StatusBadge |
| `actions` | ActionItem[] | Yes | Array of actions passed to OverflowMenu |
| `children` | node | No | Body content shown when expanded |
| `isExpanded` | boolean | No | Controlled expanded state |
| `onToggle` | function | No | Called when the card header is clicked |
| `isSelected` | boolean | No | Applies `--color-border-active` border |

#### States

**Collapsed (default)**
```
┌──────────────────────────────────────────────────┐
│  🗡  Faction Name                  [Active]  [⋯] │
└──────────────────────────────────────────────────┘
```
- Visible: icon, title, StatusBadge (if provided), OverflowMenu trigger
- Border: `1px solid var(--color-border-default)`
- Background: `var(--color-bg-card)`

**Expanded**
```
┌──────────────────────────────────────────────────┐
│  🗡  Faction Name                  [Active]  [⋯] │
├──────────────────────────────────────────────────┤
│  Description text up to three lines before        │
│  truncating with a "show more" toggle...          │
│                                                   │
│  [Secondary content slot — e.g. RelationshipSlider] │
└──────────────────────────────────────────────────┘
```
- Border: `1px solid var(--color-border-active)`
- Background: `var(--color-bg-card)`

**Selected** (active item in a list+detail layout)
- Border: `1px solid var(--color-border-active)`
- Left accent: `3px solid var(--color-text-accent)`

#### Corner brackets

The decorative corner brackets at top-left and bottom-right are a core brand element. They are implemented as CSS pseudo-elements — never as actual DOM nodes.

```css
.overlay-card { position: relative; }

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
  top: -1px; left: -1px;
  border-width: 2px 0 0 2px;   /* top-left corner */
}
.overlay-card::after {
  bottom: -1px; right: -1px;
  border-width: 0 2px 2px 0;   /* bottom-right corner */
}
```

#### OverflowMenu actions per entity type

The `actions` array passed to each card is fixed per entity type. The order below is the required order.

| Entity | Actions |
|--------|---------|
| Faction | Pin, Share, Edit, `---`, Delete |
| Plot Hook | Pin, Share, Edit, `---`, Delete |
| Handout | Pin, Share, Edit, `---`, Delete |
| Bestiary creature | Pin, Reveal, Edit, `---`, Delete |
| Rumour | Pin, Share, Edit, `---`, Delete |
| NPC | Pin, Share, Edit, `---`, Delete |
| Location | Pin, Share, Edit, `---`, Delete |

`---` = a visual divider item (`{ type: 'divider' }`). Delete always opens ConfirmDialog before executing.

#### Rules

- Action buttons (Pin, Share, Edit, Delete) are **never** shown inline in the card body or header.
- `text-transform` is **never** applied to the `title` prop.
- StatusBadge must be visible in the collapsed state whenever a `status` prop is provided.
- The edit pencil icon may appear on card header hover as a convenience shortcut — this is the **only** inline action permitted, and only on hover.
- Body text renders markdown but heading tags (H1–H3) are converted to bold text, not actual headings.
- Body text is capped at 3 lines; overflow is hidden with a "show more" toggle.

#### Example

```jsx
<OverlayCard
  icon={<FactionIcon />}
  title={faction.name}
  status={faction.standing > 3 ? 'allied' : faction.standing < -3 ? 'hostile' : 'neutral'}
  actions={[
    { label: 'Pin',    icon: <PinIcon />,    onClick: handlePin },
    { label: 'Share',  icon: <ShareIcon />,  onClick: handleShare },
    { label: 'Edit',   icon: <EditIcon />,   onClick: handleEdit },
    { type: 'divider' },
    { label: 'Delete', icon: <DeleteIcon />, onClick: () => setConfirmOpen(true), variant: 'danger' },
  ]}
>
  <p>{faction.description}</p>
  <RelationshipSlider value={faction.standing} onChange={handleStandingChange} />
</OverlayCard>
```

---

### 5.2 OverflowMenu

A ⋯ trigger button that opens a small positioned popover listing actions for an entity. Used inside every OverlayCard. Replaces all inline action button rows.

#### Anatomy

```
[⋯]  ← trigger, top-right of CardHeader, opacity 0 until hover/focus

      ┌──────────────────┐
      │  📌  Pin          │
      │  👁  Share        │
      │  ✏️  Edit         │
      ├──────────────────┤  ← divider
      │  🗑  Delete       │  ← danger colour
      └──────────────────┘
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `actions` | ActionItem[] | Yes | List of action items to render |
| `placement` | `'bottom-end'` \| `'bottom-start'` | No | Default: `'bottom-end'` |

#### ActionItem type

```ts
type ActionItem =
  | {
      type?: 'action';
      label: string;               // sentence case
      icon: ReactNode;             // 16×16
      onClick: () => void;
      variant?: 'default' | 'danger';
      disabled?: boolean;
    }
  | { type: 'divider' }
```

#### Visual spec

```css
/* Trigger — hidden until parent card is hovered or menu is open */
.overflow-menu-trigger {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: transparent; border: none; cursor: pointer;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}
.overlay-card:hover .overflow-menu-trigger,
.overflow-menu-trigger[aria-expanded="true"] { opacity: 1; }
.overflow-menu-trigger:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}

/* Popover */
.overflow-menu-popover {
  position: absolute;
  z-index: var(--z-dropdown);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 4px; min-width: 140px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Action item */
.overflow-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  cursor: pointer; white-space: nowrap;
}
.overflow-menu-item:hover         { background: rgba(255, 255, 255, 0.06); }
.overflow-menu-item.danger        { color: var(--color-text-danger); }
.overflow-menu-item.danger:hover  { background: rgba(220, 80, 60, 0.12); }

/* Divider */
.overflow-menu-divider {
  height: 1px;
  background: var(--color-border-default);
  margin: 4px 0;
}
```

#### Behaviour rules

- Popover opens on trigger click.
- Popover closes when: clicking outside, pressing Escape, or clicking any action item.
- Default placement is `bottom-end` (right-aligned to trigger). Flips to `top-end` if the popover would overflow the viewport bottom.
- Only one OverflowMenu may be open at a time — opening a new one closes any existing open menu.
- The trigger button is `opacity: 0` until the parent card is hovered or the trigger receives keyboard focus.
- Trigger must have `aria-label="More actions"` and `aria-haspopup="true"`.
- Popover must have `role="menu"`. Each item must have `role="menuitem"`.

#### Delete action — delegation pattern

OverflowMenu does **not** handle delete confirmation itself. When the Delete item is clicked:

1. The popover closes immediately.
2. The parent component opens ConfirmDialog.
3. The actual delete function only executes if the user confirms.

```jsx
{
  label: 'Delete',
  icon: <DeleteIcon />,
  variant: 'danger',
  onClick: () => setConfirmDeleteOpen(true),  // opens ConfirmDialog, NOT the delete fn
}
```

#### Forbidden pattern

```jsx
{/* This pattern is forbidden everywhere in the app */}
<div className="card-actions">
  <button>📌 Pin</button>
  <button>👁 Hide</button>
  <button>🔗 Share</button>
  <button>✏️ Edit</button>
  <button className="danger">🗑 Delete</button>
</div>
```

Remove any instance of this pattern and replace with OverlayCard + OverflowMenu.

---

### 5.3 EntityForm

The standard shell for every create and edit form in the application. Every entity type (NPC, Quest, Location, Faction, Job, Map, Bestiary, Handout, Rumour, Hook, Key-item, Inventory item) uses this exact layout. Individual forms supply their field content into the named slots — they do not customise the shell structure.

#### Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  [h2] Create [Entity Type]                                    │  FormHeader
├──────────────────────────────────────────────────────────────┤
│  [Name / Title field — full width]                            │  NameRow
├──────────────────┬───────────────────────────────────────────┤
│  FormSidebar     │  FormMain                                  │
│  240px fixed     │  flex: 1                                   │
│                  │                                            │
│  [Dropzone]      │  [Description / Biography / Briefing]      │
│  [Upload label]  │  [Other player-visible fields]             │
│                  │                                            │
│  ┌─ DETAILS ───┐ │  ┌─────────────────────────────────────┐  │
│  │ Type        │ │  │  🔒 GM ONLY   Private Notes          │  │
│  │ Status      │ │  │  [GM notes field]                    │  │
│  │ Stats…      │ │  └─────────────────────────────────────┘  │
│  └─────────────┘ │                                            │
├──────────────────┴───────────────────────────────────────────┤
│  [Cancel]  [Create / Save]                                    │  StickyFormFooter
└──────────────────────────────────────────────────────────────┘
```

#### Props / slots

| Slot | Description |
|------|-------------|
| `entityType` | String shown in heading: "Create NPC", "Create Quest" |
| `nameField` | Title/name input — always full width, always first |
| `sidebarImage` | Dropzone variant: `'square'`, `'banner'`, or `null` |
| `sidebarDetails` | Metadata fields (type, status, standing, stats, etc.) |
| `mainContent` | Primary content fields (description, biography, lore, etc.) |
| `gmSection` | GmOnlySection — always the last element in the main column |
| `onSubmit` | Form submit handler |
| `onCancel` | Cancel / close handler |
| `primaryLabel` | `"Create"` for new entities, `"Save"` for edits |

#### Sidebar variants

| Variant | Used for | Dropzone |
|---------|----------|----------|
| With portrait | NPC, Faction, Bestiary, Location | `variant="square"` (180×180px) at top of sidebar |
| Without portrait | Quest, Hook, Handout, Rumour, Inventory | No Dropzone; Details card fills full sidebar width |
| Banner image | Map | `variant="banner"` spans full width above the sidebar/main split |

When there are no metadata fields, the sidebar may be omitted entirely and the main content column goes full width.

#### Details card (sidebar metadata block)

```
┌─────────────────────┐
│ DETAILS             │  ← uppercase allowed — this is UI chrome, not user content
├─────────────────────┤
│ Type                │
│ [select input]      │
│                     │
│ Status              │
│ [select input]      │
└─────────────────────┘
```

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

#### Layout rules

- Name/Title is always the **first** field, always **full width**, always **above** the sidebar split.
- Sidebar is always `240px` fixed (`--space-sidebar-width`). Never wider or narrower.
- Main content column is `flex: 1`.
- At viewport < 640px, sidebar stacks above main content.
- GmOnlySection is always **last** in the main content column.
- Field gap within a section: `var(--space-form-gap)` (16px).
- Gap between distinct sections: `var(--space-form-section)` (28px).

#### Autofill override

All inputs inside EntityForm must suppress the browser's white autofill background:

```css
.entity-form input:-webkit-autofill,
.entity-form input:-webkit-autofill:hover,
.entity-form input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--color-bg-input) inset;
  -webkit-text-fill-color: var(--color-text-primary);
  caret-color: var(--color-text-primary);
}
```

#### Form-to-EntityForm migration map

| Form | Was | EntityForm config |
|------|-----|-------------------|
| Create NPC | Portrait-left split | Square portrait, sidebar has character metadata |
| Create Location | Portrait-left split | Square portrait, sidebar has type/danger level |
| Create Faction | Portrait-left split | Square portrait, sidebar has standing/influence |
| Create Bestiary | Portrait-left split | Circular portrait, sidebar has stat block |
| Create Quest | Single column modal | No portrait, sidebar has type/status/urgency/rewards |
| Create Job | Two-column ad-hoc | No portrait, sidebar has type/difficulty/reward |
| Create Map | Two-column ad-hoc | Banner image variant |
| Create Handout | Single column modal | No portrait, no sidebar — mainContent only |
| Create Hook | Single column modal | No portrait, minimal sidebar |
| Create Rumour | Single column modal | No portrait, sidebar has source NPC/location |
| Create Inventory | Single column modal | No portrait, sidebar has quantity/holder |
| Create Key-item | Single column modal | Square portrait, sidebar has significance/linked quest |

---

### 5.4 ConfirmDialog

A modal that gates every destructive action. No delete may execute without passing through this component first.

#### Anatomy

```
┌──────────────────────────────────────┐
│  Delete quest?                        │  ← "Delete [entityType]?"
│                                       │
│  "The Burning Keep" will be           │  ← entity name in quotes
│  permanently deleted. This cannot    │
│  be undone.                           │
│                                       │
│  [      Cancel      ] [   Delete   ]  │
└──────────────────────────────────────┘
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls visibility |
| `entityType` | string | Yes | e.g. `"quest"`, `"NPC"`, `"faction"` |
| `entityName` | string | Yes | The entity's actual name |
| `onConfirm` | function | Yes | Called when Delete is clicked |
| `onCancel` | function | Yes | Called on Cancel, overlay click, or Escape |

#### Rules

- Cancel button receives **default focus** when the dialog opens — prevents accidental Enter-key deletion.
- Delete button uses `--color-text-danger` text and `--color-border-danger` border.
- The entity name is always shown **in quotes** in the body text.
- Clicking the overlay → same as Cancel.
- Pressing Escape → same as Cancel.
- Max width: 400px. Always centred in the viewport.
- z-index: `var(--z-modal)`.

---

### 5.5 EmptyState

The zero-content placeholder shown whenever a list has no entities. Always centred inside ContentArea. Always includes a CTA that triggers the create action.

#### Anatomy

```
         [icon — 32px, muted]

      No factions yet
  Add factions to track the political
  landscape of your world.

       [+ Add faction]
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | node | Yes | 32px icon at muted opacity |
| `heading` | string | Yes | e.g. `"No factions yet"` |
| `description` | string | Yes | One line of GM-directed context |
| `ctaLabel` | string | Yes | e.g. `"+ Add faction"` |
| `onCta` | function | Yes | Triggers the create action |

#### CSS

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
  min-height: 300px;
}
```

#### Rules

- **Never** position in the bottom-right of the viewport. Always centred in ContentArea.
- Icon: 32px, `--color-text-secondary`, `opacity: 0.5`.
- Heading: `--text-lg`, `--weight-medium`, `--color-text-primary`, sentence case.
- Description: `--text-sm`, `--color-text-secondary`, sentence case.
- CTA: outline style, `--color-text-accent` border and text.
- CTA label always starts with `+`.
- The CTA triggers the same action as the `+ Add [Entity]` button in the PageHeader.

---

### 5.6 ListPage

The standard page shell for all entity list pages. Provides PageHeader, search, FilterTabs, and ContentArea in a fixed structure. All list pages use this shell without deviation.

#### Props / slots

| Slot | Description |
|------|-------------|
| `title` | Page heading (ALL CAPS applied via CSS) |
| `subtitle` | Optional one-line description below title |
| `ctaLabel` | `"+ Add [Entity]"` button label |
| `onCta` | Triggered by the add button |
| `searchPlaceholder` | e.g. `"Search factions..."` |
| `onSearch` | Search handler |
| `tabs` | Array of `{ label, value, count? }` for FilterTabs (optional) |
| `activeTab` | Currently active tab value |
| `onTabChange` | Tab change handler |
| `children` | Card grid or EmptyState |

#### Layout

```
┌───────────────────────────────────────────────────┐
│  [h1 title]                   [+ Add Entity btn]  │  PageHeader
├───────────────────────────────────────────────────┤
│  [Search input]                                    │  Controls
│  [FilterTabs — only if tabs provided]              │
├───────────────────────────────────────────────────┤
│  [Card grid]  — or —  [EmptyState centred]         │  ContentArea
│  min-height: 400px                                 │
└───────────────────────────────────────────────────┘
```

#### Rules

- `+ Add [Entity]` is **always** in PageHeader top-right. Never in ContentArea.
- FilterTabs row is not rendered when `tabs` is empty or undefined.
- ContentArea has `min-height: 400px` so EmptyState has room to centre vertically.

---

### 5.7 FilterTabs

A horizontal row of pill-shaped filter buttons. Used on list pages to filter the card grid by status or entity type.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `{ label, value, count? }[]` | Tab definitions |
| `active` | string | Currently active tab value |
| `onChange` | function | Called with new value on click |

#### Visual spec

```css
.filter-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.filter-tab {
  height: 28px;
  padding: 4px 14px;
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
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

#### Rules

- Tab labels are sentence case — never ALL CAPS or Title Case.
- All tabs are the same height (28px) regardless of label length.
- "All" tab is always first and always present.
- Optional count: shown inside the label as `Active (3)` in muted colour.

---

### 5.8 Dropzone

A styled file and image upload area. Replaces every `<input type="file">` in the application. The native file input is handled internally and never exposed in the DOM directly.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `accept` | string | e.g. `"image/*"` |
| `value` | File \| string \| null | Current value — File object or URL string |
| `onChange` | function | Called with the selected File |
| `onRemove` | function | Called when the × button is clicked |
| `label` | string | e.g. `"Upload portrait"` |
| `hint` | string | e.g. `"PNG, JPG up to 5MB"` |
| `variant` | `'square'` \| `'banner'` | `square` for portraits, `banner` for wide images |

#### States

**Empty**
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [↑]
  Click or drag to upload       ← --color-text-secondary
  PNG, JPG up to 5MB            ← --color-text-hint, --text-xs
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Filled**
```
┌───────────────────────────┐
│                           │
│   [image preview]      [×]│
│                           │
└───────────────────────────┘
```

**Drag-over** — border switches to `--color-border-active`, background to `rgba(212, 98, 26, 0.06)`.

#### CSS

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
.dropzone:hover,
.dropzone.drag-over {
  border-color: var(--color-border-active);
  background: rgba(212, 98, 26, 0.06);
}
```

#### Rules

- `<input type="file">` must **never** appear directly in any component. Always use Dropzone.
- After an image is selected, show a visual preview — never just a filename.
- The × remove button is always visible when an image is loaded.

---

### 5.9 StatusBadge

A small pill showing an entity's current status or disposition. Used on collapsed OverlayCards and in table rows.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `status` | string | Status value — see mapping table below |
| `size` | `'sm'` \| `'md'` | Default: `'sm'` |

#### Status → colour mapping

| Value | Label | Background | Border |
|-------|-------|------------|--------|
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

#### Rules

- Status text is always sentence case (`"Active"`, never `"ACTIVE"`).
- Border radius: `--radius-pill`.
- Font size: `--text-xs` (11px).
- Never use arbitrary colours — always map through the table above.

---

### 5.10 StickyFormFooter

A sticky footer inside modal and full-page forms. Always shows Cancel and the primary action. Remains visible at the bottom of the form regardless of scroll position.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `primaryLabel` | string | `"Create"` or `"Save"` |
| `onPrimary` | function | Submit handler |
| `onCancel` | function | Cancel / close handler |
| `isLoading` | boolean | Shows spinner on primary button; disables interaction |
| `isDisabled` | boolean | Disables the primary button |

#### CSS

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
  z-index: 1;
}
```

#### Rules

- Cancel is left, primary action is to its right — both are left-aligned in the footer (not `space-between`).
- Cancel: transparent background, `--color-border-default` border, `--color-text-secondary` text.
- Primary: `--color-border-active` border, `--color-text-accent` text.
- Both buttons use sentence case labels.
- `position: sticky; bottom: 0` places the footer inside the scrollable container — it is **not** fixed to the viewport.
- When `isLoading` is true, the primary button shows a spinner and is non-interactive.

---

### 5.11 RichTextField

A smart wrapper that renders either a rich text editor (with toolbar) or a plain `<textarea>` based on the field type. The caller passes a `fieldType` string — the component makes the render decision internally.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `fieldType` | `RichFieldType` \| `PlainFieldType` | Determines which editor renders |
| `value` | string | Current content |
| `onChange` | function | Change handler |
| `placeholder` | string | Placeholder text |
| `minHeight` | number | Minimum height in px |

#### Field type decision

**Renders rich text editor (toolbar: B I H2 H3 • □ " </> —):**

```
biography · description · lore · briefing
gm-notes · private-notes · content · body
```

**Renders plain `<textarea>`:**

```
goals · player-notes · summary · significance
rumour-text · source · notes · title · name
reward · item-description
```

#### Rules

- Never show the rich text toolbar on plain field types.
- Toolbar buttons are identical across all rich text fields.
- Plain textareas auto-resize vertically to their content.
- Rich text fields have a fixed minimum height of 120px with internal scrolling.

---

### 5.12 RelationshipSlider

A horizontal slider representing a faction's or NPC's disposition toward the party, running from Hostile (−10) to Allied (+10) with Neutral at zero.

The slider maps numeric values to the three semantic disposition tokens:

| Range | Label | Token |
|-------|-------|-------|
| −10 to −4 | Hostile | `--color-hostile` / `--color-hostile-bg` |
| −3 to +3 | Neutral | `--color-neutral` / `--color-neutral-bg` |
| +4 to +10 | Allied | `--color-allied` / `--color-allied-bg` |

#### Rules

- The slider track colour updates in real time to reflect the current disposition zone.
- The current value is passed to StatusBadge to show the corresponding label pill.
- Helper text shown below the slider: `(−10 = hostile, +10 = allied)`.
- Used inside the OverlayCard `children` slot for Faction and NPC cards.

---

## 6. Theme system

### 6.1 Architecture overview

The theme system has four layers. Each is additive — a lower layer is never modified to accommodate a higher one. Base tokens must work correctly with no FX or dynamic classes present.

```
Layer 0  .theme-none               No campaign active (home / login)
Layer 1  .theme-{name}             Base token overrides per game system
Layer 2  .fx-{effect}              CSS-only ambient effects per system
Layer 3  .dynamic-{key}-{value}    Programmatic overrides from live campaign data
```

All four classes are applied to `<html>`. Only one theme class and one FX class are active at a time. Multiple dynamic classes may coexist if different subsystems are active simultaneously.

```html
<!-- Layer 1 only -->
<html class="theme-dune">

<!-- Layers 1 + 2 -->
<html class="theme-dune fx-grain">

<!-- Layers 1 + 2 + 3 -->
<html class="theme-dune fx-grain dynamic-house-atreides">
```

**Switching rule:** When a campaign is loaded or changed, strip all existing `theme-*`, `fx-*`, and `dynamic-*` classes before applying the new set. Never accumulate stale classes.

### 6.2 Layer 0 — No campaign state

Applied to `<html>` when no campaign is active (home screen, login, campaign selection). A neutral blue-slate palette — intentionally distinct from all campaign themes so the user feels they are outside any world.

```css
.theme-none {
  --color-bg-page:        #0d1014;
  --color-bg-card:        #141820;
  --color-bg-elevated:    #1a2028;
  --color-bg-input:       #1e2530;
  --color-bg-subtle:      #10141a;
  --color-bg-gm:          #10141a;
  --color-accent:         #5a7a8a;
  --color-accent-muted:   rgba(90,122,138,0.18);
  --color-text-primary:   #c8d8e4;
  --color-text-secondary: #3a5060;
  --color-text-hint:      #1e3040;
  --color-border-default: rgba(80,120,150,0.14);
  --color-border-active:  rgba(80,120,150,0.55);
  --color-border-gm:      rgba(80,120,150,0.14);
  --color-border-bracket: rgba(80,120,150,0.30);
}
```

### 6.3 Layer 1 — Base themes

Each theme overrides the surface, accent, text, and border tokens only. Spacing, typography, motion, and z-index are never theme-scoped. Semantic status colours (`--color-success`, `--color-danger`, `--color-warning`, `--color-gm`) are defined on `:root` and are **never overridden** by any theme class.

#### System → theme class mapping

| Campaign system | Class | Character |
|-----------------|-------|-----------|
| None / default | `.theme-default` | Warm amber on near-black |
| `dnd5e` | `.theme-dnd5e` | Forgotten Realms crimson |
| `coc` | `.theme-cthulhu` | Tidal green, desaturated |
| `alien` | `.theme-alien` | Cold cyan, near-black |
| `coriolis` | `.theme-coriolis` | Station violet |
| `dune` | `.theme-dune` | Desert gold |
| `achtung` | `.theme-achtung` | Wartime khaki |

#### `.theme-default` — warm amber

```css
.theme-default {
  --color-bg-page:        #0e0b08;   --color-bg-card:        #1c1510;
  --color-bg-elevated:    #231a12;   --color-bg-input:       #2a1f15;
  --color-bg-subtle:      #160e06;   --color-bg-gm:          #1a0e06;
  --color-accent:         #b87828;   --color-accent-muted:   rgba(184,120,40,0.16);
  --color-text-primary:   #e8d5b5;   --color-text-secondary: #7a5a3a;
  --color-text-hint:      #4e3520;
  --color-border-default: rgba(185,125,55,0.18);
  --color-border-active:  rgba(185,125,55,0.65);
  --color-border-gm:      rgba(180,70,30,0.30);
  --color-border-bracket: rgba(185,125,55,0.45);
}
```

#### `.theme-dnd5e` — forgotten realms crimson

```css
.theme-dnd5e {
  --color-bg-page:        #0c0804;   --color-bg-card:        #180c06;
  --color-bg-elevated:    #200e08;   --color-bg-input:       #280e08;
  --color-bg-subtle:      #100806;   --color-bg-gm:          #180806;
  --color-accent:         #c84020;   --color-accent-muted:   rgba(200,64,32,0.16);
  --color-text-primary:   #f0d0b0;   --color-text-secondary: #6a3020;
  --color-text-hint:      #3a1810;
  --color-border-default: rgba(180,50,20,0.20);
  --color-border-active:  rgba(180,50,20,0.65);
  --color-border-gm:      rgba(180,30,20,0.30);
  --color-border-bracket: rgba(180,50,20,0.45);
}
```

#### `.theme-cthulhu` — tidal green

```css
.theme-cthulhu {
  --color-bg-page:        #060a0a;   --color-bg-card:        #0c1414;
  --color-bg-elevated:    #101a1a;   --color-bg-input:       #141e1e;
  --color-bg-subtle:      #080e0e;   --color-bg-gm:          #080e0e;
  --color-accent:         #6a8888;   --color-accent-muted:   rgba(106,136,136,0.16);
  --color-text-primary:   #c0d0c8;   --color-text-secondary: #3a5850;
  --color-text-hint:      #1e3030;
  --color-border-default: rgba(80,120,110,0.18);
  --color-border-active:  rgba(80,120,110,0.60);
  --color-border-gm:      rgba(80,120,80,0.28);
  --color-border-bracket: rgba(80,120,110,0.40);
  /* Serif override */
  --font-serif: 'EB Garamond', serif;
}
```

#### `.theme-alien` — cold cyan

```css
.theme-alien {
  --color-bg-page:        #060810;   --color-bg-card:        #0c1018;
  --color-bg-elevated:    #101420;   --color-bg-input:       #141828;
  --color-bg-subtle:      #080c16;   --color-bg-gm:          #080c16;
  --color-accent:         #5a9aaa;   --color-accent-muted:   rgba(90,154,170,0.15);
  --color-text-primary:   #b8d0da;   --color-text-secondary: #2a4858;
  --color-text-hint:      #182030;
  --color-border-default: rgba(70,130,150,0.16);
  --color-border-active:  rgba(70,130,150,0.60);
  --color-border-gm:      rgba(70,130,100,0.25);
  --color-border-bracket: rgba(70,130,150,0.38);
}
```

#### `.theme-coriolis` — station violet

```css
.theme-coriolis {
  --color-bg-page:        #080610;   --color-bg-card:        #100c1c;
  --color-bg-elevated:    #161028;   --color-bg-input:       #1c1430;
  --color-bg-subtle:      #0c0a18;   --color-bg-gm:          #0c0a18;
  --color-accent:         #8a78c8;   --color-accent-muted:   rgba(138,120,200,0.15);
  --color-text-primary:   #d0c8f0;   --color-text-secondary: #3a2e60;
  --color-text-hint:      #201a40;
  --color-border-default: rgba(110,90,180,0.18);
  --color-border-active:  rgba(110,90,180,0.62);
  --color-border-gm:      rgba(110,60,180,0.28);
  --color-border-bracket: rgba(110,90,180,0.42);
}
```

#### `.theme-dune` — desert gold

```css
.theme-dune {
  --color-bg-page:        #0a0804;   --color-bg-card:        #160e04;
  --color-bg-elevated:    #1e1206;   --color-bg-input:       #241608;
  --color-bg-subtle:      #120a04;   --color-bg-gm:          #120a04;
  --color-accent:         #c8a040;   --color-accent-muted:   rgba(200,160,64,0.14);
  --color-text-primary:   #f0e0b0;   --color-text-secondary: #806020;
  --color-text-hint:      #402e10;
  --color-border-default: rgba(200,160,50,0.14);
  --color-border-active:  rgba(200,160,50,0.58);
  --color-border-gm:      rgba(200,100,30,0.28);
  --color-border-bracket: rgba(200,160,50,0.38);
}
```

#### `.theme-achtung` — wartime khaki

```css
.theme-achtung {
  --color-bg-page:        #0a0c06;   --color-bg-card:        #141608;
  --color-bg-elevated:    #1a1c0c;   --color-bg-input:       #1e2010;
  --color-bg-subtle:      #0e1006;   --color-bg-gm:          #0e1006;
  --color-accent:         #a89060;   --color-accent-muted:   rgba(168,144,96,0.15);
  --color-text-primary:   #ddd8b8;   --color-text-secondary: #4a4a28;
  --color-text-hint:      #2a2a14;
  --color-border-default: rgba(140,130,80,0.16);
  --color-border-active:  rgba(140,130,80,0.58);
  --color-border-gm:      rgba(160,80,40,0.28);
  --color-border-bracket: rgba(140,130,80,0.38);
  /* Serif override */
  --font-serif: 'Lora', serif;
}
```

### 6.4 Layer 2 — Ambient FX classes

Pure CSS effects applied alongside the base theme class. No JavaScript. Each FX class is independent — it can be tested against `.theme-default` without breaking anything. All animations must be wrapped in `@media (prefers-reduced-motion: no-preference)` without exception.

| FX class | System | Effect |
|----------|--------|--------|
| `.fx-crt` | Alien RPG | Full-viewport scanline overlay via `body::before` (repeating-linear-gradient, `rgba(0,255,180,0.03)`); phosphor flicker animation on `h1` (`crt-flicker`, 6s, steps(1)); monospace font on `.nav-label` and `.field-label`. |
| `.fx-grain` | Dune | SVG fractalNoise texture tiled across the viewport via `body::after` (200px tile, opacity 0.6); heading letter-spacing widened to `0.22em` for inscription feel. |
| `.fx-desaturate` | Call of Cthulhu | Radial gradient ink-bleed on `.card::after` (transparent 60% → black 40% at edges); on hover, cards slowly drain to `saturate(0.2) brightness(0.9)` over 2 seconds (motion-safe); body text rendered in Courier New for typewriter feel. |
| `.fx-parchment` | Achtung! Cthulhu | SVG fractalNoise paper texture on `.card` backgrounds; status badges get dashed borders and wide letter-spacing for a rubber-stamp look; GM-only sections show a faint diagonal "CLASSIFIED" watermark via `::before`. |
| `.fx-stars` | Coriolis | Five radial-gradient pinpoint stars fixed to the viewport background via `body::before`; cards on hover get a slow conic-gradient holographic shimmer animation (`holo-rotate`, 3s linear). |
| `.fx-vignette` | D&D 5e | Radial gradient vignette on `.card::after` (transparent 55% → black 35% at edges); the first letter of `.entity-description p:first-child` becomes an illuminated drop cap in `--font-display` at 2.8em. |

### 6.5 Layer 3 — Dynamic data classes

Applied programmatically from live campaign data. JavaScript reads campaign state, calculates the appropriate class name, strips any existing `dynamic-*` classes, and adds the new one.

**Stripping pattern — always run before applying a new dynamic class:**

```js
const cl = document.documentElement.classList
Array.from(cl)
  .filter(c => c.startsWith('dynamic-'))
  .forEach(c => cl.remove(c))
```

#### Dune — house accents (full worked example)

The Dune house system is the canonical Layer 3 implementation. When a GM selects a Great House in the campaign settings, the interface immediately shifts to reflect that house's visual identity — accent colour, border character, and border radius all change in unison.

**How it works end to end:**

1. GM selects a house in the GM Dashboard settings tab (dropdown, `dnd_setting` field)
2. `previewHouse()` writes the value to `activeCampaign.dune_house` in the Pinia store
3. `applyTheme()` is called via `nextTick()` — it strips existing `dynamic-*` classes, then adds `dynamic-house-{name}`
4. On "Save Changes", the value is persisted to `campaigns.dune_house` via `PUT /api/campaigns/:id`
5. On tab switch without saving, the watch on `activeTab` reverts the preview to the last persisted value

**Live preview revert pattern:**
```js
// savedHouse tracks last persisted value
watch(activeTab, (newTab, oldTab) => {
  if (oldTab !== 'settings' || newTab === 'settings') return
  if (campForm.value.dune_house !== savedHouse.value) {
    campForm.value.dune_house = savedHouse.value
    campaign.activeCampaign.dune_house = savedHouse.value || null
    campaign.applyTheme(campaign.activeCampaign?.system)
  }
})
```

**The five house classes:**

```css
/* Atreides — blue-green, noble, rounded corners */
.dynamic-house-atreides {
  --color-accent:         #4a8878;
  --color-border-bracket: rgba(74,136,120,0.5);
  --radius-card: 6px;
}

/* Harkonnen — blood red, brutal, zero radius */
.dynamic-house-harkonnen {
  --color-accent:         #a02818;
  --color-border-bracket: rgba(160,40,24,0.6);
  --radius-card: 0px;
  --radius-md:   0px;
}

/* Corrino — imperial gold */
.dynamic-house-corrino {
  --color-accent:         #c8a000;
  --color-border-bracket: rgba(200,160,0,0.55);
}

/* Fremen — sand tan, austere */
.dynamic-house-fremen {
  --color-accent:       #b89050;
  --color-text-primary: #e8d8a0;
}

/* Bene Gesserit — deep purple, controlled */
.dynamic-house-bene-gesserit {
  --color-accent:         #7858a8;
  --color-border-bracket: rgba(120,88,168,0.5);
}
```

**Note on legacy variable compatibility:** The existing `base.css` uses old variable names (`--bg`, `--accent`, `--text`, `--border2`). Dynamic house classes must set both the new `--color-*` semantic tokens and the legacy names for visual changes to take effect across all components.

#### Alien RPG — threat level (summary)

Six classes `.dynamic-threat-0` through `.dynamic-threat-5` shift `--color-accent` from normal cyan (0) through amber (1–2) to red (3–5). At levels 4 and 5, a `filter: saturate()` is also applied to the entire UI, progressively draining colour from the interface as the situation deteriorates.

#### Call of Cthulhu — sanity atmosphere (summary)

Five classes `.dynamic-sanity-0` through `.dynamic-sanity-4` apply a CSS `filter` to `<html>` based on average party sanity, entered manually by the GM in the Overview tab. Band 4 (80–100 SAN) is normal. Band 0 (0–19 SAN) applies `saturate(0) sepia(0.3) hue-rotate(320deg) contrast(1.1)` — full greyscale with a red tint. The sanity band is calculated as `Math.min(4, Math.floor(avg_sanity / 20))`.

#### D&D 5e — setting/plane (summary)

Three classes override `--color-bg-page`, `--color-bg-card`, and `--color-accent` to shift the UI toward the visual identity of the active plane: `.dynamic-setting-ravenloft` (gothic purple), `.dynamic-setting-spelljammer` (void blue), `.dynamic-setting-eberron` (arcane cyan). Selected via a dropdown in GM Dashboard settings, same live-preview/revert pattern as house selection.

### 6.6 Implementation checklist

#### Phase 1 — Base themes ✅ Complete

- [x] All theme classes added to `themes.css`
- [x] Google Fonts import added to `index.html`
- [x] `theme-none` applied when no campaign is active
- [x] `campaign.system` read on load; correct `.theme-{name}` applied to `<html>`
- [x] Theme class stripped and reapplied on campaign switch
- [x] Semantic colours untouched across all themes
- [x] `data-theme` attribute kept for legacy `[data-theme]` CSS rules

#### Phase 2 — Ambient FX ✅ Complete

- [x] `.fx-crt` built and applied alongside `.theme-alien`
- [x] `.fx-grain` built and applied alongside `.theme-dune`
- [x] `.fx-desaturate` built and applied alongside `.theme-cthulhu`
- [x] `.fx-parchment` built and applied alongside `.theme-achtung`
- [x] `.fx-stars` built and applied alongside `.theme-coriolis`
- [x] `.fx-vignette` built and applied alongside `.theme-dnd5e`
- [x] All animations wrapped in `prefers-reduced-motion`

#### Phase 3 — Dynamic data ✅ Complete

- [x] `applyTheme()` strips all `dynamic-*` before applying new classes
- [x] Dune: house selector in GM Dashboard, live preview, persist on save, revert on discard
- [x] Dune: `dune_house` column in `campaigns` table, migration added
- [x] CoC: average party sanity widget in Overview tab, `avg_sanity` column added
- [x] CoC: sanity band calculated and `.dynamic-sanity-{0-4}` applied
- [x] D&D 5e: setting/plane selector in GM Dashboard, same preview/revert pattern
- [x] D&D 5e: `dnd_setting` column in `campaigns` table, migration added

