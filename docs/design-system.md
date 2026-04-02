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
