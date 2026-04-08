<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">NPCs</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search NPCs…" style="max-width:320px" />
    </div>
    <FilterTabs
      :tabs="tabs"
      :active="activeTabs"
      :multi="true"
      :on-change="v => activeTabs = v"
      :on-clear="clearNpcFilters"
    />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.npcs.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-body"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="!data.npcs.length && !campaign.isGm"
      icon="👤"
      heading="No NPCs yet"
      description="Add the people who populate your world."
    />

    <!-- NPC portrait grid -->
    <template v-else-if="data.npcs.length || campaign.isGm">
      <div class="card-grid">
        <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('npc', null, {})">
          <span class="create-card-icon">+</span>
          <span>Add NPC</span>
        </div>
        <EntityCard
          v-for="npc in filteredNpcs" :key="npc.id"
          :entity="npc" type="npc" :title="npc.name" icon="👤"
          :image="npc.image_url || null"
          :reload-fn="data.loadNpcs"
        >
          <template #badges>
            <span v-if="npc.role" class="tag">{{ npc.role }}</span>
            <span v-if="npc.race" class="tag">{{ npc.race }}</span>
            <span v-if="npc.disposition" class="tag" :class="dispositionClass(npc.disposition)">{{ npc.disposition }}</span>
          </template>
          <template #preview>
            <div v-if="npc.description">{{ stripMd(npc.description).slice(0, 80) }}</div>
            <div v-else-if="npc.role" style="opacity:0.6">{{ npc.role }}</div>
          </template>
        </EntityCard>
      </div>
      <p v-if="!filteredNpcs.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search     = ref('')
const activeTabs = ref(['all'])

const tabs = [
  { value: 'all',        label: 'All' },
  { value: 'unknown',    label: 'Unknown' },
  { value: 'friendly',   label: 'Friendly' },
  { value: 'neutral',    label: 'Neutral' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'hostile',    label: 'Hostile' },
  { value: 'helpful',    label: 'Helpful' },
  { value: 'fearful',    label: 'Fearful' },
]

const filteredNpcs = computed(() => {
  let list = data.npcs
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) {
    list = list.filter(n => {
      const disposition = n.disposition?.toLowerCase()
      const isUnknown = !disposition || disposition === 'unknown'
      if (isUnknown && selected.has('unknown')) return true
      return disposition ? selected.has(disposition) : false
    })
  }
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

function dispositionClass(d) {
  const s = d?.toLowerCase()
  if (s === 'friendly' || s === 'allied') return 'tag-active'
  if (s === 'hostile' || s === 'unfriendly') return 'tag-inactive'
  return ''
}

function clearNpcFilters() {
  activeTabs.value = ['all']
}

onMounted(() => { if (!data.npcs.length) data.loadNpcs() })
</script>
