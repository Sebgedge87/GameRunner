<template>
  <div id="app-shell">
    <!-- Sidebar overlay for mobile -->
    <div id="sidebar-overlay"
      :class="{ open: ui.sidebarOpen }"
      @click="ui.closeSidebar()">
    </div>

    <AppSidebar />

    <!-- Main area -->
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <AppTopbar />
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
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
  if (d.type === 'agenda_revealed') {
    await data.loadAgenda()
    ui.showToast('Secret Objective', 'Your agenda has been updated', '🎯')
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

onMounted(async () => {
  connect()
  await campaign.loadCampaigns()
  await data.loadAll()
  await refreshMessages()
  await refreshNotifications()
  router.push('/home')
})

onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
