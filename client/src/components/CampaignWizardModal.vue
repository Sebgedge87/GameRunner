<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close'])

const router   = useRouter()
const campaign = useCampaignStore()
const data     = useDataStore()
const ui       = useUiStore()
const auth     = useAuthStore()

const STEPS = ['Name', 'Game system', 'Review defaults', 'First entity']

const step = ref(0)

/* ── Step 0 — name ─────────────────────────────────────── */
const nameForm = reactive({ name: '', subtitle: '' })

/* ── Step 1 — system ───────────────────────────────────── */
const selectedSystem = ref('dnd5e')

/* ── Step 2 — create ───────────────────────────────────── */
const saving     = ref(false)
const saveError  = ref('')

/* ── Step 3 — first entity ─────────────────────────────── */
const importTab    = ref(0)
const entitySaving = ref(false)
const entityForm   = reactive({
  type: 'NPC', name: '', role: '', location: '', description: '', notes: '',
})

/* ── Paste parser ──────────────────────────────────────── */
const pasteRaw       = ref('')
const parseWarnings  = ref([])  // field names that were inferred, not explicit
const parsedEntities = ref([])  // [{result, warnings, format}] – multi-entity queue
const uploadFile     = ref(null)
const fileInputRef   = ref(null)

// Field name aliases → canonical field
const FIELD_ALIASES = {
  name:        ['name', 'title', 'character', 'character_name', 'entity'],
  role:        ['role', 'type', 'class', 'occupation', 'job', 'rank', 'position', 'archetype'],
  location:    ['location', 'home', 'hometown', 'place', 'region', 'base', 'area', 'origin'],
  description: ['description', 'summary', 'overview', 'appearance', 'bio', 'profile', 'about', 'desc'],
  notes:       ['notes', 'gm_notes', 'background', 'backstory', 'history', 'secrets', 'details', 'info'],
}

function aliasToField(key) {
  const k = key.toLowerCase().trim().replace(/[\s_-]+/g, '_')
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(k)) return field
  }
  return null
}

function parseEntityText(raw) {
  const result   = { name: '', role: '', location: '', description: '', notes: '' }
  const warnings = []

  // ── Try JSON ────────────────────────────────────────────
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      const src = Array.isArray(parsed) ? parsed[0] : parsed
      if (src && typeof src === 'object') {
        for (const [key, val] of Object.entries(src)) {
          if (typeof val !== 'string' && typeof val !== 'number') continue
          const field = aliasToField(key)
          if (field && !result[field]) result[field] = String(val)
        }
        // Flag fields that were filled from a non-obvious alias
        for (const [key, val] of Object.entries(src)) {
          if (typeof val !== 'string' && typeof val !== 'number') continue
          const field = aliasToField(key)
          if (field && !FIELD_ALIASES[field][0].includes(key.toLowerCase())) {
            warnings.push(field)
          }
        }
        return { result, warnings, format: 'json' }
      }
    } catch { /* fall through to markdown */ }
  }

  // ── Markdown / plain text ───────────────────────────────
  const lines = raw.split('\n')
  const notesLines = []
  let inNotesBlock = false
  let descLines    = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.trim()
    if (!stripped) continue

    // # H1 → name (inferred)
    if (/^#\s+/.test(stripped) && !result.name) {
      result.name = stripped.replace(/^#+\s+/, '')
      warnings.push('name')
      continue
    }

    // ## Notes / ## Background etc. → start notes block
    if (/^##\s+(notes?|background|backstory|secrets?|gm.?notes?|details?)/i.test(stripped)) {
      inNotesBlock = true; continue
    }
    // Any other ## heading ends notes block back to desc
    if (/^##\s+/.test(stripped)) {
      inNotesBlock = false; continue
    }

    if (inNotesBlock) { notesLines.push(stripped); continue }

    // **Key:** Value  or  *Key:* Value  or  Key: Value (at line start)
    const kvMatch =
      stripped.match(/^\*{1,2}([^*:]+)\*{0,2}:\*{0,2}\s+(.+)$/) ||
      stripped.match(/^([A-Za-z][A-Za-z _/-]{1,24}):\s+(.+)$/)

    if (kvMatch) {
      const field = aliasToField(kvMatch[1])
      const val   = kvMatch[2].replace(/\*\*/g, '').trim()
      if (field && !result[field]) {
        result[field] = val
        // flag if alias was indirect
        if (!FIELD_ALIASES[field][0].includes(kvMatch[1].toLowerCase().trim())) {
          warnings.push(field)
        }
      }
      continue
    }

    // Plain paragraph → candidate for description
    if (stripped.length > 10) descLines.push(stripped)
  }

  if (!result.notes && notesLines.length) result.notes = notesLines.join('\n')
  if (!result.description && descLines.length) {
    result.description = descLines[0]
    if (!result.name && descLines.length > 1) {
      warnings.push('description')
    }
  }

  return { result, warnings: [...new Set(warnings)], format: 'markdown' }
}

/* ── Multi-entity parse (JSON arrays) ──────────────────── */
function parseSingleJsonObj(src) {
  const result   = { name: '', role: '', location: '', description: '', notes: '' }
  const warnings = []
  for (const [key, val] of Object.entries(src)) {
    if (typeof val !== 'string' && typeof val !== 'number') continue
    const field = aliasToField(key)
    if (field && !result[field]) {
      result[field] = String(val)
      if (!FIELD_ALIASES[field][0].includes(key.toLowerCase().trim())) warnings.push(field)
    }
  }
  return { result, warnings: [...new Set(warnings)], format: 'json' }
}

/* ── Full campaign document parser ─────────────────────── */
const SECTION_TYPE_MAP = {
  NPC:      [/^npc/, /^character/, /^people/, /^persons?/],
  Location: [/^location/, /^place/, /^area/, /^region/, /^site/],
  Faction:  [/^faction/, /^group/, /^organi[sz]/, /^guild/, /^order/],
  Quest:    [/^quest/, /^mission/, /^task/, /^objective/, /^job/],
  Rumour:   [/^rumou?r/, /^gossip/, /^whisper/, /^hearsay/],
  Timeline: [/^timeline/, /^event/, /^histor/, /^chronicle/],
}

function detectSectionType(header) {
  const h = header.toLowerCase().replace(/[^a-z]/g, '')
  for (const [type, patterns] of Object.entries(SECTION_TYPE_MAP)) {
    if (patterns.some(p => p.test(h))) return type
  }
  return null
}

function blankResult(type) {
  if (type === 'Rumour')   return { text: '', source_npc: '', source_location: '' }
  if (type === 'Timeline') return { name: '', description: '', notes: '', date: '', significance: 'minor' }
  return { name: '', role: '', location: '', description: '', notes: '' }
}

function parseMarkdownDocument(raw) {
  const lines    = raw.split('\n')
  const entities = []
  let currentSection = null   // entity type string e.g. 'NPC'
  let cur = null              // {type, result, notesLines, descLines, inNotes}

  function flush() {
    if (!cur) return
    if (!cur.result.notes && cur.notesLines.length) cur.result.notes = cur.notesLines.join('\n')
    if (!cur.result.description && cur.descLines.length) cur.result.description = cur.descLines.join(' ')
    const hasContent = cur.type === 'Rumour' ? cur.result.text?.trim() : cur.result.name?.trim()
    if (hasContent) entities.push({ type: cur.type, result: cur.result, warnings: [], format: 'markdown' })
    cur = null
  }

  function startEntity(name, type) {
    return { type, result: blankResult(type), notesLines: [], descLines: [], inNotes: false, name }
  }

  for (const line of lines) {
    const s = line.trim()

    // # H1 — document title, skip
    if (/^#(?!#)/.test(s)) continue

    // ## H2 — section heading (entity type) or notes block
    if (/^##(?!#)/.test(s)) {
      const heading = s.replace(/^#+\s*/, '')
      const detected = detectSectionType(heading)
      if (detected) {
        flush()
        currentSection = detected
        cur = null
      } else if (cur) {
        // notes sub-block inside an entity
        cur.inNotes = /notes?|background|backstory|secrets?|gm.?notes?|details?/i.test(heading)
      }
      continue
    }

    // ### H3 — individual entity within a section
    if (/^###(?!#)/.test(s)) {
      flush()
      if (currentSection) {
        const name = s.replace(/^#+\s*/, '')
        cur = startEntity(name, currentSection)
        if (cur.type !== 'Rumour' && cur.type !== 'Timeline') cur.result.name = name
        else if (cur.type === 'Timeline') cur.result.name = name
      }
      continue
    }

    if (!s) continue

    // No entity context yet but in a Rumour section: list items are individual rumours
    if (!cur && currentSection === 'Rumour' && /^[-*]\s+/.test(s)) {
      entities.push({ type: 'Rumour', result: { text: s.replace(/^[-*]\s+/, ''), source_npc: '', source_location: '' }, warnings: [], format: 'markdown' })
      continue
    }

    if (!cur) continue

    // Notes sub-block toggle
    if (/^#{1,6}\s+(notes?|background|backstory|secrets?|gm.?notes?|details?)/i.test(s)) { cur.inNotes = true; continue }
    if (/^#{1,6}/.test(s)) { cur.inNotes = false; continue }
    if (cur.inNotes) { cur.notesLines.push(s); continue }

    // Key: Value  /  **Key:** Value
    const kv = s.match(/^\*{1,2}([^*:]+)\*{0,2}:\*{0,2}\s+(.+)$/) ||
               s.match(/^([A-Za-z][A-Za-z _/-]{1,28}):\s+(.+)$/)
    if (kv) {
      const key = kv[1].toLowerCase().trim().replace(/[\s_-]+/g, '_')
      const val = kv[2].replace(/\*\*/g, '').trim()
      const r   = cur.result
      if (cur.type === 'Rumour') {
        if (/^(source|source_npc|npc)$/.test(key))          r.source_npc = val
        else if (/^(location|source_location|place)$/.test(key)) r.source_location = val
        else if (/^(text|rumou?r|content)$/.test(key))      r.text = val
      } else if (cur.type === 'Timeline') {
        if (/^(date|in_world_date|when)$/.test(key))        r.date = val
        else if (/^(significance|importance)$/.test(key))   r.significance = val
        else if (/^(description|summary|desc)$/.test(key))  r.description = val
        else if (/^(notes?|gm_notes?)$/.test(key))          r.notes = val
      } else {
        const field = aliasToField(kv[1])
        if (field && !r[field]) r[field] = val
      }
      continue
    }

    // List item — append to desc or use as rumour text
    if (/^[-*]\s+/.test(s)) {
      const text = s.replace(/^[-*]\s+/, '')
      if (cur.type === 'Rumour' && !cur.result.text) cur.result.text = text
      else cur.descLines.push(text)
      continue
    }

    // Plain paragraph
    if (s.length > 4) {
      if (cur.type === 'Rumour' && !cur.result.text) cur.result.text = s
      else cur.descLines.push(s)
    }
  }

  flush()
  return entities
}

function parseAllEntities(raw) {
  const trimmed = raw.trim()

  // JSON array
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr) && arr.length > 0)
        return arr.filter(x => x && typeof x === 'object').map(src => ({ ...parseSingleJsonObj(src), type: entityForm.type }))
    } catch {}
  }

  // Single JSON object
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed)
      return [{ ...parseSingleJsonObj(obj), type: entityForm.type }]
    } catch {}
  }

  // Full markdown campaign document (has section headers)
  const mdEntities = parseMarkdownDocument(raw)
  if (mdEntities.length > 0) return mdEntities

  // Single-entity markdown fallback
  return [{ ...parseEntityText(raw), type: entityForm.type }]
}

function runPaste() {
  if (!pasteRaw.value.trim()) return
  const entities = parseAllEntities(pasteRaw.value)
  parsedEntities.value = entities
  if (entities.length === 1) {
    Object.assign(entityForm, entities[0].result)
    parseWarnings.value = entities[0].warnings
    importTab.value = 0  // switch to guided to review
  }
  // multiple: stay on paste tab and show the queue
}

/* ── Import template ────────────────────────────────────── */
const IMPORT_TEMPLATE = `# Campaign Name

## NPCs

### NPC Name
**Role:** Merchant / Guard / Villain / Cultist…
**Location:** Where they are usually found
**Description:** One-line summary visible to players
**Notes:** GM-only secrets, motivations, connections

### Example — Sister Agatha
**Role:** Rogue Priest
**Location:** The Sunken Chapel, Ashford
**Description:** A severe woman in grey robes who speaks in riddles.
**Notes:** Secretly the cult's liaison to the Merchant Council. Carries a brass key.

---

## Locations

### Location Name
**Description:** What players see and know
**Notes:** Hidden details, traps, secrets, exits

### Example — The Old Mill
**Description:** A crumbling watermill on the edge of town, long abandoned.
**Notes:** Basement trapdoor leads to the tunnel network. Cult robes stashed in a barrel.

---

## Factions

### Faction Name
**Description:** Public reputation and known activities
**Goals:** What this faction is trying to achieve
**Notes:** Leadership structure, internal tensions, secret agenda

### Example — The Merchant Council
**Description:** A powerful trade guild that controls the city's commerce and courts.
**Goals:** Monopolise the northern spice trade and install a puppet governor.
**Notes:** Funded by House Vane. The inner circle worships the Sea God in secret.

---

## Quests

### Quest Title
**Description:** What the players know and are being asked to do
**Notes:** GM context — red herrings, true culprit, possible outcomes, rewards

### Example — The Missing Shipment
**Description:** Merchant Aldred's cargo of fine cloth vanished on the Ashford road. He's offering a reward.
**Notes:** Stolen by the Council to frame a rival. The cargo hides contraband letters implicating Lord Harwick.

---

## Rumors

- The king's adviser has not been seen at court in three days.
- Strange lights appear near the old mill every night at midnight.
- A farmer swears he saw soldiers in unmarked armour crossing the north road before dawn.
- The innkeeper at the Silver Flagon pays good coin for useful information.

---

## Timeline

### Event Title
**Date:** In-world date (e.g. 3rd Frost Moon, Year 412)
**Significance:** minor / major / legendary
**Description:** What happened — player-visible account
**Notes:** GM context: true causes, hidden consequences, follow-on hooks

### Example — The Night of Embers
**Date:** 14th Harvest Moon, Year 401
**Significance:** major
**Description:** The capital's merchant quarter burned to the ground overnight. Hundreds were left homeless.
**Notes:** Arson ordered by House Vane to destroy a rival's warehouse and the damning ledgers inside.
`

function downloadTemplate() {
  const blob = new Blob([IMPORT_TEMPLATE], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'campaign-import-template.md'
  a.click()
  URL.revokeObjectURL(url)
}

function fillTemplate() {
  pasteRaw.value = IMPORT_TEMPLATE
  parsedEntities.value = []
}
function handleFileDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) processUploadedFile(file)
}

function handleFileChange(e) {
  const file = e.target?.files?.[0]
  if (file) processUploadedFile(file)
}

function processUploadedFile(file) {
  uploadFile.value = file
  parsedEntities.value = []
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const entities = parseAllEntities(text)
    parsedEntities.value = entities
    if (entities.length === 1) {
      Object.assign(entityForm, entities[0].result)
      parseWarnings.value = entities[0].warnings
    }
  }
  reader.readAsText(file)
}

/* ── Batch save ─────────────────────────────────────────── */
function entityEndpointAndBody(ent) {
  const type = ent.type || entityForm.type
  const r    = ent.result
  if (type === 'NPC')
    return { endpoint: '/api/npcs', body: { name: r.name, role: r.role, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Location')
    return { endpoint: '/api/locations', body: { name: r.name, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Faction')
    return { endpoint: '/api/factions', body: { name: r.name, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Quest')
    return { endpoint: '/api/quests', body: { title: r.name, description: r.description, gm_notes: r.notes, status: 'active', quest_type: 'main' }, valid: !!r.name?.trim() }
  if (type === 'Rumour')
    return { endpoint: '/api/rumours', body: { text: r.text, is_true: false, source_npc: r.source_npc || null, source_location: r.source_location || null }, valid: !!r.text?.trim() }
  if (type === 'Timeline')
    return { endpoint: '/api/timeline', body: { title: r.name, description: r.description, gm_notes: r.notes, in_world_date: r.date, significance: r.significance || 'minor' }, valid: !!r.name?.trim() }
  return null
}

async function saveAllEntities() {
  if (!parsedEntities.value.length) return
  entitySaving.value = true
  let saved = 0, failed = 0
  try {
    for (const ent of parsedEntities.value) {
      const info = entityEndpointAndBody(ent)
      if (!info || !info.valid) { failed++; continue }
      try {
        const r = await apif(info.endpoint, { method: 'POST', body: JSON.stringify(info.body) })
        if (!r.ok) { failed++; continue }
        saved++
      } catch { failed++ }
    }
    if (failed > 0 && saved > 0) ui.showToast(`${failed} item${failed > 1 ? 's' : ''} could not be saved`, '', '✕')
    if (saved > 0) {
      ui.showToast(`${saved} ${saved === 1 ? 'entity' : 'entities'} imported!`, '', '✓')
      emit('close')
      router.push('/dashboard')
    } else {
      ui.showToast('Nothing was saved — check that entries have names/text', '', '✕')
    }
  } catch (e) {
    ui.showToast(e.message || 'Failed to save', '', '✕')
  } finally {
    entitySaving.value = false
  }
}

/* ─────────────────────────────────────────────────────────
   System preview data
   ───────────────────────────────────────────────────────── */
const SYSTEM_PREVIEWS = {
  dnd5e: {
    calendar:        'Forgotten Realms — Harptos calendar',
    faction_types:   ['Guild', 'Kingdom', 'Religion', 'Thieves'],
    location_types:  ['Town', 'Dungeon', 'Wilderness', 'Planar'],
    npc_roles:       ['Hero', 'Villain', 'Merchant', 'Noble', 'Guard'],
    quest_structures:['Dungeon delve', 'Escort', 'Diplomacy'],
  },
  coc: {
    calendar:        'Gregorian · 1920s epoch',
    faction_types:   ['Cult', 'Agency', 'Institution', 'Criminal'],
    location_types:  ['City', 'Ruin', 'Wilderness', 'Dreamlands'],
    npc_roles:       ['Investigator', 'Cultist', 'Bystander', 'Deep One', 'Ally'],
    quest_structures:['Investigation', 'Retrieval', 'Survival'],
  },
  alien: {
    calendar:        'Standard Gregorian · 22nd century',
    faction_types:   ['Corporation', 'Colonial Marines', 'Weyland-Yutani', 'Independents'],
    location_types:  ['Colony', 'Ship', 'Installation', 'Derelict'],
    npc_roles:       ['Colonist', 'Marine', 'Synthetic', 'Executive', 'Hostile'],
    quest_structures:['Survival', 'Extraction', 'Investigation'],
  },
  coriolis: {
    calendar:        'Coriolis station time — cycles & watches',
    faction_types:   ['Crew', 'Icon Order', 'Merchant', 'Corsair'],
    location_types:  ['Station', 'Planet', 'Derelict', 'Asteroid'],
    npc_roles:       ['Contact', 'Agent', 'Corsair', 'Merchant', 'Icon Emissary'],
    quest_structures:['Contract', 'Exploration', 'Faction mission'],
  },
  dune: {
    calendar:        'Imperial standard — Guild calendar',
    faction_types:   ['Great House', 'Fremen Sietch', 'Spacing Guild', 'Bene Gesserit'],
    location_types:  ['Sietch', 'City', 'Desert', 'Orbital'],
    npc_roles:       ['Fremen', 'Noble', 'Mentat', 'Bene Gesserit', 'Harkonnen'],
    quest_structures:['Political intrigue', 'Desert survival', 'Spice operation'],
  },
  achtung: {
    calendar:        'Gregorian · World War II era',
    faction_types:   ['Allied unit', 'Axis', 'Occult order', 'Resistance'],
    location_types:  ['Battlefield', 'Bunker', 'City', 'Ruins', 'Facility'],
    npc_roles:       ['Soldier', 'Spy', 'Occultist', 'Resistance', 'Officer'],
    quest_structures:['Mission', 'Infiltration', 'Occult investigation'],
  },
  default: {
    calendar:        'Standard Gregorian',
    faction_types:   ['Faction A', 'Faction B', 'Faction C'],
    location_types:  ['City', 'Wilderness', 'Dungeon'],
    npc_roles:       ['Hero', 'Villain', 'Bystander'],
    quest_structures:['Main quest', 'Side quest'],
  },
  custom: {
    calendar:        'Define your own time system',
    faction_types:   ['You choose the categories'],
    location_types:  ['You choose the tags'],
    npc_roles:       ['You define the roles'],
    quest_structures:['You name the phases'],
  },
}

const ENTITY_TYPES = ['NPC', 'Location', 'Faction', 'Quest']

const preview = computed(() => SYSTEM_PREVIEWS[selectedSystem.value] || SYSTEM_PREVIEWS.default)

/* ── Close / dismiss ────────────────────────────────────── */
// Step 3: campaign already created — closing = skip to dashboard
// Steps 0-2: no data committed — just dismiss
function handleClose() {
  if (step.value === 3) {
    skipEntity()
  } else {
    emit('close')
  }
}

function onKey(e) { if (e.key === 'Escape') handleClose() }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

// Warn before navigating away mid-flow (steps 0-2, before campaign is created)
onBeforeRouteLeave((_to, _from, next) => {
  if (step.value < 3 && nameForm.name.trim()) {
    const leave = window.confirm('Leave campaign setup? The campaign hasn\'t been created yet and your progress will be lost.')
    if (leave) { emit('close'); next() } else { next(false) }
  } else {
    emit('close')
    next()
  }
})

/* ── Helpers ───────────────────────────────────────────── */
function apif(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
  return fetch(path, { ...opts, headers })
}

function canAdvanceFrom0() { return nameForm.name.trim().length > 0 }

function nextStep() {
  if (step.value === 0 && !canAdvanceFrom0()) return
  if (step.value < STEPS.length - 1) step.value++
}
function prevStep() { if (step.value > 0) step.value-- }

/* ── Create campaign (step 2 → 3) ─────────────────────── */
async function createAndProceed() {
  saveError.value = ''
  if (!nameForm.name.trim()) { step.value = 0; return }
  saving.value = true
  try {
    const c = await campaign.createCampaign({
      name: nameForm.name.trim(),
      subtitle: nameForm.subtitle.trim() || undefined,
      system: selectedSystem.value,
      max_players: 4,
    })
    await campaign.switchCampaign(c.id)
    await data.loadAll()
    step.value = 3
  } catch (e) {
    saveError.value = e.message || 'Failed to create campaign'
  } finally {
    saving.value = false
  }
}

/* ── First entity (step 3) ─────────────────────────────── */
async function saveEntity() {
  if (!entityForm.name.trim()) { ui.showToast('Entity name is required', '', '✕'); return }
  entitySaving.value = true
  try {
    const type = entityForm.type
    let endpoint, body
    if (type === 'NPC') {
      endpoint = '/api/npcs'
      body = { name: entityForm.name, role: entityForm.role, description: entityForm.description, gm_notes: entityForm.notes }
    } else if (type === 'Location') {
      endpoint = '/api/locations'
      body = { name: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes }
    } else if (type === 'Faction') {
      endpoint = '/api/factions'
      body = { name: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes }
    } else {
      endpoint = '/api/quests'
      body = { title: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes, status: 'active', quest_type: 'main' }
    }
    const r = await apif(endpoint, { method: 'POST', body: JSON.stringify(body) })
    if (!r.ok) { const d = await r.json(); throw new Error(d.error || r.status) }
    ui.showToast(`${type} "${entityForm.name}" created!`, '', '✓')
    emit('close')
    router.push('/dashboard')
  } catch (e) {
    ui.showToast(e.message || 'Failed to create entity', '', '✕')
  } finally {
    entitySaving.value = false
  }
}

function skipEntity() {
  emit('close')
  router.push('/dashboard')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="wiz-overlay"
      @click.self="handleClose"
    >
      <div class="wiz-card">

        <!-- Close button — always visible -->
        <button
          class="wiz-close"
          :title="step === 3 ? 'Skip and go to dashboard' : 'Close'"
          @click="handleClose"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
          </svg>
        </button>

        <!-- Step bar -->
        <div class="wiz-step-bar">
          <template v-for="(label, i) in STEPS" :key="i">
            <div class="wiz-step" :class="{ active: i === step, done: i < step }">
              <div class="wiz-step-num">
                <svg v-if="i < step" viewBox="0 0 12 12" width="10" height="10" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="wiz-step-label">{{ label }}</span>
            </div>
            <div v-if="i < STEPS.length - 1" class="wiz-step-line" />
          </template>
        </div>

        <!-- ── STEP 0 — Name ───────────────────────────── -->
        <template v-if="step === 0">
          <h2 class="wiz-title">Name your campaign</h2>
          <p class="wiz-sub">You can change these details any time from campaign settings.</p>

          <div class="wiz-field-group">
            <div class="wiz-field">
              <label>Campaign name <span class="wiz-req">*</span></label>
              <input
                v-model="nameForm.name"
                type="text"
                placeholder="The Shattered Crown…"
                autofocus
                @keydown.enter="nextStep"
              />
            </div>
            <div class="wiz-field">
              <label>Subtitle <span class="wiz-opt">(optional)</span></label>
              <input
                v-model="nameForm.subtitle"
                type="text"
                placeholder="An optional tagline"
                @keydown.enter="nextStep"
              />
            </div>
          </div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="handleClose">Cancel</button>
            <button class="wiz-btn primary" :disabled="!canAdvanceFrom0()" @click="nextStep">
              Choose system →
            </button>
          </div>
        </template>

        <!-- ── STEP 1 — System ─────────────────────────── -->
        <template v-if="step === 1">
          <h2 class="wiz-title">Choose a game system</h2>
          <p class="wiz-sub">Defaults for calendar, factions, locations, NPCs and quests will be pre-configured.</p>

          <div class="wiz-system-grid">
            <div
              v-for="(meta, key) in campaign.SYSTEM_META"
              :key="key"
              class="wiz-sys-card"
              :class="{ selected: selectedSystem === key, custom: key === 'custom' }"
              :data-sys="key"
              @click="selectedSystem = key"
            >
              <div class="wiz-sys-icon">{{ meta.icon }}</div>
              <div class="wiz-sys-name">{{ meta.label }}</div>
              <div class="wiz-sys-desc">{{ SYSTEM_PREVIEWS[key]?.calendar?.split('·')[0]?.split('—')[0]?.trim() || 'Custom' }}</div>
            </div>
          </div>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">What gets configured</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Calendar</div>
                <div class="wiz-preview-val">{{ preview.calendar }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Faction types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.faction_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Location types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.location_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">NPC roles</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Quest structures</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="prevStep">← Back</button>
            <button class="wiz-btn primary" @click="nextStep">Review defaults →</button>
          </div>
        </template>

        <!-- ── STEP 2 — Review ─────────────────────────── -->
        <template v-if="step === 2">
          <h2 class="wiz-title">Review &amp; confirm defaults</h2>
          <p class="wiz-sub">These are applied when your campaign is created. You can customise everything after.</p>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">Campaign</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Name</div>
                <div class="wiz-preview-val" style="font-weight:500;color:var(--color-text-primary)">{{ nameForm.name }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">System</div>
                <div class="wiz-preview-val">
                  {{ campaign.SYSTEM_META[selectedSystem]?.icon }}
                  {{ campaign.SYSTEM_META[selectedSystem]?.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">Factions, locations &amp; NPCs</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Calendar</div>
                <div class="wiz-preview-val">{{ preview.calendar }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Faction types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.faction_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Location types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.location_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">NPC roles</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Quest structures</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="saveError" class="wiz-error">{{ saveError }}</div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="prevStep">← Back</button>
            <button class="wiz-btn primary" :disabled="saving" @click="createAndProceed">
              {{ saving ? 'Creating…' : 'Create campaign →' }}
            </button>
          </div>
        </template>

        <!-- ── STEP 3 — First entity ───────────────────── -->
        <template v-if="step === 3">
          <h2 class="wiz-title">Add your first entity</h2>
          <p class="wiz-sub">Kick off your world with an NPC, location, faction or quest — or skip and add them later.</p>

          <div class="wiz-import-tabs">
            <button class="wiz-itab" :class="{ active: importTab === 0 }" @click="importTab = 0">Guided wizard</button>
            <button class="wiz-itab" :class="{ active: importTab === 1 }" @click="importTab = 1">Paste JSON / Markdown</button>
            <button class="wiz-itab" :class="{ active: importTab === 2 }" @click="importTab = 2">Upload file</button>
          </div>

          <!-- Guided -->
          <div v-if="importTab === 0">
            <!-- Parse warnings banner -->
            <div v-if="parseWarnings.length" class="wiz-parse-notice">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" style="flex-shrink:0">
                <path d="M8 2L14 13H2L8 2Z" stroke="#EF9F27" stroke-width="1.4" stroke-linejoin="round"/>
                <line x1="8" y1="7" x2="8" y2="10" stroke="#EF9F27" stroke-width="1.4" stroke-linecap="round"/>
                <circle cx="8" cy="12" r=".6" fill="#EF9F27"/>
              </svg>
              <span>
                Fields marked <span class="wiz-inferred-badge">inferred</span> were guessed from your text — please confirm they're correct.
              </span>
              <button class="wiz-reparse-btn" @click="importTab = 1; parseWarnings = []">Re-paste</button>
            </div>

            <div class="wiz-field-row">
              <div class="wiz-field">
                <label>Entity type</label>
                <select v-model="entityForm.type">
                  <option v-for="t in ENTITY_TYPES" :key="t">{{ t }}</option>
                </select>
              </div>
              <div class="wiz-field">
                <label>
                  Name <span class="wiz-req">*</span>
                  <span v-if="parseWarnings.includes('name')" class="wiz-inferred-badge">inferred</span>
                </label>
                <input v-model="entityForm.name" type="text" placeholder="e.g. Ezekiel Marsh…"
                  :class="{ 'wiz-inferred': parseWarnings.includes('name') }" />
              </div>
            </div>
            <div v-if="entityForm.type === 'NPC'" class="wiz-field-row">
              <div class="wiz-field">
                <label>
                  Role
                  <span v-if="parseWarnings.includes('role')" class="wiz-inferred-badge">inferred</span>
                </label>
                <input v-model="entityForm.role" type="text" placeholder="e.g. Cultist…"
                  :class="{ 'wiz-inferred': parseWarnings.includes('role') }" />
              </div>
              <div class="wiz-field">
                <label>
                  Location
                  <span v-if="parseWarnings.includes('location')" class="wiz-inferred-badge">inferred</span>
                </label>
                <input v-model="entityForm.location" type="text" placeholder="e.g. Innsmouth, MA…"
                  :class="{ 'wiz-inferred': parseWarnings.includes('location') }" />
              </div>
            </div>
            <div class="wiz-field-row wiz-full">
              <div class="wiz-field">
                <label>
                  Description
                  <span v-if="parseWarnings.includes('description')" class="wiz-inferred-badge">inferred</span>
                </label>
                <input v-model="entityForm.description" type="text" placeholder="One-line summary…"
                  :class="{ 'wiz-inferred': parseWarnings.includes('description') }" />
              </div>
            </div>
            <div class="wiz-field-row wiz-full">
              <div class="wiz-field">
                <label>
                  GM Notes
                  <span v-if="parseWarnings.includes('notes')" class="wiz-inferred-badge">inferred</span>
                </label>
                <textarea v-model="entityForm.notes" placeholder="Background, secrets, connections…"
                  :class="{ 'wiz-inferred': parseWarnings.includes('notes') }" />
              </div>
            </div>
          </div>

          <!-- Paste -->
          <div v-if="importTab === 1">
            <div class="wiz-field-row" style="margin-bottom:10px">
              <div class="wiz-field">
                <label>Entity type</label>
                <select v-model="entityForm.type">
                  <option v-for="t in ENTITY_TYPES" :key="t">{{ t }}</option>
                </select>
              </div>
            </div>
            <div class="wiz-field" style="margin-bottom:10px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                <label style="margin-bottom:0">Paste JSON or Markdown</label>
                <button class="wiz-tpl-btn" title="Fill with import template" @click="fillTemplate">
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="1" width="8" height="10" rx="1"/><line x1="4" y1="4" x2="8" y2="4"/><line x1="4" y1="6.5" x2="8" y2="6.5"/><line x1="4" y1="9" x2="6.5" y2="9"/></svg>
                  Use template
                </button>
              </div>
              <textarea
                v-model="pasteRaw"
                class="wiz-paste-area"
                placeholder="# Ezekiel Marsh&#10;**Role:** Cultist&#10;**Location:** Innsmouth, MA&#10;**Description:** Old fisherman with unsettling eyes&#10;&#10;## Notes&#10;Knows about the Deep Ones. Avoid contact after dark."
              />
            </div>
            <div class="wiz-paste-hint">
              Paste a single entity, a JSON array, or a full campaign document with
              <code>## NPCs</code> / <code>## Locations</code> / <code>## Factions</code> /
              <code>## Quests</code> / <code>## Rumors</code> / <code>## Timeline</code> sections —
              individual entries under <code>### Name</code> headings with <code>**Field:** value</code> pairs.
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:10px">
              <button class="wiz-parse-btn-main" :disabled="!pasteRaw.trim()" @click="runPaste">
                Parse and prefill fields →
              </button>
            </div>

            <div v-if="parsedEntities.length > 1" class="wiz-entity-queue" style="margin-top:10px">
              <div class="wiz-queue-header">{{ parsedEntities.length }} entities detected</div>
              <div v-for="(e, i) in parsedEntities" :key="i" class="wiz-queue-item">
                <span v-if="e.type" class="wiz-type-badge" :data-type="e.type">{{ e.type }}</span>
                <span class="wiz-queue-name">{{ e.type === 'Rumour' ? (e.result.text?.slice(0,50) + (e.result.text?.length > 50 ? '…' : '')) : (e.result.name || '(unnamed)') }}</span>
                <span v-if="e.result.role" class="wiz-queue-role">{{ e.result.role }}</span>
              </div>
            </div>
          </div>

          <!-- Upload -->
          <div v-if="importTab === 2">
            <input
              ref="fileInputRef"
              type="file"
              accept=".json,.md,.markdown,.txt"
              style="display:none"
              @change="handleFileChange"
            />
            <div
              class="wiz-upload-zone"
              :class="{ 'wiz-upload-has-file': uploadFile }"
              @click="fileInputRef.click()"
              @dragover.prevent
              @drop.prevent="handleFileDrop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="margin:0 auto 10px;display:block;opacity:.4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div class="wiz-upload-label">
                {{ uploadFile ? uploadFile.name : 'Drop a file here or click to browse' }}
              </div>
              <div class="wiz-upload-hint">
                <template v-if="parsedEntities.length">
                  {{ parsedEntities.length }} {{ parsedEntities.length === 1 ? 'entity' : 'entities' }} detected — click to replace
                </template>
                <template v-else>Campaign docs with ## NPCs / ## Locations / ## Factions / ## Quests / ## Rumors / ## Timeline sections are fully supported</template>
              </div>
              <div class="wiz-file-badges">
                <span class="wiz-file-badge">.json</span>
                <span class="wiz-file-badge">.md</span>
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:10px">
              <button class="wiz-tpl-btn" @click="downloadTemplate">
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 11h10"/></svg>
                Download template .md
              </button>
            </div>

            <!-- Fallback type selector only shown when types weren't auto-detected -->
            <div v-if="parsedEntities.length && parsedEntities.every(e => !e.type)" class="wiz-field-row" style="margin-top:12px;margin-bottom:0">
              <div class="wiz-field">
                <label>Entity type for imported items</label>
                <select v-model="entityForm.type">
                  <option v-for="t in ENTITY_TYPES" :key="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div v-if="parsedEntities.length" class="wiz-entity-queue">
              <div class="wiz-queue-header">
                {{ parsedEntities.length }} {{ parsedEntities.length === 1 ? 'entity' : 'entities' }} ready to import
              </div>
              <div v-for="(e, i) in parsedEntities" :key="i" class="wiz-queue-item">
                <span class="wiz-type-badge" :data-type="e.type">{{ e.type }}</span>
                <span class="wiz-queue-name">{{ e.type === 'Rumour' ? (e.result.text?.slice(0,50) + (e.result.text?.length > 50 ? '…' : '')) : (e.result.name || '(unnamed)') }}</span>
                <span v-if="e.result.role" class="wiz-queue-role">{{ e.result.role }}</span>
                <span v-else-if="e.result.description" class="wiz-queue-desc">{{ e.result.description.slice(0,50) }}{{ e.result.description.length > 50 ? '…' : '' }}</span>
              </div>
            </div>
          </div>

          <div class="wiz-btn-row" style="margin-top:16px">
            <button class="wiz-btn ghost" @click="skipEntity">Skip for now</button>
            <!-- Multiple entities queued (paste or upload) -->
            <button
              v-if="parsedEntities.length > 1"
              class="wiz-btn primary"
              :disabled="entitySaving"
              @click="saveAllEntities"
            >
              {{ entitySaving ? 'Saving…' : `Add all ${parsedEntities.length} entities →` }}
            </button>
            <!-- Single entity from upload tab -->
            <button
              v-else-if="importTab === 2 && parsedEntities.length === 1"
              class="wiz-btn primary"
              :disabled="entitySaving || !parsedEntities[0].result.name?.trim()"
              @click="saveAllEntities"
            >
              {{ entitySaving ? 'Saving…' : 'Add entity & enter campaign' }}
            </button>
            <!-- Guided form (tab 0) or no parse result yet -->
            <button
              v-else-if="importTab === 0 || importTab === 1"
              class="wiz-btn primary"
              :disabled="entitySaving || !entityForm.name.trim()"
              @click="saveEntity"
            >
              {{ entitySaving ? 'Saving…' : 'Add entity & enter campaign' }}
            </button>
            <!-- Upload tab with no file yet -->
            <button v-else class="wiz-btn primary" @click="skipEntity">Enter campaign →</button>
          </div>
        </template>

      </div><!-- .wiz-card -->
    </div><!-- .wiz-overlay -->
  </Teleport>
</template>

<style scoped>
/* ── Overlay ──────────────────────────────────────────── */
.wiz-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: var(--color-bg-overlay-medium);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.wiz-card {
  position: relative;
  /* ── Pin default theme — wizard never inherits campaign theme ── */
  --color-bg-page:           #040508;
  --color-bg-card:           #0a0d14;
  --color-bg-elevated:       #121622;
  --color-bg-input:          #1a2033;
  --color-bg-subtle:         #080a11;
  --color-accent:            #3b82f6;
  --color-accent-muted:      rgba(59, 130, 246, 0.16);
  --color-border-default:    #1c2130;
  --color-border-active:     #2a3652;
  --color-border-hover:      #32416b;
  --color-border-bracket:    #1c2130;
  --color-border-danger:     rgba(224, 75, 75, 0.50);
  --color-text-primary:      #f0f6fc;
  --color-text-secondary:    #8b9eb3;
  --color-text-hint:         #6b7d8f;
  --color-text-accent:       #60a5fa;
  --color-text-danger:       #e04b4b;
  --color-text-disabled:     #4a4a4a;
  --color-hostile-bg:        rgba(184, 59, 59, 0.20);
  --color-bg-overlay-medium: rgba(0, 0, 0, 0.70);
  --color-shadow-menu:       rgba(0, 0, 0, 0.40);
  --gold:                    #c9a84c;
  --gold2:                   #e8c96a;
  --gold-dim:                rgba(201, 168, 76, 0.15);
  /* ─────────────────────────────────────────────────────── */
  background: var(--color-bg-elevated);
  border: 0.5px solid var(--color-border-default);
  border-radius: 12px;
  width: 100%;
  max-width: 780px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 32px;
  box-shadow: 0 24px 80px var(--color-bg-overlay-medium), 0 4px 16px var(--color-shadow-menu);
}

/* ── Close ────────────────────────────────────────────── */
.wiz-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 0.5px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-hint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
}
.wiz-close:hover { background: var(--color-bg-elevated); color: var(--color-text-primary); }

/* ── Step bar ─────────────────────────────────────────── */
.wiz-step-bar {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}

.wiz-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-hint);
  letter-spacing: .5px;
  white-space: nowrap;
}
.wiz-step.active { color: var(--color-accent); }
.wiz-step.done   { color: var(--color-text-secondary); }

.wiz-step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-default);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500; flex-shrink: 0;
}
.wiz-step.active .wiz-step-num {
  border-color: var(--color-accent);
  background: var(--color-accent-muted);
  color: var(--color-accent);
}
.wiz-step.done .wiz-step-num {
  border-color: var(--color-border-hover);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
}

.wiz-step-label { display: none; }
@media (min-width: 520px) { .wiz-step-label { display: inline; } }

.wiz-step-line {
  flex: 1;
  height: 1px;
  background: var(--color-border-default);
  margin: 0 8px;
  min-width: 8px;
}

/* ── Typography ───────────────────────────────────────── */
.wiz-title {
  font-size: 20px; font-weight: 500;
  margin-bottom: 4px;
  color: var(--color-text-primary);
}
.wiz-sub {
  font-size: 13px;
  color: var(--color-text-hint);
  margin-bottom: 22px;
}
.wiz-req { color: var(--color-accent); }
.wiz-opt { color: var(--color-text-hint); font-size: 10px; font-weight: 400; }

/* ── Fields ───────────────────────────────────────────── */
.wiz-field-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 22px; }

.wiz-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.wiz-full { grid-template-columns: 1fr; }

.wiz-field { display: flex; flex-direction: column; gap: 4px; }
.wiz-field label { font-size: 11px; letter-spacing: .5px; color: var(--color-text-hint); }
.wiz-field input,
.wiz-field select,
.wiz-field textarea {
  background: var(--color-bg-input);
  border: 0.5px solid var(--color-border-default);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  width: 100%;
  font-family: inherit;
  transition: border-color .15s;
}
.wiz-field input:focus,
.wiz-field select:focus,
.wiz-field textarea:focus { border-color: var(--color-border-active); }
.wiz-field input::placeholder,
.wiz-field textarea::placeholder { color: var(--color-text-disabled); }
.wiz-field textarea { resize: vertical; min-height: 80px; font-family: monospace; font-size: 12px; }
.wiz-field select option { background: var(--color-bg-elevated); }

/* ── System cards ─────────────────────────────────────── */
.wiz-system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}
.wiz-sys-card {
  border: 1.5px solid var(--color-border-default);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  background: var(--color-bg-card);
}
.wiz-sys-card:hover                      { border-color: var(--color-border-hover); background: var(--color-accent-muted); }
.wiz-sys-card.selected                   { border-color: var(--color-accent); background: var(--color-accent-muted); }
.wiz-sys-card.custom                     { border-style: dashed; }
/* Per-system identity colours override the generic accent on selection */
.wiz-sys-card[data-sys="dnd5e"].selected    { border-color: rgba(197,160,89,.8);  background: rgba(197,160,89,.10); }
.wiz-sys-card[data-sys="coc"].selected      { border-color: rgba(154,124,30,.8);  background: rgba(154,124,30,.10); }
.wiz-sys-card[data-sys="alien"].selected    { border-color: rgba(57,255,20,.6);   background: rgba(57,255,20,.07);  }
.wiz-sys-card[data-sys="coriolis"].selected { border-color: rgba(0,210,255,.65);  background: rgba(0,210,255,.08);  }
.wiz-sys-card[data-sys="dune"].selected     { border-color: rgba(226,114,34,.8);  background: rgba(226,114,34,.10); }
.wiz-sys-card[data-sys="achtung"].selected  { border-color: rgba(139,0,0,.8);     background: rgba(139,0,0,.12);    }
/* Hover tint matches selection tint for a cohesive feel */
.wiz-sys-card[data-sys="dnd5e"]:hover    { border-color: rgba(197,160,89,.4); background: rgba(197,160,89,.06); }
.wiz-sys-card[data-sys="coc"]:hover      { border-color: rgba(154,124,30,.4); background: rgba(154,124,30,.06); }
.wiz-sys-card[data-sys="alien"]:hover    { border-color: rgba(57,255,20,.3);  background: rgba(57,255,20,.04);  }
.wiz-sys-card[data-sys="coriolis"]:hover { border-color: rgba(0,210,255,.35); background: rgba(0,210,255,.05);  }
.wiz-sys-card[data-sys="dune"]:hover     { border-color: rgba(226,114,34,.4); background: rgba(226,114,34,.06); }
.wiz-sys-card[data-sys="achtung"]:hover  { border-color: rgba(139,0,0,.4);    background: rgba(139,0,0,.07);    }
.wiz-sys-icon {
  width: 30px; height: 30px;
  border-radius: 6px;
  background: var(--color-bg-elevated);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  font-size: 15px;
}
.wiz-sys-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 2px; }
.wiz-sys-desc { font-size: 10px; color: var(--color-text-hint); }

/* ── Preview box ──────────────────────────────────────── */
.wiz-preview-box {
  border: 0.5px solid var(--color-border-default);
  border-radius: 8px;
  background: var(--color-bg-subtle);
  padding: 14px;
  margin-bottom: 14px;
}
.wiz-preview-title {
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--color-text-hint);
  margin-bottom: 10px;
}
.wiz-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.wiz-preview-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--color-bg-card);
  border: 0.5px solid var(--color-bg-elevated);
}
.wiz-preview-label {
  font-size: 10px; letter-spacing: .5px;
  color: var(--color-text-hint);
  margin-bottom: 3px;
}
.wiz-preview-val { font-size: 12px; color: var(--color-text-primary); line-height: 1.6; }

.wiz-tag {
  display: inline-block;
  font-size: 10px;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  border-radius: 4px;
  padding: 2px 5px;
  margin: 2px 2px 0 0;
}

/* ── Buttons ──────────────────────────────────────────── */
.wiz-btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }

.wiz-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-secondary);
  transition: all .15s;
  font-family: inherit;
}
.wiz-btn:hover:not(:disabled) { background: var(--color-bg-elevated); color: var(--color-text-primary); }
.wiz-btn:disabled { opacity: .4; cursor: default; }
.wiz-btn.primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg-page); }
.wiz-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.wiz-btn.ghost { border-color: transparent; color: var(--color-text-hint); }
.wiz-btn.ghost:hover:not(:disabled) { color: var(--color-text-secondary); background: transparent; }

/* ── Import tabs ──────────────────────────────────────── */
.wiz-import-tabs {
  display: flex;
  border-bottom: 0.5px solid var(--color-border-default);
  margin-bottom: 16px;
}
.wiz-itab {
  padding: 7px 14px;
  font-size: 12px; font-weight: 500;
  color: var(--color-text-hint);
  cursor: pointer;
  border: none; background: transparent;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s;
  font-family: inherit;
}
.wiz-itab.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
.wiz-itab:hover:not(.active) { color: var(--color-text-secondary); }

/* ── Warning / error ──────────────────────────────────── */
.wiz-warning {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 8px;
  background: var(--gold-dim);
  border: 0.5px solid var(--gold-dim);
  margin-bottom: 10px;
  font-size: 11px; color: var(--gold2);
}
.wiz-warning-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }

.wiz-error {
  color: var(--color-text-danger);
  font-size: 12px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--color-hostile-bg);
  border: 0.5px solid var(--color-border-danger);
}

/* ── Upload zone ──────────────────────────────────────── */
.wiz-upload-zone {
  border: 1.5px dashed var(--color-border-default);
  border-radius: 8px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  color: var(--color-text-hint);
}
.wiz-upload-zone:hover { border-color: var(--color-border-hover); background: var(--color-bg-elevated); }
.wiz-upload-has-file  { border-color: var(--color-accent); border-style: solid; background: var(--color-accent-muted); }
.wiz-upload-label { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px; }
.wiz-upload-hint  { font-size: 11px; color: var(--color-text-hint); margin-bottom: 10px; }
.wiz-file-badges  { display: flex; justify-content: center; gap: 6px; }
.wiz-file-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 4px;
  background: var(--color-bg-elevated); color: var(--color-text-hint);
  border: 0.5px solid var(--color-border-default);
}

/* ── Entity queue (multi-import preview) ──────────────── */
.wiz-entity-queue {
  border: 0.5px solid var(--color-border-default);
  border-radius: 8px;
  background: var(--color-bg-subtle);
  overflow: hidden;
  margin-top: 10px;
}
.wiz-queue-header {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-accent);
  padding: 7px 12px;
  background: var(--color-accent-muted);
  border-bottom: 0.5px solid var(--color-border-default);
}
.wiz-queue-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 0.5px solid var(--color-border-default);
  font-size: 12px;
}
.wiz-queue-item:last-child { border-bottom: none; }
.wiz-queue-name { color: var(--color-text-primary); font-weight: 500; flex-shrink: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wiz-queue-role { color: var(--color-text-hint); font-size: 11px; flex-shrink: 0; }
.wiz-queue-desc { color: var(--color-text-hint); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Type badges in queue */
.wiz-type-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--color-bg-elevated);
  color: var(--color-text-hint);
  border: 0.5px solid var(--color-border-default);
}
.wiz-type-badge[data-type="NPC"]      { background: rgba(59,130,220,.14); color: #4a9ecc; border-color: rgba(59,130,220,.35); }
.wiz-type-badge[data-type="Location"] { background: rgba(76,171,113,.14); color: #3a9a5a; border-color: rgba(76,171,113,.35); }
.wiz-type-badge[data-type="Faction"]  { background: rgba(168,100,220,.14); color: #a060d8; border-color: rgba(168,100,220,.35); }
.wiz-type-badge[data-type="Quest"]    { background: rgba(220,168,60,.14);  color: #b88a20; border-color: rgba(220,168,60,.35);  }
.wiz-type-badge[data-type="Rumour"]   { background: rgba(220,80,80,.14);   color: #c04040; border-color: rgba(220,80,80,.35);   }
.wiz-type-badge[data-type="Timeline"] { background: rgba(100,160,220,.14); color: #4a88c8; border-color: rgba(100,160,220,.35); }

/* ── Paste tab ────────────────────────────────────────── */
.wiz-paste-area {
  background: var(--color-bg-card);
  border: 0.5px solid var(--color-border-default);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 12px;
  font-family: 'Courier New', monospace;
  padding: 10px 12px;
  outline: none;
  width: 100%;
  min-height: 140px;
  resize: vertical;
  line-height: 1.6;
  transition: border-color .15s;
}
.wiz-paste-area:focus { border-color: var(--color-border-active); }
.wiz-paste-area::placeholder { color: var(--color-text-disabled); }

.wiz-paste-hint {
  font-size: 11px;
  color: var(--color-text-hint);
  margin-top: 5px;
}
.wiz-paste-hint code {
  font-family: 'Courier New', monospace;
  background: var(--color-bg-elevated);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.wiz-parse-btn-main {
  padding: 7px 16px;
  font-size: 12px; font-weight: 500;
  border: 0.5px solid var(--color-border-active);
  border-radius: 8px;
  background: var(--color-accent-muted);
  color: var(--color-accent);
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
}
.wiz-parse-btn-main:hover:not(:disabled) { filter: brightness(1.1); }
.wiz-parse-btn-main:disabled { opacity: .35; cursor: default; }

.wiz-tpl-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  font-size: 11px; font-weight: 500;
  border: 0.5px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text-hint);
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
  white-space: nowrap;
}
.wiz-tpl-btn:hover { color: var(--color-text-primary); border-color: var(--color-border-hover); }

/* ── Parse warnings on guided form ───────────────────── */
.wiz-parse-notice {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 8px;
  background: var(--gold-dim);
  border: 0.5px solid var(--gold-dim);
  margin-bottom: 12px;
  font-size: 11px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.wiz-inferred-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .4px;
  background: var(--gold-dim);
  color: var(--gold2);
  border-radius: 3px;
  padding: 1px 5px;
  margin-left: 4px;
  vertical-align: middle;
}

.wiz-inferred {
  border-color: var(--color-border-bracket) !important;
  background: var(--gold-dim) !important;
}
.wiz-inferred:focus { border-color: var(--color-border-active) !important; }

.wiz-reparse-btn {
  margin-left: auto;
  font-size: 11px;
  background: transparent;
  border: 0.5px solid var(--color-border-default);
  border-radius: 5px;
  color: var(--color-text-hint);
  padding: 2px 8px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
.wiz-reparse-btn:hover { color: var(--color-text-primary); }

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 600px) {
  .wiz-card { padding: 20px 16px; border-radius: 10px; }
  .wiz-field-row { grid-template-columns: 1fr; }
  .wiz-preview-grid { grid-template-columns: 1fr; }
  .wiz-system-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
}
</style>
