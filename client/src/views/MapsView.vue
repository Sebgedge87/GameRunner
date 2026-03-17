<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Maps</div>
      <div v-if="campaign.isGm" style="margin-left:auto">
        <button class="btn btn-primary btn-sm" @click="ui.openGmEdit('map', null, {})">+ Add Map</button>
      </div>
    </div>

    <div class="card-grid">
      <div
        v-for="map in data.maps"
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
            &#128506;
          </div>
        </div>
        <div class="map-label">
          <div class="card-title" style="font-size:0.95em">{{ map.title }}</div>
          <div v-if="map.description" style="font-size:0.78em;opacity:0.65;margin-top:3px">{{ map.description }}</div>
        </div>
        <div class="card-actions" @click.stop>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="map.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('map', map.id)"
            >{{ map.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('map', map.id, map)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('map', map.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.maps.length === 0" class="empty-state">
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
        >&#x2715;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const fullscreenMap = ref(null)

function openMapFullscreen(map) {
  if (map.image) {
    fullscreenMap.value = map
  }
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadMaps()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this map?')) return
  await data.deleteItem(type, id)
  await data.loadMaps()
}

onMounted(() => {
  if (!data.maps.length) data.loadMaps()
})
</script>
