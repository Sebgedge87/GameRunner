<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Hooks & Rumours</div>
    </div>
    
    <div class="search-row" style="margin-bottom:12px; display:flex; gap:16px;">
      <!-- Top Level Toggle -->
      <div class="filter-tabs" style="margin-bottom:0;">
        <button class="filter-tab" :class="{ active: viewType === 'hooks' }" @click="viewType = 'hooks'">Hooks</button>
        <button class="filter-tab" :class="{ active: viewType === 'rumours' }" @click="viewType = 'rumours'">Rumours</button>
      </div>
      <input v-model="search" class="form-input" placeholder="Search…" style="max-width:320px; flex:1;" />
    </div>
    
    <!-- Sub Filters -->
    <FilterTabs :tabs="currentTabs" :active="activeTabs" :multi="true" :on-change="v => activeTabs = v" :on-clear="() => activeTabs = ['all']" style="margin-bottom: 12px;"/>

    <!-- =========== HOOKS =========== -->
    <template v-if="viewType === 'hooks'">
      <div v-if="data.loading && !data.hooks.length" class="card-grid">
        <div v-for="n in 6" :key="'hs'+n" class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-sub"></div>
        </div>
      </div>
      <EmptyState
        v-else-if="!data.hooks.length && !campaign.isGm"
        icon="🪝"
        heading="No hooks yet"
        description="Plant clues and leads to draw players into the story."
      />
      <template v-else-if="data.hooks.length || campaign.isGm">
        <div class="card-grid">
          <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('hook', null, {})">
            <span class="create-card-icon">+</span>
            <span>Add Hook</span>
          </div>
          <OverlayCard
            v-for="hook in filteredHooks"
            :key="'h_'+hook.id"
            icon="🎣"
            :title="hook.title"
            :status="hookStatus(hook.status)"
            :actions="hookActions(hook)"
            :is-expanded="expandedId === 'h_'+hook.id"
            :on-toggle="() => toggleExpand('h_'+hook.id)"
            @delete="confirmDelete = { id: hook.id, name: hook.title, type: 'hook' }"
          >
            <div v-if="hook.type" class="card-meta">Type: {{ hook.type }}</div>
            <div v-if="hook.description" class="card-overview">{{ stripMd(hook.description) }}</div>
            <div v-if="hook.session_delivered" class="card-meta">Delivered: Session {{ hook.session_delivered }}</div>
            <div v-if="hook.connected_to?.length" class="card-meta">Linked: {{ hook.connected_to.join(', ') }}</div>
          </OverlayCard>
        </div>
        <p v-if="!filteredHooks.length" class="no-matches-msg">No matches — try a different search or filter.</p>
      </template>
    </template>

    <!-- =========== RUMOURS =========== -->
    <template v-if="viewType === 'rumours'">
      <div v-if="data.loading && !data.rumours.length" class="card-grid">
        <div v-for="n in 6" :key="'rs'+n" class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-sub"></div>
        </div>
      </div>
      <EmptyState
        v-else-if="!data.rumours.length && !campaign.isGm"
        icon="🗣️"
        heading="No rumours yet"
        description="Plant whispers — some true, some false. Players won't know which."
      />
      <template v-else-if="data.rumours.length || campaign.isGm">
        <div class="card-grid">
          <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('rumour', null, {})">
            <span class="create-card-icon">+</span>
            <span>Add Rumour</span>
          </div>
          <OverlayCard
            v-for="rumour in filteredRumours"
            :key="'r_'+rumour.id"
            icon="🗣️"
            :title="rumourTitle(rumour)"
            :status="rumourStatus(rumour)"
            :actions="rumourActions(rumour)"
            :is-expanded="expandedId === 'r_'+rumour.id"
            :on-toggle="() => toggleExpand('r_'+rumour.id)"
            @delete="confirmDelete = { id: rumour.id, name: rumourTitle(rumour), type: 'rumour' }"
          >
            <div v-if="rumour.source_npc" class="card-meta">Source: {{ rumour.source_npc }}</div>
            <div v-if="rumour.source_location" class="card-meta">Location: {{ rumour.source_location }}</div>
            <div v-if="rumour.text" class="card-overview">{{ stripMd(rumour.text) }}</div>
          </OverlayCard>
        </div>
        <p v-if="!filteredRumours.length" class="no-matches-msg">No matches — try a different search or filter.</p>
      </template>
    </template>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      :entity-type="confirmDelete?.type || 'item'"
      :entity-name="confirmDelete?.name"
      :on-confirm="doDelete"
      :on-cancel="() => confirmDelete = null"
    />
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import OverlayCard from '@/components/OverlayCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()

const viewType      = ref('hooks')
const search        = ref('')
const activeTabs    = ref(['all'])
const expandedId    = ref(null)
const confirmDelete = ref(null)

const hookTabs = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'missed',    label: 'Missed' },
  { value: 'expired',   label: 'Expired' },
]

const rumourTabs = [
  { value: 'all',     label: 'All' },
  { value: 'true',    label: 'True' },
  { value: 'false',   label: 'False' },
  { value: 'exposed', label: 'Exposed' },
]

const currentTabs = computed(() => viewType.value === 'hooks' ? hookTabs : rumourTabs)

watch(viewType, () => {
  activeTabs.value = ['all']
  search.value = ''
})

const filteredHooks = computed(() => {
  let list = data.hooks
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) list = list.filter(h => selected.has(h.status?.toLowerCase()))
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(h =>
      h.title?.toLowerCase().includes(q) ||
      h.type?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q)
    )
  }
  return list
})

const filteredRumours = computed(() => {
  let list = data.rumours
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) {
    list = list.filter(r =>
      (selected.has('true') && r.is_true) ||
      (selected.has('false') && !r.is_true) ||
      (selected.has('exposed') && r.exposed)
    )
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.text?.toLowerCase().includes(q) ||
      r.source_npc?.toLowerCase().includes(q) ||
      r.source_location?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function hookStatus(status) {
  const s = status?.toLowerCase()
  if (s === 'active')                    return 'active'
  if (s === 'delivered')                 return 'done'
  if (s === 'missed' || s === 'expired') return 'missed'
  return null
}

function hookActions(hook) {
  const base = [
    { label: 'Pin', icon: '📌', onClick: () => data.addPin('hook', hook.id, hook.title) },
  ]
  if (!campaign.isGm) return base
  return [
    ...base,
    { label: 'Share',  icon: '🔗', onClick: () => ui.openShare('hook', hook.id, hook.title) },
    { label: 'Edit',   icon: '✏️', onClick: () => ui.openGmEdit('hook', hook.id, hook) },
    { type: 'divider' },
    { label: 'Delete', icon: '🗑️', variant: 'danger', onClick: () => {} },
  ]
}

function rumourTitle(r) { return '\u201c' + (r.text?.slice(0, 60) || '\u2026') + '\u201d' }

function rumourStatus(rumour) {
  if (!campaign.isGm) return null
  if (rumour.exposed)   return 'done'
  return rumour.is_true ? 'active' : 'missed'
}

function rumourActions(rumour) {
  const base = [
    { label: 'Pin', icon: '📌', onClick: () => data.addPin('rumour', rumour.id, rumourTitle(rumour)) },
  ]
  if (!campaign.isGm) return base
  return [
    ...base,
    { label: 'Expose', icon: '📢', onClick: () => exposeRumour(rumour.id) },
    { label: 'Edit',   icon: '✏️', onClick: () => ui.openGmEdit('rumour', rumour.id, rumour) },
    { type: 'divider' },
    { label: 'Delete', icon: '🗑️', variant: 'danger', onClick: () => {} },
  ]
}

async function exposeRumour(id) {
  await data.apif(`/api/rumours/${id}/expose`, { method: 'POST' })
  ui.showToast('Rumour exposed to players', '', '📢')
  await data.loadRumours()
}

async function doDelete() {
  const type = confirmDelete.value.type
  await data.deleteItem(type, confirmDelete.value.id)
  if (type === 'hook') await data.loadHooks()
  else await data.loadRumours()
  confirmDelete.value = null
}

onMounted(() => { 
  if (!data.hooks.length) data.loadHooks()
  if (!data.rumours.length) data.loadRumours()
})
</script>
