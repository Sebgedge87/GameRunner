<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">NPCs</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search NPCs…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

    <!-- Skeleton -->
    <div v-if="data.loading && !data.npcs.length" class="npc-grid">
      <div v-for="n in 6" :key="n" class="npc-card npc-card--skeleton">
        <div class="npc-skel-img"></div>
        <div class="npc-skel-body">
          <div class="npc-skel-line npc-skel-line--title"></div>
          <div class="npc-skel-line"></div>
        </div>
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
      <div class="npc-grid">

        <!-- Create tile (GM only) -->
        <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('npc', null, {})">
          <span class="create-card-icon">+</span>
          <span>Add NPC</span>
        </div>

        <!-- NPC portrait card — click opens detail modal -->
        <div
          v-for="npc in filteredNpcs" :key="npc.id"
          class="npc-card"
          :class="{ 'npc-card--hidden': npc.hidden }"
          @click="ui.openDetail('npc', npc)"
          :title="npc.name"
        >
          <!-- Portrait area -->
          <div class="npc-portrait">
            <img v-if="npc.image_url" :src="npc.image_url" class="npc-portrait-img" alt="" />
            <div v-else class="npc-portrait-empty">👤</div>
            <!-- Hover detail overlay -->
            <div class="npc-hover-overlay">
              <div class="npc-hover-name">{{ npc.name }}</div>
              <div class="npc-hover-tags">
                <span v-if="npc.role" class="tag">{{ npc.role }}</span>
                <span v-if="npc.race" class="tag">{{ npc.race }}</span>
                <span v-if="npc.disposition" class="tag" :class="dispositionClass(npc.disposition)">{{ npc.disposition }}</span>
              </div>
            </div>
          </div>


          <!-- Info bar: always visible below portrait -->
          <div class="npc-info">
            <div class="npc-name">{{ npc.name }}</div>
            <div class="npc-tags">
              <span v-if="npc.role" class="tag">{{ npc.role }}</span>
              <span v-if="npc.race" class="tag">{{ npc.race }}</span>
              <span
                v-if="npc.disposition"
                class="tag"
                :class="dispositionClass(npc.disposition)"
              >{{ npc.disposition }}</span>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const activeTab     = ref('all')
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

function dispositionClass(d) {
  const s = d?.toLowerCase()
  if (s === 'friendly' || s === 'allied') return 'tag-active'
  if (s === 'hostile' || s === 'unfriendly') return 'tag-inactive'
  return ''
}

async function doDelete() {
  await data.deleteItem('npc', confirmDelete.value.id)
  await data.loadNpcs()
  confirmDelete.value = null
}

onMounted(() => { if (!data.npcs.length) data.loadNpcs() })
</script>

<style scoped>
/* ── Grid ─────────────────────────────────────────────────────────────────── */
.npc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  align-items: start;
}

/* ── Portrait Card ───────────────────────────────────────────────────────── */
.npc-card {
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
.npc-card:hover {
  border-color: var(--accent, #1a78ff);
  box-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(26,120,255,0.15);
  transform: translateY(-2px);
}
.npc-card--hidden { opacity: 0.45; filter: grayscale(0.4); }

/* ── Portrait area ───────────────────────────────────────────────────────── */
.npc-portrait {
  width: 100%;
  aspect-ratio: 3 / 4;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg3);
  position: relative;
}
.npc-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.npc-card:hover .npc-portrait-img { transform: scale(1.05); }
.npc-portrait-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  opacity: 0.18;
  background: var(--surface2);
}

/* Hover detail overlay: slides up from bottom */
.npc-hover-overlay {
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
.npc-card:hover .npc-hover-overlay { opacity: 1; transform: translateY(0); }
.npc-hover-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: #fff;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9);
  margin-bottom: 5px;
}
.npc-hover-tags { display: flex; flex-wrap: wrap; gap: 4px; }


/* ── Info bar ────────────────────────────────────────────────────────────── */
.npc-info {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.npc-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: var(--text);
  letter-spacing: 0.05em;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npc-tags { display: flex; flex-wrap: wrap; gap: 4px; }

/* ── Skeleton loader ────────────────────────────────────────────────────── */
.npc-card--skeleton {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  overflow: hidden;
  pointer-events: none;
  animation: shimmer 1.5s infinite;
  background-size: 200% 100%;
  background-image: linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%);
}
.npc-skel-img { aspect-ratio: 3/4; background: var(--bg3); }
.npc-skel-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.npc-skel-line { height: 10px; background: var(--border); border-radius: 3px; }
.npc-skel-line--title { width: 70%; height: 12px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
</style>

