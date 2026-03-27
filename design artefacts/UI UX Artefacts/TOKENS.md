# The Chronicle — Design Tokens

All colour, spacing, typography, and motion values live here as CSS custom properties.
Claude Code must NEVER hardcode any of these values — always reference the token name.

> **Theme overrides:** The colour tokens below are the `:root` defaults (used when no
> campaign theme is active). Per-system theme overrides live in THEMES.md. Themes only
> override colour tokens — spacing, typography, motion, and z-index are never theme-scoped.

---

## How to use
Define these on `:root` in your global CSS file (e.g. `globals.css` or `tokens.css`).
Theme overrides (Dune, Cthulhu, etc.) redefine only the tokens that change per theme —
all components stay the same, only the token values shift.

---

## Colour — Surfaces

```css
:root {
  /* Page background */
  --color-bg-page:          #0e0b08;

  /* Card / panel surface */
  --color-bg-card:          #1c1510;

  /* Elevated surface (modals, drawers) */
  --color-bg-elevated:      #231a12;

  /* Input / field background */
  --color-bg-input:         #2a1f15;

  /* Subtle surface (stat blocks, sidebars) */
  --color-bg-subtle:        #1a1208;

  /* GM-only section background */
  --color-bg-gm:            #1e1008;
}
```

## Colour — Borders

```css
:root {
  /* Default border — most cards and inputs */
  --color-border-default:   rgba(210, 140, 80, 0.18);

  /* Active / selected border */
  --color-border-active:    rgba(210, 140, 80, 0.65);

  /* Hover border */
  --color-border-hover:     rgba(210, 140, 80, 0.35);

  /* GM-only section border */
  --color-border-gm:        rgba(200, 60, 60, 0.30);

  /* Decorative corner brackets */
  --color-border-bracket:   rgba(210, 140, 80, 0.50);

  /* Danger / destructive border */
  --color-border-danger:    rgba(220, 80, 60, 0.50);
}
```

## Colour — Text

```css
:root {
  /* Primary body text */
  --color-text-primary:     #e8d5b5;

  /* Secondary / muted text */
  --color-text-secondary:   #a08060;

  /* Placeholder / hint text */
  --color-text-hint:        #5a4030;

  /* Accent / heading text */
  --color-text-accent:      #d4621a;

  /* Danger text */
  --color-text-danger:      #e05040;

  /* Success text */
  --color-text-success:     #60a860;

  /* GM-only label text */
  --color-text-gm:          #c06050;

  /* Disabled text */
  --color-text-disabled:    #3a2a1a;
}
```

## Colour — Semantic / Status

```css
:root {
  /* Active / open status */
  --color-status-active:    #3a6e3a;
  --color-status-active-bg: rgba(60, 110, 60, 0.20);

  /* Delivered / complete status */
  --color-status-done:      #4a6a8a;
  --color-status-done-bg:   rgba(70, 100, 140, 0.20);

  /* Missed / expired status */
  --color-status-missed:    #8a4a30;
  --color-status-missed-bg: rgba(140, 70, 40, 0.20);

  /* Hostile disposition */
  --color-hostile:          #9a3020;
  --color-hostile-bg:       rgba(160, 50, 30, 0.20);

  /* Neutral disposition */
  --color-neutral:          #7a6a40;
  --color-neutral-bg:       rgba(120, 100, 60, 0.20);

  /* Allied disposition */
  --color-allied:           #3a6a40;
  --color-allied-bg:        rgba(60, 110, 60, 0.20);
}
```

## Colour — Forbidden values
These values must NEVER appear in component code. If a browser default injects them,
they must be overridden.

```
FORBIDDEN:
  #ffffff        — pure white (breaks dark theme)
  #000000        — pure black (use --color-bg-page instead)
  #f0f0f0        — browser default input background
  gray / grey    — always use a token, never CSS named colours
  white          — always use a token
  black          — always use a token

AUTOFILL OVERRIDE REQUIRED:
  input:-webkit-autofill must be styled with:
    -webkit-box-shadow: 0 0 0 1000px var(--color-bg-input) inset;
    -webkit-text-fill-color: var(--color-text-primary);
```

---

## Spacing

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

  /* Component-specific */
  --space-form-gap:        16px;   /* vertical gap between form fields */
  --space-form-section:    28px;   /* gap between form sections */
  --space-card-padding:    16px;   /* internal card padding */
  --space-card-gap:        12px;   /* gap between cards in a grid */
  --space-page-padding:    24px;   /* page content left/right padding */
  --space-sidebar-width:   240px;  /* entity form portrait sidebar */
}
```

## Border Radius

```css
:root {
  --radius-xs:    2px;   /* input fields */
  --radius-sm:    3px;   /* buttons, badges */
  --radius-md:    4px;   /* cards, panels */
  --radius-lg:    6px;   /* modals, drawers */
  --radius-pill:  100px; /* status badges, filter tabs */
}
```

## Typography

```css
:root {
  --font-sans:   'YourSansFont', system-ui, sans-serif;
  --font-serif:  'YourSerifFont', Georgia, serif;
  --font-mono:   'JetBrains Mono', 'Courier New', monospace;

  /* Scale */
  --text-xs:     11px;
  --text-sm:     12px;
  --text-base:   13px;
  --text-md:     14px;
  --text-lg:     16px;
  --text-xl:     20px;
  --text-2xl:    24px;
  --text-page:   28px;   /* page title h1 */

  /* Weight */
  --weight-regular: 400;
  --weight-medium:  500;

  /* FORBIDDEN weight values: 600, 700, 800, 900 */
  /* Use --weight-medium (500) as the heaviest weight in the app */

  /* Line height */
  --leading-tight:  1.3;
  --leading-normal: 1.6;
  --leading-loose:  1.8;
}
```

## Motion

```css
:root {
  --duration-fast:    120ms;
  --duration-base:    200ms;
  --duration-slow:    350ms;
  --ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:          cubic-bezier(0.4, 0, 1, 1);
  --ease-out:         cubic-bezier(0, 0, 0.2, 1);
}

/* Always wrap animations in this media query */
@media (prefers-reduced-motion: no-preference) {
  /* animation rules here */
}
```

## Z-index scale

```css
:root {
  --z-base:      0;
  --z-raised:    10;    /* cards on hover */
  --z-dropdown:  100;   /* OverflowMenu popovers */
  --z-drawer:    200;   /* side panels (Timeline detail, Mindmap inspector) */
  --z-modal:     300;   /* EntityForm modals, ConfirmDialog */
  --z-toast:     400;   /* notifications */
  --z-top:       500;   /* global nav */
}
```
