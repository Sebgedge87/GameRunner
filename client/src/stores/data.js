import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useCampaignStore } from './campaign'

export const useDataStore = defineStore('data', () => {
  const auth = useAuthStore()
  const campaign = useCampaignStore()

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

  function apif(path, opts = {}) {
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    }
    if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
    return fetch(path, { ...opts, headers })
  }

  async function loadAll() {
    await Promise.all([
      loadQuests(), loadNpcs(), loadLocations(), loadHooks(),
      loadFactions(), loadTimeline(), loadInventory(), loadMaps(),
      loadBestiary(), loadRumours(), loadJobs(), loadSessions(),
      loadNotes(), loadHandouts(), loadUsers(),
      loadAgenda(), loadStress(), loadPins(),
    ])
  }

  async function loadQuests() {
    const r = await apif('/api/quests')
    quests.value = (await r.json()).quests || []
  }

  async function loadNpcs() {
    const r = await apif('/api/npcs')
    npcs.value = (await r.json()).npcs || []
  }

  async function loadLocations() {
    const r = await apif('/api/locations')
    locations.value = (await r.json()).locations || []
  }

  async function loadHooks() {
    const r = await apif('/api/hooks')
    hooks.value = (await r.json()).hooks || []
  }

  async function loadFactions() {
    const r = await apif('/api/factions')
    factions.value = (await r.json()).factions || []
  }

  async function loadTimeline() {
    const r = await apif('/api/timeline')
    timeline.value = (await r.json()).events || []
  }

  async function loadInventory() {
    const [rI, rK] = await Promise.all([apif('/api/inventory'), apif('/api/key-items')])
    inventory.value = (await rI.json()).inventory || []
    keyItems.value = (await rK.json()).key_items || []
  }

  async function loadMaps() {
    const r = await apif('/api/maps')
    maps.value = (await r.json()).maps || []
  }

  async function loadBestiary() {
    const r = await apif('/api/bestiary')
    bestiary.value = (await r.json()).bestiary || []
  }

  async function loadRumours() {
    const r = await apif('/api/rumours')
    rumours.value = (await r.json()).rumours || []
  }

  async function loadJobs() {
    const r = await apif('/api/jobs')
    jobs.value = (await r.json()).jobs || []
  }

  async function loadNotes() {
    const r = await apif('/api/notes')
    notes.value = (await r.json()).notes || []
  }

  async function loadHandouts() {
    const r = await apif('/api/handouts')
    handouts.value = (await r.json()).handouts || []
  }

  async function loadUsers() {
    const r = await apif('/api/users')
    users.value = (await r.json()).users || []
  }

  async function loadAgenda() {
    try {
      const r = await apif('/api/agenda')
      const cards = (await r.json()).agenda || []
      agenda.value = campaign.isGm ? null : (cards[0] || null)
    } catch (e) { console.error('[loadAgenda]', e) }
  }

  async function loadStress() {
    try {
      const r = await apif('/api/stress')
      const rows = (await r.json()).stress || []
      stress.value = rows[0] || null
    } catch (e) { console.error('[loadStress]', e) }
  }

  async function loadPins() {
    try {
      const r = await apif('/api/pins')
      pins.value = (await r.json()).pins || []
    } catch (e) { console.error('[loadPins]', e) }
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
