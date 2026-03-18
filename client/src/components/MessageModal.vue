<template>
  <div v-if="msg" id="msg-modal" class="modal-overlay open" style="z-index:250" @click.self="close">
    <div class="modal">
      <div class="modal-title">{{ msg.subject }}</div>
      <div class="modal-from">
        From: {{ msg.from_character || msg.from_username || 'Unknown' }} →
        To: {{ msg.to_character || msg.to_username || 'All Players' }} · {{ fmt(msg.created_at) }}
      </div>
      <div v-if="msg.is_secret" class="tag" style="margin-bottom:10px;background:rgba(139,76,201,0.2);color:var(--purple)">SECRET</div>
      <div v-if="parentMsg" style="background:var(--bg3);border-left:2px solid var(--border2);padding:8px 12px;margin-bottom:10px;font-size:12px;color:var(--text3)">
        <div style="font-size:10px;letter-spacing:.05em;margin-bottom:4px">RE: {{ parentMsg.subject }}</div>
        <div>{{ (parentMsg.body || '').slice(0, 120) }}{{ parentMsg.body?.length > 120 ? '…' : '' }}</div>
      </div>
      <div class="modal-body">{{ msg.body }}</div>
      <div class="modal-actions">
        <button class="modal-close" @click="close">CLOSE</button>
        <button v-if="msg.requires_ack && !msg.acked_at" class="btn btn-primary btn-sm" @click="ack">Acknowledge</button>
        <button class="btn btn-sm" @click="reply">Reply</button>
        <button v-if="canDelete" class="btn btn-sm btn-danger" @click="del">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const ui = useUiStore()
const campaign = useCampaignStore()
const data = useDataStore()

const msg = computed(() => ui.viewingMessage || null)
const parentMsg = computed(() => {
  if (!msg.value?.reply_to_id) return null
  return ui.messages.find(m => m.id === msg.value.reply_to_id) || null
})
const canDelete = computed(() =>
  campaign.isGm || msg.value?.from_user_id === auth.currentUser?.id
)

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function close() {
  ui.closeMessage()
}

async function ack() {
  if (!msg.value) return
  await data.apif(`/api/messages/${msg.value.id}/ack`, { method: 'PUT' })
  msg.value.acked_at = new Date().toISOString()
}

function reply() {
  if (!msg.value) return
  close()
  ui.openFlyout('msgs')
}

async function del() {
  if (!msg.value) return
  if (!await ui.confirm('Delete this message?')) return
  const r = await data.apif(`/api/messages/${msg.value.id}`, { method: 'DELETE' })
  if (r.ok) {
    ui.showToast('Deleted', '', '✓')
    const msgs = await data.loadMessages()
    ui.setMessages(msgs)
    close()
  } else {
    ui.showToast('Delete failed', '', '✕')
  }
}
</script>
