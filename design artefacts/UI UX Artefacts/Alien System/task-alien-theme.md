# Task: Implement Alien RPG Theme

Branch: `claude/review-ui-guidelines-Gqg5d`
Design artefact: `design-artefacts/UI UX Artefacts/themes/THEME-ALIEN.md`

---

## Context

The Chronicle has a 7-theme system. Each theme overrides CSS tokens on a
campaign container element. The Alien theme is `.theme-alien`.

Read these files before writing any code:
- `design-artefacts/UI UX Artefacts/TOKENS.md`
- `design-artefacts/UI UX Artefacts/THEMES.md`
- `design-artefacts/UI UX Artefacts/themes/THEME-ALIEN.md`

---

## Deliverables

### 1. `src/assets/themes/theme-alien.css`

Create this file. It must contain:

a) The `.theme-alien` root override block — all token overrides from
   THEME-ALIEN.md § "Phase 1 — CSS Token Overrides".

b) The Phase 2 FX classes — `.fx-scanlines`, `.fx-crt`, `.fx-flicker`,
   `.fx-noise` — exactly as specified in THEME-ALIEN.md § "Phase 2".

c) The Phase 3 dynamic modifiers — `.dynamic-threat-{0-5}` and
   `.dynamic-panic-{0-10}` — exactly as specified in THEME-ALIEN.md § "Phase 3".

d) The component overrides from THEME-ALIEN.md § "Component Overrides":
   cards, headings, inputs, buttons, scrollbars, cursor.

e) The `prefers-reduced-motion` accessibility block at the end of the file.

Do NOT add any overrides not listed in the spec. Do NOT modify any existing
theme files or base token files.

---

### 2. Register the font

In `index.html` (or the project's font loading entry point), add the Google
Fonts preconnect and link tags for VT323 and Share Tech Mono as shown in
THEME-ALIEN.md § "Fonts". Check first — if they are already loaded, skip this step.

---

### 3. Register the theme in the theme registry

Find where the other 6 themes are registered (likely a themes config object,
a ThemeProvider, or a CSS import list). Add `theme-alien` following the same
pattern as the existing themes.

The theme entry should include:
```js
{
  id: 'alien',
  label: 'Alien RPG',
  class: 'theme-alien',
  defaultFx: ['fx-scanlines'],          // applied by default
  optionalFx: ['fx-crt', 'fx-flicker', 'fx-noise'],
  dynamicKeys: ['threat', 'panic'],     // keys used for Phase 3 class generation
  accentColor: '#4af04a',               // for campaign card tinting on home screen
}
```

---

### 4. Import the CSS file

Import `theme-alien.css` in the same place the other theme CSS files are imported.
Maintain alphabetical or existing ordering.

---

### 5. Character sheet field mapping (if EntityForm.vue handles character sheets)

If `EntityForm.vue` or an equivalent component renders character sheets, verify
that the following Alien RPG fields are present in the character entity schema.
Do NOT add them if missing — only verify and report back what is and isn't there:

- `stats`: STR, AGI, WIT, EMP (1–12 integer range)
- `hp.current` and `hp.max`
- `stress.current` (1–10 range)
- `wounds` array with 6 hit locations
- `skills` array with 5-dot rank values

Report any missing fields as a checklist at the end of your output.

---

## Verification steps

After implementing, confirm:

1. `theme-alien.css` exists at `src/assets/themes/theme-alien.css`
2. The file is imported correctly (no console errors)
3. The theme registry includes the `alien` entry
4. Applying `class="theme-alien"` to a container changes text colour to `#4af04a`
   and background to `#000000`
5. Adding `fx-scanlines` adds the scanline overlay
6. Adding `dynamic-threat-5` changes `--color-text-primary` to `#cc2200`

Do NOT open a browser. Verify by reading the output CSS and checking token values
match the spec. Flag any discrepancy.

---

## Constraints

- Read only the files needed for this task
- Commit after all 5 deliverables are complete, with message:
  `feat(themes): add alien RPG theme with CRT fx and dynamic threat/panic modifiers`
- Do not modify: TOKENS.md, THEMES.md, any existing theme file, any component file
- Large writes: if theme-alien.css exceeds 150 lines, write it in 2 groups with
  a verification step between them
