import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useCampaignStore } from './campaign'
import { useUiStore } from './ui'

export const useDataStore = defineStore('data', () => {
  const auth = useAuthStore()
  const campaign = useCampaignStore()
  const ui = useUiStore()

  // Wraps a load fn with consistent error handling — shows a toast on failure
  // rather than leaving the user staring at a blank screen
  async function safe(fn, label) {
    try {
      return await fn()
    } catch (e) {
      console.error(`[data] ${label}:`, e)
      ui.showToast(`Failed to load ${label}`, 'Check connection or reload', '✕')
    }
  }

  const loading = ref(false)

  const quests = ref([])
  const npcs = ref([])
  const locations = ref([])
  const hooks = ref([])
  const factions = ref([])
  const timeline = ref([])
  const inventory = ref([])
  const keyItems = ref([])
  const maps = ref([])
  const bestiary = ref([])
  const rumours = ref([])
  const jobs = ref([])
  const notes = ref([])
  const handouts = ref([])
  const users = ref([])
  const agenda = ref(null)
  const stress = ref(null)
  const pins = ref([])
  const sessions = ref([])
  const polls = ref([])
  const scheduling = ref([])

  async function apif(path, opts = {}) {
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    }
    if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
    const r = await fetch(path, { ...opts, headers })
    if (r.status === 401) auth.logout()
    return r
  }

  async function loadAll() {
    loading.value = true
    try {
      await Promise.all([
        loadQuests(), loadNpcs(), loadLocations(), loadHooks(),
        loadFactions(), loadTimeline(), loadInventory(), loadMaps(),
        loadBestiary(), loadRumours(), loadJobs(), loadSessions(),
        loadNotes(), loadHandouts(), loadUsers(),
        loadAgenda(), loadStress(), loadPins(),
      ])
    } finally {
      loading.value = false
    }
  }

  async function loadQuests() {
    return safe(async () => {
      const r = await apif('/api/quests'); if (!r.ok) throw new Error(r.status)
      quests.value = (await r.json()).quests || []
    }, 'quests')
  }

  async function loadNpcs() {
    return safe(async () => {
      const r = await apif('/api/npcs'); if (!r.ok) throw new Error(r.status)
      npcs.value = (await r.json()).npcs || []
    }, 'npcs')
  }

  async function loadLocations() {
    return safe(async () => {
      const r = await apif('/api/locations'); if (!r.ok) throw new Error(r.status)
      locations.value = (await r.json()).locations || []
    }, 'locations')
  }

  async function loadHooks() {
    return safe(async () => {
      const r = await apif('/api/hooks'); if (!r.ok) throw new Error(r.status)
      hooks.value = (await r.json()).hooks || []
    }, 'hooks')
  }

  async function loadFactions() {
    return safe(async () => {
      const r = await apif('/api/factions'); if (!r.ok) throw new Error(r.status)
      factions.value = (await r.json()).factions || []
    }, 'factions')
  }

  async function loadTimeline() {
    return safe(async () => {
      const r = await apif('/api/timeline'); if (!r.ok) throw new Error(r.status)
      timeline.value = (await r.json()).events || []
    }, 'timeline')
  }

  async function loadInventory() {
    return safe(async () => {
      const [rI, rK] = await Promise.all([apif('/api/inventory'), apif('/api/key-items')])
      if (!rI.ok || !rK.ok) throw new Error('inventory load failed')
      inventory.value = (await rI.json()).inventory || []
      keyItems.value = (await rK.json()).key_items || []
    }, 'inventory')
  }

  async function loadMaps() {
    return safe(async () => {
      const r = await apif('/api/maps'); if (!r.ok) throw new Error(r.status)
      maps.value = (await r.json()).maps || []
    }, 'maps')
  }

  async function loadBestiary() {
    return safe(async () => {
      const r = await apif('/api/bestiary'); if (!r.ok) throw new Error(r.status)
      bestiary.value = (await r.json()).bestiary || []
    }, 'bestiary')
  }

  async function loadRumours() {
    return safe(async () => {
      const r = await apif('/api/rumours'); if (!r.ok) throw new Error(r.status)
      rumours.value = (await r.json()).rumours || []
    }, 'rumours')
  }

  async function loadJobs() {
    return safe(async () => {
      const r = await apif('/api/jobs'); if (!r.ok) throw new Error(r.status)
      jobs.value = (await r.json()).jobs || []
    }, 'jobs')
  }

  async function loadNotes() {
    return safe(async () => {
      const r = await apif('/api/notes'); if (!r.ok) throw new Error(r.status)
      notes.value = (await r.json()).notes || []
    }, 'notes')
  }

  async function loadHandouts() {
    return safe(async () => {
      const r = await apif('/api/handouts'); if (!r.ok) throw new Error(r.status)
      handouts.value = (await r.json()).handouts || []
    }, 'handouts')
  }

  async function loadUsers() {
    return safe(async () => {
      const r = await apif('/api/users'); if (!r.ok) throw new Error(r.status)
      users.value = (await r.json()).users || []
    }, 'users')
  }

  async function loadAgenda() {
    return safe(async () => {
      const r = await apif('/api/agenda'); if (!r.ok) throw new Error(r.status)
      const cards = (await r.json()).agenda || []
      agenda.value = campaign.isGm ? null : (cards[0] || null)
    }, 'agenda')
  }

  async function loadStress() {
    return safe(async () => {
      const r = await apif('/api/stress'); if (!r.ok) throw new Error(r.status)
      const rows = (await r.json()).stress || []
      stress.value = rows[0] || null
    }, 'stress')
  }

  async function loadPins() {
    return safe(async () => {
      const r = await apif('/api/pins'); if (!r.ok) throw new Error(r.status)
      pins.value = (await r.json()).pins || []
    }, 'pins')
  }

  async function addPin(itemType, itemId, itemTitle) {
    await apif('/api/pins', { method: 'POST', body: JSON.stringify({ item_type: itemType, item_id: itemId, item_title: itemTitle }) })
    await loadPins()
  }

  async function removePin(pinId) {
    await apif(`/api/pins/${pinId}`, { method: 'DELETE' })
    await loadPins()
  }

  async function loadSessions() {
    const [rS, rP, rSch] = await Promise.all([
      apif('/api/sessions'),
      apif('/api/sessions/polls'),
      apif('/api/sessions/scheduling'),
    ])
    sessions.value = (await rS.json()).sessions || []
    polls.value = (await rP.json()).polls || []
    scheduling.value = (await rSch.json()).scheduling || []
  }

  async function loadMessages() {
    const r = await apif('/api/messages')
    return (await r.json()).messages || []
  }

  async function loadNotifications() {
    const r = await apif('/api/notifications')
    return (await r.json()).notifications || []
  }

  async function toggleHidden(type, id) {
    const vaultTypes = new Set(['quest', 'npc', 'location', 'hook'])
    const TYPE_ENDPOINT = {
      faction: '/api/factions', timeline: '/api/timeline', inventory: '/api/inventory',
      'key-item': '/api/key-items', job: '/api/jobs', bestiary: '/api/bestiary',
      rumour: '/api/rumours', map: '/api/maps',
    }
    const ep = vaultTypes.has(type) ? `/api/vault/${id}/hidden` : `${TYPE_ENDPOINT[type]}/${id}/hidden`
    const r = await apif(ep, { method: 'PUT' })
    if (!r.ok) throw new Error('Failed to toggle hidden')
    return await r.json()
  }

  async function deleteItem(type, id) {
    const TYPE_ENDPOINT = {
      quest: '/api/quests', npc: '/api/npcs', location: '/api/locations',
      hook: '/api/hooks', faction: '/api/factions', timeline: '/api/timeline',
      inventory: '/api/inventory', 'key-item': '/api/key-items', job: '/api/jobs',
      bestiary: '/api/bestiary', rumour: '/api/rumours', map: '/api/maps',
      session: '/api/sessions', handout: '/api/handouts', poll: '/api/sessions/polls',
    }
    const r = await apif(`${TYPE_ENDPOINT[type]}/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Delete failed')
  }

  return {
    loading,
    quests, npcs, locations, hooks, factions, timeline, inventory, keyItems,
    maps, bestiary, rumours, jobs, notes, handouts, users, agenda, stress, pins,
    sessions, polls, scheduling,
    apif,
    loadAll, loadQuests, loadNpcs, loadLocations, loadHooks, loadFactions,
    loadTimeline, loadInventory, loadMaps, loadBestiary, loadRumours, loadJobs,
    loadNotes, loadHandouts, loadUsers, loadAgenda, loadStress, loadPins,
    addPin, removePin, loadSessions, loadMessages, loadNotifications,
    toggleHidden, deleteItem,
  }
})
