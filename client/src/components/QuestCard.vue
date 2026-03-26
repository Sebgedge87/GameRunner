<template>
  <div
    class="card quest-card"
    :class="{
      hidden: quest.hidden,
      expanded: expanded,
      [`urgency-${quest.urgency}`]: quest.urgency && quest.urgency !== 'none',
    }"
  >
    <!-- ── HEADER (always visible, click to expand) ── -->
    <div class="qc-header" @click="$emit('toggle')">
      <div class="qc-title-row">
        <span class="qc-icon">⚔️</span>
        <span class="qc-title">{{ quest.title }}</span>
        <button
          v-if="campaign.isGm"
          class="btn btn-xs qc-edit-btn"
          title="Edit"
          @click.stop="ui.openGmEdit('quest', quest.id, quest)"
        >✏️</button>
      </div>
      <div class="qc-badge-row">
        <span class="tag qc-type-tag">{{ quest.quest_type || 'main' }}</span>
        <span class="tag" :class="statusClass(quest.status)">{{ quest.status || 'active' }}</span>
        <span
          v-if="quest.urgency && quest.urgency !== 'none'"
          class="doom-clock"
          :class="`doom-${quest.urgency}`"
        >⏳ URGENT</span>
      </div>
    </div>

    <!-- ── EXPANDED BODY ── -->
    <template v-if="expanded">

      <!-- Image banner -->
      <img
        v-if="quest.image_url"
        :src="quest.image_url"
        class="qc-image"
        alt="Quest banner"
      />

      <!-- Description -->
      <div v-if="quest.description" class="qc-section qc-description">
        <div class="qc-section-text prose" v-html="renderMd(quest.description)"></div>
      </div>

      <!-- Connections: Locations / Factions / NPCs -->
      <div
        v-if="allLocations.length || allFactions.length || allNpcs.length"
        class="qc-section qc-connections"
      >
        <div v-if="allLocations.length" class="qc-conn-group">
          <span class="qc-conn-label">📍 Locations</span>
          <div class="qc-conn-badges">
            <button
              v-for="name in allLocations"
              :key="name"
              class="conn-badge"
              @click.stop="openEntityDetail('location', name)"
            >{{ name }}</button>
          </div>
        </div>
        <div v-if="allFactions.length" class="qc-conn-group">
          <span class="qc-conn-label">🏰 Factions</span>
          <div class="qc-conn-badges">
            <button
              v-for="name in allFactions"
              :key="name"
              class="conn-badge"
              @click.stop="openEntityDetail('faction', name)"
            >{{ name }}</button>
          </div>
        </div>
        <div v-if="allNpcs.length" class="qc-conn-group">
          <span class="qc-conn-label">🧑 NPCs</span>
          <div class="qc-conn-badges">
            <button
              v-for="name in allNpcs"
              :key="name"
              class="conn-badge"
              @click.stop="openEntityDetail('npc', name)"
            >{{ name }}</button>
          </div>
        </div>
      </div>

      <!-- Deadline -->
      <div v-if="quest.deadline" class="qc-section qc-deadline">
        <span class="qc-deadline-icon">⏳</span>
        <span>{{ quest.deadline }}</span>
      </div>

      <!-- Loot Tray -->
      <div class="qc-section qc-loot">
        <div class="qc-loot-header">
          <span>💰 Loot Tray</span>
          <button
            v-if="campaign.isGm"
            class="qc-add-reward"
            @click.stop="ui.openGmEdit('quest', quest.id, quest)"
          >+ Add Reward</button>
        </div>
        <div v-if="hasReward" class="qc-loot-pills">
          <span v-if="quest.reward_gold" class="reward-pill">{{ quest.reward_gold }} GP</span>
          <template v-if="quest.reward_items">
            <span v-for="item in splitComma(quest.reward_items)" :key="item" class="reward-pill">{{ item }}</span>
          </template>
          <span v-if="quest.reward_xp" class="reward-pill">{{ quest.reward_xp }} XP</span>
        </div>
        <div v-else class="qc-loot-empty">No rewards set.</div>
      </div>

      <!-- GM Notes (GM only) -->
      <div v-if="campaign.isGm && quest.gm_notes" class="qc-section qc-gm-notes">
        <div class="qc-gm-header">
          <span class="gm-note-label">🔒 GM Note</span>
        </div>
        <div class="qc-gm-text prose" v-html="renderMd(quest.gm_notes)"></div>
      </div>

      <!-- Action bar -->
      <div class="qc-actions">
        <button class="btn btn-sm" title="Pin" @click.stop="data.addPin('quest', quest.id, quest.title)">📌 Pin</button>
        <button class="btn btn-sm" title="Mindmap" @click.stop="router.push('/mindmap')">🧠 Mindmap</button>
        <template v-if="campaign.isGm">
          <button
            class="btn btn-sm"
            :title="quest.hidden ? 'Reveal' : 'Hide'"
            @click.stop="toggleHidden"
          >{{ quest.hidden ? '👁 Reveal' : '🙈 Hide' }}</button>
          <button class="btn btn-sm" title="Edit" @click.stop="ui.openGmEdit('quest', quest.id, quest)">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" title="Delete" @click.stop="deleteItem">🗑 Delete</button>
        </template>
      </div>

    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { renderMd } from '@/utils/markdown'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  quest:    { type: Object, required: true },
  expanded: { type: Boolean, default: false },
})
defineEmits(['toggle'])

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const router   = useRouter()

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'active') return 'tag-active'
  if (s === 'completed') return 'tag-completed'
  if (s === 'failed') return 'tag-inactive'
  return ''
}

function splitComma(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

const allLocations = computed(() => {
  const multi  = splitComma(props.quest.connected_locations)
  const single = props.quest.connected_location ? [props.quest.connected_location.trim()] : []
  return [...new Set([...multi, ...single])].filter(Boolean)
})
const allFactions = computed(() => splitComma(props.quest.connected_factions))
const allNpcs     = computed(() => splitComma(props.quest.connected_npcs))
const hasReward   = computed(() => props.quest.reward_gold || props.quest.reward_xp || props.quest.reward_items)

function openEntityDetail(type, name) {
  let store
  if (type === 'location') store = data.locations
  else if (type === 'faction') store = data.factions
  else store = data.npcs
  const entity = store?.find(e => (e.title || e.name)?.toLowerCase() === name?.toLowerCase())
  if (entity) ui.openDetail(type, entity)
  else ui.showToast(`${name} not found`, '', '🔍')
}

async function toggleHidden() {
  await data.toggleHidden('quest', props.quest.id)
  await data.loadQuests()
}

async function deleteItem() {
  if (!await ui.confirm('Delete this quest?')) return
  await data.deleteItem('quest', props.quest.id)
  await data.loadQuests()
}
</script>

<style scoped>
.quest-card { padding: 0; overflow: hidden; cursor: pointer; }

/* ── Header ── */
.qc-header { padding: 12px 16px 10px; user-select: none; }
.qc-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.qc-icon { font-size: 14px; flex-shrink: 0; }
.qc-title {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  flex: 1;
  line-height: 1.3;
}
.qc-edit-btn { opacity: 0.45; padding: 2px 6px; font-size: 11px; transition: opacity 0.15s; flex-shrink: 0; }
.qc-edit-btn:hover { opacity: 1; }
.qc-badge-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.qc-type-tag { text-transform: capitalize; }

/* ── Shared section padding ── */
.qc-section { padding: 10px 16px; border-top: 1px solid var(--border); }

/* ── Image banner ── */
.qc-image { width: 100%; height: 150px; object-fit: cover; display: block; border-top: 1px solid var(--border); }

/* ── Description ── */
.qc-section-text { font-size: 13px; color: var(--text2); line-height: 1.65; font-style: italic; }

/* ── Connections ── */
.qc-connections { display: flex; flex-direction: column; gap: 8px; }
.qc-conn-group { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.qc-conn-label {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text3);
  white-space: nowrap;
  padding-top: 3px;
  min-width: 78px;
}
.qc-conn-badges { display: flex; gap: 4px; flex-wrap: wrap; }

/* ── Deadline ── */
.qc-deadline { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text2); }
.qc-deadline-icon { font-size: 14px; }

/* ── Loot Tray ── */
.qc-loot-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 7px;
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--text3);
}
.qc-add-reward {
  background: none; border: 1px dashed var(--border2); color: var(--text3);
  font-size: 10px; padding: 2px 8px; border-radius: 3px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.qc-add-reward:hover { border-color: var(--gold); color: var(--gold); }
.qc-loot-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.qc-loot-empty { font-size: 12px; color: var(--text3); font-style: italic; }

/* ── GM Notes ── */
.qc-gm-notes { background: rgba(180,40,40,.06); border-top: 1px solid rgba(201,76,76,.22) !important; }
.qc-gm-header { margin-bottom: 5px; }
.qc-gm-text { font-size: 13px; color: var(--text2); line-height: 1.55; }

/* ── Action bar ── */
.qc-actions {
  display: flex; gap: 5px; flex-wrap: wrap;
  padding: 8px 16px 10px; border-top: 1px solid var(--border);
}
.qc-actions .btn { font-size: 11px; padding: 3px 8px; }
</style>
