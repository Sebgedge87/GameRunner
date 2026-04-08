<template>
  <div id="msgs-overlay" :class="{ open: ui.activeFlyout === 'msgs' }" @click="ui.closeFlyout()"></div>
  <div id="msgs-flyout" class="flyout" :class="{ open: ui.activeFlyout === 'msgs' }">
    <div class="flyout-header">
      <button v-if="activeThread" class="flyout-back" @click="activeThread = null">← Back</button>
      <div class="flyout-title">{{ activeThread ? activeThread[0].subject : 'Messages' }}</div>
      <button class="flyout-close" @click="ui.closeFlyout()">✕</button>
    </div>

    <div class="flyout-body">

      <!-- ── Thread detail view ──────────────────────────────────────────── -->
      <template v-if="activeThread">
        <div class="thread-messages">
          <div
            v-for="m in activeThread" :key="m.id"
            class="thread-msg"
            :class="{ mine: m.from_user_id === auth.currentUser?.id }"
          >
            <div class="thread-msg-meta">
              <span class="thread-msg-author">{{ m.from_character || m.from_username || 'Unknown' }}</span>
              <span v-if="m.is_secret" class="thread-msg-badge secret">secret</span>
              <span class="thread-msg-date">{{ fmt(m.created_at) }}</span>
            </div>
            <div class="thread-msg-body">{{ m.body }}</div>
            <div v-if="m.requires_ack && !m.acked_at && m.to_user_id === auth.currentUser?.id" style="margin-top:6px">
              <button class="btn btn-sm btn-primary" @click="ackMessage(m)">Acknowledge</button>
            </div>
            <div v-if="m.requires_ack && m.acked_at" style="margin-top:4px;font-size:0.78em;color:var(--green)">✓ Acknowledged</div>
          </div>
        </div>

        <!-- Reply box -->
        <div class="reply-box">
          <textarea
            v-model="replyBody"
            class="form-input"
            placeholder="Reply…"
            style="min-height:72px;resize:vertical"
          ></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:6px">
            <button class="submit-btn" :disabled="!replyBody.trim()" @click="sendReply">Send reply</button>
          </div>
        </div>
      </template>

      <!-- ── Thread list view ───────────────────────────────────────────── -->
      <template v-else>
        <!-- Compose toggle -->
        <button v-if="!composeOpen" class="btn-compose" @click="composeOpen = true">+ New message</button>

        <!-- Compose form -->
        <div v-show="composeOpen" class="compose-form">
          <div class="compose-header">
            <span class="compose-title">New message</span>
            <button class="compose-close" @click="composeOpen = false" aria-label="Close compose">✕</button>
          </div>
          <div v-if="toUserLocked" class="form-input compose-locked-to">To: {{ toUserLockedName }}</div>
          <select v-else id="flyout-msg-to" v-model="toUser" class="form-input">
            <option value="">— All players —</option>
            <option v-for="u in recipients" :key="u.id" :value="u.id">
              {{ u.character_name || u.username }}
            </option>
          </select>
          <input v-model="subject" class="form-input" placeholder="Subject" />
          <textarea v-model="body" class="form-input" placeholder="Message…" style="min-height:80px;resize:vertical"></textarea>
          <div class="compose-checks">
            <div class="compose-check-group">
              <label class="compose-check-label">
                <input type="checkbox" v-model="isSecret" /> Secret
              </label>
              <div class="compose-helper">Recipient won't see your name</div>
            </div>
            <div class="compose-check-group">
              <label class="compose-check-label">
                <input type="checkbox" v-model="requiresAck" /> Needs ack
              </label>
              <div class="compose-helper">You'll be notified when read</div>
            </div>
          </div>
          <button class="submit-btn" @click="sendMessage">Send</button>
          <div v-if="sendStatus" :class="['status-msg', sendOk ? 'status-ok' : 'status-err']">{{ sendStatus }}</div>
        </div>

        <!-- Search + filter -->
        <div style="margin-bottom:10px;display:flex;gap:6px;align-items:center">
          <input v-model="search" class="form-input" placeholder="Search messages…" style="flex:1;font-size:0.85em" />
          <label style="font-size:0.82em;white-space:nowrap;display:flex;align-items:center;gap:4px;cursor:pointer">
            <input type="checkbox" v-model="unreadOnly" />Unread
          </label>
        </div>

        <!-- Thread list -->
        <div id="flyout-msg-list" class="msg-list">
          <div v-if="!filteredThreads.length" class="empty-state">
            {{ search || unreadOnly ? 'No matching messages.' : 'No messages.' }}
          </div>
          <div
            v-for="thread in filteredThreads" :key="thread[0].id"
            class="msg-item"
            :class="{ unread: hasUnread(thread), secret: thread[0].is_secret }"
            @click="openThread(thread)"
          >
            <div class="msg-header">
              <div class="msg-subject">{{ thread[0].subject }}</div>
              <div class="msg-meta">{{ fmt(thread[thread.length - 1].created_at) }}</div>
            </div>
            <div class="msg-meta" style="margin-bottom:2px">
              {{ threadParticipants(thread) }}
              <span v-if="thread[0].is_secret" style="color:var(--purple)"> · secret</span>
              <span v-if="thread.length > 1" style="color:var(--text3)"> · {{ thread.length }} messages</span>
              <span v-if="hasUnread(thread)" style="color:var(--accent)"> · unread</span>
            </div>
            <div class="msg-preview">{{ (thread[thread.length - 1].body || '').slice(0, 80) }}</div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const ui = useUiStore()
const data = useDataStore()

const toUser = ref('')
const toUserLocked = ref(false)
const toUserLockedName = ref('')
const subject = ref('')
const body = ref('')
const isSecret = ref(false)
const requiresAck = ref(false)
const sendStatus = ref('')
const sendOk = ref(false)
const search = ref('')
const unreadOnly = ref(false)
const composeOpen = ref(false)
const activeThread = ref(null)
const replyBody = ref('')

// ── Thread grouping ────────────────────────────────────────────────────────
const threads = computed(() => {
  const msgs = ui.messages
  const byId = {}
  msgs.forEach(m => { byId[m.id] = m })

  // Find the root id by following reply_to_id chain
  function rootId(m) {
    if (!m.reply_to_id) return m.id
    const parent = byId[m.reply_to_id]
    return parent ? rootId(parent) : m.id
  }

  const groups = {}
  msgs.forEach(m => {
    const rid = rootId(m)
    if (!groups[rid]) groups[rid] = []
    groups[rid].push(m)
  })

  return Object.values(groups)
    .map(g => [...g].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    .sort((a, b) => {
      const lastA = a[a.length - 1].created_at
      const lastB = b[b.length - 1].created_at
      return new Date(lastB) - new Date(lastA)
    })
})

const filteredThreads = computed(() => {
  let ts = threads.value
  if (unreadOnly.value) ts = ts.filter(t => hasUnread(t))
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    ts = ts.filter(t => t.some(m =>
      m.subject?.toLowerCase().includes(q) ||
      m.body?.toLowerCase().includes(q) ||
      (m.from_character || m.from_username || '').toLowerCase().includes(q)
    ))
  }
  return ts
})

function hasUnread(thread) {
  return thread.some(m => !m.read_at && m.to_user_id === auth.currentUser?.id)
}

function threadParticipants(thread) {
  const names = new Set()
  thread.forEach(m => {
    const n = m.from_character || m.from_username
    if (n) names.add(n)
  })
  return [...names].join(', ')
}

// ── Compose ────────────────────────────────────────────────────────────────
watch(() => ui.activeFlyout, (val) => {
  if (val === 'msgs' && ui.pendingReply) {
    toUser.value = ui.pendingReply.toUserId
    toUserLocked.value = true
    toUserLockedName.value = ui.pendingReply.toName
    subject.value = ui.pendingReply.subject
    composeOpen.value = true
    activeThread.value = null
  } else if (!val) {
    toUserLocked.value = false
    toUserLockedName.value = ''
    activeThread.value = null
    replyBody.value = ''
  }
})

const recipients = computed(() =>
  data.users.filter(u => u.id !== auth.currentUser?.id)
)

function fmt(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

async function openThread(thread) {
  activeThread.value = thread
  replyBody.value = ''
  // Mark unread messages as read
  const unread = thread.filter(m => !m.read_at && m.to_user_id === auth.currentUser?.id)
  await Promise.all(unread.map(m => data.apif(`/api/messages/${m.id}/read`, { method: 'PUT' })))
  if (unread.length) {
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
    // refresh thread view with updated read states
    activeThread.value = msgs.filter(m => {
      const byId = {}; msgs.forEach(x => { byId[x.id] = x })
      function rootId(msg) { if (!msg.reply_to_id) return msg.id; const p = byId[msg.reply_to_id]; return p ? rootId(p) : msg.id }
      return rootId(m) === rootId(thread[0])
    }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
}

async function sendMessage() {
  if (!subject.value || !body.value) {
    sendStatus.value = 'Subject and body required.'
    sendOk.value = false
    return
  }
  const r = await data.apif('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      to_user_id: toUser.value ? Number(toUser.value) : undefined,
      subject: subject.value,
      body: body.value,
      is_secret: isSecret.value,
      requires_ack: requiresAck.value,
    }),
  })
  if (r.ok) {
    sendStatus.value = 'Sent.'
    sendOk.value = true
    subject.value = ''
    body.value = ''
    toUser.value = ''
    toUserLocked.value = false
    toUserLockedName.value = ''
    composeOpen.value = false
    ui.pendingReply = null
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
  } else {
    const d = await r.json()
    sendStatus.value = d.error || 'Failed.'
    sendOk.value = false
  }
}

async function sendReply() {
  if (!replyBody.value.trim() || !activeThread.value) return
  const root = activeThread.value[0]
  const r = await data.apif('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      to_user_id: root.from_user_id === auth.currentUser?.id ? root.to_user_id : root.from_user_id,
      subject: root.subject,
      body: replyBody.value.trim(),
      reply_to_id: root.id,
    }),
  })
  if (r.ok) {
    replyBody.value = ''
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
    // Update thread view
    const byId = {}; msgs.forEach(x => { byId[x.id] = x })
    function rootId(m) { if (!m.reply_to_id) return m.id; const p = byId[m.reply_to_id]; return p ? rootId(p) : m.id }
    activeThread.value = msgs
      .filter(m => rootId(m) === root.id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
}

async function ackMessage(m) {
  const r = await data.apif(`/api/messages/${m.id}/ack`, { method: 'PUT' })
  if (r.ok) {
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
    if (activeThread.value) {
      const byId = {}; msgs.forEach(x => { byId[x.id] = x })
      function rootId(msg) { if (!msg.reply_to_id) return msg.id; const p = byId[msg.reply_to_id]; return p ? rootId(p) : msg.id }
      activeThread.value = msgs
        .filter(msg => rootId(msg) === rootId(activeThread.value[0]))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    }
  }
}
</script>

<style scoped>
/* ── Compose toggle button ───────────────────────────────────────────────── */
.btn-compose {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-3);
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  color: var(--color-text-accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.btn-compose:hover {
  border-color: var(--color-border-active);
  background: rgba(59, 130, 246, 0.06);
}

/* ── Compose form ───────────────────────────────────────────────────────── */
.compose-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-default);
}
.compose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.compose-title {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
}
.compose-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--text-sm);
  padding: 2px 4px;
}
.compose-close:hover { color: var(--color-text-primary); }
.compose-locked-to { opacity: 0.7; cursor: default; }
.compose-checks { display: flex; flex-direction: column; gap: var(--space-2); }
.compose-check-group { display: flex; flex-direction: column; gap: 2px; }
.compose-check-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.compose-helper {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-hint);
  padding-left: 18px;
}

/* ── Thread list ─────────────────────────────────────────────────────────── */
.msg-list { display: flex; flex-direction: column; gap: 2px; }
.msg-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.msg-item:hover {
  background: rgba(255,255,255,0.04);
  border-color: var(--color-border-default);
}
.msg-item.unread {
  border-left: 2px solid var(--color-accent);
  background: rgba(59, 130, 246, 0.04);
}
.msg-item.secret { border-left: 2px solid var(--purple); }
.msg-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 2px; }
.msg-subject { font-size: 0.88em; font-weight: 500; color: var(--color-text-primary); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg-meta { font-size: 0.76em; color: var(--text3); white-space: nowrap; }
.msg-preview { font-size: 0.8em; color: var(--text3); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-top: 2px; }

/* ── Flyout back button ──────────────────────────────────────────────────── */
.flyout-back {
  background: none;
  border: none;
  color: var(--color-text-accent);
  font-size: 0.85em;
  cursor: pointer;
  padding: 0 8px 0 0;
  flex-shrink: 0;
}

/* ── Thread messages ─────────────────────────────────────────────────────── */
.thread-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}
.thread-msg {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 10px 14px;
}
.thread-msg.mine {
  background: rgba(59, 130, 246, 0.06);
  border-color: rgba(59, 130, 246, 0.2);
}
.thread-msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.thread-msg-author {
  font-size: 0.82em;
  font-weight: 600;
  color: var(--color-text-primary);
}
.thread-msg-date {
  font-size: 0.76em;
  color: var(--text3);
  margin-left: auto;
}
.thread-msg-badge {
  font-size: 0.7em;
  padding: 1px 6px;
  border-radius: 100px;
  font-weight: 500;
}
.thread-msg-badge.secret {
  background: rgba(139, 76, 201, 0.2);
  color: var(--purple);
}
.thread-msg-body {
  font-size: 0.88em;
  color: var(--color-text-secondary);
  line-height: 1.55;
  white-space: pre-wrap;
}

/* ── Reply box ───────────────────────────────────────────────────────────── */
.reply-box {
  border-top: 1px solid var(--color-border-default);
  padding-top: 12px;
}
</style>
