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

  const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === '1')
  function toggleSidebarCollapse() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value ? '1' : '0')
  }

  // Notifications
  const notifications = ref([])
  const unreadNotifCount = ref(0)

  function setNotifications(notifs) {
    notifications.value = notifs
    unreadNotifCount.value = notifs.filter(n => !n.read_at).length
    unreadHandoutCount.value = notifs.filter(n => !n.read_at && n.type === 'handout').length
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

  // Good Boy Cards badge (unplayed cards awarded to this user)
  const cardBadge = ref(0)

  // Active flyout
  const activeFlyout = ref(null)
  const pendingReply = ref(null) // { toUserId, toName, subject }
  function openFlyout(name) { activeFlyout.value = name }
  function openReplyFlyout(toUserId, toName, subject) {
    pendingReply.value = { toUserId, toName, subject }
    activeFlyout.value = 'msgs'
  }
  function closeFlyout() {
    activeFlyout.value = null
    pendingReply.value = null
  }

  // Message viewer
  const viewingMessage = ref(null)
  function openMessage(msg) {
    viewingMessage.value = msg
    openFlyout('msg-view')
  }
  function closeMessage() {
    viewingMessage.value = null
    if (activeFlyout.value === 'msg-view') closeFlyout()
  }

  // Handout viewer
  const viewingHandout = ref(null)
  function openHandout(handout) {
    viewingHandout.value = handout
    openFlyout('handout')
  }
  function closeHandout() {
    viewingHandout.value = null
    if (activeFlyout.value === 'handout') closeFlyout()
  }

  // Detail modal
  const detailModal = ref(null) // { type, item }
  function openDetail(type, item) { detailModal.value = { type, item } }
  function closeDetail() { detailModal.value = null }

  // GM edit modal
  const gmEditModal = ref(null) // { type, id, data }
  function openGmEdit(type, id, data = null) { gmEditModal.value = { type, id, data } }
  function closeGmEdit() { gmEditModal.value = null }

  // Share modal
  const shareModal = ref(null) // { itemType, itemId, title }
  function openShare(itemType, itemId, title) { shareModal.value = { itemType, itemId, title } }
  function closeShare() { shareModal.value = null }

  // Confirm / Prompt dialog
  const confirmDialog = ref(null) // { message, resolve, prompt?, inputValue? }

  function confirm(message) {
    return new Promise(resolve => {
      confirmDialog.value = { message, resolve, isPrompt: false }
    })
  }

  function prompt(message, defaultValue = '') {
    return new Promise(resolve => {
      confirmDialog.value = { message, resolve, isPrompt: true, inputValue: defaultValue }
    })
  }

  function resolveConfirm(result) {
    if (confirmDialog.value) {
      confirmDialog.value.resolve(result)
      confirmDialog.value = null
    }
  }

  return {
    toasts, showToast, dismissToast,
    sidebarOpen, toggleSidebar, closeSidebar,
    sidebarCollapsed, toggleSidebarCollapse,
    notifications, unreadNotifCount, setNotifications,
    messages, unreadMsgCount, setMessages,
    unreadHandoutCount, cardBadge,
    activeFlyout, pendingReply, openFlyout, openReplyFlyout, closeFlyout,
    viewingMessage, openMessage, closeMessage,
    viewingHandout, openHandout, closeHandout,
    detailModal, openDetail, closeDetail,
    gmEditModal, openGmEdit, closeGmEdit,
    shareModal, openShare, closeShare,
    confirmDialog, confirm, prompt, resolveConfirm,
  }
})
