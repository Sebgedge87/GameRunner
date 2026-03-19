<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Handouts</div>
      <div class="page-sub">Documents &amp; artefacts</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search handouts…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('handout', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Handout</div>
      </div>
      <EntityCard
        v-for="handout in filteredHandouts" :key="handout.id"
        :entity="handout" type="handout" :title="handout.title" icon="📜"
        :image="handout.image_url || null"
        :expanded="expandedId === handout.id" :reload-fn="data.loadHandouts"
        @toggle="toggleExpand(handout.id)"
      >
        <template #badges>
          <span v-if="handout.type" class="tag">{{ handout.type }}</span>
          <span v-if="handout.session_delivered" class="tag">Session {{ handout.session_delivered }}</span>
        </template>
        <template #body>
          <div v-if="handout.description" class="card-overview">{{ handout.description }}</div>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredHandouts.length === 0" class="empty-state">No handouts found.</div>
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
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'map', label: 'Map' },
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

onMounted(() => { if (!data.handouts.length) data.loadHandouts() })
</script>
