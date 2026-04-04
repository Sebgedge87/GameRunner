<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Command Centre</div></div>

    <!-- Campaign banner -->
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

    <!-- Quick Links (Mirrors Sidebar Clusters) -->
    <div class="dash-section" style="margin-top:16px;">Quick Links</div>
    <div class="dash-grid" style="margin-bottom: 24px;">
      <!-- World -->
      <div class="stat-card stat-card-link" @click="router.push('/npcs')"><div class="stat-label">NPCs</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/locations')"><div class="stat-label">Locations</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/factions')"><div class="stat-label">Factions</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/bestiary')"><div class="stat-label">Bestiary</div></div>
      <!-- Knowledge & Chronology -->
      <div class="stat-card stat-card-link" @click="router.push('/timeline')"><div class="stat-label">Timeline</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/maps')"><div class="stat-label">Maps</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/theory-board')"><div class="stat-label">Theory</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/notes')"><div class="stat-label">Notes</div></div>
      <!-- Player Bag -->
      <div class="stat-card stat-card-link" @click="router.push('/inventory')"><div class="stat-label">Inventory</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/handouts')"><div class="stat-label">Handouts</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/hooks-rumours')"><div class="stat-label">Rumours/Hooks</div></div>
      <div class="stat-card stat-card-link" @click="router.push('/quests')"><div class="stat-label">Quests</div></div>
    </div>

    <!-- ── 2-column lower dashboard ─────────────────────── -->
    <div class="dash-lower">

      <!-- LEFT: Job Board & Quests -->
      <div class="dash-lower-col">
        <!-- Local Job Board -->
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

        <!-- Active Quests -->
        <div class="dash-section-row">
          <div class="dash-section">Active Quests</div>
          <router-link to="/quests" class="dash-view-all">View all →</router-link>
        </div>
        <div class="card-grid">
          <QuestCard v-for="q in activeQuests.slice(0, 6)" :key="q.id" :quest="q" :expanded="expandedId === q.id" @toggle="toggleExpand(q.id)" />
          <div v-if="activeQuests.length === 0" class="empty-state dash-empty">No active quests.</div>
        </div>
      </div>

      <!-- RIGHT: Messages, Next Session -->
      <div class="dash-lower-col">
        <!-- Next session -->
        <div class="dash-section-row">
          <div class="dash-section">Next Session</div>
          <router-link to="/sessions" class="dash-view-all">View all →</router-link>
        </div>
        <div v-if="nextSession" class="card">
          <div class="card-title">{{ nextSession.title || 'Proposed date' }}</div>
          <div class="card-meta next-session-date">{{ fmtTime(nextSession.proposed_date) }}</div>
        </div>
        <div v-else class="empty-state dash-empty">No upcoming session.</div>

        <!-- Recent handouts -->
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

const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const auth = useAuthStore()
const router = useRouter()
const { hasStress, hasSanity } = useSystemFeatures()

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
const openHooks = computed(() => data.hooks.filter(h => h.status === 'active').length)
const recentHandouts = computed(() =>
  [...data.handouts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)
)

const partyLocationModel = ref(campaign.currentPartyLocationId || '')
const partyLocationName = computed(() => {
  const loc = data.locations.find(l => l.id == campaign.currentPartyLocationId)
  return loc ? loc.name : 'Unknown'
})

async function updatePartyLocation(e) {
  const val = e.target.value
  await campaign.setPartyLocation(val)
}

const localJobs = computed(() => {
  if (!campaign.currentPartyLocationId) return []
  // If GM, show all for location to manage. If player, maybe just open jobs?
  // The plan requested: GM sees all for location, players see jobs for location.
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

function openMessage(m) { ui.openMessage(m) }

onMounted(async () => {
  if (!data.scheduling.length) await data.loadSessions()
  await loadMyCharacters()
})
</script>

<style scoped>
.campaign-subtitle { font-size: 12px; color: var(--text3); margin-top: 2px; }

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

/* Stress bars */
.stress-wrap { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
.stress-col { min-width: 180px; }
.sanity-critical { color: var(--red); }

/* Pins */
.pins-section { margin-bottom: 18px; }
.pin-remove { background: none; border: none; color: var(--text3); font-size: 11px; padding: 0 0 0 4px; cursor: pointer; }

/* Stat cards */
.stat-card-link { cursor: pointer; }

/* Section headers */
.dash-section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  margin-bottom: 10px;
}
.dash-section { margin: 0; flex: 1; }
.dash-view-all {
  font-size: 11px;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
}
.dash-badge {
  font-size: 11px;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  margin-left: 8px;
}
.dash-empty { padding: 12px 0; }

/* Handout items are clickable */
.msg-item-link { cursor: pointer; }

/* Next session */
.next-session-date { color: var(--text3); }

/* 2-column lower layout */
.dash-lower {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
  margin-top: 8px;
}

@media (max-width: 860px) {
  .dash-lower { grid-template-columns: 1fr; }
}
</style>
