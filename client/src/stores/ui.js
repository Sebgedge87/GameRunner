import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Toasts
  const toasts = ref([])
  let toastId = 0

  function showToast(title, body = '', icon = 'ℹ') {
    const id = ++toastId
    toasts.value.push({ id, title, body, icon })
    setTimeout(() => dismissToast(id), 5000)
  }

  function dismissToast(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  // Sidebar
  const sidebarOpen = ref(false)
  function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
  function closeSidebar() { sidebarOpen.value = false }

  // Notifications
  const notifications = ref([])
  const unreadNotifCount = ref(0)

  function setNotifications(notifs) {
    notifications.value = notifs
    unreadNotifCount.value = notifs.filter(n => !n.read_at).length
  }

  // Messages
  const messages = ref([])
  const unreadMsgCount = ref(0)

  function setMessages(msgs) {
    messages.value = msgs
    unreadMsgCount.value = msgs.filter(m => !m.read_at).length
  }

  // Handouts badge
  const unreadHandoutCount = ref(0)

  // Active flyout
  const activeFlyout = ref(null)
  function openFlyout(name) { activeFlyout.value = name }
  function closeFlyout() { activeFlyout.value = null }

  // Detail modal
  const detailModal = ref(null) // { type, item }
  function openDetail(type, item) { detailModal.value = { type, item } }
  function closeDetail() { detailModal.value = null }

  // GM edit modal
  const gmEditModal = ref(null) // { type, id, data }
  function openGmEdit(type, id, data = null) { gmEditModal.value = { type, id, data } }
  function closeGmEdit() { gmEditModal.value = null }

  return {
    toasts, showToast, dismissToast,
    sidebarOpen, toggleSidebar, closeSidebar,
    notifications, unreadNotifCount, setNotifications,
    messages, unreadMsgCount, setMessages,
    unreadHandoutCount,
    activeFlyout, openFlyout, closeFlyout,
    detailModal, openDetail, closeDetail,
    gmEditModal, openGmEdit, closeGmEdit,
  }
})
