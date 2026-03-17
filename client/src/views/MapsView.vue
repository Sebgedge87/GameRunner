<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Maps</div>
    </div>

    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search maps…" style="max-width:320px" />
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('map', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Map</div>
      </div>

      <div
        v-for="map in filteredMaps"
        :key="map.id"
        class="map-card card"
        :class="{ hidden: map.hidden }"
        @click="openMapFullscreen(map)"
      >
        <div class="map-thumb">
          <img
            v-if="map.image"
            :src="map.image"
            :alt="map.title"
            style="width:100%;height:100%;object-fit:cover"
          />
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;opacity:0.3;font-size:2em">
            🗺
          </div>
        </div>
        <div class="map-label">
          <div class="card-title" style="font-size:0.95em">{{ map.title }}</div>
          <div v-if="map.description" style="font-size:0.78em;opacity:0.65;margin-top:3px">{{ map.description }}</div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('map', map.id, map.title)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="map.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('map', map.id)"
            >{{ map.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('map', map.id, map.title)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('map', map.id, map)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('map', map.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredMaps.length === 0" class="empty-state">
      No maps found.
    </div>

    <!-- Fullscreen overlay -->
    <div
      v-if="fullscreenMap"
      class="modal-overlay open"
      style="z-index:9999;background:rgba(0,0,0,0.92)"
      @click="fullscreenMap = null"
    >
      <div style="position:relative;max-width:95vw;max-height:95vh" @click.stop>
        <img
          :src="fullscreenMap.image"
          :alt="fullscreenMap.title"
          style="max-width:95vw;max-height:90vh;object-fit:contain;border-radius:6px;display:block"
        />
        <div style="text-align:center;margin-top:10px;color:#fff;font-size:1em;opacity:0.85">
          {{ fullscreenMap.title }}
        </div>
        <button
          class="btn btn-sm"
          style="position:absolute;top:-12px;right:-12px;border-radius:50%;width:32px;height:32px;font-size:1.1em;padding:0"
          @click="fullscreenMap = null"
        >✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const search = ref('')
const fullscreenMap = ref(null)

const filteredMaps = computed(() => {
  if (!search.value.trim()) return data.maps
  const q = search.value.toLowerCase()
  return data.maps.filter(m =>
    m.title?.toLowerCase().includes(q) ||
    m.description?.toLowerCase().includes(q)
  )
})

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

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadMaps()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this map?')) return
  await data.deleteItem(type, id)
  await data.loadMaps()
}
</script>
