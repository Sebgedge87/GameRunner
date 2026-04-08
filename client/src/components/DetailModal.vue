<template>
  <Teleport to="body">
    <div v-if="ui.detailModal" class="dm-overlay" @click.self="ui.closeDetail()">
      <div class="dm-panel">

        <!-- Corner bracket top-left -->
        <div class="dm-bracket-tl">⌜</div>

        <!-- Header -->
        <div class="dm-header">
          <span class="dm-type-label">{{ typeLabel }}</span>
          <button class="dm-close" @click="ui.closeDetail()" aria-label="Close">✕</button>
        </div>

        <!-- Scrollable content -->
        <div class="dm-body" @click="handleModalClick" v-html="renderedContent"></div>

        <!-- Player contextual actions (non-GM) -->
        <div v-if="hasPlayerActions" class="dm-player-actions">
          <button
            v-if="ui.detailModal?.type === 'job' && ui.detailModal?.item?.status === 'open' && !campaign.isGm"
            class="dm-btn dm-btn-primary"
            @click="acceptJob"
          >Accept Job</button>
          <button class="dm-btn dm-btn-ghost" @click="pinItem">📌 Pin</button>
        </div>

        <!-- GM-only section -->
        <div v-if="campaign.isGm" class="dm-gm-section">
          <div class="dm-gm-label">GM ONLY</div>
          <div class="dm-gm-actions">
            <!-- Contextual GM actions -->
            <button
              v-if="ui.detailModal?.type === 'job' && !ui.detailModal?.item?.promoted_quest_id"
              class="dm-btn dm-btn-ghost"
              @click="promoteJobToQuest"
            >→ Quest</button>
            <button
              v-if="ui.detailModal?.type === 'location'"
              class="dm-btn"
              :class="isPartyLocation ? 'dm-btn-active' : 'dm-btn-ghost'"
              @click="togglePartyLocation"
            >{{ isPartyLocation ? '📍 Party Here ✓' : 'Set Party Location' }}</button>

            <!-- Universal GM actions -->
            <button class="dm-btn dm-btn-ghost" @click="pinItem">📌 Pin</button>
            <button class="dm-btn dm-btn-ghost" @click="toggleHiddenItem">
              {{ ui.detailModal?.item?.hidden ? '👁 Reveal' : '🙈 Hide' }}
            </button>
            <button class="dm-btn dm-btn-ghost" @click="editItem">✏️ Edit</button>
            <button class="dm-btn dm-btn-danger" @click="deleteItem">🗑 Delete</button>
          </div>
        </div>

        <!-- Corner bracket bottom-right -->
        <div class="dm-bracket-br">⌟</div>

      </div>
    </div>
  </Teleport>
</template>


<script setup>
import { computed } from 'vue'
import { renderMd } from '@/utils/markdown'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const ui = useUiStore()
const campaign = useCampaignStore()
const data = useDataStore()

/** Is the currently viewed location the party's active location? */
const isPartyLocation = computed(() => {
  if (ui.detailModal?.type !== 'location') return false
  return String(campaign.currentPartyLocationId) === String(ui.detailModal?.item?.id)
})

const TYPE_LABELS = {
  quest: 'Quest', npc: 'NPC', location: 'Location', hook: 'Plot Hook',
  faction: 'Faction', timeline: 'Timeline Event', inventory: 'Item',
  'key-item': 'Key Item', job: 'Job Board', bestiary: 'Bestiary', rumour: 'Rumour',
}

const typeLabel = computed(() => TYPE_LABELS[ui.detailModal?.type] || 'Detail')

/** Show the player action bar when there's a non-GM contextual action */
const hasPlayerActions = computed(() => {
  if (campaign.isGm) return false
  const m = ui.detailModal
  if (!m) return false
  if (m.type === 'job' && m.item?.status === 'open') return true
  return false
})

const TYPE_RELOAD = {
  quest: () => data.loadQuests(),
  npc: () => data.loadNpcs(),
  location: () => data.loadLocations(),
  hook: () => data.loadHooks(),
  faction: () => data.loadFactions(),
  timeline: () => data.loadTimeline(),
  inventory: () => data.loadInventory(),
  'key-item': () => data.loadInventory(),
  job: () => data.loadJobs(),
  bestiary: () => data.loadBestiary(),
  rumour: () => data.loadRumours(),
  map: () => data.loadMaps(),
}

function esc(s) {
  if (s == null) return ''
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Render a prose (markdown) content block
function md(s) { return s ? renderMd(s) : '' }

// Metadata field — short values, escaped plain text
function df(label, value) {
  if (!value && value !== 0) return ''
  return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(value))}</div></div>`
}

// Prose field rendered as markdown
function dfMd(label, value) {
  if (!value) return ''
  return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-body" style="margin:0">${md(value)}</div></div>`
}

// Renders a field whose values are clickable links that open related detail views
function dfLinks(label, values, type) {
  if (!values) return ''
  const items = Array.isArray(values) ? values : [values]
  if (!items.length) return ''
  const chips = items.map(v =>
    `<span class="tag link-chip" data-item-name="${esc(String(v))}" data-item-type="${esc(type)}" style="cursor:pointer;text-decoration:underline dotted">${esc(String(v))}</span>`
  ).join(' ')
  return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-field-value" style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div></div>`
}

function img(d) {
  if (d.image_path) return `<img class="detail-img" src="${d.image_path}" onerror="this.style.display='none'" alt=""/>`
  if (d.image_url) return `<img class="detail-img" src="${d.image_url}" onerror="this.style.display='none'" alt=""/>`
  return ''
}

const renderedContent = computed(() => {
  if (!ui.detailModal) return ''
  const { type, item: d } = ui.detailModal
  const title = d.title || d.name || d.label || '(Untitled)'
  const isGm = campaign.isGm

  switch (type) {
    case 'quest':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.type||'side')}">${esc(d.type||'side')}</span><span class="tag tag-${esc(d.status||'active')}">${esc(d.status||'active')}</span></div>
        ${d.progress!=null?`<div style="margin-bottom:10px"><div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${d.progress}%"></div></div><div style="font-size:10px;color:var(--text3);margin-top:2px">${d.progress}% complete</div></div>`:''}
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${dfLinks('Location', d.location, 'location')}${dfLinks('Connected To', d.connected_to, 'quest')}`
    case 'npc':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta">
          ${d.role?`<span class="tag">${esc(d.role)}</span>`:''}
          ${d.race?`<span class="tag">${esc(d.race)}</span>`:''}
          ${d.disposition?`<span class="tag tag-${esc(d.disposition)}">${esc(d.disposition)}</span>`:''}
          ${d.faction?`<span class="tag">${esc(d.faction)}</span>`:''}
        </div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${d.player_notes?`<div class="detail-body" style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">${md(d.player_notes)}</div>`:''}
        ${dfLinks('Home Location', d.home_location||d.location, 'location')}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'location':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.status||'unvisited')}">${esc(d.status||'unvisited')}</span>${d.danger?`<span class="tag tag-${esc(d.danger)}">${esc(d.danger)}</span>`:''}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${d.player_notes?`<div class="detail-body" style="margin-top:8px">${md(d.player_notes)}</div>`:''}
        ${dfLinks('Connected To', d.connected_to, 'location')}${df('Visited Session', d.visited_session)}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'hook':
      return `<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.type||'clue')}">${esc(d.type||'clue')}</span><span class="tag tag-${esc(d.status||'active')}">${esc(d.status||'active')}</span></div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${dfLinks('Connected To', d.connected_to, 'quest')}`
    case 'faction':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${dfMd('Goals', d.goals)}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'timeline':
      return `<div class="detail-title">${esc(title)}</div>
        <div class="detail-grid">
          <div class="detail-sidebar-col">
            ${d.in_world_date?`<div class="detail-sidebar-section"><div class="detail-sidebar-label">In-World Date</div><div class="detail-sidebar-value">${esc(d.in_world_date)}</div></div>`:''}
            ${d.session_number?`<div class="detail-sidebar-section"><div class="detail-sidebar-label">Session</div><div class="detail-sidebar-value">${esc(d.session_number)}</div></div>`:''}
            ${d.significance&&d.significance!=='minor'?`<div class="detail-sidebar-section"><div class="detail-sidebar-label">Significance</div><span class="tag">${esc(d.significance)}</span></div>`:''}
          </div>
          <div class="detail-body-col">
            ${d.description?`<div class="detail-body" style="margin:0">${md(d.description)}</div>`:`<div style="color:var(--text3);font-size:13px;font-style:italic">No description recorded.</div>`}
            ${d.linked_quest?`<div class="detail-field"><div class="detail-field-label">Linked quest</div>${dfLinks('',d.linked_quest,'quest')}</div>`:''}
            ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}
          </div>
        </div>`
    case 'inventory':
      return `<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag">×${d.quantity||1}</span><span class="tag">${esc(d.holder||'party')}</span></div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}`
    case 'key-item':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${df('Significance',d.significance)}${df('Linked Quest',d.linked_quest)}`
    case 'job':
      return `<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.difficulty||'medium')}">${esc(d.difficulty||'medium')}</span><span class="tag tag-${esc(d.status||'open')}">${esc(d.status||'open')}</span></div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${df('Reward',d.reward)}${df('Posted By',d.posted_by)}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'bestiary': {
      const st = d.stats || {}
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        ${(st.cr!=null||st.ac!=null||st.hp!=null)?`<div class="stat-chips" style="margin-bottom:14px">
          ${st.cr!=null?`<div class="stat-chip"><div class="stat-chip-val">${st.cr}</div><div class="stat-chip-lbl">CR</div></div>`:''}
          ${st.ac!=null?`<div class="stat-chip"><div class="stat-chip-val">${st.ac}</div><div class="stat-chip-lbl">AC</div></div>`:''}
          ${st.hp!=null?`<div class="stat-chip"><div class="stat-chip-val">${st.hp}</div><div class="stat-chip-lbl">HP</div></div>`:''}
        </div>`:''}
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${d.player_notes?`<div class="detail-body">${md(d.player_notes)}</div>`:''}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM notes</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    }
    case 'rumour':
      return `<div class="detail-title" style="font-size:16px">${esc(d.text||title)}</div>
        ${isGm?`<div class="detail-meta"><span class="tag" style="background:${d.is_true?'rgba(80,160,80,0.2)':'rgba(160,60,60,0.2)'};color:${d.is_true?'var(--green)':'var(--red)'}">${d.is_true?'TRUE':'FALSE'}</span></div>`:''}`
    default:
      return `<div class="detail-title">${esc(title)}</div><div class="detail-body">${md(d.description||d.summary||'')}</div>`
  }
})

function handleModalClick(e) {
  const chip = e.target.closest('.link-chip')
  if (!chip) return
  const name = chip.dataset.itemName
  const type = chip.dataset.itemType
  if (!name || !type) return
  openDetailByName(name, type)
}

const SEARCH_COLLECTIONS = {
  location: () => data.locations,
  quest: () => data.quests,
  npc: () => data.npcs,
  faction: () => data.factions,
  hook: () => data.hooks,
  job: () => data.jobs,
  bestiary: () => data.bestiary,
  rumour: () => data.rumours,
  inventory: () => data.inventory,
  'key-item': () => data.keyItems,
  timeline: () => data.timeline,
}

function openDetailByName(name, type) {
  const coll = SEARCH_COLLECTIONS[type]?.()
  if (!coll) return
  const lname = name.toLowerCase()
  const found = coll.find(item =>
    (item.name || item.title || '').toLowerCase() === lname
  )
  if (found) {
    ui.openDetail(type, found)
  }
}

function pinItem() {
  const { type, item } = ui.detailModal
  const label = item.title || item.name || item.label || '(Untitled)'
  data.addPin(type, item.id, label)
  ui.showToast('Pinned', label, '📌')
}

async function toggleHiddenItem() {
  const { type, item } = ui.detailModal
  await data.toggleHidden(type, item.id)
  TYPE_RELOAD[type]?.()
  ui.closeDetail()
}

function editItem() {
  const { type, item } = ui.detailModal
  ui.closeDetail()
  ui.openGmEdit(type, item.id, item)
}

async function deleteItem() {
  const { type, item } = ui.detailModal
  if (!await ui.confirm(`Delete this ${type}?`)) return
  try {
    await data.deleteItem(type, item.id)
    ui.showToast('Deleted', '', '✓')
    TYPE_RELOAD[type]?.()
    ui.closeDetail()
  } catch (e) {
    ui.showToast('Delete failed', e.message, '✕')
  }
}

async function acceptJob() {
  const { item } = ui.detailModal
  const r = await data.apif(`/api/jobs/${item.id}/accept`, { method: 'PUT' })
  if (r.ok) {
    ui.showToast('Job accepted!', item.title, '✓')
    data.loadJobs()
    ui.closeDetail()
  } else {
    const d = await r.json().catch(() => ({}))
    ui.showToast('Could not accept', d.error || '', '✗')
  }
}

async function promoteJobToQuest() {
  const { item } = ui.detailModal
  await data.apif(`/api/jobs/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: 'taken', promoted_quest_id: -1 }) })
  ui.showToast('Job promoted to Quest', '', '→')
  data.loadJobs()
  data.loadQuests()
  ui.closeDetail()
}

async function togglePartyLocation() {
  const { item } = ui.detailModal
  const newVal = isPartyLocation.value ? null : item.id
  await campaign.setPartyLocation(newVal)
  ui.showToast(newVal ? 'Party location set' : 'Party location cleared', item.title || item.name || '', '📍')
}
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────────────────────────── */
.dm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
.dm-panel {
  position: relative;
  background: #0a0c12;
  border: 1px solid rgba(26,120,255,0.25);
  border-radius: 6px;
  width: 100%;
  max-width: 640px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(26,120,255,0.08);
  animation: dm-in 0.18s ease;
}
@keyframes dm-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

/* Corner brackets */
.dm-bracket-tl {
  position: absolute;
  top: -2px; left: -2px;
  font-size: 24px;
  color: #1a78ff;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}
.dm-bracket-br {
  position: absolute;
  bottom: -2px; right: -2px;
  font-size: 24px;
  color: #1a78ff;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.dm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 12px;
  border-bottom: 1px solid rgba(26,120,255,0.15);
  flex-shrink: 0;
}
.dm-type-label {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #3d9bff;
}
.dm-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: color 0.15s;
  line-height: 1;
}
.dm-close:hover { color: rgba(255,255,255,0.85); }

/* ── Body (scrollable content) ───────────────────────────────────────────── */
.dm-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  min-height: 0;

  /* Inherit detail-* classes from DetailModal rendered HTML */
  color: var(--text2, rgba(255,255,255,0.75));
  font-size: 13px;
  line-height: 1.6;
}
.dm-body :deep(.detail-title) {
  font-family: 'Cinzel', serif;
  font-size: 20px;
  color: #fff;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
  line-height: 1.2;
}
.dm-body :deep(.detail-img) {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 14px;
  border: 1px solid rgba(255,255,255,0.06);
}
.dm-body :deep(.detail-meta) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.dm-body :deep(.detail-body) {
  margin-bottom: 12px;
}
.dm-body :deep(.detail-field) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 10px;
}
.dm-body :deep(.detail-field-label) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
}
.dm-body :deep(.detail-gm-box) {
  background: rgba(180,40,40,0.07);
  border: 1px solid rgba(180,40,40,0.2);
  border-radius: 4px;
  padding: 10px 14px;
  margin-top: 10px;
}
.dm-body :deep(.detail-gm-label) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #e05050;
  margin-bottom: 6px;
}

/* ── Player actions ──────────────────────────────────────────────────────── */
.dm-player-actions {
  display: flex;
  gap: 8px;
  padding: 10px 24px 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}

/* ── GM section ──────────────────────────────────────────────────────────── */
.dm-gm-section {
  border-top: 1px solid rgba(180,40,40,0.2);
  background: rgba(180,40,40,0.04);
  padding: 10px 24px 14px;
  flex-shrink: 0;
}
.dm-gm-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  color: #e05050;
  margin-bottom: 8px;
  opacity: 0.8;
}
.dm-gm-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.dm-btn {
  padding: 6px 14px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.dm-btn-ghost {
  background: transparent;
  border-color: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.55);
}
.dm-btn-ghost:hover {
  border-color: rgba(255,255,255,0.28);
  color: rgba(255,255,255,0.85);
}
.dm-btn-primary {
  background: rgba(26,120,255,0.15);
  border-color: rgba(26,120,255,0.6);
  color: #3d9bff;
}
.dm-btn-primary:hover {
  background: rgba(26,120,255,0.25);
  box-shadow: 0 0 12px rgba(26,120,255,0.2);
}
.dm-btn-active {
  background: rgba(26,120,255,0.18);
  border-color: rgba(26,120,255,0.7);
  color: #3d9bff;
}
.dm-btn-danger {
  background: transparent;
  border-color: rgba(220,60,60,0.35);
  color: #e05050;
}
.dm-btn-danger:hover {
  background: rgba(220,60,60,0.1);
  border-color: rgba(220,60,60,0.6);
}
</style>
