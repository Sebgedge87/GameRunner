<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Plot Hooks</div>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('hook', null, {})">+ Add hook</button>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search hooks…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.hooks.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
        <div class="skeleton-line skeleton-body"></div>
        <div class="skeleton-line skeleton-body-short"></div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!data.hooks.length"
      icon="🪝"
      heading="No hooks yet"
      description="Plant clues and leads to draw players into the story."
      :cta-label="campaign.isGm ? '+ Add hook' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('hook', null, {}) : null"
    />

    <!-- Card grid -->
    <template v-else>
      <div class="card-grid">
        <OverlayCard
          v-for="hook in filteredHooks"
          :key="hook.id"
          icon="🎣"
          :title="hook.title"
          :status="hookStatus(hook.status)"
          :actions="hookActions(hook)"
          :is-expanded="expandedId === hook.id"
          :on-toggle="() => toggleExpand(hook.id)"
          @delete="confirmDelete = { id: hook.id, name: hook.title }"
        >
          <div v-if="hook.type" class="card-meta">Type: {{ hook.type }}</div>
          <div v-if="hook.description" class="card-overview">{{ stripMd(hook.description) }}</div>
          <div v-if="hook.session_delivered" class="card-meta">Delivered: Session {{ hook.session_delivered }}</div>
          <div v-if="hook.connected_to?.length" class="card-meta">Linked: {{ hook.connected_to.join(', ') }}</div>
        </OverlayCard>
      </div>
      <p v-if="!filteredHooks.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="plot hook"
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
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'missed',    label: 'Missed' },
  { value: 'expired',   label: 'Expired' },
]

const filteredHooks = computed(() => {
  let list = data.hooks
  if (activeTab.value !== 'all') list = list.filter(h => h.status?.toLowerCase() === activeTab.value)
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

async function doDelete() {
  await data.deleteItem('hook', confirmDelete.value.id)
  await data.loadHooks()
  confirmDelete.value = null
}

onMounted(() => { if (!data.hooks.length) data.loadHooks() })
</script>
