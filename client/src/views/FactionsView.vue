<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Factions</div>
    </div>

    <div class="search-row" style="margin-bottom:16px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search factions…"
        style="max-width:320px"
      />
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('faction', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Faction</div>
      </div>

      <div
        v-for="faction in filteredFactions"
        :key="faction.id"
        class="card"
        :class="{ hidden: faction.hidden }"
        @click="ui.openDetail('faction', faction)"
      >
        <div class="card-body">
          <div class="card-title">{{ faction.name }}</div>
          <div v-if="faction.description" class="card-meta" style="font-size:0.85em;opacity:0.8;margin-top:4px">
            {{ faction.description }}
          </div>
          <div v-if="faction.goals" class="card-meta" style="font-size:0.8em;opacity:0.65;margin-top:4px">
            Goals: {{ faction.goals }}
          </div>
          <div v-if="faction.reputation != null" style="margin-top:10px">
            <div style="display:flex;justify-content:space-between;font-size:0.75em;opacity:0.6;margin-bottom:4px">
              <span>Hostile</span>
              <span style="font-weight:600;opacity:1;color:var(--accent)">{{ reputationLabel(faction.reputation) }}</span>
              <span>Allied</span>
            </div>
            <div class="progress-bar" style="position:relative">
              <div
                class="progress-fill"
                :style="`width:${reputationPercent(faction.reputation)}%;background:${reputationColor(faction.reputation)}`"
              ></div>
            </div>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('faction', faction.id, faction.name)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="faction.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('faction', faction.id)"
            >{{ faction.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('faction', faction.id, faction.name)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('faction', faction.id, faction)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('faction', faction.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredFactions.length === 0" class="empty-state">
      No factions found.
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

const filteredFactions = computed(() => {
  if (!search.value.trim()) return data.factions
  const q = search.value.toLowerCase()
  return data.factions.filter(f =>
    f.name?.toLowerCase().includes(q) ||
    f.description?.toLowerCase().includes(q) ||
    f.goals?.toLowerCase().includes(q)
  )
})

function reputationLabel(rep) {
  if (rep <= -3) return 'Hostile'
  if (rep <= -1) return 'Unfriendly'
  if (rep === 0) return 'Neutral'
  if (rep <= 2) return 'Friendly'
  return 'Allied'
}

function reputationPercent(rep) {
  return ((rep + 3) / 6) * 100
}

function reputationColor(rep) {
  if (rep <= -2) return 'var(--red, #e05c5c)'
  if (rep <= -1) return 'var(--orange, #e0945c)'
  if (rep === 0) return 'var(--muted, #888)'
  if (rep <= 2) return 'var(--green, #5ce07a)'
  return 'var(--accent, #a78bfa)'
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadFactions()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this faction?')) return
  await data.deleteItem(type, id)
  await data.loadFactions()
}

onMounted(() => {
  if (!data.factions.length) data.loadFactions()
})
</script>
