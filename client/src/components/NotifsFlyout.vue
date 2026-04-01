<template>
  <div id="notifs-overlay" :class="{ open: ui.activeFlyout === 'notifs' }" @click="ui.closeFlyout()"></div>
  <div id="notifs-flyout" class="flyout" :class="{ open: ui.activeFlyout === 'notifs' }">
    <div class="flyout-header">
      <div class="flyout-title">Notifications</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button v-if="ui.unreadNotifCount > 0" class="btn btn-sm" @click="markAllRead">Mark all read</button>
        <button class="flyout-close" @click="ui.closeFlyout()">✕</button>
      </div>
    </div>
    <div id="notifs-body" class="flyout-body">
      <EmptyState
        v-if="!ui.notifications.length"
        icon="🔔"
        heading="No notifications yet"
        description="You'll see alerts when players send messages, share notes, or respond to scheduling polls."
      />
      <div
        v-for="n in ui.notifications"
        :key="n.id"
        class="notif-item"
        :class="{ unread: !n.read_at }"
      >
        <span v-if="!n.read_at" class="notif-dot"></span>
        <div class="notif-text">{{ n.message || n.title || '' }}</div>
        <div class="notif-time">{{ fmtTime(n.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import EmptyState from './EmptyState.vue'

const ui = useUiStore()
const data = useDataStore()

function fmtTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function markAllRead() {
  await data.apif('/api/notifications/read-all', { method: 'PUT' }).catch(() => {})
  const notifs = await data.loadNotifications()
  ui.setNotifications(notifs)
}
</script>
