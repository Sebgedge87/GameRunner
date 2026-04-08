<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Factions</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search factions…" style="max-width:320px" />
    </div>
    <FilterTabs
      :tabs="tabs"
      :active="activeTabs"
      :multi="true"
      :on-change="v => activeTabs = v"
      :on-clear="() => activeTabs = ['all']"
    />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.factions.length" class="card-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-body"></div>
        <div class="skeleton-line skeleton-body-short"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="!data.factions.length && !campaign.isGm"
      icon="⚔️"
      heading="No factions yet"
      description="Define the guilds, cults and powers that shape your world."
    />

    <!-- Faction grid -->
    <template v-else-if="data.factions.length || campaign.isGm">
      <div class="card-grid">

        <!-- Create tile (GM only) -->
        <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('faction', null, {})">
          <span class="create-card-icon">+</span>
          <span>Add Faction</span>
        </div>

        <EntityCard
          v-for="faction in filteredFactions"
          :key="faction.id"
          :entity="faction"
          type="faction"
          :title="faction.name"
          icon="⚔️"
          :image="faction.image_path || null"
          :reload-fn="data.loadFactions"
        >
          <template #badges>
            <span class="tag" :class="standingTagClass(faction.reputation)">{{ reputationLabel(faction.reputation) }}</span>
            <span v-if="faction.influence != null" class="tag">Influence {{ faction.influence }}</span>
          </template>
          <template #preview>
            <div v-if="faction.description">{{ stripMd(faction.description).slice(0, 110) }}</div>
            <div v-else-if="faction.goals">{{ stripMd(faction.goals).slice(0, 110) }}</div>
          </template>
        </EntityCard>

      </div>
      <p v-if="!filteredFactions.length" class="no-matches-msg">No matches — try a different search or filter.</p>
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
const search      = ref('')
const activeTabs  = ref(['all'])

const tabs = [
  { value: 'all',     label: 'All' },
  { value: 'allied',  label: 'Allied' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
]

const filteredFactions = computed(() => {
  let list = data.factions
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) {
    list = list.filter(f => selected.has(reputationStatus(f.reputation)))
  }
  if (!search.value.trim()) return list
  const q = search.value.toLowerCase()
  return list.filter(f =>
    f.name?.toLowerCase().includes(q) ||
    f.description?.toLowerCase().includes(q) ||
    f.goals?.toLowerCase().includes(q)
  )
})

function reputationStatus(rep) {
  if (rep == null) return 'neutral'
  if (rep <= -1) return 'hostile'
  if (rep >= 1)  return 'allied'
  return 'neutral'
}

function reputationLabel(rep) {
  if (rep == null || rep === 0) return 'Neutral'
  if (rep <= -3) return 'Hostile'
  if (rep <= -1) return 'Unfriendly'
  if (rep <= 2)  return 'Friendly'
  return 'Allied'
}

function standingTagClass(rep) {
  const status = reputationStatus(rep)
  if (status === 'allied')  return 'tag-active'
  if (status === 'hostile') return 'tag-inactive'
  return ''
}

onMounted(() => { if (!data.factions.length) data.loadFactions() })
</script>
