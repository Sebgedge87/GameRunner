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
    const savedTheme = localStorage.getItem('chronicle_theme')
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
    if (!token.value) return false
    try {
      const r = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (r.ok) {
        const d = await r.json()
        currentUser.value = d.user
        return true
      } else {
        setToken(null)
        return false
      }
    } catch {
      return false
    }
  }

  async function login(username, password) {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'Login failed')
    setToken(data.token)
    currentUser.value = data.user
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

  function logout() {
    setToken(null)
    currentUser.value = null
  }

  return { token, currentUser, isAuthenticated, setToken, setUser, restoreSession, login, register, logout }
})
