<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Locations</div></div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search locations…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('location', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Location</div>
      </div>
      <EntityCard
        v-for="loc in filteredLocations" :key="loc.id"
        :entity="loc" type="location" :title="loc.name" icon="📍"
        :image="loc.image || null"
        :expanded="expandedId === loc.id" :reload-fn="data.loadLocations"
        @toggle="toggleExpand(loc.id)"
      >
        <template #badges>
          <span v-if="loc.status" class="tag" :class="statusClass(loc.status)">{{ loc.status }}</span>
          <span v-if="loc.danger" class="tag tag-inactive">⚠️ {{ loc.danger }}</span>
        </template>
        <template #body>
          <div v-if="loc.description" class="card-overview">{{ loc.description }}</div>
          <div v-if="loc.visited_session" class="card-meta">Session {{ loc.visited_session }}</div>
          <div v-if="loc.connected_to?.length" class="card-meta">Linked: {{ loc.connected_to.join(', ') }}</div>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredLocations.length === 0" class="empty-state">No locations found.</div>
  </div>
</template>

<script setup>
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
  { value: 'safe', label: 'Safe' },
  { value: 'dangerous', label: 'Dangerous' },
  { value: 'unexplored', label: 'Unexplored' },
]

const filteredLocations = computed(() => {
  let list = data.locations
  if (activeTab.value !== 'all') list = list.filter(l => l.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'safe' || s === 'friendly') return 'tag-active'
  if (s === 'dangerous' || s === 'hostile') return 'tag-inactive'
  return ''
}

onMounted(() => { if (!data.locations.length) data.loadLocations() })
</script>
