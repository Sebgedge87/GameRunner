<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">NPCs</div>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('npc', null, {})">+ Add NPC</button>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search NPCs…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>

    <!-- Skeleton -->
    <div v-if="data.loading && !data.npcs.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
      </div>
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!data.npcs.length"
      icon="👤"
      heading="No NPCs yet"
      description="Add the people who populate your world."
      :cta-label="campaign.isGm ? '+ Add NPC' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('npc', null, {}) : null"
    />

    <!-- NPC portrait grid -->
    <template v-else>
      <div class="npc-grid">
        <div
          v-for="npc in filteredNpcs" :key="npc.id"
          class="npc-card card"
          :class="{ 'npc-hidden': npc.hidden, 'npc-expanded': expandedId === npc.id }"
          @click="toggleExpand(npc.id)"
        >
          <!-- Portrait -->
          <div class="npc-portrait">
            <img v-if="npc.image_url" :src="npc.image_url" class="npc-portrait-img" alt="" />
            <div v-else class="npc-portrait-empty">👤</div>
          </div>

          <!-- Always-visible info -->
          <div class="npc-info">
            <div class="npc-name-row">
              <span class="npc-name">{{ npc.name }}</span>
              <button
                v-if="campaign.isGm"
                class="btn btn-xs npc-edit-btn"
                title="Edit"
                @click.stop="ui.openGmEdit('npc', npc.id, npc)"
              >✏️</button>
            </div>
            <div class="npc-tags">
              <span v-if="npc.role" class="tag">{{ npc.role }}</span>
              <span v-if="npc.race" class="tag">{{ npc.race }}</span>
              <span v-if="npc.disposition" class="tag" :class="dispositionClass(npc.disposition)">{{ npc.disposition }}</span>
            </div>
            <div v-if="npc.faction" class="npc-meta">⚔️ {{ npc.faction }}</div>
            <div v-if="npc.location" class="npc-meta">📍 {{ npc.location }}</div>
          </div>

          <!-- Expanded detail -->
          <template v-if="expandedId === npc.id">
            <div v-if="npc.description" class="npc-body">
              {{ stripMd(npc.description) }}
            </div>
            <div class="npc-actions">
              <button class="btn btn-sm" @click.stop="data.addPin('npc', npc.id, npc.name)">📌 Pin</button>
              <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="revealNpc(npc.id, !npc.revealed)">
                {{ npc.revealed ? '👁 Hide' : '⭐ Reveal' }}
              </button>
              <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="ui.openShare('npc', npc.id, npc.name)">🔗 Share</button>
              <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="ui.openGmEdit('npc', npc.id, npc)">✏️ Edit</button>
              <button v-if="campaign.isGm" class="btn btn-sm btn-danger" @click.stop="confirmDeleteNpc(npc)">🗑 Delete</button>
            </div>
          </template>
        </div>
      </div>
      <p v-if="!filteredNpcs.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="NPC"
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
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const activeTab     = ref('all')
const expandedId    = ref(null)
const confirmDelete = ref(null)

const tabs = [
  { value: 'all',      label: 'All' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral',  label: 'Neutral' },
  { value: 'hostile',  label: 'Hostile' },
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

function confirmDeleteNpc(npc) {
  confirmDelete.value = { id: npc.id, name: npc.name }
}

async function doDelete() {
  await data.deleteItem('npc', confirmDelete.value.id)
  await data.loadNpcs()
  confirmDelete.value = null
}

onMounted(() => { if (!data.npcs.length) data.loadNpcs() })
</script>

<style scoped>
.npc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  align-items: start;
}

.npc-card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}

/* Portrait */
.npc-portrait {
  width: 100%;
  height: 160px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}
.npc-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.npc-card:hover .npc-portrait-img { transform: scale(1.04); }
.npc-portrait-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  opacity: 0.2;
  background: var(--surface2);
}

/* Info area */
.npc-info {
  padding: 10px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.npc-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.npc-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.05em;
  text-transform: none;
  flex: 1;
  line-height: 1.3;
}
.npc-edit-btn { opacity: 0.4; padding: 2px 5px; font-size: 11px; transition: opacity 0.15s; flex-shrink: 0; }
.npc-edit-btn:hover { opacity: 1; }
.npc-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.npc-meta { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

/* Hidden NPC */
.npc-hidden { opacity: 0.5; }

/* Expanded detail */
.npc-body {
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.npc-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  padding: 8px 14px 10px;
  border-top: 1px solid var(--border);
}
.npc-actions .btn { font-size: 11px; padding: 3px 8px; }
</style>
