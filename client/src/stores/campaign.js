import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useCampaignStore = defineStore('campaign', () => {
  const auth = useAuthStore()

  const activeCampaign = ref(null)
  const allCampaigns = ref([])
  const isGm = ref(false)

  const SYSTEM_THEME_MAP = {
    default: 'default', dnd5e: 'dnd5e', coc: 'coc', alien: 'alien',
    coriolis: 'coriolis', dune: 'dune', achtung: 'achtung', custom: 'custom',
  }

  const SYSTEM_META = {
    default: { label: 'Default', icon: '◈', color: '#6b8cff' },
    dnd5e: { label: 'D&D 5e', icon: '⚔', color: '#c9a84c' },
    coc: { label: 'Call of Cthulhu', icon: '🐙', color: '#b8a060' },
    alien: { label: 'Alien RPG', icon: '👾', color: '#4caf50' },
    coriolis: { label: 'Coriolis', icon: '🌌', color: '#4a9fd4' },
    dune: { label: 'Dune', icon: '🏜', color: '#d4821a' },
    achtung: { label: 'Achtung!', icon: '☠', color: '#9e9e9e' },
    custom: { label: 'Custom', icon: '🎨', color: '#c9a84c' },
  }

  function applyTheme(system) {
    const theme = SYSTEM_THEME_MAP[system] || 'default'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('chronicle_theme', system)
    if (theme === 'custom') applyCustomTheme()
  }

  function applyCustomTheme() {
    const saved = JSON.parse(localStorage.getItem('chronicle_custom_theme') || '{}')
    const bg = saved.bg || '#0d0d0f'
    const surface = saved.surface || '#1a1a24'
    const accent = saved.accent || '#c9a84c'
    const text = saved.text || '#e8e4d9'
    const border = saved.border || '#2a2a3a'
    const r = document.documentElement
    r.style.setProperty('--custom-bg', bg)
    r.style.setProperty('--custom-surface', surface)
    r.style.setProperty('--custom-accent', accent)
    r.style.setProperty('--custom-text', text)
    r.style.setProperty('--custom-border', border)
  }

  function apif(path, opts = {}) {
    const headers = {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    }
    if (activeCampaign.value?.id) headers['X-Campaign-Id'] = activeCampaign.value.id
    return fetch(path, { ...opts, headers })
  }

  async function loadCampaigns() {
    try {
      const [rA, rAll] = await Promise.all([
        apif('/api/campaigns/active'),
        apif('/api/campaigns'),
      ])
      const dA = await rA.json()
      activeCampaign.value = dA.campaign || null
      if (rAll.ok) {
        const dAll = await rAll.json()
        allCampaigns.value = dAll.campaigns || []
      }
      const myCamp = allCampaigns.value.find(c => c.id === activeCampaign.value?.id)
      isGm.value = myCamp ? myCamp.my_role === 'gm' : false
      if (activeCampaign.value?.system) {
        applyTheme(activeCampaign.value.system)
      }
    } catch (e) {
      console.error('[loadCampaigns]', e)
    }
  }

  async function switchCampaign(id) {
    const campaign = allCampaigns.value.find(c => c.id === id)
    if (!campaign) return
    if (campaign.my_role === 'gm') {
      const r = await apif(`/api/campaigns/${id}/activate`, {
        method: 'PUT',
        headers: { 'X-Campaign-Id': id },
      })
      if (!r.ok) throw new Error('Switch failed')
    }
    activeCampaign.value = campaign
    isGm.value = campaign.my_role === 'gm'
    if (campaign.system) applyTheme(campaign.system)
  }

  async function createCampaign(body) {
    const r = await apif('/api/campaigns', { method: 'POST', body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Failed to create')
    await loadCampaigns()
    return d.campaign
  }

  async function joinCampaign(code) {
    const r = await apif('/api/campaigns/join', { method: 'POST', body: JSON.stringify({ code }) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Failed to join')
    await loadCampaigns()
    return d.campaign
  }

  const currentPartyLocationId = computed(() => activeCampaign.value?.current_party_location_id || null)

  async function setPartyLocation(locId) {
    if (!activeCampaign.value?.id) return
    const r = await apif(`/api/campaigns/${activeCampaign.value.id}/party-location`, {
      method: 'PUT',
      body: JSON.stringify({ location_id: locId }),
    })
    if (r.ok) {
      activeCampaign.value = { ...activeCampaign.value, current_party_location_id: locId ? String(locId) : null }
    }
  }

  return {
    activeCampaign, allCampaigns, isGm, currentPartyLocationId,
    SYSTEM_META, SYSTEM_THEME_MAP,
    applyTheme, applyCustomTheme,
    loadCampaigns, switchCampaign, createCampaign, joinCampaign, setPartyLocation,
  }
})
