# Design Artefacts — GameRunner

UI/UX designs produced in Claude.ai before implementation.
Each artefact has an HTML reference (open in browser) and a Vue shell component (wire up and ship).

---

## Artefacts

### 1. Character Sheet — Call of Cthulhu
**Status:** Design signed off ✓

| File | Purpose |
|------|---------|
| `html/character-sheet-coc.html` | Standalone reference — open in browser |
| `vue/CharacterSheetCoC.vue` | Shell component — wire v-model bindings |

**Key decisions:**
- WW2 classified document aesthetic — aged paper, Courier Prime, Special Elite stamps
- A4 proportioned page, rotated -0.6deg, sits on app theme background
- Responsive scaling: `min(720px, 90vw)` → up to `min(1200px, 65vw)` at 1920p
- Two tabs: Page I (identity/stats/condition) / Page II (skills/weapons/gear)
- All inputs transparent with border-bottom only — typewriter feel
- Sheet data maps to existing `sheet_data` JSONB blob — no new DB columns

**Design tokens:**
```
Paper bg:    #e8dfc0    Header bar:  #c8b882
Border/ink:  #8a7240    Dark ink:    #2a1a08
Mid ink:     #4a3a18    Faded ink:   #6a5428
Placeholder: #a89a6a    Stamp red:   #8b1a1a
```

**Fonts (add to index.html):**
```html
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
```

---

### 2. Campaign Creation Wizard — System Selection & Entity Import
**Status:** Design signed off ✓

| File | Purpose |
|------|---------|
| `html/campaign-wizard.html` | Standalone reference — open in browser |
| `vue/CampaignWizardSystemStep.vue` | Shell component — drop into existing wizard |

**Key decisions:**
- 4-step wizard (Name → Game system → Review defaults → First entity)
- Built-in system library: CoC, D&D 5e, Delta Green, Blades in the Dark + Custom
- System selection previews all seeded defaults before committing
- Entity import: 3 tabs — guided wizard / paste JSON+MD / upload file
- Shared parse pipeline: `parseEntityInput(raw, type, format)` → implement in `src/lib/parseEntity.js`
- Parse warnings: low-confidence fields flagged for user confirmation
- Entity import accessible from campaign wizard AND standalone NPC/Location/Faction pages

**DB schema required:**
```sql
CREATE TABLE system_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_slug  TEXT NOT NULL,
  name         TEXT NOT NULL,
  is_builtin   BOOLEAN DEFAULT false,
  owner_id     UUID REFERENCES users(id),
  config       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

**Config JSONB shape:**
```json
{
  "calendar":        { "system": "gregorian", "epoch": "1920-01-01", "months": [], "moons": [], "seasons": [] },
  "factions":        [{ "name": "...", "type": "antagonist", "tags": [] }],
  "location_types":  ["City", "Ruin", "Wilderness"],
  "npc_roles":       ["Investigator", "Cultist", "Bystander"],
  "quest_structures":[{ "name": "Investigation", "phases": ["Hook","Research","Confrontation","Aftermath"] }]
}
```

---

## Workflow

```
Claude.ai (design)  →  this folder  →  Claude Code (implement)
```

1. Design and iterate UI in Claude.ai widget — free, no code risk
2. Artefacts committed here as the signed-off spec
3. Claude Code reads artefacts and implements against real codebase

When briefing Claude Code, point it at this folder:
```
Read the design artefacts in /design artefacts/ and implement
[artefact name] into [target component]. Wire all v-model bindings
per the integration notes in the file headers.
```
