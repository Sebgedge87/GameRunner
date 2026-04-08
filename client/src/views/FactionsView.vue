<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Factions</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search factions…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.factions.length" class="faction-grid">
      <div v-for="n in 4" :key="n" class="faction-card faction-card--skeleton">
        <div class="faction-skel-banner"></div>
        <div class="faction-skel-body">
          <div class="faction-skel-line faction-skel-line--title"></div>
          <div class="faction-skel-line"></div>
        </div>
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
      <div class="faction-grid">

        <!-- Create tile (GM only) -->
        <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('faction', null, {})">
          <span class="create-card-icon">+</span>
          <span>Add Faction</span>
        </div>

        <!-- Faction card -->
        <div
          v-for="faction in filteredFactions" :key="faction.id"
          class="faction-card"
          :class="{ 'faction-card--hidden': faction.hidden }"
          @click="campaign.isGm ? ui.openGmEdit('faction', faction.id, faction) : ui.openDetail('faction', faction)"
          :title="faction.name"
        >
          <!-- Banner area -->
          <div class="faction-banner">
            <img v-if="faction.image_path" :src="`/vault/${faction.image_path}`" class="faction-banner-img" alt="" />
            <div v-else class="faction-banner-empty">⚔️</div>
            <!-- Hover overlay -->
            <div class="faction-hover-overlay">
              <div class="faction-hover-name">{{ faction.name }}</div>
              <div v-if="faction.description" class="faction-hover-desc">{{ faction.description?.slice(0, 100) }}{{ (faction.description?.length ?? 0) > 100 ? '…' : '' }}</div>
            </div>
          </div>

          <!-- Info bar -->
          <div class="faction-info">
            <div class="faction-name">{{ faction.name }}</div>
            <div class="faction-tags">
              <span v-if="faction.reputation != null" class="tag" :class="standingClass(faction.reputation)">
                {{ reputationLabel(faction.reputation) }}
              </span>
              <span v-if="faction.goals" class="faction-goals-hint">{{ faction.goals?.slice(0, 48) }}{{ (faction.goals?.length ?? 0) > 48 ? '…' : '' }}</span>
            </div>
            <!-- Rep bar -->
            <div v-if="faction.reputation != null" class="faction-rep-bar">
              <div class="faction-rep-fill" :style="`width:${reputationPercent(faction.reputation)}%;background:${reputationColor(faction.reputation)}`"></div>
            </div>
          </div>
        </div>

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
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import FilterTabs from '@/components/FilterTabs.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const activeTab     = ref('all')
const confirmDelete = ref(null)

const tabs = [
  { value: 'all',      label: 'All' },
  { value: 'allied',   label: 'Allied' },
  { value: 'neutral',  label: 'Neutral' },
  { value: 'hostile',  label: 'Hostile' },
]

const filteredFactions = computed(() => {
  let list = data.factions
  if (activeTab.value !== 'all') {
    list = list.filter(f => {
      const rep = f.reputation
      if (activeTab.value === 'allied')  return rep != null && rep >= 1
      if (activeTab.value === 'neutral') return rep == null || rep === 0
      if (activeTab.value === 'hostile') return rep != null && rep <= -1
      return true
    })
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.goals?.toLowerCase().includes(q)
    )
  }
  return list
})

function standingClass(rep) {
  if (rep == null) return ''
  if (rep >= 1)  return 'tag-active'
  if (rep <= -1) return 'tag-inactive'
  return ''
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

<style scoped>
/* ── Grid ─────────────────────────────────────────────────────────────────── */
.faction-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  align-items: start;
}

/* ── Card ────────────────────────────────────────────────────────────────── */
.faction-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  position: relative;
}
.faction-card:hover {
  border-color: var(--accent, #1a78ff);
  box-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(26,120,255,0.15);
  transform: translateY(-2px);
}
.faction-card--hidden { opacity: 0.45; filter: grayscale(0.4); }

/* ── Banner area ─────────────────────────────────────────────────────────── */
.faction-banner {
  width: 100%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg3);
  position: relative;
}
.faction-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.faction-card:hover .faction-banner-img { transform: scale(1.05); }
.faction-banner-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  opacity: 0.16;
  background: var(--surface2);
}

/* Hover detail overlay */
.faction-hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(6,8,18,0.92) 0%, rgba(6,8,18,0.3) 55%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 12px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  pointer-events: none;
}
.faction-card:hover .faction-hover-overlay { opacity: 1; transform: translateY(0); }
.faction-hover-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: #fff;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9);
  margin-bottom: 4px;
}
.faction-hover-desc {
  font-size: 10px;
  color: rgba(255,255,255,0.72);
  line-height: 1.4;
}

/* ── Info bar ────────────────────────────────────────────────────────────── */
.faction-info {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.faction-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: var(--text);
  letter-spacing: 0.05em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.faction-tags { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.faction-goals-hint {
  font-size: 10px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ── Rep bar ─────────────────────────────────────────────────────────────── */
.faction-rep-bar {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.faction-rep-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ── Skeleton loader ────────────────────────────────────────────────────── */
.faction-card--skeleton {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  overflow: hidden;
  pointer-events: none;
  animation: shimmer 1.5s infinite;
  background-size: 200% 100%;
  background-image: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
}
.faction-skel-banner { aspect-ratio: 16/9; background: var(--bg3); }
.faction-skel-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.faction-skel-line { height: 10px; background: var(--border); border-radius: 3px; }
.faction-skel-line--title { width: 70%; height: 12px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
</style>
