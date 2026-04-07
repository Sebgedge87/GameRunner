<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'

const auth     = useAuthStore()
const campaign = useCampaignStore()
const data     = useDataStore()
const ui       = useUiStore()

const activeTab      = ref(0)   // 0=upload, 1=paste
const pasteRaw       = ref('')
const parsedEntities = ref([])
const uploadFile     = ref(null)
const fileInputRef   = ref(null)
const saving         = ref(false)
const saveResults    = ref([])
const saveResultsSummary = computed(() => {
  const ok    = saveResults.value.filter(r => r.status === 'ok').length
  const error = saveResults.value.filter(r => r.status === 'error').length
  const total = saveResults.value.length
  return { ok, error, total, done: total > 0 && ok + error === total }
})
const fallbackType   = ref('NPC')
const ENTITY_TYPES   = ['NPC', 'Location', 'Faction', 'Quest', 'Rumour', 'Timeline']

function apif(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
  return fetch(path, { ...opts, headers })
}

/* ── Parse helpers ─────────────────────────────────────── */
const FIELD_ALIASES = {
  name:        ['name', 'title', 'character', 'character_name', 'entity'],
  role:        ['role', 'type', 'class', 'occupation', 'job', 'rank', 'position', 'archetype'],
  location:    ['location', 'home', 'hometown', 'place', 'region', 'base', 'area', 'origin'],
  faction:     ['faction', 'group', 'organization', 'organisation', 'allegiance', 'guild'],
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

function parseSingleJsonObj(src) {
  const result = { name: '', role: '', location: '', faction: '', description: '', notes: '' }
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
  return { name: '', role: '', location: '', faction: '', description: '', notes: '' }
}

function parseMarkdownDocument(raw) {
  const lines = raw.split('\n')
  const entities = []
  let currentSection = null
  let cur = null

  function flush() {
    if (!cur) return
    if (!cur.result.notes && cur.notesLines.length) cur.result.notes = cur.notesLines.join('\n')
    if (!cur.result.description && cur.descLines.length) cur.result.description = cur.descLines.join(' ')
    const hasContent = cur.type === 'Rumour' ? cur.result.text?.trim() : cur.result.name?.trim()
    if (hasContent) entities.push({ type: cur.type, result: cur.result, warnings: [], format: 'markdown' })
    cur = null
  }

  for (const line of lines) {
    const s = line.trim()
    if (/^#(?!#)/.test(s)) continue
    if (/^##(?!#)/.test(s)) {
      const heading = s.replace(/^#+\s*/, '')
      const detected = detectSectionType(heading)
      if (detected) { flush(); currentSection = detected; cur = null }
      else if (cur) cur.inNotes = /notes?|background|backstory|secrets?|gm.?notes?|details?/i.test(heading)
      continue
    }
    if (/^###(?!#)/.test(s)) {
      flush()
      if (currentSection) {
        const name = s.replace(/^#+\s*/, '')
        cur = { type: currentSection, result: blankResult(currentSection), notesLines: [], descLines: [], inNotes: false }
        if (cur.type !== 'Rumour') cur.result.name = name
      }
      continue
    }
    if (!s) continue
    if (!cur && currentSection === 'Rumour' && /^[-*]\s+/.test(s)) {
      entities.push({ type: 'Rumour', result: { text: s.replace(/^[-*]\s+/, ''), source_npc: '', source_location: '' }, warnings: [], format: 'markdown' })
      continue
    }
    if (!cur) continue
    if (/^#{1,6}\s+(notes?|background|backstory|secrets?|gm.?notes?|details?)/i.test(s)) { cur.inNotes = true; continue }
    if (/^#{1,6}/.test(s)) { cur.inNotes = false; continue }
    if (cur.inNotes) { cur.notesLines.push(s); continue }
    const kv = s.match(/^\*{1,2}([^*:]+)\*{0,2}:\*{0,2}\s+(.+)$/) || s.match(/^([A-Za-z][A-Za-z _/-]{1,28}):\s+(.+)$/)
    if (kv) {
      const key = kv[1].toLowerCase().trim().replace(/[\s_-]+/g, '_')
      const val = kv[2].replace(/\*\*/g, '').trim()
      const r = cur.result
      if (cur.type === 'Rumour') {
        if (/^(source|source_npc|npc)$/.test(key)) r.source_npc = val
        else if (/^(location|source_location|place)$/.test(key)) r.source_location = val
        else if (/^(text|rumou?r|content)$/.test(key)) r.text = val
      } else if (cur.type === 'Timeline') {
        if (/^(date|in_world_date|when)$/.test(key)) r.date = val
        else if (/^(significance|importance)$/.test(key)) r.significance = val
        else if (/^(description|summary|desc)$/.test(key)) r.description = val
        else if (/^(notes?|gm_notes?)$/.test(key)) r.notes = val
      } else {
        const field = aliasToField(kv[1])
        if (field && !r[field]) r[field] = val
      }
      continue
    }
    if (/^[-*]\s+/.test(s)) {
      const text = s.replace(/^[-*]\s+/, '')
      if (cur.type === 'Rumour' && !cur.result.text) cur.result.text = text
      else cur.descLines.push(text)
      continue
    }
    if (s.length > 4) {
      if (cur.type === 'Rumour' && !cur.result.text) cur.result.text = s
      else cur.descLines.push(s)
    }
  }
  flush()
  return entities
}

function parseAll(raw) {
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr) && arr.length > 0)
        return arr.filter(x => x && typeof x === 'object').map(src => ({ ...parseSingleJsonObj(src), type: fallbackType.value }))
    } catch {}
  }
  if (trimmed.startsWith('{')) {
    try { return [{ ...parseSingleJsonObj(JSON.parse(trimmed)), type: fallbackType.value }] } catch {}
  }
  const mdEntities = parseMarkdownDocument(raw)
  if (mdEntities.length > 0) return mdEntities
  const result = { name: '', role: '', location: '', faction: '', description: '', notes: '' }
  return [{ result, warnings: [], format: 'text', type: fallbackType.value }]
}

/* ── File handling ─────────────────────────────────────── */
function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) readFile(file)
}
function handleFileChange(e) {
  const file = e.target?.files?.[0]
  if (file) readFile(file)
}
function readFile(file) {
  uploadFile.value = file
  parsedEntities.value = []
  const reader = new FileReader()
  reader.onload = ev => { parsedEntities.value = parseAll(ev.target.result) }
  reader.readAsText(file)
}

function runPaste() {
  if (!pasteRaw.value.trim()) return
  parsedEntities.value = parseAll(pasteRaw.value)
}

/* ── Template ──────────────────────────────────────────── */
const IMPORT_TEMPLATE = `# Campaign Name

## NPCs

### NPC Name
**Role:** Merchant / Guard / Villain / Cultist…
**Location:** Where they are usually found
**Faction:** Name of faction (auto-created if missing)
**Description:** One-line summary visible to players
**Notes:** GM-only secrets, motivations, connections

---

## Locations

### Location Name
**Description:** What players see and know
**Notes:** Hidden details, traps, secrets, exits

---

## Factions

### Faction Name
**Description:** Public reputation and known activities
**Goals:** What this faction is trying to achieve
**Notes:** Leadership structure, internal tensions, secret agenda

---

## Quests

### Quest Title
**Description:** What the players know and are being asked to do
**Notes:** GM context — red herrings, true culprit, possible outcomes, rewards

---

## Rumors

- The king's adviser has not been seen at court in three days.
- Strange lights appear near the old mill every night at midnight.

---

## Timeline

### Event Title
**Date:** In-world date (e.g. 3rd Frost Moon, Year 412)
**Significance:** minor / major / legendary
**Description:** What happened — player-visible account
**Notes:** GM context: true causes, hidden consequences, follow-on hooks
`

function downloadTemplate() {
  const blob = new Blob([IMPORT_TEMPLATE], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'campaign-import-template.md'; a.click()
  URL.revokeObjectURL(url)
}
function fillTemplate() { pasteRaw.value = IMPORT_TEMPLATE; parsedEntities.value = [] }

/* ── Save ──────────────────────────────────────────────── */
function endpointAndBody(ent) {
  const type = ent.type || fallbackType.value
  const r = ent.result
  if (type === 'NPC')
    return { endpoint: '/api/npcs',      body: { name: r.name, role: r.role, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Location')
    return { endpoint: '/api/locations', body: { name: r.name, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Faction')
    return { endpoint: '/api/factions',  body: { name: r.name, description: r.description, gm_notes: r.notes }, valid: !!r.name?.trim() }
  if (type === 'Quest')
    return { endpoint: '/api/quests',    body: { title: r.name, description: r.description, gm_notes: r.notes, status: 'active', quest_type: 'main' }, valid: !!r.name?.trim() }
  if (type === 'Rumour')
    return { endpoint: '/api/rumours',   body: { text: r.text, is_true: false, source_npc: r.source_npc || null, source_location: r.source_location || null }, valid: !!r.text?.trim() }
  if (type === 'Timeline')
    return { endpoint: '/api/timeline',  body: { title: r.name, description: r.description, gm_notes: r.notes, in_world_date: r.date, significance: r.significance || 'minor' }, valid: !!r.name?.trim() }
  return null
}

function normName(value = '') {
  return String(value || '').trim().toLowerCase()
}

async function ensureNamedEntity(name, type, indexMap) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return null
  const key = normName(trimmed)
  if (indexMap.has(key)) return indexMap.get(key)

  const endpoint = type === 'faction' ? '/api/factions' : '/api/locations'
  const payload = { name: trimmed }
  const r = await apif(endpoint, { method: 'POST', body: JSON.stringify(payload) })
  if (!r.ok) {
    let msg = `Failed to create ${type}`
    try { const b = await r.json(); msg = b?.error || b?.message || msg } catch {}
    throw new Error(msg)
  }
  const body = await r.json()
  const created = type === 'faction' ? body?.faction : body?.location
  const id = created?.id
  if (!id) throw new Error(`Created ${type} "${trimmed}" but no id returned`)
  indexMap.set(key, id)
  return id
}

async function saveAll() {
  if (!parsedEntities.value.length) return
  saving.value = true
  saveResults.value = parsedEntities.value.map(e => ({
    type:     e.type || fallbackType.value,
    label:    e.type === 'Rumour'
                ? (e.result.text?.slice(0, 60) + (e.result.text?.length > 60 ? '…' : ''))
                : (e.result.name || '(unnamed)'),
    status:   'pending',
    errorMsg: '',
  }))
  let saved = 0
  try {
    const factionByName = new Map((data.factions || []).map(f => [normName(f.name || f.title), f.id]).filter(([k, id]) => k && id))
    const locationByName = new Map((data.locations || []).map(l => [normName(l.name || l.title), l.id]).filter(([k, id]) => k && id))

    for (let i = 0; i < parsedEntities.value.length; i++) {
      const entity = parsedEntities.value[i]
      const info = endpointAndBody(entity)
      if (!info || !info.valid) {
        saveResults.value[i].status   = 'error'
        saveResults.value[i].errorMsg = 'Missing required field (name or text)'
        continue
      }
      try {
        if (entity.type === 'NPC') {
          const factionId = await ensureNamedEntity(entity.result.faction, 'faction', factionByName)
          const locationId = await ensureNamedEntity(entity.result.location, 'location', locationByName)
          if (factionId) info.body.faction_id = factionId
          if (locationId) info.body.home_location_id = locationId
        }
        const r = await apif(info.endpoint, { method: 'POST', body: JSON.stringify(info.body) })
        if (!r.ok) {
          let msg = `HTTP ${r.status}`
          try { const b = await r.json(); msg = b?.error || b?.message || b?.detail || msg } catch {}
          saveResults.value[i].status   = 'error'
          saveResults.value[i].errorMsg = msg
        } else {
          saveResults.value[i].status = 'ok'
          saved++
        }
      } catch (err) {
        saveResults.value[i].status   = 'error'
        saveResults.value[i].errorMsg = err.message || 'Network error'
      }
    }
    if (saved > 0) await data.loadAll()
  } catch (e) {
    ui.showToast(e.message || 'Import failed', '', '✕')
  } finally {
    saving.value = false
  }
}

function close() { saveResults.value = []; ui.closeBulkImport() }

function onKey(e) { if (e.key === 'Escape') close() }
import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="ui.bulkImportOpen" class="bim-overlay" @click.self="close">
      <div class="bim-card">

        <!-- Header -->
        <div class="bim-header">
          <div>
            <div class="bim-title">Import Entities</div>
            <div class="bim-sub">Bulk-import NPCs, Locations, Factions, Quests, Rumours and Timeline events into this campaign.</div>
          </div>
          <button class="bim-close" title="Close" @click="close">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="bim-tabs">
          <button class="bim-tab" :class="{ active: activeTab === 0 }" @click="activeTab = 0">Upload file</button>
          <button class="bim-tab" :class="{ active: activeTab === 1 }" @click="activeTab = 1">Paste text</button>
        </div>

        <!-- Upload tab -->
        <div v-if="activeTab === 0" class="bim-body">
          <input ref="fileInputRef" type="file" accept=".json,.md,.markdown,.txt" style="display:none" @change="handleFileChange" />
          <div class="bim-dropzone" :class="{ 'bim-has-file': uploadFile }" @click="fileInputRef.click()" @dragover.prevent @drop.prevent="handleDrop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="margin:0 auto 10px;display:block;opacity:.4">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div class="bim-drop-label">{{ uploadFile ? uploadFile.name : 'Drop a file here or click to browse' }}</div>
            <div class="bim-drop-hint">
              <template v-if="parsedEntities.length && activeTab === 0">{{ parsedEntities.length }} {{ parsedEntities.length === 1 ? 'entity' : 'entities' }} detected — click to replace</template>
              <template v-else>Markdown with ## section headers or JSON arrays</template>
            </div>
            <div class="bim-badges">
              <span class="bim-badge">.json</span>
              <span class="bim-badge">.md</span>
            </div>
            <div class="bim-tpl-row" @click.stop>
              <span class="bim-tpl-hint">Don't have a file yet?</span>
              <button class="bim-tpl-btn" @click="downloadTemplate">
                <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 11h10"/>
                </svg>
                Download template .md
              </button>
            </div>
          </div>
        </div>

        <!-- Paste tab -->
        <div v-if="activeTab === 1" class="bim-body">
          <div class="bim-paste-label-row">
            <label class="bim-label">Paste JSON or Markdown</label>
            <button class="bim-tpl-btn" @click="fillTemplate">
              <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                <rect x="2" y="1" width="8" height="10" rx="1"/><line x1="4" y1="4" x2="8" y2="4"/><line x1="4" y1="6.5" x2="8" y2="6.5"/>
              </svg>
              Use template
            </button>
          </div>
          <textarea v-model="pasteRaw" class="bim-textarea" placeholder="# Campaign Name&#10;&#10;## NPCs&#10;### Ezekiel Marsh&#10;**Role:** Cultist&#10;..."></textarea>
          <div class="bim-paste-hint">
            Paste a campaign doc with <code>## NPCs</code> / <code>## Locations</code> / <code>## Factions</code> /
            <code>## Quests</code> / <code>## Rumors</code> / <code>## Timeline</code> sections,
            a JSON array, or a single JSON object.
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:10px">
            <button class="bim-parse-btn" :disabled="!pasteRaw.trim()" @click="runPaste">Parse →</button>
          </div>
        </div>

        <!-- Fallback type when no section headers detected -->
        <div v-if="parsedEntities.length && parsedEntities.every(e => !e.type || e.type === fallbackType)" class="bim-fallback-type">
          <label class="bim-label">Entity type</label>
          <select v-model="fallbackType" class="bim-select">
            <option v-for="t in ENTITY_TYPES" :key="t">{{ t }}</option>
          </select>
        </div>

        <!-- Queue — hidden once saving starts -->
        <div v-if="parsedEntities.length && !saveResults.length" class="bim-queue">
          <div class="bim-queue-header">{{ parsedEntities.length }} {{ parsedEntities.length === 1 ? 'entity' : 'entities' }} ready to import</div>
          <div v-for="(e, i) in parsedEntities" :key="i" class="bim-queue-row">
            <span class="bim-type-badge" :data-type="e.type">{{ e.type }}</span>
            <span class="bim-queue-name">{{ e.type === 'Rumour' ? (e.result.text?.slice(0,60) + (e.result.text?.length > 60 ? '…' : '')) : (e.result.name || '(unnamed)') }}</span>
            <span v-if="e.result.role" class="bim-queue-role">{{ e.result.role }}</span>
            <span v-else-if="e.result.description" class="bim-queue-desc">{{ e.result.description.slice(0,50) }}{{ e.result.description.length > 50 ? '…' : '' }}</span>
          </div>
        </div>

        <!-- Results panel — appears the moment saving starts -->
        <div v-if="saveResults.length" class="bim-results">
          <div class="bim-results-header">
            <span v-if="!saveResultsSummary.done">Saving {{ saveResults.length }} {{ saveResults.length === 1 ? 'entity' : 'entities' }}…</span>
            <span v-else>{{ saveResultsSummary.ok }} saved{{ saveResultsSummary.error ? `, ${saveResultsSummary.error} failed` : '' }}</span>
          </div>
          <div class="bim-results-list">
            <div v-for="(row, i) in saveResults" :key="i" class="bim-result-row" :data-status="row.status">
              <span class="bim-type-badge" :data-type="row.type">{{ row.type }}</span>
              <span class="bim-result-name">{{ row.label }}</span>
              <span class="bim-result-status">
                <svg v-if="row.status === 'pending'" class="bim-spinner" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="8" cy="8" r="6" stroke-dasharray="28" stroke-dashoffset="10" stroke-opacity=".3"/>
                  <path d="M8 2a6 6 0 0 1 6 6" stroke-linecap="round"/>
                </svg>
                <svg v-else-if="row.status === 'ok'" class="bim-status-ok" viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M2.5 7.5L5.5 10.5L11.5 4"/>
                </svg>
                <template v-else-if="row.status === 'error'">
                  <svg class="bim-status-err" viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
                  </svg>
                  <span class="bim-result-errmsg">{{ row.errorMsg }}</span>
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bim-footer">
          <template v-if="!saveResultsSummary.done">
            <button class="bim-btn ghost" @click="close">Cancel</button>
            <button class="bim-btn primary" :disabled="saving || !parsedEntities.length" @click="saveAll">
              {{ saving ? 'Importing…' : parsedEntities.length ? `Import ${parsedEntities.length} ${parsedEntities.length === 1 ? 'entity' : 'entities'} →` : 'Import →' }}
            </button>
          </template>
          <template v-else>
            <span class="bim-results-summary">
              <span class="bim-summary-ok">{{ saveResultsSummary.ok }} saved</span>
              <template v-if="saveResultsSummary.error">&nbsp;·&nbsp;<span class="bim-summary-err">{{ saveResultsSummary.error }} failed</span></template>
            </span>
            <button class="bim-btn primary" @click="close">Done</button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.bim-overlay {
  position: fixed; inset: 0; z-index: 310;
  background: var(--color-bg-overlay-medium);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.bim-card {
  position: relative;
  /* Pin default theme — never inherits campaign theme */
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
  --color-text-primary:      #f0f6fc;
  --color-text-secondary:    #8b9eb3;
  --color-text-hint:         #6b7d8f;
  --color-text-disabled:     #4a4a4a;
  --color-bg-overlay-medium: rgba(0, 0, 0, 0.70);
  /* ─────────────────────────────────────────────────────── */
  background: var(--color-bg-elevated);
  border: 0.5px solid var(--color-border-default);
  border-radius: 12px;
  width: 100%; max-width: 680px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 24px 80px var(--color-bg-overlay-medium);
  display: flex; flex-direction: column;
}

/* Header */
.bim-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding: 24px 24px 16px;
}
.bim-title { font-size: 18px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 4px; }
.bim-sub   { font-size: 12px; color: var(--color-text-hint); line-height: 1.5; }
.bim-close {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 6px;
  border: 0.5px solid var(--color-border-default); background: transparent;
  color: var(--color-text-hint); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s;
}
.bim-close:hover { background: var(--color-bg-card); color: var(--color-text-primary); }

/* Tabs */
.bim-tabs {
  display: flex; border-bottom: 0.5px solid var(--color-border-default);
  padding: 0 24px;
}
.bim-tab {
  padding: 8px 14px; font-size: 12px; font-weight: 500;
  color: var(--color-text-hint); cursor: pointer;
  border: none; background: transparent;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .15s; font-family: inherit;
}
.bim-tab.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
.bim-tab:hover:not(.active) { color: var(--color-text-secondary); }

/* Body */
.bim-body { padding: 16px 24px 0; }

/* Dropzone */
.bim-dropzone {
  border: 1.5px dashed var(--color-border-default);
  border-radius: 8px; padding: 24px; text-align: center;
  cursor: pointer; transition: border-color .15s, background .15s;
}
.bim-dropzone:hover { border-color: var(--color-border-hover); background: var(--color-bg-card); }
.bim-has-file { border-style: solid; border-color: var(--color-accent); background: var(--color-accent-muted); }
.bim-drop-label { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 4px; }
.bim-drop-hint  { font-size: 11px; color: var(--color-text-hint); margin-bottom: 8px; }
.bim-badges { display: flex; justify-content: center; gap: 6px; margin-bottom: 14px; }
.bim-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 4px;
  background: var(--color-bg-elevated); color: var(--color-text-hint);
  border: 0.5px solid var(--color-border-default);
}
.bim-tpl-row  { display: flex; align-items: center; justify-content: center; gap: 8px; padding-top: 4px; }
.bim-tpl-hint { font-size: 11px; color: var(--color-text-hint); }
.bim-tpl-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; font-size: 11px; font-weight: 500;
  border: 0.5px solid var(--color-border-default); border-radius: 6px;
  background: var(--color-bg-card); color: var(--color-text-hint);
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.bim-tpl-btn:hover { color: var(--color-text-primary); border-color: var(--color-border-hover); }

/* Paste tab */
.bim-paste-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.bim-label { font-size: 11px; letter-spacing: .5px; color: var(--color-text-hint); }
.bim-textarea {
  width: 100%; min-height: 160px; resize: vertical;
  background: var(--color-bg-card); border: 0.5px solid var(--color-border-default);
  border-radius: 8px; color: var(--color-text-primary);
  font-size: 12px; font-family: 'Courier New', monospace;
  padding: 10px 12px; outline: none; line-height: 1.6; transition: border-color .15s;
}
.bim-textarea:focus { border-color: var(--color-border-active); }
.bim-textarea::placeholder { color: var(--color-text-disabled); }
.bim-paste-hint { font-size: 11px; color: var(--color-text-hint); margin-top: 6px; }
.bim-paste-hint code {
  font-family: 'Courier New', monospace; background: var(--color-bg-card);
  padding: 1px 4px; border-radius: 3px; font-size: 10px;
}
.bim-parse-btn {
  padding: 7px 16px; font-size: 12px; font-weight: 500;
  border: 0.5px solid var(--color-border-active); border-radius: 8px;
  background: var(--color-accent-muted); color: var(--color-accent);
  cursor: pointer; font-family: inherit; transition: filter .15s;
}
.bim-parse-btn:hover:not(:disabled) { filter: brightness(1.15); }
.bim-parse-btn:disabled { opacity: .35; cursor: default; }

/* Fallback type */
.bim-fallback-type {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 24px 0;
}
.bim-select {
  background: var(--color-bg-input); border: 0.5px solid var(--color-border-default);
  border-radius: 6px; color: var(--color-text-primary); font-size: 12px;
  padding: 5px 8px; outline: none; font-family: inherit;
}
.bim-select:focus { border-color: var(--color-border-active); }

/* Queue */
.bim-queue {
  margin: 14px 24px 0;
  border: 0.5px solid var(--color-border-default);
  border-radius: 8px; overflow: hidden;
  background: var(--color-bg-subtle);
}
.bim-queue-header {
  font-size: 10px; letter-spacing: 1px;
  color: var(--color-accent); padding: 7px 12px;
  background: var(--color-accent-muted);
  border-bottom: 0.5px solid var(--color-border-default);
}
.bim-queue-row {
  display: flex; align-items: baseline; gap: 8px;
  padding: 6px 12px; border-bottom: 0.5px solid var(--color-border-default);
  font-size: 12px;
}
.bim-queue-row:last-child { border-bottom: none; }
.bim-queue-name { color: var(--color-text-primary); font-weight: 500; flex-shrink: 0; }
.bim-queue-role { color: var(--color-text-hint); font-size: 11px; flex-shrink: 0; }
.bim-queue-desc { color: var(--color-text-hint); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Type badges */
.bim-type-badge {
  flex-shrink: 0; font-size: 9px; font-weight: 600; letter-spacing: .5px;
  text-transform: uppercase; padding: 1px 5px; border-radius: 3px;
  background: var(--color-bg-elevated); color: var(--color-text-hint);
  border: 0.5px solid var(--color-border-default);
}
.bim-type-badge[data-type="NPC"]      { background: rgba(59,130,220,.14);  color: #4a9ecc; border-color: rgba(59,130,220,.35);  }
.bim-type-badge[data-type="Location"] { background: rgba(76,171,113,.14);  color: #3a9a5a; border-color: rgba(76,171,113,.35);  }
.bim-type-badge[data-type="Faction"]  { background: rgba(168,100,220,.14); color: #a060d8; border-color: rgba(168,100,220,.35); }
.bim-type-badge[data-type="Quest"]    { background: rgba(220,168,60,.14);  color: #b88a20; border-color: rgba(220,168,60,.35);  }
.bim-type-badge[data-type="Rumour"]   { background: rgba(220,80,80,.14);   color: #c04040; border-color: rgba(220,80,80,.35);   }
.bim-type-badge[data-type="Timeline"] { background: rgba(100,160,220,.14); color: #4a88c8; border-color: rgba(100,160,220,.35); }

/* Footer */
.bim-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px 20px; margin-top: 14px;
  border-top: 0.5px solid var(--color-border-default);
}
.bim-btn {
  padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1.5px solid var(--color-border-default);
  background: transparent; color: var(--color-text-secondary);
  transition: all .15s; font-family: inherit;
}
.bim-btn:hover:not(:disabled) { background: var(--color-bg-card); color: var(--color-text-primary); }
.bim-btn:disabled { opacity: .4; cursor: default; }
.bim-btn.primary { background: var(--color-accent); border-color: var(--color-accent); color: var(--color-bg-page); }
.bim-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.bim-btn.ghost { border-color: transparent; color: var(--color-text-hint); }
.bim-btn.ghost:hover:not(:disabled) { color: var(--color-text-secondary); background: transparent; }

/* Results panel */
.bim-results { margin: 14px 24px 0; border: 0.5px solid var(--color-border-default); border-radius: 8px; overflow: hidden; background: var(--color-bg-subtle); }
.bim-results-header { font-size: 10px; letter-spacing: 1px; color: var(--color-accent); padding: 7px 12px; background: var(--color-accent-muted); border-bottom: 0.5px solid var(--color-border-default); }
.bim-results-list { max-height: 260px; overflow-y: auto; }
.bim-result-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 0.5px solid var(--color-border-default); font-size: 12px; }
.bim-result-row:last-child { border-bottom: none; }
.bim-result-row[data-status="ok"]    { background: rgba(76,171,113,.06); }
.bim-result-row[data-status="error"] { background: rgba(220,80,80,.06); }
.bim-result-name { flex: 1; color: var(--color-text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bim-result-status { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.bim-result-errmsg { font-size: 10px; color: #c04040; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bim-status-ok  { color: #3a9a5a; flex-shrink: 0; }
.bim-status-err { color: #c04040; flex-shrink: 0; }
@keyframes bim-spin { to { transform: rotate(360deg); } }
.bim-spinner { color: var(--color-text-hint); animation: bim-spin .8s linear infinite; transform-origin: center; flex-shrink: 0; }
.bim-results-summary { font-size: 12px; }
.bim-summary-ok  { color: #3a9a5a; font-weight: 500; }
.bim-summary-err { color: #c04040; font-weight: 500; }
</style>
