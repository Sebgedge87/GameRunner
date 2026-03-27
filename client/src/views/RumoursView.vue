<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Rumours</div></div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search rumours…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('rumour', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Rumour</div>
      </div>
      <OverlayCard
        v-for="rumour in filteredRumours"
        :key="rumour.id"
        icon="🗣️"
        :title="rumourTitle(rumour)"
        :status="rumourStatus(rumour)"
        :actions="rumourActions(rumour)"
        :is-expanded="expandedId === rumour.id"
        :on-toggle="() => toggleExpand(rumour.id)"
        @delete="confirmDelete = { id: rumour.id, name: rumourTitle(rumour) }"
      >
        <div v-if="rumour.source_npc" class="card-meta">Source: {{ rumour.source_npc }}</div>
        <div v-if="rumour.source_location" class="card-meta">Location: {{ rumour.source_location }}</div>
        <div v-if="rumour.text" class="card-overview">{{ stripMd(rumour.text) }}</div>
      </OverlayCard>
    </div>
    <div v-if="filteredRumours.length === 0" class="empty-state">
      <span class="empty-state-icon">🗣️</span>
      <div class="empty-state-title">{{ data.rumours.length ? 'No Matches' : 'No Rumours Yet' }}</div>
      <div class="empty-state-hint">{{ data.rumours.length ? 'Try a different search or filter.' : "GM: plant whispers — some true, some false. Players won't know which." }}</div>
    </div>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="rumour"
      :entity-name="confirmDelete?.name"
      :on-confirm="doDelete"
      :on-cancel="() => confirmDelete = null"
    />
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import OverlayCard from '@/components/OverlayCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const activeTab     = ref('all')
const expandedId    = ref(null)
const confirmDelete = ref(null)

const tabs = [
  { value: 'all',     label: 'All' },
  { value: 'true',    label: 'True' },
  { value: 'false',   label: 'False' },
  { value: 'exposed', label: 'Exposed' },
]

const filteredRumours = computed(() => {
  let list = data.rumours
  if (activeTab.value === 'true')         list = list.filter(r => r.is_true)
  else if (activeTab.value === 'false')   list = list.filter(r => !r.is_true)
  else if (activeTab.value === 'exposed') list = list.filter(r => r.exposed)
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
  await data.deleteItem('rumour', confirmDelete.value.id)
  await data.loadRumours()
  confirmDelete.value = null
}

onMounted(() => { if (!data.rumours.length) data.loadRumours() })
</script>
