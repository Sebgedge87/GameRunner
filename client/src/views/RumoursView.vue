<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Rumours</div></div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search rumours…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('rumour', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Rumour</div>
      </div>
      <EntityCard
        v-for="rumour in filteredRumours" :key="rumour.id"
        :entity="rumour" type="rumour" :title="rumourTitle(rumour)" icon="🗣️"
        :expanded="expandedId === rumour.id" :reload-fn="data.loadRumours"
        @toggle="toggleExpand(rumour.id)"
      >
        <template #badges>
          <span v-if="rumour.source_npc" class="tag">{{ rumour.source_npc }}</span>
          <span v-if="rumour.source_location" class="tag">{{ rumour.source_location }}</span>
          <span v-if="campaign.isGm" class="tag" :class="rumour.is_true ? 'tag-active' : 'tag-inactive'">{{ rumour.is_true ? 'True' : 'False' }}</span>
        </template>
        <template #body>
          <div v-if="rumour.text && rumour.text.length > 60" class="card-overview">{{ stripMd(rumour.text) }}</div>
        </template>
        <template #actions>
          <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="exposeRumour(rumour.id)">📢 Expose</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredRumours.length === 0" class="empty-state">No rumours found.</div>
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
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
  { value: 'exposed', label: 'Exposed' },
]

const filteredRumours = computed(() => {
  let list = data.rumours
  if (activeTab.value === 'true') list = list.filter(r => r.is_true)
  else if (activeTab.value === 'false') list = list.filter(r => !r.is_true)
  else if (activeTab.value === 'exposed') list = list.filter(r => r.exposed)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.text?.toLowerCase().includes(q) ||
      r.source_npc?.toLowerCase().includes(q) ||
      r.source_location?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }
function rumourTitle(r) { return '\u201c' + (r.text?.slice(0, 60) || '\u2026') + '\u201d' }

async function exposeRumour(id) {
  await data.apif(`/api/rumours/${id}/expose`, { method: 'POST' })
  ui.showToast('Rumour exposed to players', '', '📢')
  await data.loadRumours()
}

onMounted(() => { if (!data.rumours.length) data.loadRumours() })
</script>
