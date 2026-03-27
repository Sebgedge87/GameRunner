<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Factions</div>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('faction', null, {})">+ Add faction</button>
    </div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search factions…" style="max-width:320px" />
    </div>

    <!-- Skeleton -->
    <div v-if="data.loading && !data.factions.length" class="card-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-body"></div>
        <div class="skeleton-line skeleton-body-short"></div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!data.factions.length"
      icon="⚔️"
      heading="No factions yet"
      description="Define the guilds, cults and powers that shape your world."
      :cta-label="campaign.isGm ? '+ Add faction' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('faction', null, {}) : null"
    />

    <!-- Card grid -->
    <template v-else>
      <div class="card-grid">
        <OverlayCard
          v-for="faction in filteredFactions"
          :key="faction.id"
          icon="⚔️"
          :title="faction.name"
          :status="reputationStatus(faction.reputation)"
          :actions="factionActions(faction)"
          :is-expanded="expandedId === faction.id"
          :on-toggle="() => toggleExpand(faction.id)"
          @delete="confirmDelete = { id: faction.id, name: faction.name }"
        >
          <div v-if="faction.description" class="card-overview">{{ stripMd(faction.description) }}</div>
          <div v-if="faction.goals" class="card-meta">Goals: {{ stripMd(faction.goals, 80) }}</div>
          <div v-if="faction.reputation != null" style="margin-top:4px">
            <div style="display:flex;justify-content:space-between;font-size:0.75em;opacity:0.6;margin-bottom:4px">
              <span>Hostile</span>
              <span style="opacity:1;color:var(--accent)">{{ reputationLabel(faction.reputation) }}</span>
              <span>Allied</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="`width:${reputationPercent(faction.reputation)}%;background:${reputationColor(faction.reputation)}`"></div>
            </div>
          </div>
        </OverlayCard>
      </div>
      <p v-if="!filteredFactions.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="faction"
      :entity-name="confirmDelete?.name"
      :on-confirm="doDelete"
      :on-cancel="() => confirmDelete = null"
    />
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import OverlayCard from '@/components/OverlayCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyState from '@/components/EmptyState.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const expandedId    = ref(null)
const confirmDelete = ref(null)

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

function factionActions(faction) {
  const base = [
    { label: 'Pin', icon: '📌', onClick: () => data.addPin('faction', faction.id, faction.name) },
  ]
  if (!campaign.isGm) return base
  return [
    ...base,
    { label: 'Share',  icon: '🔗', onClick: () => ui.openShare('faction', faction.id, faction.name) },
    { label: 'Edit',   icon: '✏️', onClick: () => ui.openGmEdit('faction', faction.id, faction) },
    { type: 'divider' },
    { label: 'Delete', icon: '🗑️', variant: 'danger', onClick: () => {} },
  ]
}

function reputationStatus(rep) {
  if (rep == null) return null
  if (rep <= -3) return 'hostile'
  if (rep >= 3)  return 'allied'
  return 'neutral'
}

function reputationLabel(rep) {
  if (rep <= -3) return 'Hostile'
  if (rep <= -1) return 'Unfriendly'
  if (rep === 0) return 'Neutral'
  if (rep <= 2)  return 'Friendly'
  return 'Allied'
}

function reputationPercent(rep) { return ((rep + 3) / 6) * 100 }

function reputationColor(rep) {
  if (rep <= -2) return 'var(--red, #e05c5c)'
  if (rep <= -1) return 'var(--orange, #e0945c)'
  if (rep === 0) return 'var(--muted, #888)'
  if (rep <= 2)  return 'var(--green, #5ce07a)'
  return 'var(--accent, #a78bfa)'
}

async function doDelete() {
  await data.deleteItem('faction', confirmDelete.value.id)
  await data.loadFactions()
  confirmDelete.value = null
}

onMounted(() => { if (!data.factions.length) data.loadFactions() })
</script>
