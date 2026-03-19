<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">NPCs</div></div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search NPCs…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('npc', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add NPC</div>
      </div>
      <EntityCard
        v-for="npc in filteredNpcs" :key="npc.id"
        :entity="npc" type="npc" :title="npc.name" icon="👤"
        :image="npc.image || null"
        :expanded="expandedId === npc.id" :reload-fn="data.loadNpcs"
        @toggle="toggleExpand(npc.id)"
      >
        <template #badges>
          <span v-if="npc.role" class="tag">{{ npc.role }}</span>
          <span v-if="npc.disposition" class="tag" :class="dispositionClass(npc.disposition)">{{ npc.disposition }}</span>
        </template>
        <template #body>
          <div v-if="npc.description" class="card-overview">{{ stripMd(npc.description) }}</div>
          <div v-if="npc.faction" class="card-meta">⚔️ {{ npc.faction }}</div>
          <div v-if="npc.location" class="card-meta">📍 {{ npc.location }}</div>
          <div v-if="npc.connected_to?.length" class="card-meta">Linked: {{ npc.connected_to.join(', ') }}</div>
        </template>
        <template #actions>
          <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="revealNpc(npc.id, !npc.revealed)">{{ npc.revealed ? '👁 Hide' : '⭐ Reveal' }}</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredNpcs.length === 0" class="empty-state">No NPCs found.</div>
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
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
]

const filteredNpcs = computed(() => {
  let list = data.npcs
  if (activeTab.value !== 'all') list = list.filter(n => n.disposition?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(n =>
      n.name?.toLowerCase().includes(q) ||
      n.role?.toLowerCase().includes(q) ||
      n.faction?.toLowerCase().includes(q) ||
      n.location?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function dispositionClass(d) {
  const s = d?.toLowerCase()
  if (s === 'friendly' || s === 'allied') return 'tag-active'
  if (s === 'hostile' || s === 'unfriendly') return 'tag-inactive'
  return ''
}

async function revealNpc(id, val) {
  await data.apif(`/api/npcs/${id}/reveal`, { method: 'PUT', body: JSON.stringify({ revealed: val }) })
  ui.showToast(val ? 'NPC revealed to players' : 'NPC hidden', '', val ? '⭐' : '👁')
  await data.loadNpcs()
}

onMounted(() => { if (!data.npcs.length) data.loadNpcs() })
</script>
