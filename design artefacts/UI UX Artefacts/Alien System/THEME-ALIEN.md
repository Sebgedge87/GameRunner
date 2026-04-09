# The Chronicle — Theme: Alien (Weyland-Yutani Terminal)

System: Alien RPG (Free League / Year Zero Engine)
Theme class: `.theme-alien`
Ambient FX classes: `.fx-crt` `.fx-scanlines` `.fx-flicker`
Dynamic modifier classes: `.dynamic-threat-{0-5}` `.dynamic-panic-{0-10}`

---

## Concept

Weyland-Yutani corporate terminal. MU/TH/UR 6000 mainframe uplink.
Green phosphor on black. Military-grade utilitarian. Everything feels
like it could cut out at any moment.

The UI should feel like you are accessing a classified file on a
1979-era CRT monitor in the cargo hold of a deep-space hauler.

---

## Phase 1 — CSS Token Overrides

Apply these by overriding the base tokens on `.theme-alien`:

```css
.theme-alien {

  /* --- Surfaces --- */
  --color-bg-page:          #000000;
  --color-bg-card:          #030f03;
  --color-bg-elevated:      #061206;
  --color-bg-input:         #000d00;
  --color-bg-subtle:        #020802;
  --color-bg-gm:            #0d0000;

  /* --- Borders --- */
  --color-border-default:   rgba(74, 240, 74, 0.18);
  --color-border-active:    rgba(74, 240, 74, 0.70);
  --color-border-hover:     rgba(74, 240, 74, 0.35);
  --color-border-gm:        rgba(200, 40, 40, 0.40);
  --color-border-bracket:   rgba(143, 255, 143, 0.50);
  --color-border-danger:    rgba(220, 40, 40, 0.60);

  /* --- Text --- */
  --color-text-primary:     #4af04a;
  --color-text-secondary:   #2a9a2a;
  --color-text-hint:        #1a5a1a;
  --color-text-accent:      #8fff8f;
  --color-text-danger:      #cc3333;
  --color-text-success:     #8fff8f;
  --color-text-gm:          #cc2222;
  --color-text-disabled:    #0d2a0d;

  /* --- Semantic / Status --- */
  --color-status-active:    #2a6e2a;
  --color-status-active-bg: rgba(42, 110, 42, 0.20);
  --color-status-done:      #1a4a1a;
  --color-status-done-bg:   rgba(26, 74, 26, 0.20);
  --color-status-missed:    #6e1a1a;
  --color-status-missed-bg: rgba(110, 26, 26, 0.20);
  --color-hostile:          #aa2222;
  --color-hostile-bg:       rgba(170, 34, 34, 0.20);
  --color-neutral:          #2a6e2a;
  --color-neutral-bg:       rgba(42, 110, 42, 0.15);
  --color-allied:           #3a8a3a;
  --color-allied-bg:        rgba(58, 138, 58, 0.20);

  /* --- Typography --- */
  --font-display:           'VT323', 'Courier New', monospace;
  --font-body:              'Share Tech Mono', 'Courier New', monospace;
  --font-mono:              'Share Tech Mono', 'Courier New', monospace;
  --font-size-base:         13px;
  --letter-spacing-body:    0.5px;
  --letter-spacing-label:   2px;
  --letter-spacing-heading: 3px;

  /* --- Spacing & Shape --- */
  --border-radius-card:     0px;
  --border-radius-input:    0px;
  --border-radius-badge:    0px;
  --border-width-default:   1px;

  /* --- Alien-specific tokens --- */
  --alien-phosphor:         #4af04a;
  --alien-phosphor-bright:  #8fff8f;
  --alien-phosphor-dim:     #1a5a1a;
  --alien-danger:           #cc3333;
  --alien-warn:             #aaaa00;
}
```

---

## Phase 2 — Ambient FX Classes

These are additive CSS classes. Apply to `.theme-alien` container alongside the base class.
Each is independent — they can be stacked or used alone.

### `.fx-scanlines`

Horizontal line overlay simulating CRT raster lines.

```css
.theme-alien.fx-scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
  pointer-events: none;
  z-index: 9998;
}
```

### `.fx-crt`

Barrel-distortion vignette simulating CRT tube curvature.

```css
.theme-alien.fx-crt::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 55%,
    rgba(0, 0, 0, 0.75) 100%
  );
  pointer-events: none;
  z-index: 9997;
}
```

### `.fx-flicker`

Subtle phosphor flicker. Use sparingly — do not combine with `.fx-crt` on
low-powered devices as the two `position: fixed` overlays compound repaint cost.

```css
@keyframes alien-flicker {
  0%, 95%, 100% { opacity: 1; }
  96%           { opacity: 0.92; }
  97%           { opacity: 1; }
  98%           { opacity: 0.88; }
  99%           { opacity: 0.96; }
}

.theme-alien.fx-flicker {
  animation: alien-flicker 8s step-end infinite;
}
```

### `.fx-noise`

Grain texture overlay for added texture depth.

```css
.theme-alien.fx-noise::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9996;
  opacity: 0.3;
}
```

---

## Phase 3 — Dynamic Modifier Classes

Driven by live game data. Apply to the campaign container element.
The app computes the class from current game state and swaps it reactively.

### `.dynamic-threat-{0-5}`

Driven by: GM-set threat level (0 = clear, 5 = xenomorph contact).

```css
/* Level 0 — nominal */
.theme-alien.dynamic-threat-0 { --alien-phosphor: #4af04a; }

/* Level 1 — uneasy */
.theme-alien.dynamic-threat-1 { --alien-phosphor: #6adf4a; }

/* Level 2 — alert */
.theme-alien.dynamic-threat-2 { --alien-phosphor: #aacc22; --alien-warn: #dddd00; }

/* Level 3 — danger */
.theme-alien.dynamic-threat-3 { --alien-phosphor: #ccaa00; }

/* Level 4 — contact */
.theme-alien.dynamic-threat-4 {
  --alien-phosphor: #cc6600;
  --color-text-primary: #cc6600;
  --color-border-default: rgba(200, 100, 0, 0.25);
}

/* Level 5 — xenomorph on deck */
.theme-alien.dynamic-threat-5 {
  --alien-phosphor: #cc2200;
  --color-text-primary: #cc2200;
  --color-border-default: rgba(200, 34, 0, 0.25);
  --color-bg-page: #0d0000;
}
```

### `.dynamic-panic-{0-10}`

Driven by: highest current panic rating in the party.

```css
/* 0-3: normal */
.theme-alien.dynamic-panic-0,
.theme-alien.dynamic-panic-1,
.theme-alien.dynamic-panic-2,
.theme-alien.dynamic-panic-3 {
  /* no override — base tokens apply */
}

/* 4-6: elevated */
.theme-alien.dynamic-panic-4,
.theme-alien.dynamic-panic-5,
.theme-alien.dynamic-panic-6 {
  --color-bg-page: #020000;
  --alien-phosphor-dim: #3a1a00;
}

/* 7-9: critical */
.theme-alien.dynamic-panic-7,
.theme-alien.dynamic-panic-8,
.theme-alien.dynamic-panic-9 {
  --color-bg-page: #0a0000;
  --alien-phosphor: #ff4422;
  --color-text-primary: #ff4422;
  --color-border-default: rgba(255, 68, 34, 0.20);
}

/* 10: full panic */
.theme-alien.dynamic-panic-10 {
  --color-bg-page: #110000;
  --alien-phosphor: #ff0000;
  --color-text-primary: #ff0000;
  --color-border-default: rgba(255, 0, 0, 0.25);
  animation: alien-flicker 2s step-end infinite;
}
```

---

## Component Overrides

These component-level overrides apply within `.theme-alien`. They should live
in a single `theme-alien.css` scoped file, not in individual component files.

### Cards & Panels

```css
.theme-alien .card,
.theme-alien .panel {
  border-radius: 0;
  border: 1px solid var(--color-border-default);
  font-family: var(--font-body);
  position: relative;
}

/* Corner bracket decoration */
.theme-alien .card::before,
.theme-alien .panel::before {
  content: '';
  position: absolute;
  top: -1px; left: -1px;
  width: 12px; height: 12px;
  border-top: 2px solid var(--alien-phosphor-bright);
  border-left: 2px solid var(--alien-phosphor-bright);
  pointer-events: none;
}
```

### Headings

```css
.theme-alien h1,
.theme-alien h2,
.theme-alien h3 {
  font-family: var(--font-display);
  letter-spacing: var(--letter-spacing-heading);
  color: var(--alien-phosphor-bright);
  text-transform: uppercase;
}

.theme-alien h2::before { content: '[ '; }
.theme-alien h2::after  { content: ' ]'; }
```

### Inputs

```css
.theme-alien input,
.theme-alien textarea,
.theme-alien select {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-default);
  border-radius: 0;
  color: var(--alien-phosphor-bright);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  letter-spacing: var(--letter-spacing-body);
}

.theme-alien input:focus,
.theme-alien textarea:focus {
  border-color: var(--alien-phosphor);
  outline: none;
  box-shadow: 0 0 0 1px var(--alien-phosphor-dim);
}
```

### Buttons

```css
.theme-alien .btn {
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: 0;
  color: var(--alien-phosphor);
  font-family: var(--font-mono);
  letter-spacing: var(--letter-spacing-label);
  text-transform: uppercase;
}

.theme-alien .btn:hover {
  background: rgba(74, 240, 74, 0.08);
  border-color: var(--alien-phosphor);
  color: var(--alien-phosphor-bright);
}

.theme-alien .btn-danger {
  border-color: var(--alien-danger);
  color: var(--alien-danger);
}
```

### Scrollbars

```css
.theme-alien ::-webkit-scrollbar { width: 6px; }
.theme-alien ::-webkit-scrollbar-track { background: #000; }
.theme-alien ::-webkit-scrollbar-thumb {
  background: var(--alien-phosphor-dim);
  border-radius: 0;
}
```

### Cursor

```css
.theme-alien { cursor: crosshair; }
.theme-alien input,
.theme-alien textarea { cursor: text; }
.theme-alien button,
.theme-alien [role="button"] { cursor: crosshair; }
```

---

## Fonts

Load in `index.html` or equivalent entry point:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap" rel="stylesheet">
```

| Role          | Font              | Fallback       | Usage                        |
|---------------|-------------------|----------------|------------------------------|
| Display/heads | VT323             | Courier New    | Section headers, entity names|
| Body/UI       | Share Tech Mono   | Courier New    | All body text, labels, inputs|
| Mono/code     | Share Tech Mono   | monospace      | Values, stats, dice results  |

---

## Character Sheet Mapping (Alien RPG → Chronicle fields)

| Chronicle field     | Alien RPG equivalent | Notes                          |
|---------------------|---------------------|--------------------------------|
| `name`              | Character name       |                                |
| `role`              | Career               | Warrant Officer, Marine, etc.  |
| `stats[STR]`        | Strength             | 1–12 range                     |
| `stats[AGI]`        | Agility              | 1–12 range                     |
| `stats[WIT]`        | Wits                 | 1–12 range                     |
| `stats[EMP]`        | Empathy              | 1–12 range                     |
| `hp.current`        | Health               | = Strength rating              |
| `hp.max`            | Max health           | = Strength rating              |
| `stress.current`    | Stress               | 1–10; triggers panic at 10     |
| `stress.threshold`  | Panic threshold      | = Empathy rating               |
| `skills[]`          | Skills               | 5-dot rank system              |
| `wounds[]`          | Broken per location  | 6 hit locations                |
| `inventory[]`       | Gear                 | Weight/encumbrance optional    |
| `notes`             | Personal agenda      | Hidden from other players      |

---

## Vue Component Usage

```html
<!-- Basic — Phase 1 only -->
<div class="theme-alien">
  <CampaignShell />
</div>

<!-- Phase 1 + ambient FX -->
<div class="theme-alien fx-scanlines fx-crt">
  <CampaignShell />
</div>

<!-- Phase 1 + 2 + 3 (fully dynamic) -->
<div
  class="theme-alien fx-scanlines fx-crt"
  :class="`dynamic-threat-${campaign.threatLevel} dynamic-panic-${maxPartyPanic}`"
>
  <CampaignShell />
</div>
```

---

## Recommended FX Presets

| Scenario                   | Classes                                     |
|----------------------------|---------------------------------------------|
| Session start / calm       | `theme-alien fx-scanlines`                  |
| Exploration / tension      | `theme-alien fx-scanlines fx-crt`           |
| Combat / active threat     | `theme-alien fx-scanlines fx-crt fx-flicker`|
| Full panic / endgame       | `theme-alien fx-scanlines fx-crt fx-noise fx-flicker dynamic-panic-10` |

---

## Accessibility Notes

- All phosphor green tones (#4af04a) pass WCAG AA on black backgrounds.
- The flicker animation must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .fx-flicker,
  .theme-alien.dynamic-panic-10 {
    animation: none;
  }
}
```
