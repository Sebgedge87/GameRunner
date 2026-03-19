<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Factions</div></div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search factions…" style="max-width:320px" />
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('faction', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Faction</div>
      </div>
      <EntityCard
        v-for="faction in filteredFactions" :key="faction.id"
        :entity="faction" type="faction" :title="faction.name" icon="⚔️"
        :expanded="expandedId === faction.id" :reload-fn="data.loadFactions"
        @toggle="toggleExpand(faction.id)"
      >
        <template #badges></template>
        <template #body>
          <div v-if="faction.description" class="card-overview">{{ stripMd(faction.description) }}</div>
          <div v-if="faction.goals" class="card-meta">Goals: {{ stripMd(faction.goals, 80) }}</div>
          <div v-if="faction.reputation != null" style="margin-top:4px">
            <div style="display:flex;justify-content:space-between;font-size:0.75em;opacity:0.6;margin-bottom:4px">
              <span>Hostile</span>
              <span style="font-weight:600;opacity:1;color:var(--accent)">{{ reputationLabel(faction.reputation) }}</span>
              <span>Allied</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="`width:${reputationPercent(faction.reputation)}%;background:${reputationColor(faction.reputation)}`"></div>
            </div>
          </div>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredFactions.length === 0" class="empty-state">No factions found.</div>
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
const expandedId = ref(null)

const filteredFactions = computed(() => {
  if (!search.value.trim()) return data.factions
  const q = search.value.toLowerCase()
  return data.factions.filter(f =>
    f.name?.toLowerCase().includes(q) ||
    f.description?.toLowerCase().includes(q) ||
    f.goals?.toLowerCase().includes(q)
  )
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function reputationLabel(rep) {
  if (rep <= -3) return 'Hostile'
  if (rep <= -1) return 'Unfriendly'
  if (rep === 0) return 'Neutral'
  if (rep <= 2) return 'Friendly'
  return 'Allied'
}

function reputationPercent(rep) { return ((rep + 3) / 6) * 100 }

function reputationColor(rep) {
  if (rep <= -2) return 'var(--red, #e05c5c)'
  if (rep <= -1) return 'var(--orange, #e0945c)'
  if (rep === 0) return 'var(--muted, #888)'
  if (rep <= 2) return 'var(--green, #5ce07a)'
  return 'var(--accent, #a78bfa)'
}

onMounted(() => { if (!data.factions.length) data.loadFactions() })
</script>
