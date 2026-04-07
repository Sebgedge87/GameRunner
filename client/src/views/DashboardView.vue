<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Campaign Home</div></div>
    <!-- Campaign banner (always visible) -->
    <div v-if="campaign.activeCampaign" class="campaign-banner">
      <div>
        <div class="campaign-name">{{ campaign.activeCampaign.name }}</div>
        <div v-if="campaign.activeCampaign.subtitle" class="campaign-subtitle">
          {{ campaign.activeCampaign.subtitle }}
        </div>
      </div>
      <div class="campaign-meta">
        <div v-if="campaign.activeCampaign.current_scene" class="campaign-meta-item">
          <span>Scene </span><b>{{ campaign.activeCampaign.current_scene }}</b>
        </div>
        <div v-if="campaign.activeCampaign.current_weather" class="campaign-meta-item">
          <span>Weather </span><b>{{ campaign.activeCampaign.current_weather }}</b>
        </div>
        <div v-if="campaign.activeCampaign.current_time" class="campaign-meta-item">
          <span>Time </span><b>{{ campaign.activeCampaign.current_time }}</b>
        </div>
      </div>
    </div>

    <!-- GM tab strip — only visible to GMs -->
    <div v-if="campaign.isGm" class="dash-tabs">
      <button class="dash-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
      <button class="dash-tab" :class="{ active: activeTab === 'gm' }" @click="activeTab = 'gm'">GM Dashboard</button>
      <button class="dash-tab" :class="{ active: activeTab === 'combat' }" @click="activeTab = 'combat'">Combat</button>
    </div>

    <!-- ── OVERVIEW tab ───────────────────────────────────────── -->
    <template v-if="activeTab === 'overview'">
      <PlaylistPlayer :url="playlistUrl" />

      <!-- Character shortcut (player only) -->
      <div v-if="!campaign.isGm" class="char-shortcut-row">
        <div v-if="myCharacters.length === 0" class="char-shortcut-new" @click="router.push('/characters')">
          <span class="char-shortcut-plus">+</span>
          <span>Create your character</span>
        </div>
        <template v-else>
          <div v-for="c in myCharacters" :key="c.id" class="char-shortcut-tile" @click="router.push(`/character-sheet?id=${c.id}`)">
            <div class="char-shortcut-portrait">
              <img v-if="c.portrait_url" :src="c.portrait_url" :alt="c.name" class="char-shortcut-img" />
              <div v-else class="char-shortcut-initials">{{ initials(c.name) }}</div>
            </div>
            <div class="char-shortcut-details">
              <div class="char-shortcut-name">{{ c.name }}</div>
              <div v-if="c.sheet_data?.class" class="char-shortcut-class">{{ c.sheet_data.class }}</div>
            </div>
            <div class="char-shortcut-arrow">→</div>
          </div>
          <div class="char-shortcut-add" @click="router.push('/characters')" title="Manage characters">
            <span class="nav-icon">🧙</span> Characters
          </div>
        </template>
      </div>

      <!-- Pinned items -->
      <div v-if="data.pins.length" class="pins-section">
        <div class="dash-section">Pinned</div>
        <div class="pins-row">
          <div
            v-for="p in data.pins"
            :key="p.id"
            class="pin-chip"
            @click="router.push(PIN_ROUTES[p.item_type] || '/' + p.item_type)"
          >
            <div class="type-dot" :style="`background:${TYPE_COLORS[p.item_type] || '#888'}`"></div>
            {{ p.item_title || p.item_type + ' #' + p.item_id }}
            <button class="pin-remove" @click.stop="data.removePin(p.id)">✕</button>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="dash-section" style="margin-top:16px;">Quick Links</div>
      <div class="dash-grid quick-links-grid" style="margin-bottom: 24px;">
        <router-link to="/npcs" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">👤</div><div class="ql-label">NPCs</div>
        </router-link>
        <router-link to="/locations" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🗺</div><div class="ql-label">Locations</div>
        </router-link>
        <router-link to="/factions" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">⚑</div><div class="ql-label">Factions</div>
        </router-link>
        <router-link to="/bestiary" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🐉</div><div class="ql-label">Bestiary</div>
        </router-link>
        <router-link to="/timeline" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">⏳</div><div class="ql-label">Timeline</div>
        </router-link>
        <router-link to="/maps" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🗾</div><div class="ql-label">Maps</div>
        </router-link>
        <router-link to="/theory-board" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🔍</div><div class="ql-label">Theory</div>
        </router-link>
        <router-link to="/notes" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">📝</div><div class="ql-label">Notes</div>
        </router-link>
        <router-link to="/inventory" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🎒</div><div class="ql-label">Inventory</div>
        </router-link>
        <router-link to="/handouts" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">📄</div><div class="ql-label">Handouts</div>
        </router-link>
        <router-link to="/hooks-rumours" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">🪝</div><div class="ql-label">Hooks / Rumours</div>
        </router-link>
        <router-link to="/quests" class="stat-card stat-card-link quick-link-card" style="text-decoration:none">
          <div class="ql-icon">📜</div><div class="ql-label">Quests</div>
        </router-link>
      </div>

      <!-- 2-column lower dashboard -->
      <div class="dash-lower">
        <!-- LEFT: Job Board & Quests -->
        <div class="dash-lower-col">
          <div class="dash-section-row">
            <div class="dash-section">Local Job Board</div>
            <router-link to="/jobs" class="dash-view-all">Manage →</router-link>
          </div>

          <div style="margin-bottom: 16px;">
            <div v-if="campaign.isGm" style="display:flex; align-items:center; gap:8px;">
              <label style="font-size: 12px; color: var(--text3);">Party Location:</label>
              <select v-model="partyLocationModel" @change="updatePartyLocation" class="form-input" style="max-width:200px; padding:4px 8px; font-size:12px;">
                <option value="">-- Nowhere --</option>
                <option v-for="l in data.locations" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
            <div v-else-if="campaign.currentPartyLocationId" style="font-size: 12px; color: var(--text3);">
              Current Location: <span style="color: var(--text); font-weight: 600;">{{ partyLocationName }}</span>
            </div>
          </div>

          <div class="card-grid" style="margin-bottom: 24px;">
            <div v-for="job in localJobs" :key="job.id" class="card" style="padding: 12px;">
              <div style="font-weight: 600; margin-bottom: 4px;">📌 {{ job.title }}</div>
              <div style="font-size: 12px; color: var(--text2); margin-bottom: 8px;">{{ job.client }}</div>
              <div style="font-size: 12px; color: var(--text3);">Reward: {{ job.reward || 'Negotiable' }}</div>
            </div>
            <div v-if="!localJobs.length" class="empty-state dash-empty">No jobs available here.</div>
          </div>

          <div class="dash-section-row">
            <div class="dash-section">Active Quests</div>
            <router-link to="/quests" class="dash-view-all">View all →</router-link>
          </div>
          <div class="card-grid">
            <QuestCard v-for="q in activeQuests.slice(0, 6)" :key="q.id" :quest="q" :expanded="expandedId === q.id" @toggle="toggleExpand(q.id)" />
            <div v-if="activeQuests.length === 0" class="empty-state dash-empty">No active quests.</div>
          </div>
        </div>

        <!-- RIGHT: Next Session, Handouts -->
        <div class="dash-lower-col">
          <div class="dash-section-row">
            <div class="dash-section">Next Session</div>
            <router-link to="/sessions" class="dash-view-all">View all →</router-link>
          </div>
          <div v-if="nextSession" class="card">
            <div class="card-title">{{ nextSession.title || 'Proposed date' }}</div>
            <div class="card-meta next-session-date">{{ fmtTime(nextSession.proposed_date) }}</div>
          </div>
          <div v-else class="empty-state dash-empty">No upcoming session.</div>

          <div class="dash-section-row" style="margin-top:20px">
            <div class="dash-section">
              Recent Handouts
              <span v-if="ui.unreadHandoutCount" class="dash-badge">{{ ui.unreadHandoutCount }} new</span>
            </div>
            <router-link to="/handouts" class="dash-view-all">View all →</router-link>
          </div>
          <div>
            <div v-if="!recentHandouts.length" class="empty-state dash-empty">No handouts.</div>
            <div v-for="h in recentHandouts" :key="h.id" class="msg-item msg-item-link" @click="ui.openHandout(h)">
              <div class="msg-header">
                <div class="msg-subject">{{ h.title }}</div>
                <div class="msg-meta">{{ fmt(h.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /dash-lower -->
    </template>

    <!-- ── GM DASHBOARD tab ───────────────────────────────────── -->
    <template v-else-if="activeTab === 'gm' && campaign.isGm">
      <GmDashboardView />
    </template>

    <!-- ── COMBAT tab ─────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'combat' && campaign.isGm">
      <CombatView />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useSystemFeatures } from '@/composables/useSystemFeatures'
import PlaylistPlayer from '@/components/PlaylistPlayer.vue'
import QuestCard from '@/components/QuestCard.vue'
import GmDashboardView from '@/views/GmDashboardView.vue'
import CombatView from '@/views/CombatView.vue'

const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const auth = useAuthStore()
const router = useRouter()
const { hasStress, hasSanity } = useSystemFeatures()
const activeTab = ref('overview')

// Characters for the current player
const myCharacters = ref([])

async function loadMyCharacters() {
  if (campaign.isGm) return
  try {
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    }
    if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
    const r = await fetch('/api/characters', { headers })
    if (r.ok) {
      const d = await r.json()
      myCharacters.value = d.characters || []
    }
  } catch (_) {}
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const expandedId = ref(null)
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

const TYPE_COLORS = {
  quest: '#c9a84c', npc: '#4c7ac9', location: '#4caf7d', hook: '#8b4cc9',
  job: '#a09890', 'key-item': '#c9a84c', bestiary: '#c94c4c', faction: '#4caf7d',
  handout: '#6a8ad4', rumour: '#a09890', inventory: '#4caf7d',
}

const PIN_ROUTES = {
  quest: '/quests', npc: '/npcs', location: '/locations', hook: '/hooks-rumours',
  faction: '/factions', job: '/jobs', bestiary: '/bestiary', handout: '/handouts',
  inventory: '/inventory', 'key-item': '/inventory', rumour: '/hooks-rumours',
  timeline: '/timeline', map: '/maps', note: '/notes', session: '/sessions',
}

const activeQuests = computed(() => data.quests.filter(q => q.status === 'active'))
const recentHandouts = computed(() =>
  [...data.handouts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
)

const partyLocationModel = ref(campaign.currentPartyLocationId || '')
const partyLocationName = computed(() => {
  const loc = data.locations.find(l => l.id == campaign.currentPartyLocationId)
  return loc ? loc.name : 'Unknown'
})

async function updatePartyLocation(e) {
  await campaign.setPartyLocation(e.target.value)
}

const localJobs = computed(() => {
  if (!campaign.currentPartyLocationId) return []
  return data.jobs.filter(j =>
    j.location_id == campaign.currentPartyLocationId &&
    (campaign.isGm || j.status === 'open')
  )
})

const playlistUrl = computed(() => {
  const c = campaign.activeCampaign
  return c?.playlist_url || c?.music_url || null
})

const nextSession = computed(() => {
  const now = new Date()
  return data.scheduling
    .filter(s => s.proposed_date && new Date(s.proposed_date) > now)
    .sort((a, b) => new Date(a.proposed_date) - new Date(b.proposed_date))[0] || null
})

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  if (!campaign.isGm) activeTab.value = 'overview'
  if (!data.scheduling.length) await data.loadSessions()
  await loadMyCharacters()
})
</script>

<style scoped>
.campaign-subtitle { font-size: 12px; color: var(--text3); margin-top: 2px; }
.gm-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.gm-tab {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  text-decoration: none;
  color: var(--text2);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
}
.gm-tab.active {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in oklab, var(--accent) 10%, transparent);
}

/* Tab strip */
.dash-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}
.dash-tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 8px 14px;
  color: var(--text3);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.dash-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.dash-tab:hover:not(.active) { color: var(--text2); }

/* Character shortcut row */
.char-shortcut-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
.char-shortcut-tile {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius, 6px); padding: 8px 12px;
  cursor: pointer; transition: border-color 0.15s;
  min-width: 180px;
}
.char-shortcut-tile:hover { border-color: var(--accent); }
.char-shortcut-portrait {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--surface2, #2a2a3a); overflow: hidden;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.char-shortcut-img { width: 100%; height: 100%; object-fit: cover; }
.char-shortcut-initials { font-size: 0.9em; font-weight: 700; opacity: 0.3; font-family: 'JetBrains Mono', monospace; }
.char-shortcut-details { flex: 1; min-width: 0; }
.char-shortcut-name { font-weight: 600; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.char-shortcut-class { font-size: 0.75em; opacity: 0.5; }
.char-shortcut-arrow { opacity: 0.3; font-size: 0.9em; }
.char-shortcut-new {
  display: flex; align-items: center; gap: 8px;
  border: 1px dashed var(--border); border-radius: var(--radius, 6px);
  padding: 8px 16px; cursor: pointer; font-size: 0.82em; opacity: 0.6;
  transition: opacity 0.15s, border-color 0.15s;
}
.char-shortcut-new:hover { opacity: 1; border-color: var(--accent); }
.char-shortcut-plus { font-size: 1.2em; opacity: 0.7; }
.char-shortcut-add {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75em; opacity: 0.45; cursor: pointer;
  font-family: 'JetBrains Mono', monospace; padding: 4px 8px;
}
.char-shortcut-add:hover { opacity: 0.8; }

/* Pins */
.pins-section { margin-bottom: 18px; }
.pin-remove { background: none; border: none; color: var(--text3); font-size: 11px; padding: 0 0 0 4px; cursor: pointer; }

/* Section headers */
.dash-section-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 4px; margin-bottom: 10px;
}
.dash-section { margin: 0; }
.dash-view-all {
  font-size: 11px; color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer; white-space: nowrap; text-decoration: none;
}
.dash-badge {
  font-size: 11px; color: var(--accent);
  font-family: 'JetBrains Mono', monospace; margin-left: 8px;
}
.dash-empty { padding: 12px 0; }
.msg-item-link { cursor: pointer; }
.next-session-date { color: var(--text3); }
.stat-card-link { cursor: pointer; }

/* Quick Links */
.quick-links-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
  gap: 12px;
}
.quick-link-card {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; padding: 16px 10px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius, 6px); text-align: center;
}
.quick-link-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px var(--color-bg-overlay-light); }
.ql-icon { font-size: 24px; line-height: 1; }
.ql-label { font-family: var(--font-sans); font-size: 11px; color: var(--text2); font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; line-height: 1.3; word-break: break-word; }

/* 2-column lower layout */
.dash-lower {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 28px; align-items: start; margin-top: 8px;
}

@media (max-width: 860px) {
  .dash-lower { grid-template-columns: 1fr; }
}
</style>
