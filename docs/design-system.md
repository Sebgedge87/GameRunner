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

