<template>
  <div id="msgs-overlay" :class="{ open: ui.activeFlyout === 'msgs' }" @click="ui.closeFlyout()"></div>
  <div id="msgs-flyout" class="flyout" :class="{ open: ui.activeFlyout === 'msgs' }">
    <div class="flyout-header">
      <div class="flyout-title">Messages</div>
      <button class="flyout-close" @click="ui.closeFlyout()">✕</button>
    </div>
    <div class="flyout-body">
      <!-- Compose -->
      <div style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)">
        <div style="font-size:10px;color:var(--text3);letter-spacing:.08em;margin-bottom:8px">SEND MESSAGE</div>
        <select id="flyout-msg-to" v-model="toUser" class="form-input" style="margin-bottom:6px">
          <option value="">— All Players —</option>
          <option v-for="u in recipients" :key="u.id" :value="u.id">
            {{ u.character_name || u.username }}
          </option>
        </select>
        <input v-model="subject" class="form-input" placeholder="Subject" style="margin-bottom:6px" />
        <textarea v-model="body" class="form-input" placeholder="Message..." style="min-height:80px;resize:vertical;margin-bottom:6px"></textarea>
        <div style="display:flex;gap:12px;margin-bottom:6px;font-size:12px">
          <label><input type="checkbox" v-model="isSecret" style="margin-right:4px" />Secret</label>
          <label><input type="checkbox" v-model="requiresAck" style="margin-right:4px" />Needs ack</label>
        </div>
        <button class="submit-btn" @click="sendMessage">SEND</button>
        <div v-if="sendStatus" :class="['status-msg', sendOk ? 'status-ok' : 'status-err']">{{ sendStatus }}</div>
      </div>
      <!-- Inbox -->
      <div id="flyout-msg-list" class="msg-list">
        <div v-if="!ui.messages.length" class="empty-state">No messages.</div>
        <div
          v-for="m in ui.messages"
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
          </div>
          <div class="msg-preview">{{ (m.body || '').slice(0, 80) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const ui = useUiStore()
const data = useDataStore()

const toUser = ref('')
const subject = ref('')
const body = ref('')
const isSecret = ref(false)
const requiresAck = ref(false)
const sendStatus = ref('')
const sendOk = ref(false)

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
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
  } else {
    const d = await r.json()
    sendStatus.value = d.error || 'Failed.'
    sendOk.value = false
  }
}

function openMsg(m) {
  ui.closeFlyout()
  ui.openFlyout('msg-view')
  // Store in ui for the modal to pick up
  ui._viewingMessage = m
}
</script>
