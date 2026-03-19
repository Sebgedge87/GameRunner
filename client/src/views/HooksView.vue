<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Plot Hooks</div></div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search hooks…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('hook', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Hook</div>
      </div>
      <EntityCard
        v-for="hook in filteredHooks" :key="hook.id"
        :entity="hook" type="hook" :title="hook.title" icon="🎣"
        :expanded="expandedId === hook.id" :reload-fn="data.loadHooks"
        @toggle="toggleExpand(hook.id)"
      >
        <template #badges>
          <span v-if="hook.type" class="tag">{{ hook.type }}</span>
          <span v-if="hook.status" class="tag" :class="statusClass(hook.status)">{{ hook.status }}</span>
        </template>
        <template #body>
          <div v-if="hook.description" class="card-overview">{{ stripMd(hook.description) }}</div>
          <div v-if="hook.session_delivered" class="card-meta">Delivered: Session {{ hook.session_delivered }}</div>
          <div v-if="hook.connected_to?.length" class="card-meta">Linked: {{ hook.connected_to.join(', ') }}</div>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredHooks.length === 0" class="empty-state">
      <span class="empty-state-icon">🪝</span>
      <div class="empty-state-title">{{ data.hooks.length ? 'No Matches' : 'No Hooks Yet' }}</div>
      <div class="empty-state-hint">{{ data.hooks.length ? 'Try a different search or filter.' : 'GM: plant clues and leads to draw players into the story.' }}</div>
    </div>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const search = ref('')
const activeTab = ref('all')
const expandedId = ref(null)

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'missed', label: 'Missed' },
  { value: 'expired', label: 'Expired' },
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

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'active' || s === 'delivered') return 'tag-active'
  if (s === 'missed' || s === 'expired') return 'tag-inactive'
  return ''
}

onMounted(() => { if (!data.hooks.length) data.loadHooks() })
</script>
