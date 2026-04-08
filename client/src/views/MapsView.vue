<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Maps</div>
    </div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search maps…" style="max-width:320px" />
    </div>
    <FilterTabs
      :tabs="tabs"
      :active="activeTabs"
      :multi="true"
      :on-change="v => activeTabs = v"
      :on-clear="() => activeTabs = ['all']"
    />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.maps.length" class="card-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-img" style="height:180px"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="!data.maps.length && !campaign.isGm"
      icon="🗺️"
      heading="No maps yet"
      description="Upload battle maps, regional maps and area layouts."
    />

    <!-- Card grid -->
    <template v-else-if="data.maps.length || campaign.isGm">
      <div class="card-grid">
        <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('map', null, {})">
          <span class="create-card-icon">+</span>
          <span>Add Map</span>
        </div>
        <EntityCard
          v-for="map in filteredMaps" :key="map.id"
          :entity="map" type="map" :title="map.title" icon="🗺️"
          :image="map.image || map.image_path || null"
          :expanded="expandedId === map.id" :reload-fn="data.loadMaps"
          @toggle="toggleExpand(map.id)"
        >
          <template #badges>
            <span v-if="map.map_type" class="tag">{{ map.map_type.charAt(0).toUpperCase() + map.map_type.slice(1) }}</span>
          </template>
          <template #preview>
            <div v-if="map.description">{{ map.description.slice(0, 80) }}</div>
          </template>
          <template #actions>
            <button v-if="map.image || map.image_path" class="btn btn-sm" @click.stop="openMapFullscreen(map)">⛶ Fullscreen</button>
          </template>
        </EntityCard>
      </div>
      <p v-if="!filteredMaps.length" class="no-matches-msg">No matches — try a different search.</p>
    </template>

    <!-- Fullscreen overlay -->
    <div v-if="fullscreenMap" class="modal-overlay open" style="z-index:9999;background:var(--color-bg-overlay-heavy)" @click="fullscreenMap = null">
      <div style="position:relative;max-width:95vw;max-height:95vh" @click.stop>
        <img :src="fullscreenMap.image || fullscreenMap.image_path" style="max-width:95vw;max-height:90vh;object-fit:contain;border-radius:6px;display:block" />
        <div style="text-align:center;margin-top:10px;color:var(--color-text-primary);font-size:1em;opacity:0.85">{{ fullscreenMap.title }}</div>
        <button class="btn btn-sm" style="position:absolute;top:-12px;right:-12px;border-radius:50%;width:32px;height:32px;font-size:1.1em;padding:0" @click="fullscreenMap = null">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const activeTabs    = ref(['all'])
const expandedId    = ref(null)
const fullscreenMap = ref(null)

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'world', label: 'World' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'encounter', label: 'Encounter' },
]

const filteredMaps = computed(() => {
  let list = data.maps
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) list = list.filter(m => selected.has((m.map_type || '').toLowerCase()))
  if (!search.value.trim()) return list
  const q = search.value.toLowerCase()
  return list.filter(m =>
    m.title?.toLowerCase().includes(q) ||
    m.description?.toLowerCase().includes(q) ||
    m.map_type?.toLowerCase().includes(q)
  )
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function openMapFullscreen(map) {
  if (map.image || map.image_path) fullscreenMap.value = map
}

function onKeydown(e) {
  if (e.key === 'Escape') fullscreenMap.value = null
}

onMounted(() => {
  if (!data.maps.length) data.loadMaps()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
