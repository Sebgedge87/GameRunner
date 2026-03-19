<template>
  <div v-if="ui.detailModal" class="flyout-overlay open" @click.self="ui.closeDetail()">
    <div class="flyout open">
      <div class="flyout-header">
        <div class="flyout-title">{{ typeLabel }}</div>
        <button class="flyout-close" @click="ui.closeDetail()">✕</button>
      </div>
      <div class="flyout-body" @click="handleModalClick" v-html="renderedContent"></div>
      <div class="flyout-compose">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="modal-close" @click="ui.closeDetail()">CLOSE</button>
          <button class="btn btn-sm" title="Pin" @click="pinItem">📌 Pin</button>
          <template v-if="campaign.isGm">
            <button class="btn btn-sm" @click="toggleHiddenItem">{{ ui.detailModal?.item?.hidden ? '👁 Reveal' : '🙈 Hide' }}</button>
            <button class="btn btn-sm" @click="editItem">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteItem">Delete</button>
          </template>
        </div>
      </div>
    </div>
  </div>
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

const TYPE_LABELS = {
  quest: 'Quest', npc: 'NPC', location: 'Location', hook: 'Plot Hook',
  faction: 'Faction', timeline: 'Timeline Event', inventory: 'Item',
  'key-item': 'Key Item', job: 'Job Board', bestiary: 'Bestiary', rumour: 'Rumour',
}

const typeLabel = computed(() => TYPE_LABELS[ui.detailModal?.type] || 'Detail')

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
        <div class="detail-meta">${d.role?`<span class="tag">${esc(d.role)}</span>`:''}<span class="tag tag-${esc(d.disposition||'neutral')}">${esc(d.disposition||'neutral')}</span>${d.faction?`<span class="tag">${esc(d.faction)}</span>`:''}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${d.player_notes?`<div class="detail-body" style="margin-top:8px">${md(d.player_notes)}</div>`:''}
        ${dfLinks('Location', d.location, 'location')}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'location':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.status||'unvisited')}">${esc(d.status||'unvisited')}</span>${d.danger?`<span class="tag tag-${esc(d.danger)}">${esc(d.danger)}</span>`:''}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${d.player_notes?`<div class="detail-body" style="margin-top:8px">${md(d.player_notes)}</div>`:''}
        ${dfLinks('Connected To', d.connected_to, 'location')}${df('Visited Session', d.visited_session)}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
    case 'hook':
      return `<div class="detail-title">${esc(title)}</div>
        <div class="detail-meta"><span class="tag tag-${esc(d.type||'clue')}">${esc(d.type||'clue')}</span><span class="tag tag-${esc(d.status||'active')}">${esc(d.status||'active')}</span></div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${dfLinks('Connected To', d.connected_to, 'quest')}`
    case 'faction':
      return `${img(d)}<div class="detail-title">${esc(title)}</div>
        ${d.description?`<div class="detail-body">${md(d.description)}</div>`:''}
        ${dfMd('Goals', d.goals)}
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
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
            ${d.linked_quest?`<div class="detail-field"><div class="detail-field-label">LINKED QUEST</div>${dfLinks('',d.linked_quest,'quest')}</div>`:''}
            ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}
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
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
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
        ${isGm&&d.gm_notes?`<div class="detail-gm-box"><div class="detail-gm-label">GM NOTES</div><div class="detail-body" style="margin:0">${md(d.gm_notes)}</div></div>`:''}`
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
</script>
