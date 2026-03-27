<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Handouts</div>
      <div class="page-sub">Documents &amp; artefacts</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search handouts…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div v-if="data.loading && !data.handouts.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
        <div class="skeleton-line skeleton-body"></div>
      </div>
    </div>
    <div v-else class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('handout', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Handout</div>
      </div>
      <OverlayCard
        v-for="handout in filteredHandouts"
        :key="handout.id"
        icon="📜"
        :title="handout.title"
        :status="handout.type || null"
        :actions="handoutActions(handout)"
        :is-expanded="expandedId === handout.id"
        :on-toggle="() => toggleExpand(handout.id)"
        @delete="confirmDelete = { id: handout.id, name: handout.title }"
      >
        <img
          v-if="handout.image_url"
          :src="handout.image_url"
          style="width:100%;max-height:180px;object-fit:cover;display:block;margin-bottom:8px;border-radius:var(--radius-sm)"
          alt=""
        />
        <div v-if="handout.session_delivered" class="card-meta">Session {{ handout.session_delivered }}</div>
        <div v-if="handout.description" class="card-overview">{{ stripMd(handout.description) }}</div>
      </OverlayCard>
    </div>
    <div v-if="!data.loading && filteredHandouts.length === 0" class="empty-state">
      <span class="empty-state-icon">📜</span>
      <div class="empty-state-title">{{ data.handouts.length ? 'No Matches' : 'No Handouts Yet' }}</div>
      <div class="empty-state-hint">{{ data.handouts.length ? 'Try a different search or filter.' : 'GM: share letters, maps and artefacts directly with players.' }}</div>
    </div>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="handout"
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
  { value: 'all',    label: 'All' },
  { value: 'text',   label: 'Text' },
  { value: 'image',  label: 'Image' },
  { value: 'map',    label: 'Map' },
  { value: 'letter', label: 'Letter' },
]

const filteredHandouts = computed(() => {
  let list = data.handouts
  if (activeTab.value !== 'all') list = list.filter(h => h.type?.toLowerCase() === activeTab.value)
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

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function handoutActions(handout) {
  const base = [
    { label: 'Pin', icon: '📌', onClick: () => data.addPin('handout', handout.id, handout.title) },
  ]
  if (!campaign.isGm) return base
  return [
    ...base,
    { label: 'Share',  icon: '🔗', onClick: () => ui.openShare('handout', handout.id, handout.title) },
    { label: 'Edit',   icon: '✏️', onClick: () => ui.openGmEdit('handout', handout.id, handout) },
    { type: 'divider' },
    { label: 'Delete', icon: '🗑️', variant: 'danger', onClick: () => {} },
  ]
}

async function doDelete() {
  await data.deleteItem('handout', confirmDelete.value.id)
  await data.loadHandouts()
  confirmDelete.value = null
}

onMounted(() => { if (!data.handouts.length) data.loadHandouts() })
</script>
