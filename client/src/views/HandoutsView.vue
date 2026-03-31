<template>
  <div class="page-content">
    <div class="page-header">
      <div>
        <div class="page-title">Handouts</div>
        <div class="page-sub">Documents &amp; artefacts</div>
      </div>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('handout', null, {})">+ Add handout</button>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search handouts…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.handouts.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
        <div class="skeleton-line skeleton-body"></div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!data.handouts.length"
      icon="📜"
      heading="No handouts yet"
      description="Share letters, maps and artefacts directly with players."
      :cta-label="campaign.isGm ? '+ Add handout' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('handout', null, {}) : null"
    />

    <!-- Card grid -->
    <template v-else>
      <div class="card-grid">
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
      <p v-if="!filteredHandouts.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

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
