<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Locations</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search locations…"
        style="max-width:320px"
      />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('location', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Location</div>
      </div>

      <div
        v-for="loc in filteredLocations"
        :key="loc.id"
        class="card"
        :class="{ hidden: loc.hidden }"
        @click="ui.openDetail('location', loc)"
      >
        <div v-if="loc.image" class="card-img">
          <img :src="loc.image" :alt="loc.name" style="width:100%;height:120px;object-fit:cover;border-radius:4px 4px 0 0" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ loc.name }}</div>
          <div class="card-meta">
            <span v-if="loc.status" class="tag" :class="statusClass(loc.status)">{{ loc.status }}</span>
            <span v-if="loc.danger" class="tag tag-inactive">⚠️ {{ loc.danger }}</span>
          </div>
          <div v-if="loc.visited_session" class="card-meta">
            <span style="opacity:0.6;font-size:0.8em">Session {{ loc.visited_session }}</span>
          </div>
          <div v-if="loc.connected_to?.length" class="card-meta" style="margin-top:4px">
            <span style="opacity:0.5;font-size:0.75em">Linked: {{ loc.connected_to.join(', ') }}</span>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('location', loc.id, loc.name)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="loc.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('location', loc.id)"
            >{{ loc.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('location', loc.id, loc.name)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('location', loc.id, loc)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('location', loc.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredLocations.length === 0" class="empty-state">
      No locations found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const search = ref('')
const activeTab = ref('all')

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

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'safe' || s === 'friendly') return 'tag-active'
  if (s === 'dangerous' || s === 'hostile') return 'tag-inactive'
  return ''
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadLocations()
}

async function deleteItem(type, id) {
  if (!await ui.confirm('Delete this location?')) return
  await data.deleteItem(type, id)
  await data.loadLocations()
}

onMounted(() => {
  if (!data.locations.length) data.loadLocations()
})
</script>
