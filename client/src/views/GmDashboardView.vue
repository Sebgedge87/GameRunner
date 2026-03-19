<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">GM Dashboard</div>
      <div class="page-sub">Campaign management &amp; overview</div>
    </div>

    <div v-if="loading" class="loading">Loading dashboard…</div>

    <template v-else>
      <!-- ── Campaign Controls ─────────────────────────────── -->
      <div class="section-divider">Campaign Settings</div>
      <div class="card" style="margin-top:12px;margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
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
          <div class="field-group" style="grid-column:1/-1">
            <label>Description</label>
            <textarea v-model="campForm.description" class="form-input" style="min-height:60px;resize:vertical"></textarea>
          </div>
          <div class="field-group">
            <label>Playlist URL</label>
            <input v-model="campForm.playlist_url" class="form-input" placeholder="Spotify / YouTube URL" />
          </div>
          <div class="field-group">
            <label>Background Image URL</label>
            <input v-model="campForm.bg_image" class="form-input" placeholder="https://…" />
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;align-items:center">
          <button class="btn" @click="saveCampaign" :disabled="campSaving">
            {{ campSaving ? 'Saving…' : 'Save Changes' }}
          </button>
          <span v-if="campStatus" :class="['status-msg', campOk ? 'status-ok' : 'status-err']" style="margin:0">{{ campStatus }}</span>
        </div>
      </div>

      <!-- ── Players ───────────────────────────────────────── -->
      <div class="section-divider">Players</div>
      <div style="margin-top:12px;margin-bottom:8px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.85em">
          <thead>
            <tr style="color:var(--text3);font-family:'JetBrains Mono',monospace;font-size:0.7em;letter-spacing:.05em">
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">PLAYER</th>
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">ROLE</th>
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">XP</th>
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">STRESS / SANITY</th>
              <th style="text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in data.users" :key="u.id" style="border-bottom:1px solid var(--border)">
              <td style="padding:8px">
                <div style="font-weight:600">{{ u.username }}</div>
                <div v-if="u.character_name" style="font-size:0.8em;opacity:0.55">{{ u.character_name }}</div>
              </td>
              <td style="padding:8px">
                <span class="tag" :class="u.role === 'gm' ? 'tag-active' : ''">{{ u.role }}</span>
              </td>
              <td style="padding:8px">
                <span style="color:var(--accent);font-weight:600">{{ xpMap[u.id]?.total ?? 0 }}</span>
                <span v-if="xpMap[u.id]?.level" style="font-size:0.75em;opacity:0.55;margin-left:4px">Lvl {{ xpMap[u.id].level }}</span>
              </td>
              <td style="padding:8px">
                <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                  <input
                    v-model.number="stressEdits[u.id].stress"
                    type="number"
                    class="form-input"
                    style="width:55px;padding:2px 4px;font-size:12px"
                    placeholder="str"
                  />
                  <input
                    v-model.number="stressEdits[u.id].sanity"
                    type="number"
                    class="form-input"
                    style="width:55px;padding:2px 4px;font-size:12px"
                    placeholder="san"
                  />
                  <button class="btn btn-sm" @click="saveStress(u.id)">Set</button>
                </div>
              </td>
              <td style="padding:8px">
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <button class="btn btn-sm" @click="msgPlayer(u)">✉</button>
                  <button v-if="u.role !== 'gm'" class="btn btn-sm" @click="resetPassword(u)">Pwd</button>
                  <button v-if="u.role !== 'gm'" class="btn btn-sm btn-danger" @click="deleteUser(u)">Del</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- XP Award -->
      <div class="card" style="margin-top:12px;margin-bottom:24px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px">AWARD XP</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">
          <div class="field-group" style="margin:0;flex:1;min-width:120px">
            <label>Amount</label>
            <input v-model.number="xpForm.amount" type="number" min="0" class="form-input" placeholder="100" />
          </div>
          <div class="field-group" style="margin:0;flex:2;min-width:180px">
            <label>Reason</label>
            <input v-model="xpForm.reason" class="form-input" placeholder="Defeated the dragon…" />
          </div>
          <div class="field-group" style="margin:0">
            <label>Players</label>
            <select v-model="xpForm.user_ids" multiple class="form-input" style="min-height:80px">
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <button class="btn" @click="awardXp" style="margin-bottom:1px">Award XP</button>
        </div>
        <div v-if="xpStatus" :class="['status-msg', xpOk ? 'status-ok' : 'status-err']" style="margin-top:8px">{{ xpStatus }}</div>
      </div>

      <!-- ── Active Quests ─────────────────────────────────── -->
      <div class="section-divider">Active Quests</div>
      <div class="card-grid" style="margin-top:12px;margin-bottom:24px">
        <div v-if="activeQuests.length === 0" style="opacity:0.5;font-size:0.85em;padding:12px 0">No active quests.</div>
        <QuestCard
          v-for="quest in activeQuests"
          :key="quest.id"
          :quest="quest"
          :expanded="expandedId === quest.id"
          @toggle="toggleExpand(quest.id)"
        />
      </div>

      <!-- ── Agenda ────────────────────────────────────────── -->
      <div class="section-divider">Session Agenda</div>
      <div class="card" style="margin-top:12px;margin-bottom:24px">
        <div v-if="agendaCards.length === 0" style="opacity:0.5;font-size:0.85em">No agenda items.</div>
        <div v-for="card in agendaCards" :key="card.id" style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="font-weight:600;font-size:0.9em">{{ card.title }}</div>
          <div v-if="card.body" style="font-size:0.82em;opacity:0.7;margin-top:4px;line-height:1.5">{{ card.body }}</div>
        </div>
        <button class="btn" style="margin-top:12px" @click="ui.openGmEdit('agenda', null, {})">+ Add Agenda Item</button>
      </div>

      <!-- ── Unread Messages ───────────────────────────────── -->
      <div class="section-divider">Unread Messages</div>
      <div style="margin-top:12px;margin-bottom:24px">
        <div v-if="unreadMessages.length === 0" style="opacity:0.5;font-size:0.85em;padding:8px 0">No unread messages.</div>
        <div v-for="msg in unreadMessages" :key="msg.id" class="card" style="margin-bottom:8px">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:0.85em;font-weight:600">{{ msg.sender_name || msg.from_username }}</span>
              <span style="font-size:0.75em;opacity:0.5">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div style="font-size:0.82em;opacity:0.75;margin-top:4px">{{ msg.body }}</div>
          </div>
        </div>
      </div>

      <!-- ── Quick Actions + Backup ────────────────────────── -->
      <div class="section-divider">Quick Actions</div>
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
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import QuestCard from '@/components/QuestCard.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const expandedId = ref(null)
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

const loading = ref(false)
const agendaCards = ref([])
const unreadMessages = ref([])
const stressMap = ref({})
const stressEdits = reactive({})
const xpMap = ref({})

// Campaign form
const campForm = ref({ name: '', subtitle: '', system: '', description: '', playlist_url: '', bg_image: '' })
const campSaving = ref(false)
const campStatus = ref('')
const campOk = ref(false)

// XP form
const xpForm = ref({ amount: 0, reason: '', user_ids: [] })
const xpStatus = ref('')
const xpOk = ref(false)

const players = computed(() => data.users.filter(u => u.role !== 'gm'))
const activeQuests = computed(() => data.quests.filter(q => q.status?.toLowerCase() === 'active'))

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
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
      }),
    })
    if (r.ok) {
      campStatus.value = 'Saved.'
      campOk.value = true
      await campaign.loadCampaigns()
    } else {
      campStatus.value = 'Save failed.'
      campOk.value = false
    }
  } finally {
    campSaving.value = false
  }
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
    ;(d.xp || []).forEach(x => { map[x.user_id] = x })
    xpMap.value = map
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
    // Populate editable stress values
    stressRows.forEach(s => { stressEdits[s.user_id] = { stress: s.stress ?? '', sanity: s.sanity ?? '' } })
    // Ensure every user has an entry
    data.users.forEach(u => { if (!stressEdits[u.id]) stressEdits[u.id] = { stress: '', sanity: '' } })
  } catch (e) {
    console.error('[GmDashboard]', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const ac = campaign.activeCampaign
  if (ac) {
    campForm.value = {
      name: ac.name || '',
      subtitle: ac.subtitle || '',
      system: ac.system || 'dnd5e',
      description: ac.description || '',
      playlist_url: ac.playlist_url || '',
      bg_image: ac.bg_image || '',
    }
  }
  await Promise.all([
    data.users.length ? null : data.loadUsers(),
    data.quests.length ? null : data.loadQuests(),
    loadXp(),
    loadDash(),
  ])
  // Ensure stressEdits has entries for all users
  data.users.forEach(u => { if (!stressEdits[u.id]) stressEdits[u.id] = { stress: '', sanity: '' } })
})
</script>
