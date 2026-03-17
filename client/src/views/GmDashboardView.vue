<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">GM Dashboard</div>
      <div class="page-sub">Campaign management &amp; overview</div>
    </div>

    <div v-if="loading" class="loading">Loading dashboard...</div>

    <template v-else>
      <!-- Player Status -->
      <div class="section-divider">Players</div>
      <div class="card-grid" style="margin-top:12px;margin-bottom:24px">
        <div v-for="player in players" :key="player.id" class="card">
          <div class="card-body" style="display:flex;align-items:center;gap:12px">
            <div style="flex:1">
              <div class="card-title" style="font-size:0.95em">{{ player.username }}</div>
              <div class="card-meta" style="font-size:0.8em;margin-top:4px">
                <span class="tag" :class="player.online ? 'tag-active' : ''">
                  {{ player.online ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
            <div v-if="player.stress != null" style="text-align:right">
              <div style="font-size:0.7em;opacity:0.5;margin-bottom:3px">STRESS</div>
              <div style="font-size:1.1em;font-weight:600;color:var(--red,#c94c4c)">{{ player.stress }}</div>
            </div>
          </div>
          <div class="card-actions" @click.stop>
            <button class="btn btn-sm" title="Message" @click="openMessage(player)">&#9993;</button>
            <button class="btn btn-sm" title="View Sheet" @click="viewSheet(player)">&#128100;</button>
          </div>
        </div>
      </div>

      <!-- Agenda / GM Notes -->
      <div class="section-divider">Agenda &amp; GM Notes</div>
      <div class="card" style="margin-top:12px;margin-bottom:24px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px">SESSION AGENDA</div>
        <div v-if="agendaCards.length === 0" style="opacity:0.5;font-size:0.85em">No agenda items.</div>
        <div v-for="card in agendaCards" :key="card.id" style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:0.9em">{{ card.title }}</div>
          <div v-if="card.notes" style="font-size:0.82em;opacity:0.7;margin-top:4px;line-height:1.5">{{ card.notes }}</div>
        </div>
        <button class="btn" style="margin-top:12px" @click="ui.openGmEdit('agenda', null, {})">+ Add Agenda Item</button>
      </div>

      <!-- Active Quests Summary -->
      <div class="section-divider">Active Quests</div>
      <div class="card-grid" style="margin-top:12px;margin-bottom:24px">
        <div v-if="activeQuests.length === 0" style="opacity:0.5;font-size:0.85em;padding:12px 0">No active quests.</div>
        <div
          v-for="quest in activeQuests"
          :key="quest.id"
          class="card"
          @click="ui.openDetail('quest', quest)"
        >
          <div class="card-body">
            <div class="card-title" style="font-size:0.9em">{{ quest.title }}</div>
            <div v-if="quest.progress != null" class="progress-bar" style="margin-top:6px">
              <div class="progress-fill" :style="`width:${quest.progress}%`"></div>
            </div>
            <div v-if="quest.hidden" class="card-meta" style="margin-top:4px">
              <span class="tag tag-inactive" style="font-size:0.7em">Hidden</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Messages -->
      <div class="section-divider">Unread Messages</div>
      <div style="margin-top:12px;margin-bottom:24px">
        <div v-if="unreadMessages.length === 0" style="opacity:0.5;font-size:0.85em;padding:8px 0">No unread messages.</div>
        <div v-for="msg in unreadMessages" :key="msg.id" class="card" style="margin-bottom:8px">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:0.85em;font-weight:600">{{ msg.sender_name || msg.from }}</span>
              <span style="font-size:0.75em;opacity:0.5">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div style="font-size:0.82em;opacity:0.75;margin-top:4px">{{ msg.body || msg.content }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-divider">Quick Actions</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button class="btn" @click="ui.openGmEdit('quest', null, {})">+ Quest</button>
        <button class="btn" @click="ui.openGmEdit('npc', null, {})">+ NPC</button>
        <button class="btn" @click="ui.openGmEdit('location', null, {})">+ Location</button>
        <button class="btn" @click="ui.openGmEdit('hook', null, {})">+ Hook</button>
        <button class="btn" @click="ui.openGmEdit('handout', null, {})">+ Handout</button>
        <button class="btn" @click="ui.openGmEdit('session', null, {})">+ Session</button>
        <router-link to="/combat" class="btn">&#9876; Combat Tracker</router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useRouter } from 'vue-router'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const router = useRouter()

const loading = ref(false)
const agendaCards = ref([])
const unreadMessages = ref([])

const players = computed(() => data.users.filter(u => !u.is_gm))

const activeQuests = computed(() =>
  data.quests.filter(q => q.status?.toLowerCase() === 'active')
)

function openMessage(player) {
  ui.openGmEdit('message', null, { to_user_id: player.id, to_username: player.username })
}

function viewSheet(player) {
  router.push(`/character-sheet?user=${player.id}`)
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

async function loadDash() {
  loading.value = true
  try {
    const [rA, rM] = await Promise.all([
      data.apif('/api/agenda'),
      data.apif('/api/messages?unread=true'),
    ])
    agendaCards.value = (await rA.json()).agenda || []
    unreadMessages.value = (await rM.json()).messages || []
  } catch (e) {
    console.error('[GmDashboard]', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    data.users.length ? null : data.loadUsers(),
    data.quests.length ? null : data.loadQuests(),
  ])
  await loadDash()
})
</script>
