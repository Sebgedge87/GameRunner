<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Dashboard</div></div>

    <!-- Campaign banner -->
    <div v-if="campaign.activeCampaign" class="campaign-banner">
      <div>
        <div class="campaign-name">{{ campaign.activeCampaign.name }}</div>
        <div v-if="campaign.activeCampaign.subtitle" style="font-size:12px;color:var(--text3);margin-top:2px">
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

    <!-- Playlist player -->
    <PlaylistPlayer :url="playlistUrl" />

    <!-- Agenda card (player only) -->
    <div v-if="data.agenda && !campaign.isGm" class="agenda-card">
      <div class="agenda-card-title">SECRET OBJECTIVE</div>
      <div v-if="!data.agenda.revealed" class="agenda-locked">🔒 Sealed — awaiting revelation</div>
      <div v-else class="agenda-body">{{ data.agenda.body || data.agenda.title }}</div>
    </div>

    <!-- Stress/Sanity bar (player only) -->
    <div v-if="data.stress && !campaign.isGm" style="margin-bottom:18px">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <template v-if="['alien','coriolis'].includes(campaign.activeCampaign?.system)">
          <div style="min-width:180px">
            <div class="stress-bar-label">
              <span>Stress</span>
              <span>{{ data.stress.stress }}/{{ data.stress.stress_max }}</span>
            </div>
            <div class="stress-track">
              <div class="stress-fill" :style="`width:${stressPct}%;background:${stressPct > 70 ? 'var(--red)' : stressPct > 40 ? '#c9a84c' : 'var(--green)'}`"></div>
            </div>
          </div>
        </template>
        <template v-if="['coc','achtung'].includes(campaign.activeCampaign?.system)">
          <div style="min-width:180px">
            <div class="stress-bar-label">
              <span>Sanity</span>
              <span>{{ data.stress.sanity }}/{{ data.stress.sanity_max }}
                <span v-if="data.stress.indefinite_insanity" style="color:var(--red)"> INDEFINITE</span>
              </span>
            </div>
            <div class="stress-track">
              <div class="stress-fill" :style="`width:${sanityPct}%;background:${sanityPct > 60 ? 'var(--green)' : sanityPct > 30 ? '#c9a84c' : 'var(--red)'}`"></div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Pinned items -->
    <div v-if="data.pins.length" style="margin-bottom:18px">
      <div class="dash-section" style="margin-top:0;margin-bottom:8px">Pinned</div>
      <div class="pins-row">
        <div
          v-for="p in data.pins"
          :key="p.id"
          class="pin-chip"
          @click="router.push('/' + (p.item_type + 's'))"
        >
          <div class="type-dot" :style="`background:${TYPE_COLORS[p.item_type] || '#888'}`"></div>
          {{ p.item_title || p.item_type + ' #' + p.item_id }}
          <button style="background:none;border:none;color:var(--text3);font-size:11px;padding:0 0 0 4px" @click.stop="data.removePin(p.id)">✕</button>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="dash-grid">
      <div class="stat-card"><div class="stat-value">{{ data.quests.length }}</div><div class="stat-label">Quests</div></div>
      <div class="stat-card"><div class="stat-value">{{ activeQuests.length }}</div><div class="stat-label">Active</div></div>
      <div class="stat-card"><div class="stat-value">{{ data.npcs.length }}</div><div class="stat-label">NPCs</div></div>
      <div class="stat-card"><div class="stat-value">{{ openHooks }}</div><div class="stat-label">Open Hooks</div></div>
    </div>

    <!-- Active quests list -->
    <div class="dash-section" style="margin-top:4px">Active Quests</div>
    <div class="card-grid">
      <div
        v-for="q in activeQuests.slice(0, 6)"
        :key="q.id"
        class="card"
        style="cursor:pointer"
        @click="ui.openDetail('quest', q)"
      >
        <div class="card-title">{{ q.title }}</div>
        <div class="card-meta">
          <span :class="`tag tag-${q.type || 'side'}`">{{ q.type || 'side' }}</span>
        </div>
        <div v-if="q.progress != null" class="progress-bar">
          <div class="progress-fill" :style="`width:${q.progress}%`"></div>
        </div>
      </div>
    </div>

    <!-- Recent messages -->
    <div class="dash-section" style="margin-top:18px">Recent Messages</div>
    <div>
      <div v-if="!ui.messages.length" class="empty-state" style="padding:12px">No messages.</div>
      <div
        v-for="m in ui.messages.slice(0, 3)"
        :key="m.id"
        class="msg-item"
        :class="{ unread: !m.read_at }"
        @click="openMessage(m)"
      >
        <div class="msg-header">
          <div class="msg-subject">{{ m.subject }}</div>
          <div class="msg-meta">{{ fmt(m.created_at) }}</div>
        </div>
        <div class="msg-preview">{{ (m.body || '').slice(0, 80) }}</div>
      </div>
    </div>

    <!-- Next session -->
    <div class="dash-section" style="margin-top:18px">Next Session</div>
    <div v-if="nextSession" class="card">
      <div class="card-title">{{ nextSession.title || 'Proposed date' }}</div>
      <div class="card-meta" style="color:var(--text3)">{{ fmtTime(nextSession.proposed_date) }}</div>
    </div>
    <div v-else class="empty-state" style="padding:12px">No upcoming session scheduled.</div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import PlaylistPlayer from '@/components/PlaylistPlayer.vue'

const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const router = useRouter()

const TYPE_COLORS = {
  quest: '#c9a84c', npc: '#4c7ac9', location: '#4caf7d', hook: '#8b4cc9',
  job: '#a09890', 'key-item': '#c9a84c',
}

const activeQuests = computed(() => data.quests.filter(q => q.status === 'active'))
const openHooks = computed(() => data.hooks.filter(h => h.status === 'active').length)

const stressPct = computed(() => {
  if (!data.stress) return 0
  return Math.min(100, Math.round((data.stress.stress / data.stress.stress_max) * 100))
})
const sanityPct = computed(() => {
  if (!data.stress) return 0
  return Math.min(100, Math.round((data.stress.sanity / data.stress.sanity_max) * 100))
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

function openMessage(m) {
  ui._viewingMessage = m
  ui.openFlyout('msg-view')
}

onMounted(async () => {
  if (!data.scheduling.length) await data.loadSessions()
})
</script>
