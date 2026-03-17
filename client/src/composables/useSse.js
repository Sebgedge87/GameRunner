import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useSse(onEvent) {
  const auth = useAuthStore()
  let source = null
  let reconnectTimer = null
  const connected = ref(false)

  function connect() {
    if (source) return
    source = new EventSource(`/api/events?token=${encodeURIComponent(auth.token)}`)
    source.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data)
        onEvent(d)
      } catch {}
    }
    source.onopen = () => { connected.value = true }
    source.onerror = () => {
      connected.value = false
      source.close()
      source = null
      reconnectTimer = setTimeout(connect, 10000)
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer)
    if (source) { source.close(); source = null }
    connected.value = false
  }

  onUnmounted(disconnect)

  return { connect, disconnect, connected }
}
