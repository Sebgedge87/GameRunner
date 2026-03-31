<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Rumours</div>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('rumour', null, {})">+ Add rumour</button>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search rumours…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

    <!-- Empty state -->
    <EmptyState
      v-if="!data.rumours.length"
      icon="🗣️"
      heading="No rumours yet"
      description="Plant whispers — some true, some false. Players won't know which."
      :cta-label="campaign.isGm ? '+ Add rumour' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('rumour', null, {}) : null"
    />

    <!-- Card grid -->
    <template v-else>
      <div class="card-grid">
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
      <p v-if="!filteredRumours.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

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
import EmptyState from '@/components/EmptyState.vue'
import FilterTabs from '@/components/FilterTabs.vue'

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
