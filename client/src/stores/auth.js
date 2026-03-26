import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('chronicle_token') || null)
  const currentUser = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!currentUser.value)

  function setToken(t) {
    token.value = t
    if (t) localStorage.setItem('chronicle_token', t)
    else localStorage.removeItem('chronicle_token')
  }

  function setUser(user) {
    currentUser.value = user
  }

  async function restoreSession() {
    if (!token.value) return false
    try {
      const r = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (r.ok) {
        const d = await r.json()
        currentUser.value = d.user
        // Load and apply persisted preferences
        await loadPreferences()
        return true
      } else {
        setToken(null)
        return false
      }
    } catch {
      return false
    }
  }

  async function loadPreferences() {
    if (!token.value) return
    try {
      const r = await fetch('/api/users/me/preferences', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (!r.ok) return
      const { preferences } = await r.json()
      if (preferences?.theme) {
        document.documentElement.setAttribute('data-theme', preferences.theme)
        localStorage.setItem('chronicle_theme', preferences.theme)
      }
      if (preferences?.custom_colors) {
        localStorage.setItem('chronicle_custom_colors', JSON.stringify(preferences.custom_colors))
      }
    } catch (_) {}
  }

  async function savePreferences(prefs) {
    if (!token.value) return
    try {
      await fetch('/api/users/me/preferences', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
    } catch (_) {}
  }

  async function login(username, password, totp_token = null) {
    const body = { username, password }
    if (totp_token) body.totp_token = totp_token
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    // Server signals 2FA is required
    if (r.ok && data.requires_totp) return { requires_totp: true }
    if (!r.ok) throw new Error(data.error || 'Login failed')
    setToken(data.token)
    currentUser.value = data.user
    await loadPreferences()
    return data.user
  }

  async function register(payload) {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Registration failed')
    setToken(data.token)
    currentUser.value = data.user
    return data.user
  }

  async function logout() {
    // Invalidate token server-side first (best-effort)
    if (token.value) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.value}` },
        })
      } catch (_) {}
    }
    setToken(null)
    currentUser.value = null
  }

  return { token, currentUser, isAuthenticated, setToken, setUser, restoreSession, loadPreferences, savePreferences, login, register, logout }
})
