<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Sessions</div><div class="page-sub">Campaign history &amp; scheduling</div></div>

    <!-- Sessions list -->
    <div id="session-list">
      <div v-if="!data.sessions.length" class="empty-state">No sessions recorded.</div>
      <div v-for="s in data.sessions" :key="s.id" class="session-item">
        <div class="session-header" @click="toggleSession(s.id)">
          <div>
            <div class="session-num">SESSION {{ s.number || '?' }}</div>
            <div class="session-title-text">{{ s.title }}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="session-date">{{ fmt(s.played_at) }}</div>
            <template v-if="campaign.isGm">
              <button class="btn btn-sm" @click.stop="ui.openGmEdit('session', s.id, s)">Edit</button>
              <button class="btn btn-sm btn-danger" @click.stop="deleteSession(s.id)">Del</button>
            </template>
          </div>
        </div>
        <div class="session-body" :class="{ open: openSessions.has(s.id) }">
          <div v-if="s.summary" class="session-summary">{{ s.summary }}</div>
          <div v-else style="color:var(--text3);font-size:12px">No summary recorded.</div>

          <!-- Player notes -->
          <template v-if="s.notes && s.notes.length">
            <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin:10px 0 6px">PLAYER NOTES</div>
            <div v-for="n in s.notes" :key="n.id" class="session-note">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div><b>{{ n.character_name || 'Anon' }}</b>: {{ n.body }}</div>
                <div v-if="canEditNote(n)" style="display:flex;gap:4px;flex-shrink:0">
                  <button class="btn btn-sm" @click="startEditNote(s.id, n)">Edit</button>
                  <button class="btn btn-sm btn-danger" @click="deleteSessionNote(s.id, n.id)">Del</button>
                </div>
              </div>
              <div v-if="editingNote?.noteId === n.id" style="margin-top:6px">
                <textarea v-model="editingNote.body" class="form-input" rows="2" style="margin-bottom:4px"></textarea>
                <button class="btn btn-sm" @click="saveNoteEdit(s.id)">Save</button>
                <button class="btn btn-sm" @click="editingNote = null" style="margin-left:4px">Cancel</button>
              </div>
            </div>
          </template>

          <!-- Add note -->
          <div style="font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin:10px 0 6px">ADD NOTE</div>
          <div style="display:flex;gap:8px;align-items:flex-start">
            <textarea v-model="newNotes[s.id]" style="flex:1;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:7px;border-radius:4px;font-size:12px;font-family:'Crimson Pro',serif;resize:vertical;min-height:60px" placeholder="Your note..."></textarea>
            <button class="submit-btn" @click="addSessionNote(s.id)">SAVE</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Polls -->
    <div class="section-divider" style="margin-top:24px">Polls</div>
    <div v-if="campaign.isGm" style="margin-bottom:10px">
      <button class="btn btn-primary btn-sm" @click="ui.openGmEdit('poll', null, null)">+ Create Poll</button>
    </div>
    <div v-if="!data.polls.length" class="empty-state" style="padding:16px">No polls.</div>
    <div v-for="p in data.polls" :key="p.id" class="poll-card">
      <div class="poll-q">{{ p.question }}<span v-if="p.closed" class="tag" style="font-size:9px;margin-left:6px">closed</span></div>
      <div>
        <div
          v-for="(opt, i) in (Array.isArray(p.options) ? p.options : [])"
          :key="i"
          class="poll-option"
          :class="{ voted: p.my_vote === i }"
          @click="!p.closed && votePoll(p.id, i)"
        >
          <span style="font-size:15px">{{ p.my_vote === i ? '●' : '○' }}</span> {{ opt }}
          <template v-if="(p.results_public || campaign.isGm) && p.votes">
            <span class="inline-label" style="margin-left:auto">
              {{ p.votes.filter(v => v.option_index === i).length }}v
            </span>
          </template>
        </div>
      </div>
      <div v-if="campaign.isGm" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button v-if="!p.results_public" class="btn btn-sm" @click="revealPoll(p.id)">Reveal Results</button>
        <button v-if="!p.closed" class="btn btn-sm" @click="closePoll(p.id)">Close Poll</button>
      </div>
    </div>

    <!-- Scheduling -->
    <div class="section-divider" style="margin-top:24px">Scheduling</div>
    <div v-if="campaign.isGm" style="margin-bottom:10px">
      <button class="btn btn-primary btn-sm" @click="ui.openGmEdit('schedule', null, null)">+ Propose Date</button>
    </div>
    <div v-if="!data.scheduling.length" class="empty-state" style="padding:16px">No proposed dates.</div>
    <div v-for="d in data.scheduling" :key="d.id" class="sched-item">
      <div class="sched-date">
        {{ formatSchedDate(d.proposed_date) }}{{ d.title ? ` — ${d.title}` : '' }}
        <span v-if="d.confirmed" class="tag tag-quest-active" style="margin-left:8px;font-size:9px">CONFIRMED</span>
      </div>
      <div class="sched-responses">
        <span
          v-for="r in (d.responses || [])"
          :key="r.user_id"
          class="sched-resp"
          :class="`sched-${r.availability}`"
        >{{ r.character_name || r.username }}: {{ r.availability }}</span>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">
        <button
          v-for="opt in ['yes','maybe','no']"
          :key="opt"
          class="filter-tab"
          :class="{ active: d.my_response === opt }"
          style="padding:3px 8px;font-size:10px"
          @click="respondSched(d.id, opt)"
        >{{ opt }}</button>
        <button
          v-if="campaign.isGm && !d.confirmed"
          class="btn btn-sm btn-primary"
          style="margin-left:auto"
          @click="confirmSched(d.id)"
        >Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()

const openSessions = ref(new Set())
const newNotes = reactive({})
const editingNote = ref(null)

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatSchedDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toggleSession(id) {
  if (openSessions.value.has(id)) openSessions.value.delete(id)
  else openSessions.value.add(id)
}

function canEditNote(n) {
  return campaign.isGm || n.player_id === auth.currentUser?.id
}

async function addSessionNote(sessionId) {
  const body = newNotes[sessionId]?.trim()
  if (!body) return
  const r = await data.apif(`/api/sessions/${sessionId}/notes`, { method: 'POST', body: JSON.stringify({ body }) })
  if (r.ok) { newNotes[sessionId] = ''; await data.loadSessions(); ui.showToast('Note saved', '', '✓') }
  else ui.showToast('Failed', '', '✕')
}

function startEditNote(sessionId, n) {
  editingNote.value = { sessionId, noteId: n.id, body: n.body }
}

async function saveNoteEdit(sessionId) {
  if (!editingNote.value) return
  const { noteId, body } = editingNote.value
  const r = await data.apif(`/api/sessions/${sessionId}/notes/${noteId}`, { method: 'PUT', body: JSON.stringify({ body }) })
  if (r.ok) { editingNote.value = null; await data.loadSessions(); ui.showToast('Note updated', '', '✓') }
  else ui.showToast('Update failed', '', '✕')
}

async function deleteSessionNote(sessionId, noteId) {
  if (!confirm('Delete this note?')) return
  const r = await data.apif(`/api/sessions/${sessionId}/notes/${noteId}`, { method: 'DELETE' })
  if (r.ok) { await data.loadSessions(); ui.showToast('Note deleted', '', '✓') }
}

async function deleteSession(id) {
  if (!confirm('Delete this session?')) return
  await data.deleteItem('session', id)
  await data.loadSessions()
}

async function votePoll(id, idx) {
  const r = await data.apif(`/api/sessions/polls/${id}/vote`, { method: 'POST', body: JSON.stringify({ option_index: idx }) })
  if (r.ok) await data.loadSessions()
}

async function revealPoll(id) {
  const r = await data.apif(`/api/sessions/polls/${id}/reveal`, { method: 'PUT' })
  if (r.ok) await data.loadSessions()
}

async function closePoll(id) {
  const r = await data.apif(`/api/sessions/polls/${id}/close`, { method: 'PUT' })
  if (r.ok) await data.loadSessions()
}

async function respondSched(id, availability) {
  const r = await data.apif(`/api/sessions/scheduling/${id}/respond`, { method: 'POST', body: JSON.stringify({ availability }) })
  if (r.ok) await data.loadSessions()
}

async function confirmSched(id) {
  const r = await data.apif(`/api/sessions/scheduling/${id}/confirm`, { method: 'PUT' })
  if (r.ok) await data.loadSessions()
}

onMounted(async () => {
  await data.loadSessions()
})
</script>
