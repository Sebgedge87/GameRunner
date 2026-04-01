<template>
  <div id="msgs-overlay" :class="{ open: ui.activeFlyout === 'msgs' }" @click="ui.closeFlyout()"></div>
  <div id="msgs-flyout" class="flyout" :class="{ open: ui.activeFlyout === 'msgs' }">
    <div class="flyout-header">
      <div class="flyout-title">Messages</div>
      <button class="flyout-close" @click="ui.closeFlyout()">✕</button>
    </div>
    <div class="flyout-body">
      <!-- Compose toggle -->
      <button v-if="!composeOpen" class="btn-compose" @click="composeOpen = true">+ New message</button>

      <!-- Compose form (collapsed by default) -->
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
      <!-- Inbox -->
      <div id="flyout-msg-list" class="msg-list">
        <div v-if="!filteredMessages.length" class="empty-state">{{ search || unreadOnly ? 'No matching messages.' : 'No messages.' }}</div>
        <div
          v-for="m in filteredMessages"
          :key="m.id"
          class="msg-item"
          :class="{ unread: !m.read_at, secret: m.is_secret }"
          @click="openMsg(m)"
        >
          <div class="msg-header">
            <div class="msg-subject">{{ m.subject }}</div>
            <div class="msg-meta">{{ fmt(m.created_at) }}</div>
          </div>
          <div class="msg-meta" style="margin-bottom:2px">
            From: {{ m.from_character || m.from_username || 'Unknown' }}
            <span v-if="m.is_secret" style="color:var(--purple)"> · secret</span>
            <span v-if="!m.read_at" style="color:var(--accent)"> · unread</span>
            <span v-if="m.requires_ack && m.acked_at" style="color:var(--green)"> · acked</span>
            <span v-if="m.requires_ack && !m.acked_at" style="color:#c9a84c"> · needs ack</span>
          </div>
          <div class="msg-preview">{{ (m.body || '').slice(0, 80) }}</div>
          <div v-if="m.requires_ack && !m.acked_at && m.to_user_id === auth.currentUser?.id" style="margin-top:6px">
            <button class="btn btn-sm btn-primary" @click.stop="ackMessage(m)">Acknowledge</button>
          </div>
        </div>
      </div>
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

const filteredMessages = computed(() => {
  let msgs = ui.messages
  if (unreadOnly.value) msgs = msgs.filter(m => !m.read_at)
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    msgs = msgs.filter(m =>
      m.subject?.toLowerCase().includes(q) ||
      m.body?.toLowerCase().includes(q) ||
      (m.from_character || m.from_username || '').toLowerCase().includes(q)
    )
  }
  return msgs
})

watch(() => ui.activeFlyout, (val) => {
  if (val === 'msgs' && ui.pendingReply) {
    toUser.value = ui.pendingReply.toUserId
    toUserLocked.value = true
    toUserLockedName.value = ui.pendingReply.toName
    subject.value = ui.pendingReply.subject
    composeOpen.value = true   // auto-open compose when replying
  } else if (!val) {
    toUserLocked.value = false
    toUserLockedName.value = ''
  }
})

const recipients = computed(() =>
  data.users.filter(u => u.id !== auth.currentUser?.id)
)

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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

function openMsg(m) {
  ui.openMessage(m)
}

async function ackMessage(m) {
  const r = await data.apif(`/api/messages/${m.id}/ack`, { method: 'PUT' })
  if (r.ok) {
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
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
  transition: border-color var(--duration-fast) var(--ease-default),
              background    var(--duration-fast) var(--ease-default);
}
.btn-compose:hover {
  border-color: var(--color-border-active);
  background: rgba(212, 98, 26, 0.06);
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

.compose-locked-to {
  opacity: 0.7;
  cursor: default;
}

/* ── Checkboxes + helper text ───────────────────────────────────────────── */
.compose-checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.compose-check-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

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
  padding-left: 18px;   /* aligns under the label text, past the checkbox */
}
</style>
