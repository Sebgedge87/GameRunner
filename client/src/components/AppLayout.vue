<template>
  <div id="app-shell" :class="{ 'sidebar-icon-only': ui.sidebarCollapsed }">
    <!-- Sidebar overlay for mobile -->
    <div id="sidebar-overlay"
      :class="{ open: ui.sidebarOpen }"
      @click="ui.closeSidebar()">
    </div>

    <AppSidebar />

    <!-- Main area -->
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <AppTopbar />
      <!-- Update available banner -->
      <div v-if="updateAvailable"
           style="background:var(--accent);color:#1a1008;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:12px;flex-shrink:0">
        <span>⚡ A new version is available.</span>
        <button @click="() => window.location.reload()"
                style="background:rgba(0,0,0,0.2);border:none;border-radius:4px;padding:4px 12px;cursor:pointer;color:inherit;font-family:inherit;font-size:12px;font-weight:700">
          Refresh now
        </button>
      </div>
      <div id="main" ref="mainEl">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </div>

    <!-- Messages flyout -->
    <MessagesFlyout />
    <!-- Notifications flyout -->
    <NotifsFlyout />
    <!-- Detail modal -->
    <DetailModal />
    <!-- GM Edit modal -->
    <GmEditModal />
    <!-- Message view modal -->
    <MessageModal />
    <!-- Handout view modal -->
    <HandoutModal />
    <!-- GM FAB -->
    <GmFab />
    <!-- Share modal -->
    <ShareModal />
    <!-- Onboarding wizard -->
    <OnboardingWizard />
    <!-- Confirm dialog -->
    <ConfirmDialog />
    <!-- Toast container -->
    <ToastContainer />
  <!-- Timer widget (always on top, all users) -->
  <TimerWidget />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'
import { useSse } from '@/composables/useSse'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import MessagesFlyout from './MessagesFlyout.vue'
import NotifsFlyout from './NotifsFlyout.vue'
import DetailModal from './DetailModal.vue'
import GmEditModal from './GmEditModal.vue'
import MessageModal from './MessageModal.vue'
import HandoutModal from './HandoutModal.vue'
import GmFab from './GmFab.vue'
import ShareModal from './ShareModal.vue'
import OnboardingWizard from './OnboardingWizard.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import ToastContainer from './ToastContainer.vue'
import TimerWidget from './TimerWidget.vue'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const router = useRouter()

async function handleSseEvent(d) {
  if (d.type === 'notification') {
    await refreshNotifications()
    if (d.notif_type === 'message') {
      await refreshMessages()
      ui.showToast(d.title || 'New message', '', '✉')
    } else if (d.notif_type === 'handout') {
      await data.loadHandouts()
      ui.showToast(d.title || 'New handout', '', '📄')
    } else {
      ui.showToast(d.title || 'Notification', '')
    }
  }
  if (d.type === 'new_handout' || d.type === 'handout_group') {
    await data.loadHandouts()
    ui.showToast(d.title || 'New Handout', '', '📄')
  }
  if (d.type === 'timer_update' && d.campaign_id === campaign.activeCampaign?.id) {
    campaign.setTimer(d.timer)
  }
  if (d.type === 'calendar_update' && d.campaign_id === campaign.activeCampaign?.id) {
    campaign.calendarVersion++
  }
  if (d.type === 'agenda_revealed') {
    await data.loadAgenda()
    ui.showToast('Secret Objective', 'Your agenda has been updated', '🎯')
  }
  if (d.type === 'card_awarded') {
    ui.cardBadge = (ui.cardBadge || 0) + 1
    const icon = d.card?.type === 'good' ? '🐶' : '😈'
    ui.showToast(d.message || 'You received a card!', d.card?.effect || '', icon)
  }
  if (d.type === 'card_played') {
    const icon = d.card_type === 'good' ? '🐶' : '😈'
    ui.showToast(
      `${d.player_name} played: ${d.card_name}`,
      d.card_effect || '',
      icon,
    )
  }
  if (d.type === 'new_message') {
    await refreshMessages()
    ui.showToast(`📬 ${d.from || 'Someone'}: ${d.subject || 'New message'}`, '')
  }
  if (d.type === 'message_acked') {
    await refreshMessages()
  }
}

async function refreshMessages() {
  const msgs = await data.loadMessages()
  ui.setMessages(msgs)
}

async function refreshNotifications() {
  const notifs = await data.loadNotifications()
  ui.setNotifications(notifs)
}

const { connect, disconnect } = useSse(handleSseEvent)

watch(() => auth.token, (token) => {
  if (!token) disconnect()
})

// ── Update detection ──────────────────────────────────────────────────────────
const updateAvailable = ref(false)
let startupVersion = null
let versionPollTimer = null

async function checkVersion() {
  try {
    const r = await fetch('/api/version')
    if (!r.ok) return
    const { version } = await r.json()
    if (startupVersion === null) { startupVersion = version; return }
    if (version !== startupVersion) updateAvailable.value = true
  } catch (_) {}
}

onMounted(async () => {
  connect()
  await campaign.loadCampaigns()
  await data.loadAll()
  await refreshMessages()
  await refreshNotifications()
  await checkVersion()
  versionPollTimer = setInterval(checkVersion, 5 * 60 * 1000)
})

onUnmounted(() => {
  disconnect()
  clearInterval(versionPollTimer)
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
