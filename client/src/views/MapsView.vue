<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Maps</div></div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search maps…" style="max-width:320px" />
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('map', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Map</div>
      </div>
      <EntityCard
        v-for="map in filteredMaps" :key="map.id"
        :entity="map" type="map" :title="map.title" icon="🗺️"
        :image="map.image || null"
        :expanded="expandedId === map.id" :reload-fn="data.loadMaps"
        @toggle="toggleExpand(map.id)"
      >
        <template #badges>
          <span v-if="map.map_type" class="tag">{{ map.map_type.charAt(0).toUpperCase() + map.map_type.slice(1) }}</span>
        </template>
        <template #body>
          <div v-if="map.description" class="card-overview">{{ map.description }}</div>
        </template>
        <template #actions>
          <button v-if="map.image" class="btn btn-sm" @click.stop="openMapFullscreen(map)">⛶ Fullscreen</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredMaps.length === 0" class="empty-state">
      <span class="empty-state-icon">🗺️</span>
      <div class="empty-state-title">{{ data.maps.length ? 'No Matches' : 'No Maps Yet' }}</div>
      <div class="empty-state-hint">{{ data.maps.length ? 'Try a different search.' : 'GM: upload battle maps, regional maps and area layouts.' }}</div>
    </div>

    <!-- Fullscreen overlay -->
    <div v-if="fullscreenMap" class="modal-overlay open" style="z-index:9999;background:rgba(0,0,0,0.92)" @click="fullscreenMap = null">
      <div style="position:relative;max-width:95vw;max-height:95vh" @click.stop>
        <img :src="fullscreenMap.image" style="max-width:95vw;max-height:90vh;object-fit:contain;border-radius:6px;display:block" />
        <div style="text-align:center;margin-top:10px;color:#fff;font-size:1em;opacity:0.85">{{ fullscreenMap.title }}</div>
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

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const search = ref('')
const expandedId = ref(null)
const fullscreenMap = ref(null)

const filteredMaps = computed(() => {
  if (!search.value.trim()) return data.maps
  const q = search.value.toLowerCase()
  return data.maps.filter(m =>
    m.title?.toLowerCase().includes(q) ||
    m.description?.toLowerCase().includes(q)
  )
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function openMapFullscreen(map) {
  if (map.image) fullscreenMap.value = map
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
