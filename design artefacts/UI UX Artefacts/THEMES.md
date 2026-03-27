# The Chronicle — Theme System

The Chronicle uses a three-phase theme architecture. Each phase layers on top
of the previous without requiring any rewrites. Themes are applied via CSS
classes on the root campaign container element.

```html
<!-- Phase 1 only -->
<div class="theme-alien">

<!-- Phase 1 + 2 -->
<div class="theme-alien fx-crt">

<!-- Phase 1 + 2 + 3 -->
<div class="theme-alien fx-crt dynamic-threat-2">
```

---

## Architecture overview

```
Layer 0  — No campaign (home/login screen)   .theme-none
Layer 1  — Base tokens    (Phase 1 — NOW)    .theme-{name}
Layer 2  — Ambient FX     (Phase 2 — NEXT)   .fx-{effect}
Layer 3  — Dynamic data   (Phase 3 — LATER)  .dynamic-{key}-{value}
```

**Rule:** Each layer is additive only. Never modify a lower layer to
accommodate a higher one. Base tokens must work without any FX classes.

---

## Layer 0 — No campaign (home / login screen)

Applied when no campaign is selected. Neutral blue-slate — intentionally
distinct from all campaign themes so users feel they are "outside" any world.

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

---

## Layer 1 — Base token themes (Phase 1)

Each theme overrides only these tokens. Everything else inherits from `:root`.
Semantic colours (success, danger, warning) are intentionally NOT overridden
per theme — they must be universally readable regardless of system.

### Default

The base fallback. Used when a campaign has no specific system set.
Warm amber on near-black. Closest to the current app colour.

```css
.theme-default {
  --color-bg-page:        #0e0b08;
  --color-bg-card:        #1c1510;
  --color-bg-elevated:    #231a12;
  --color-bg-input:       #2a1f15;
  --color-bg-subtle:      #160e06;
  --color-bg-gm:          #1a0e06;

  --color-accent:         #b87828;
  --color-accent-muted:   rgba(184,120,40,0.16);

  --color-text-primary:   #e8d5b5;
  --color-text-secondary: #7a5a3a;
  --color-text-hint:      #4e3520;

  --color-border-default: rgba(185,125,55,0.18);
  --color-border-active:  rgba(185,125,55,0.65);
  --color-border-gm:      rgba(180,70,30,0.30);
  --color-border-bracket: rgba(185,125,55,0.45);
}
```

### D&D 5e — forgotten realms crimson

```css
.theme-dnd5e {
  --color-bg-page:        #0c0804;
  --color-bg-card:        #180c06;
  --color-bg-elevated:    #200e08;
  --color-bg-input:       #280e08;
  --color-bg-subtle:      #100806;
  --color-bg-gm:          #180806;

  --color-accent:         #c84020;
  --color-accent-muted:   rgba(200,64,32,0.16);

  --color-text-primary:   #f0d0b0;
  --color-text-secondary: #6a3020;
  --color-text-hint:      #3a1810;

  --color-border-default: rgba(180,50,20,0.20);
  --color-border-active:  rgba(180,50,20,0.65);
  --color-border-gm:      rgba(180,30,20,0.30);
  --color-border-bracket: rgba(180,50,20,0.45);
}
```

### Call of Cthulhu — tidal green

```css
.theme-cthulhu {
  --color-bg-page:        #060a0a;
  --color-bg-card:        #0c1414;
  --color-bg-elevated:    #101a1a;
  --color-bg-input:       #141e1e;
  --color-bg-subtle:      #080e0e;
  --color-bg-gm:          #080e0e;

  --color-accent:         #6a8888;
  --color-accent-muted:   rgba(106,136,136,0.16);

  --color-text-primary:   #c0d0c8;
  --color-text-secondary: #3a5850;
  --color-text-hint:      #1e3030;

  --color-border-default: rgba(80,120,110,0.18);
  --color-border-active:  rgba(80,120,110,0.60);
  --color-border-gm:      rgba(80,120,80,0.28);
  --color-border-bracket: rgba(80,120,110,0.40);
}
```

### Alien RPG — cold cyan

```css
.theme-alien {
  --color-bg-page:        #060810;
  --color-bg-card:        #0c1018;
  --color-bg-elevated:    #101420;
  --color-bg-input:       #141828;
  --color-bg-subtle:      #080c16;
  --color-bg-gm:          #080c16;

  --color-accent:         #5a9aaa;
  --color-accent-muted:   rgba(90,154,170,0.15);

  --color-text-primary:   #b8d0da;
  --color-text-secondary: #2a4858;
  --color-text-hint:      #182030;

  --color-border-default: rgba(70,130,150,0.16);
  --color-border-active:  rgba(70,130,150,0.60);
  --color-border-gm:      rgba(70,130,100,0.25);
  --color-border-bracket: rgba(70,130,150,0.38);
}
```

### Coriolis — station violet

```css
.theme-coriolis {
  --color-bg-page:        #080610;
  --color-bg-card:        #100c1c;
  --color-bg-elevated:    #161028;
  --color-bg-input:       #1c1430;
  --color-bg-subtle:      #0c0a18;
  --color-bg-gm:          #0c0a18;

  --color-accent:         #8a78c8;
  --color-accent-muted:   rgba(138,120,200,0.15);

  --color-text-primary:   #d0c8f0;
  --color-text-secondary: #3a2e60;
  --color-text-hint:      #201a40;

  --color-border-default: rgba(110,90,180,0.18);
  --color-border-active:  rgba(110,90,180,0.62);
  --color-border-gm:      rgba(110,60,180,0.28);
  --color-border-bracket: rgba(110,90,180,0.42);
}
```

### Dune — desert gold

```css
.theme-dune {
  --color-bg-page:        #0a0804;
  --color-bg-card:        #160e04;
  --color-bg-elevated:    #1e1206;
  --color-bg-input:       #241608;
  --color-bg-subtle:      #120a04;
  --color-bg-gm:          #120a04;

  --color-accent:         #c8a040;
  --color-accent-muted:   rgba(200,160,64,0.14);

  --color-text-primary:   #f0e0b0;
  --color-text-secondary: #806020;
  --color-text-hint:      #402e10;

  --color-border-default: rgba(200,160,50,0.14);
  --color-border-active:  rgba(200,160,50,0.58);
  --color-border-gm:      rgba(200,100,30,0.28);
  --color-border-bracket: rgba(200,160,50,0.38);
}
```

### Achtung! Cthulhu — wartime khaki

```css
.theme-achtung {
  --color-bg-page:        #0a0c06;
  --color-bg-card:        #141608;
  --color-bg-elevated:    #1a1c0c;
  --color-bg-input:       #1e2010;
  --color-bg-subtle:      #0e1006;
  --color-bg-gm:          #0e1006;

  --color-accent:         #a89060;
  --color-accent-muted:   rgba(168,144,96,0.15);

  --color-text-primary:   #ddd8b8;
  --color-text-secondary: #4a4a28;
  --color-text-hint:      #2a2a14;

  --color-border-default: rgba(140,130,80,0.16);
  --color-border-active:  rgba(140,130,80,0.58);
  --color-border-gm:      rgba(160,80,40,0.28);
  --color-border-bracket: rgba(140,130,80,0.38);
}
```

---

## Semantic colours — fixed across ALL themes

These are defined on `:root` and must NEVER be overridden by theme classes.
Users must always be able to read status information regardless of system.

```css
:root {
  /* Success — Active, Allied, Delivered, True */
  --color-success:        #70a870;
  --color-success-bg:     rgba(50,90,50,0.25);
  --color-success-border: rgba(50,90,50,0.38);

  /* Warning — Neutral, Pending, Missed */
  --color-warning:        #c0a040;
  --color-warning-bg:     rgba(120,90,20,0.22);
  --color-warning-border: rgba(120,90,20,0.35);

  /* Danger — Hostile, Expired, Delete */
  --color-danger:         #c06858;
  --color-danger-bg:      rgba(110,35,25,0.28);
  --color-danger-border:  rgba(110,35,25,0.42);

  /* GM-only — Private, Hidden, Secret */
  --color-gm:             #c87840;
  --color-gm-bg:          rgba(140,60,20,0.22);
  --color-gm-border:      rgba(140,60,20,0.35);
}
```

---

## Font overrides per theme (Phase 1)

Default font stack applies to all themes. Some themes override specific
roles. All overrides are additive — never remove the fallback stack.

```css
/* Default (all themes inherit this from :root) */
:root {
  --font-display: 'Cinzel Decorative', serif;  /* app logo / wordmark only */
  --font-sans:    'Cinzel', serif;              /* all UI chrome */
  --font-serif:   'Crimson Pro', serif;         /* body / descriptions */
  --font-mono:    'JetBrains Mono', monospace;  /* dates / stats / code */
}

/* Alien RPG — monospace bleeds into UI labels for terminal feel */
/* Applied in Phase 2 via .fx-terminal, not Phase 1 */

/* Call of Cthulhu — body text gets a slightly heavier serif */
.theme-cthulhu {
  --font-serif: 'EB Garamond', serif;  /* more antiquarian than Crimson Pro */
}

/* Achtung! — body text uses a slightly condensed serif */
.theme-achtung {
  --font-serif: 'Lora', serif;  /* sturdy, slightly military feel */
}
```

Google Fonts import string (add to `<head>`):
```
https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cinzel+Decorative:wght@400&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400&display=swap
```

---

## Layer 2 — Ambient FX classes (Phase 2)

CSS-only effects. No JavaScript required. Each is a separate class applied
alongside the base theme class. Implement one at a time — they are independent.

All animations MUST be wrapped in:
```css
@media (prefers-reduced-motion: no-preference) { /* animation rules */ }
```

### `.fx-crt` — Alien RPG scanline + phosphor flicker

```css
.fx-crt {
  /* Scanlines on page background */
  --scanline-color: rgba(0, 255, 180, 0.03);
}
.fx-crt body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    var(--scanline-color) 2px,
    var(--scanline-color) 4px
  );
  pointer-events: none;
  z-index: var(--z-top);
}

/* Phosphor flicker on page titles */
@media (prefers-reduced-motion: no-preference) {
  .fx-crt h1 {
    animation: crt-flicker 6s steps(1) infinite;
  }
  @keyframes crt-flicker {
    0%, 95%, 97%, 100% { opacity: 1; }
    96%                 { opacity: 0.85; }
  }
}

/* Monospace override for nav labels and field labels */
.fx-crt .nav-label,
.fx-crt .field-label {
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
}
```

### `.fx-grain` — Dune sand texture

```css
.fx-grain body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  pointer-events: none;
  z-index: var(--z-top);
  opacity: 0.6;
}

/* Wider heading tracking for inscription feel */
.fx-grain h1, .fx-grain h2 {
  letter-spacing: 0.22em;
}
```

### `.fx-desaturate` — Cthulhu wet ink + colour fade

```css
/* Ink bleed at card edges */
.fx-desaturate .card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%);
  pointer-events: none;
  border-radius: inherit;
}

/* Colour drains on hover — unsettling */
@media (prefers-reduced-motion: no-preference) {
  .fx-desaturate .card {
    transition: filter 2s ease;
  }
  .fx-desaturate .card:hover {
    filter: saturate(0.2) brightness(0.9);
  }
}

/* Typewriter feel on body text */
.fx-desaturate .body-text {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
}
```

### `.fx-parchment` — Achtung! aged paper + military stamp

```css
/* Paper texture on card surfaces */
.fx-parchment .card {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.04'/%3E%3C/svg%3E");
}

/* Status badges get stamp treatment */
.fx-parchment .status-badge {
  border-style: dashed;
  letter-spacing: 0.18em;
  font-weight: 500;
}

/* GM-only sections get red diagonal classification stripe */
.fx-parchment .gm-section::before {
  content: 'CLASSIFIED';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-size: 48px;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: rgba(180, 40, 30, 0.06);
  pointer-events: none;
  white-space: nowrap;
}
```

### `.fx-stars` — Coriolis star field + holographic card hover

```css
/* Star field on page background */
.fx-stars body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 15%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 70%, rgba(255,255,255,0.2) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.35) 0%, transparent 100%),
    radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.25) 0%, transparent 100%);
  /* Extend this with more radial-gradient stops for density */
  pointer-events: none;
  z-index: 0;
}

/* Holographic shimmer on card hover */
@media (prefers-reduced-motion: no-preference) {
  .fx-stars .card {
    transition: background-position 0.3s ease;
    background-size: 200% 200%;
  }
  .fx-stars .card:hover {
    background-image: conic-gradient(
      from var(--hue, 0deg) at 50% 50%,
      rgba(138,120,200,0.06),
      transparent 40%,
      rgba(138,120,200,0.04),
      transparent
    );
    animation: holo-rotate 3s linear infinite;
  }
  @keyframes holo-rotate {
    to { --hue: 360deg; }
  }
}
```

### `.fx-vignette` — D&D 5e parchment + illuminated initial

```css
/* Vignette on card edges */
.fx-vignette .card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%);
  pointer-events: none;
  border-radius: inherit;
}

/* Illuminated drop cap on first description paragraph */
.fx-vignette .entity-description p:first-child::first-letter {
  font-family: var(--font-display);
  font-size: 2.8em;
  line-height: 0.8;
  float: left;
  margin: 0.05em 0.08em 0 0;
  color: var(--color-accent);
}
```

---

## Layer 3 — Dynamic data classes (Phase 3)

These classes are applied programmatically based on campaign data.
They require JavaScript to read campaign state and apply the appropriate class.

```js
// Example: apply dynamic classes from campaign data
function applyDynamicTheme(campaign) {
  const container = document.getElementById('campaign-root');

  // Clear existing dynamic classes
  container.className = container.className
    .replace(/dynamic-\S+/g, '').trim();

  // Dune — house selection
  if (campaign.system === 'dune' && campaign.activeHouse) {
    container.classList.add(`dynamic-house-${campaign.activeHouse}`);
    // e.g. dynamic-house-atreides, dynamic-house-harkonnen
  }

  // Alien — threat level (0–5)
  if (campaign.system === 'alien' && campaign.threatLevel !== undefined) {
    container.classList.add(`dynamic-threat-${campaign.threatLevel}`);
  }

  // Cthulhu — average party sanity (0–100)
  if (campaign.system === 'cthulhu' && campaign.avgSanity !== undefined) {
    const sanityBand = Math.floor(campaign.avgSanity / 20); // 0–4
    container.classList.add(`dynamic-sanity-${sanityBand}`);
  }
}
```

### Dune — house accent overrides

```css
/* Atreides — blue-green, noble, disciplined */
.dynamic-house-atreides {
  --color-accent:         #4a8878;
  --color-border-bracket: rgba(74,136,120,0.5);
  /* Softer border radius — ducal refinement */
  --radius-card: 6px;
}

/* Harkonnen — blood red, brutal, squared */
.dynamic-house-harkonnen {
  --color-accent:         #a02818;
  --color-border-bracket: rgba(160,40,24,0.6);
  /* Sharp corners — no mercy */
  --radius-card: 0px;
  --radius-md:   0px;
}

/* Fremen — sand tan, austere */
.dynamic-house-fremen {
  --color-accent:         #b89050;
  --color-text-primary:   #e8d8a0;
}

/* Bene Gesserit — deep purple, controlled */
.dynamic-house-bene-gesserit {
  --color-accent:         #7858a8;
  --color-border-bracket: rgba(120,88,168,0.5);
}
```

### Alien RPG — threat level accent temperature

```css
/* Condition Green (0) — normal cyan */
.dynamic-threat-0 { --color-accent: #5a9aaa; }

/* Condition Yellow (1–2) — shift toward amber */
.dynamic-threat-1 { --color-accent: #7a9060; }
.dynamic-threat-2 { --color-accent: #a09040; }

/* Condition Red (3–5) — shift toward red, desaturate UI */
.dynamic-threat-3 { --color-accent: #c07030; }
.dynamic-threat-4 {
  --color-accent: #c04020;
  filter: saturate(0.85);
}
.dynamic-threat-5 {
  --color-accent: #c02010;
  filter: saturate(0.65) brightness(0.9);
}
```

### Call of Cthulhu — sanity atmosphere

```css
/* Sanity band 4 (80–100 SAN) — normal */
.dynamic-sanity-4 { filter: saturate(1); }

/* Sanity band 3 (60–79 SAN) — faint desaturation */
.dynamic-sanity-3 { filter: saturate(0.85); }

/* Sanity band 2 (40–59 SAN) — noticeable grey shift */
.dynamic-sanity-2 { filter: saturate(0.60); }

/* Sanity band 1 (20–39 SAN) — near-monochrome */
.dynamic-sanity-1 {
  filter: saturate(0.25) contrast(1.05);
}

/* Sanity band 0 (0–19 SAN) — greyscale + red tint */
.dynamic-sanity-0 {
  filter: saturate(0) sepia(0.3) hue-rotate(320deg) contrast(1.1);
}
```

### D&D 5e — setting / plane overrides

```css
/* Ravenloft — gothic mist */
.dynamic-setting-ravenloft {
  --color-bg-page:     #08060a;
  --color-bg-card:     #120a14;
  --color-accent:      #9858a8;
}

/* Spelljammer — void + stars */
.dynamic-setting-spelljammer {
  --color-bg-page:     #06060e;
  --color-bg-card:     #0c0c18;
  --color-accent:      #5858c8;
}

/* Eberron — arcane lightning */
.dynamic-setting-eberron {
  --color-bg-page:     #080a10;
  --color-bg-card:     #101420;
  --color-accent:      #4888d0;
}
```

---

## Implementation checklist

### Phase 1 (now)
- [ ] Add all theme classes to `tokens.css`
- [ ] Add Google Fonts import to `<head>`
- [ ] Add `theme-none` to home/login page container
- [ ] Read `campaign.system` on campaign load and apply correct `.theme-{name}` class
- [ ] Verify semantic colours (success/danger/warning/gm) are untouched across all themes
- [ ] Test all themes at minimum font size (11px labels) for legibility

### Phase 2 (next — after Phase 1 is stable)
- [ ] Build `.fx-crt` and apply to Alien RPG alongside `.theme-alien`
- [ ] Build `.fx-grain` and apply to Dune alongside `.theme-dune`
- [ ] Build `.fx-desaturate` and apply to Cthulhu alongside `.theme-cthulhu`
- [ ] Build `.fx-parchment` and apply to Achtung! alongside `.theme-achtung`
- [ ] Build `.fx-stars` and apply to Coriolis alongside `.theme-coriolis`
- [ ] Build `.fx-vignette` and apply to D&D 5e alongside `.theme-dnd5e`
- [ ] All animations wrapped in `prefers-reduced-motion` media query
- [ ] Accessibility audit — verify contrast ratios still pass WCAG AA with FX applied

### Phase 3 (later — after Phase 2 is stable)
- [ ] Build `applyDynamicTheme()` function
- [ ] Dune: add house selector to campaign settings, wire to `dynamic-house-{name}`
- [ ] Alien: add threat level to GM Dashboard, wire to `dynamic-threat-{0-5}`
- [ ] Cthulhu: calculate avg party sanity from character sheets, wire to `dynamic-sanity-{0-4}`
- [ ] D&D 5e: add setting/plane selector to campaign settings, wire to `dynamic-setting-{name}`
- [ ] All dynamic classes tested with and without FX layer active

---

## Claude Code prompt for Phase 1

```
Read /design-artefacts/THEMES.md and /design-artefacts/TOKENS.md.

Create a new file at [your styles path]/themes.css containing all theme
classes from THEMES.md — Layer 0 (.theme-none) and all Layer 1 theme
classes (.theme-default through .theme-achtung).

Then:
1. On the home/campaign-selection page, add class="theme-none" to the
   root container element.
2. Find where a campaign is loaded (the route or component that receives
   campaign data). Add logic to apply the correct theme class based on
   campaign.system:
     default / no system → theme-default
     dnd5e              → theme-dnd5e
     cthulhu            → theme-cthulhu
     alien              → theme-alien
     coriolis           → theme-coriolis
     dune               → theme-dune
     achtung            → theme-achtung
3. The theme class must be applied to the outermost campaign container
   element so all child components inherit the CSS variables.
4. Only ONE theme class should be active at a time. Remove the previous
   class before applying the new one.
5. Do NOT override the semantic colour tokens (--color-success,
   --color-danger, --color-warning, --color-gm) in any theme class.

Confirm which file the theme class is applied in and show the
application logic.
```

## Claude Code prompt for Phase 2 (FX layer — run per theme)

```
Read /design-artefacts/THEMES.md, section "Layer 2 — Ambient FX classes".

Implement the [.fx-crt / .fx-grain / .fx-desaturate / .fx-parchment /
.fx-stars / .fx-vignette] class from the spec.

Add it to [your styles path]/themes.css.

Rules:
- All CSS animations MUST be inside @media (prefers-reduced-motion: no-preference)
- Use only CSS — no JavaScript for this layer
- The FX class must work independently of the base theme class (test it
  on .theme-default to confirm it doesn't break the base)
- Apply the class alongside the base theme on the campaign container:
    .theme-alien.fx-crt
    .theme-dune.fx-grain
    etc.

After implementing, confirm:
- Animations are motion-safe
- The FX does not affect semantic badge colours
- Body text remains readable (run a contrast check at the muted text colour)
```
