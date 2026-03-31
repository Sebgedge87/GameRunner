<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">GM Dashboard</div>
      <div class="page-sub">Campaign management &amp; overview</div>
    </div>

    <!-- Tab bar -->
    <div class="filter-tabs" style="margin-bottom:20px">
      <button class="filter-tab" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
      <button class="filter-tab" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
      <button class="filter-tab" :class="{ active: activeTab === 'stats' }" @click="activeTab = 'stats'">Stats</button>
    </div>

    <div v-if="loading" class="loading">Loading dashboard…</div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════
           TAB: OVERVIEW
      ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'overview'">

        <!-- ── Players + Award XP side by side ──────────────── -->
        <div class="players-xp-cols">

          <!-- LEFT: Players table -->
          <div class="players-xp-col">
            <div class="section-divider">Players</div>
            <div class="players-table-wrap">
              <table class="players-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Role</th>
                    <th>{{ usesMilestone ? 'Level' : 'XP' }}</th>
                    <th v-if="hasStress || hasSanity">{{ hasStress && hasSanity ? 'Stress / Sanity' : hasStress ? 'Stress' : 'Sanity' }}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in data.users" :key="u.id">
                    <td>
                      <div class="player-name">{{ u.username }}</div>
                      <div v-if="u.character_name" class="player-char">{{ u.character_name }}</div>
                      <div v-if="u.last_seen" class="player-last-seen">seen {{ formatRelative(u.last_seen) }}</div>
                    </td>
                    <td>
                      <span class="tag" :class="u.role === 'gm' ? 'tag-active' : ''">{{ u.role }}</span>
                    </td>
                    <td>
                      <!-- Milestone: level stepper -->
                      <div v-if="usesMilestone && u.role !== 'gm'" class="level-stepper">
                        <button class="btn btn-sm level-btn" @click="adjustLevel(u, -1)" :disabled="u.character_level <= 1">−</button>
                        <span class="level-val">{{ u.character_level ?? 1 }}</span>
                        <button class="btn btn-sm level-btn" @click="adjustLevel(u, 1)" :disabled="u.character_level >= maxLevel">+</button>
                      </div>
                      <!-- XP-based: show total + computed level -->
                      <template v-else-if="!usesMilestone">
                        <span class="xp-total">{{ xpMap[u.id]?.total ?? 0 }}</span>
                        <span v-if="xpMap[u.id]?.level" class="xp-level">Lvl {{ xpMap[u.id].level }}</span>
                      </template>
                      <!-- GM row or milestone GM: just show level -->
                      <span v-else class="xp-level">Lvl {{ u.character_level ?? 1 }}</span>
                    </td>
                    <td v-if="hasStress || hasSanity">
                      <div class="stress-cell">
                        <input v-if="hasStress" v-model.number="stressEdits[u.id].stress" type="number" class="form-input stress-input" placeholder="str" />
                        <input v-if="hasSanity" v-model.number="stressEdits[u.id].sanity" type="number" class="form-input stress-input" placeholder="san" />
                        <button class="btn btn-sm" @click="saveStress(u.id)">Set</button>
                      </div>
                    </td>
                    <td>
                      <div class="action-cell">
                        <a v-if="hasDndBeyond && sheetMap[u.id]?.dnd_beyond_url" :href="sheetMap[u.id].dnd_beyond_url" target="_blank" rel="noopener" class="btn btn-sm" title="Open in D&D Beyond">Beyond</a>
                        <button class="btn btn-sm" @click="msgPlayer(u)">✉</button>
                        <button v-if="u.role !== 'gm'" class="btn btn-sm" @click="resetPassword(u)">Pwd</button>
                        <button v-if="u.role !== 'gm'" class="btn btn-sm btn-danger" @click="deleteUser(u)">Del</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- RIGHT: Award XP (XP systems) or Milestone notes (5e) -->
          <div class="players-xp-col">

            <!-- XP-based systems -->
            <template v-if="usesXP">
              <div class="section-divider">Award XP</div>
              <div class="card xp-card">
                <div class="xp-fields">
                  <div class="field-group">
                    <label>Amount</label>
                    <input v-model.number="xpForm.amount" type="number" min="0" class="form-input" placeholder="100" />
                  </div>
                  <div class="field-group">
                    <label>Reason</label>
                    <input v-model="xpForm.reason" class="form-input" placeholder="Defeated the dragon…" />
                  </div>
                  <div class="field-group">
                    <label>Players</label>
                    <div class="xp-player-list">
                      <label class="xp-player-row xp-player-all">
                        <input type="checkbox" :checked="allPlayersSelected" @change="toggleAllPlayers" />
                        <span>All Players</span>
                      </label>
                      <label v-for="u in players" :key="u.id" class="xp-player-row">
                        <input type="checkbox" :value="u.id" v-model="xpForm.user_ids" />
                        <span>{{ u.username }}</span>
                        <span v-if="u.character_name" class="xp-player-char">{{ u.character_name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button class="btn" @click="awardXp">Award XP</button>
                <div v-if="xpStatus" :class="['status-msg', xpOk ? 'status-ok' : 'status-err']" style="margin-top:8px">{{ xpStatus }}</div>
              </div>
            </template>

            <!-- Milestone levelling (5e) -->
            <template v-else>
              <div class="section-divider">Milestone Levelling</div>
              <div class="card" style="padding:16px">
                <div style="font-size:0.82em;opacity:0.6;margin-bottom:14px;line-height:1.5">
                  Use the +/− buttons in the Players table to adjust individual levels, or level up all players at once below.
                </div>
                <button class="btn" @click="levelUpAll">Level Up All Players</button>
                <div v-if="xpStatus" :class="['status-msg', xpOk ? 'status-ok' : 'status-err']" style="margin-top:8px">{{ xpStatus }}</div>
              </div>
            </template>

          </div>

        </div><!-- /players-xp-cols -->

        <!-- ── 2-column lower dashboard ──────────────────────── -->
        <div class="dash-cols">

          <!-- LEFT: Active Quests -->
          <div class="dash-col">
            <div class="section-divider">Active Quests</div>
            <div class="card-grid" style="margin-top:12px">
              <div v-if="activeQuests.length === 0" style="opacity:0.5;font-size:0.85em;padding:12px 0;grid-column:1/-1">No active quests.</div>
              <QuestCard
                v-for="quest in activeQuests"
                :key="quest.id"
                :quest="quest"
                :expanded="expandedId === quest.id"
                @toggle="toggleExpand(quest.id)"
              />
            </div>
          </div>

          <!-- RIGHT: Agenda + Messages + Quick Actions -->
          <div class="dash-col">

            <!-- Session Agenda -->
            <div class="section-divider">Session Agenda</div>
            <div class="card" style="margin-top:12px">
              <div v-if="agendaCards.length === 0" style="opacity:0.5;font-size:0.85em;padding:4px 0 8px">No agenda items.</div>
              <div v-else class="agenda-list">
                <div v-for="card in agendaCards" :key="card.id" class="agenda-item">
                  <div class="agenda-title">{{ card.title }}</div>
                  <div v-if="card.body" class="agenda-body">{{ card.body }}</div>
                  <div v-else class="agenda-body agenda-empty">—</div>
                </div>
              </div>
              <button class="btn" style="margin-top:12px" @click="ui.openGmEdit('agenda', null, {})">+ Add Agenda Item</button>
            </div>

            <!-- Unread Messages -->
            <div class="section-divider" style="margin-top:24px">Unread Messages</div>
            <div style="margin-top:12px">
              <div v-if="unreadMessages.length === 0" style="opacity:0.5;font-size:0.85em;padding:8px 0">No unread messages.</div>
              <div v-for="msg in unreadMessages" :key="msg.id" class="card" style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;min-width:0">
                  <span style="font-size:0.85em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ msg.from_character || msg.from_username }}</span>
                  <span style="font-size:0.75em;opacity:0.5;flex-shrink:0">{{ formatTime(msg.created_at) }}</span>
                </div>
                <div style="font-size:0.82em;font-weight:600;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ msg.subject }}</div>
                <div style="font-size:0.82em;opacity:0.75;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ msg.body }}</div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="section-divider" style="margin-top:24px">Quick Actions</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
              <button class="btn" @click="ui.openGmEdit('quest', null, {})">+ Quest</button>
              <button class="btn" @click="ui.openGmEdit('npc', null, {})">+ NPC</button>
              <button class="btn" @click="ui.openGmEdit('location', null, {})">+ Location</button>
              <button class="btn" @click="ui.openGmEdit('hook', null, {})">+ Hook</button>
              <button class="btn" @click="ui.openGmEdit('handout', null, {})">+ Handout</button>
              <button class="btn" @click="ui.openGmEdit('session', null, {})">+ Session</button>
              <router-link to="/combat" class="btn">⚔ Combat Tracker</router-link>
              <button class="btn" @click="downloadBackup">&#8659; Backup</button>
            </div>
          </div>

        </div><!-- /dash-cols -->
      </template>

      <!-- ══════════════════════════════════════════════════════
           TAB: SETTINGS
      ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'settings'">
        <div class="card" style="margin-top:4px">
          <div class="camp-form-grid">
            <div class="field-group">
              <label>Name</label>
              <input v-model="campForm.name" class="form-input" />
            </div>
            <div class="field-group">
              <label>System</label>
              <select v-model="campForm.system" class="form-input">
                <option value="dnd5e">D&amp;D 5e</option>
                <option value="coc">Call of Cthulhu</option>
                <option value="alien">Alien RPG</option>
                <option value="coriolis">Coriolis</option>
                <option value="dune">Dune</option>
                <option value="achtung">Achtung! Cthulhu</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="field-group">
              <label>Subtitle</label>
              <input v-model="campForm.subtitle" class="form-input" placeholder="Optional tagline…" />
            </div>
            <div class="field-group">
              <label>Playlist URL</label>
              <input v-model="campForm.playlist_url" class="form-input" placeholder="Spotify / YouTube URL" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Description</label>
              <textarea v-model="campForm.description" class="form-input" style="min-height:80px;resize:vertical"></textarea>
            </div>
            <!-- Background image row -->
            <div class="field-group" style="grid-column:1/-1">
              <label>Background Image</label>
              <Dropzone
                variant="banner"
                accept="image/*"
                :value="campForm.bg_image || null"
                :on-change="uploadBgImage"
                :on-remove="() => campForm.bg_image = ''"
                hint="PNG, JPG — or paste a URL below"
              />
              <input v-model="campForm.bg_image" class="form-input" placeholder="Or paste image URL…" style="margin-top:8px" />
            </div>
            <!-- Invite code row -->
            <div class="field-group" style="grid-column:1/-1">
              <label>Invite Code</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input v-model="campForm.invite_code" class="form-input" placeholder="AUTO-GENERATED" style="font-family:'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;flex:1" maxlength="12" />
                <button class="btn btn-sm" @click="regenInviteCode" style="flex-shrink:0">Regenerate</button>
                <button class="btn btn-sm" @click="copyInviteCode" style="flex-shrink:0">Copy</button>
              </div>
              <div style="font-size:0.78em;opacity:0.5;margin-top:4px">Share this code with players so they can join from the home screen.</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;align-items:center">
            <button class="btn" @click="saveCampaign" :disabled="campSaving">
              {{ campSaving ? 'Saving…' : 'Save Changes' }}
            </button>
            <span v-if="campStatus" :class="['status-msg', campOk ? 'status-ok' : 'status-err']" style="margin:0">{{ campStatus }}</span>
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════
           TAB: STATS
      ══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'stats'">
        <div v-if="!campaignStats" style="opacity:0.5;padding:24px 0;text-align:center">Loading stats…</div>
        <template v-else>
          <!-- Top stat pills -->
          <div class="stats-strip" style="margin-top:4px">
            <div class="stat-pill"><span class="stat-pill-num">{{ campaignStats.session_count }}</span><span class="stat-pill-label">Sessions</span></div>
            <div class="stat-pill"><span class="stat-pill-num">{{ campaignStats.player_count }}</span><span class="stat-pill-label">Players</span></div>
            <div class="stat-pill"><span class="stat-pill-num">{{ campaignStats.quest_count }}</span><span class="stat-pill-label">Quests</span></div>
            <div class="stat-pill stat-pill-accent"><span class="stat-pill-num">{{ campaignStats.active_quest_count }}</span><span class="stat-pill-label">Active Quests</span></div>
            <div class="stat-pill"><span class="stat-pill-num">{{ campaignStats.handout_count }}</span><span class="stat-pill-label">Handouts</span></div>
            <div class="stat-pill"><span class="stat-pill-num">{{ campaignStats.message_count }}</span><span class="stat-pill-label">Messages</span></div>
            <div class="stat-pill stat-pill-accent"><span class="stat-pill-num">{{ campaignStats.xp_total.toLocaleString() }}</span><span class="stat-pill-label">Total XP Awarded</span></div>
          </div>

          <!-- Per-player XP breakdown -->
          <div class="section-divider" style="margin-top:28px">Player Progression</div>
          <div class="stats-player-grid" style="margin-top:12px">
            <div v-if="!Object.keys(xpMap).length" style="opacity:0.5;font-size:0.85em">No XP awarded yet.</div>
            <div v-for="u in data.users.filter(u => u.role !== 'gm')" :key="u.id" class="stats-player-card">
              <div class="stats-player-name">{{ u.character_name || u.username }}</div>
              <div v-if="u.character_name" class="stats-player-user">{{ u.username }}</div>
              <div class="stats-player-row">
                <span class="stats-player-xp">{{ (xpMap[u.id]?.total ?? 0).toLocaleString() }} XP</span>
                <span class="stats-player-level" v-if="xpMap[u.id]?.level">Lvl {{ xpMap[u.id].level }}</span>
              </div>
              <div class="stats-xp-bar-wrap">
                <div class="stats-xp-bar" :style="xpBarStyle(u.id)"></div>
              </div>
              <div v-if="u.last_seen" class="stats-player-seen">Last seen {{ formatRelative(u.last_seen) }}</div>
            </div>
          </div>

          <!-- Audit log -->
          <div class="section-divider" style="margin-top:28px">Recent Activity</div>
          <div style="margin-top:12px">
            <div v-if="!auditLog.length" style="opacity:0.5;font-size:0.85em">No activity recorded.</div>
            <div v-for="entry in auditLog" :key="entry.id" class="audit-row">
              <span class="audit-user">{{ entry.username || 'System' }}</span>
              <span class="audit-action">{{ entry.action }}</span>
              <span v-if="entry.detail" class="audit-detail">{{ entry.detail }}</span>
              <span class="audit-time">{{ formatTime(entry.created_at) }}</span>
            </div>
          </div>
        </template>
      </template>

    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useSystemFeatures } from '@/composables/useSystemFeatures'
import QuestCard from '@/components/QuestCard.vue'
import Dropzone from '@/components/Dropzone.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const { hasStress, hasSanity, usesXP, usesMilestone, hasDndBeyond, maxLevel } = useSystemFeatures()

const expandedId = ref(null)
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

const activeTab = ref('overview')

const loading = ref(false)
const agendaCards = ref([])
const unreadMessages = ref([])
const stressMap = ref({})
const stressEdits = reactive({})
const xpMap = ref({})
const auditLog = ref([])

const campForm = ref({ name: '', subtitle: '', system: '', description: '', playlist_url: '', bg_image: '', invite_code: '' })
const campSaving = ref(false)
const campStatus = ref('')
const campOk = ref(false)
const campaignStats = ref(null)
const sheetMap = ref({}) // userId → { dnd_beyond_url, ... }

const xpForm = ref({ amount: 0, reason: '', user_ids: [] })
const xpStatus = ref('')
const xpOk = ref(false)

const players = computed(() => data.users.filter(u => u.role !== 'gm'))
const activeQuests = computed(() => data.quests.filter(q => q.status?.toLowerCase() === 'active'))

const allPlayersSelected = computed(() =>
  players.value.length > 0 && players.value.every(u => xpForm.value.user_ids.includes(u.id))
)
function toggleAllPlayers(e) {
  xpForm.value.user_ids = e.target.checked ? players.value.map(u => u.id) : []
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}

function formatRelative(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

async function saveCampaign() {
  const id = campaign.activeCampaign?.id
  if (!id) return
  campSaving.value = true
  campStatus.value = ''
  try {
    const r = await data.apif(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: campForm.value.name,
        subtitle: campForm.value.subtitle || null,
        system: campForm.value.system,
        description: campForm.value.description,
        playlist_url: campForm.value.playlist_url || null,
        bg_image: campForm.value.bg_image || null,
        invite_code: campForm.value.invite_code?.toUpperCase() || null,
      }),
    })
    if (r.ok) {
      campStatus.value = 'Saved.'
      campOk.value = true
      await campaign.loadCampaigns()
      campaign.applyBgImage(campForm.value.bg_image || null)
    } else {
      campStatus.value = 'Save failed.'
      campOk.value = false
    }
  } finally {
    campSaving.value = false
  }
}

async function uploadBgImage(file) {
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('chronicle_token')
  const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  if (r.ok) {
    campForm.value.bg_image = (await r.json()).url
    ui.showToast('Image uploaded', '', '✓')
  } else {
    ui.showToast('Upload failed', '', '✕')
  }
}

function regenInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  campForm.value.invite_code = code
}

function copyInviteCode() {
  if (!campForm.value.invite_code) return
  navigator.clipboard.writeText(campForm.value.invite_code).then(
    () => ui.showToast('Invite code copied!', '', '✓'),
    () => ui.showToast('Copy failed', '', '✕'),
  )
}

async function saveStress(userId) {
  const edits = stressEdits[userId] || {}
  const body = {}
  if (edits.stress != null && edits.stress !== '') body.stress = Number(edits.stress)
  if (edits.sanity != null && edits.sanity !== '') body.sanity = Number(edits.sanity)
  if (!Object.keys(body).length) return
  const r = await data.apif(`/api/stress/${userId}`, { method: 'PUT', body: JSON.stringify(body) })
  if (r.ok) ui.showToast('Stress updated', '', '✓')
  else ui.showToast('Update failed', '', '✕')
}

async function awardXp() {
  xpStatus.value = ''
  if (!xpForm.value.amount || !xpForm.value.user_ids.length) {
    xpStatus.value = 'Amount and at least one player required.'
    xpOk.value = false
    return
  }
  const r = await data.apif('/api/xp', {
    method: 'POST',
    body: JSON.stringify({ user_ids: xpForm.value.user_ids, amount: xpForm.value.amount, reason: xpForm.value.reason }),
  })
  if (r.ok) {
    xpStatus.value = `Awarded ${xpForm.value.amount} XP.`
    xpOk.value = true
    xpForm.value = { amount: 0, reason: '', user_ids: [] }
    await loadXp()
  } else {
    xpStatus.value = 'Award failed.'
    xpOk.value = false
  }
}

function msgPlayer(u) {
  ui.openGmEdit('message', null, { to_user_id: u.id, to_username: u.username })
}

async function resetPassword(u) {
  const newPwd = await ui.prompt(`New password for ${u.username}:`)
  if (!newPwd) return
  const r = await data.apif(`/api/users/${u.id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPwd }),
  })
  if (r.ok) ui.showToast('Password reset', '', '✓')
  else ui.showToast('Reset failed', '', '✕')
}

async function deleteUser(u) {
  if (!await ui.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
  const r = await data.apif(`/api/users/${u.id}`, { method: 'DELETE' })
  if (r.ok) {
    ui.showToast('User deleted', '', '✓')
    await data.loadUsers()
  } else {
    ui.showToast('Delete failed', '', '✕')
  }
}

async function downloadBackup() {
  const token = localStorage.getItem('chronicle_token')
  try {
    const r = await fetch('/api/backup', { headers: { Authorization: `Bearer ${token}` } })
    if (!r.ok) { ui.showToast('Backup failed', '', '✕'); return }
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chronicle-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ui.showToast('Backup failed', '', '✕')
  }
}

async function loadXp() {
  try {
    const r = await data.apif('/api/xp')
    const d = await r.json()
    const map = {}
    ;(d.totals || d.xp || []).forEach(x => { map[x.user_id] = x })
    xpMap.value = map
  } catch (_) {}
}

// XP level thresholds (matching server-side logic)
const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

function xpBarStyle(userId) {
  const total = xpMap.value[userId]?.total ?? 0
  const level = xpMap.value[userId]?.level ?? 1
  const idx = Math.min(level - 1, XP_THRESHOLDS.length - 1)
  const nextIdx = Math.min(level, XP_THRESHOLDS.length - 1)
  const base = XP_THRESHOLDS[idx] ?? 0
  const next = XP_THRESHOLDS[nextIdx] ?? base + 1
  const pct = next === base ? 100 : Math.min(100, Math.round(((total - base) / (next - base)) * 100))
  return `width:${pct}%`
}

async function loadAuditLog() {
  try {
    const r = await data.apif('/api/users/audit')
    if (r.ok) auditLog.value = (await r.json()).logs || []
  } catch (_) {}
}

async function loadSheets() {
  try {
    const r = await data.apif('/api/character-sheets')
    if (r.ok) {
      const d = await r.json()
      const map = {}
      ;(d.sheets || []).forEach(s => { map[s.user_id] = s })
      sheetMap.value = map
    }
  } catch (_) {}
}

async function adjustLevel(user, delta) {
  const current = user.character_level ?? 1
  const next = Math.max(1, Math.min(maxLevel.value, current + delta))
  if (next === current) return
  const r = await data.apif(`/api/users/${user.id}/level`, {
    method: 'PUT',
    body: JSON.stringify({ level: next }),
  })
  if (r.ok) {
    user.character_level = next
    ui.showToast(`${user.username} → Level ${next}`, '', '✓')
  } else {
    ui.showToast('Level update failed', '', '✕')
  }
}

async function levelUpAll() {
  xpStatus.value = ''
  const targets = players.value.filter(u => (u.character_level ?? 1) < maxLevel.value)
  if (!targets.length) { xpStatus.value = 'All players are at max level.'; xpOk.value = false; return }
  await Promise.all(targets.map(u => adjustLevel(u, 1)))
  xpStatus.value = `Levelled up ${targets.length} player${targets.length !== 1 ? 's' : ''}.`
  xpOk.value = true
}

async function loadStats() {
  const id = campaign.activeCampaign?.id
  if (!id) return
  try {
    const r = await data.apif(`/api/campaigns/${id}/stats`)
    if (r.ok) campaignStats.value = (await r.json()).stats
  } catch (_) {}
}

async function loadDash() {
  loading.value = true
  try {
    const [rA, rM, rSt] = await Promise.all([
      data.apif('/api/agenda'),
      data.apif('/api/messages?unread=true'),
      data.apif('/api/stress'),
    ])
    agendaCards.value = (await rA.json()).agenda || []
    unreadMessages.value = (await rM.json()).messages || []
    const stressRows = (await rSt.json()).stress || []
    const smap = {}
    stressRows.forEach(s => { smap[s.user_id] = s })
    stressMap.value = smap
    stressRows.forEach(s => { stressEdits[s.user_id] = { stress: s.stress ?? '', sanity: s.sanity ?? '' } })
    data.users.forEach(u => { if (!stressEdits[u.id]) stressEdits[u.id] = { stress: '', sanity: '' } })
  } catch (e) {
    console.error('[GmDashboard]', e)
  } finally {
    loading.value = false
  }
}

async function initForCampaign() {
  const ac = campaign.activeCampaign
  if (ac) {
    campForm.value = {
      name: ac.name || '',
      subtitle: ac.subtitle || '',
      system: ac.system || 'dnd5e',
      description: ac.description || '',
      playlist_url: ac.playlist_url || '',
      bg_image: ac.bg_image || '',
      invite_code: ac.invite_code || '',
    }
  }
  await Promise.all([
    data.loadUsers(),
    data.loadQuests(),
    loadXp(),
    loadDash(),
    loadStats(),
    loadAuditLog(),
    loadSheets(),
  ])
  data.users.forEach(u => { if (!stressEdits[u.id]) stressEdits[u.id] = { stress: '', sanity: '' } })
}

onMounted(initForCampaign)

watch(() => campaign.activeCampaign?.id, (newId, oldId) => {
  if (newId && newId !== oldId) initForCampaign()
})
</script>

<style scoped>
.player-last-seen { font-size: 0.72em; opacity: 0.45; margin-top: 2px; }

/* Milestone level stepper */
.level-stepper { display: flex; align-items: center; gap: 4px; }
.level-val { font-weight: 700; font-size: 1em; color: var(--accent); min-width: 22px; text-align: center; }
.level-btn { padding: 2px 7px; font-size: 1em; line-height: 1.2; }

.stats-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 4px;
}
.stat-pill {
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.stat-pill-num { font-size: 1.4em; font-weight: 700; line-height: 1; }
.stat-pill-label { font-size: 0.72em; opacity: 0.55; margin-top: 3px; text-align: center; }

.bg-preview {
  width: 100%;
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  margin-top: 8px;
  border: 1px solid var(--border);
}

/* Campaign settings: 2-col form */
.camp-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Players + XP side-by-side */
.players-xp-cols {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
  align-items: start;
  margin-top: 12px;
  margin-bottom: 24px;
}
.players-table-wrap { overflow-x: auto; }

/* Players table */
.players-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
}
.players-table thead tr {
  color: var(--text3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7em;
  letter-spacing: .05em;
}
.players-table th {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}
.players-table td {
  padding: 8px;
  border-bottom: 1px solid var(--border);
}
.player-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.player-char { font-size: 0.8em; opacity: 0.55; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.xp-total { color: var(--accent); font-weight: 600; }
.xp-level { font-size: 0.75em; opacity: 0.55; margin-left: 4px; }
.stress-cell { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.stress-input { width: 55px; padding: 2px 4px; font-size: 12px; }
.action-cell { display: flex; gap: 4px; flex-wrap: wrap; }

/* Award XP card */
.xp-card { display: flex; flex-direction: column; gap: 0; }
.xp-fields { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.xp-player-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 8px;
  background: var(--bg);
}
.xp-player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  cursor: pointer;
  font-size: 0.88em;
  border-radius: 3px;
  user-select: none;
  min-width: 0;
}
.xp-player-row input[type="checkbox"] {
  width: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
}
.xp-player-row:hover { background: var(--surface); }
.xp-player-all {
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
  margin-bottom: 2px;
}
.xp-player-char { opacity: 0.5; font-size: 0.85em; margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 50%; }

/* 2-column lower dashboard */
.dash-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
  margin-bottom: 32px;
}

/* Agenda: 2-col title + description per item */
.agenda-list {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0;
}
.agenda-item {
  display: contents;
}
.agenda-title {
  font-weight: 600;
  font-size: 0.88em;
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--border);
}
.agenda-body {
  font-size: 0.82em;
  opacity: 0.7;
  line-height: 1.5;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.agenda-empty {
  opacity: 0.3;
}

/* Stats tab: accent pill variant */
.stat-pill-accent {
  border-color: var(--accent);
}
.stat-pill-accent .stat-pill-num {
  color: var(--accent);
}

/* Stats tab: player progression grid */
.stats-player-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.stats-player-card {
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
}
.stats-player-name {
  font-weight: 700;
  font-size: 0.95em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stats-player-user {
  font-size: 0.78em;
  opacity: 0.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.stats-player-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 6px 0 4px;
}
.stats-player-xp {
  color: var(--accent);
  font-weight: 700;
  font-size: 0.9em;
}
.stats-player-level {
  font-size: 0.78em;
  opacity: 0.55;
}
.stats-xp-bar-wrap {
  background: var(--border);
  border-radius: 99px;
  height: 5px;
  overflow: hidden;
  margin-bottom: 6px;
}
.stats-xp-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.4s ease;
  min-width: 2px;
}
.stats-player-seen {
  font-size: 0.72em;
  opacity: 0.45;
}

/* Audit log */
.audit-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.83em;
  flex-wrap: wrap;
}
.audit-user {
  font-weight: 600;
  color: var(--accent);
  min-width: 80px;
  flex-shrink: 0;
}
.audit-action {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  opacity: 0.85;
}
.audit-detail {
  opacity: 0.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.audit-time {
  opacity: 0.38;
  font-size: 0.88em;
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .players-xp-cols { grid-template-columns: 1fr; }
  .dash-cols { grid-template-columns: 1fr; }
  .camp-form-grid { grid-template-columns: 1fr; }
  .agenda-list { grid-template-columns: 1fr; }
  .agenda-title { border-bottom: none; padding-bottom: 2px; }
  .agenda-body { padding-top: 0; }
  .stats-player-grid { grid-template-columns: 1fr 1fr; }
}
</style>
