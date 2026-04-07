import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useCampaignStore = defineStore('campaign', () => {
  const auth = useAuthStore()

  const activeCampaign = ref(null)
  const allCampaigns = ref([])
  const isGm = ref(false)
  const timer = ref({ label: '', end: null, remaining: 0, running: false })
  const calendarVersion = ref(0)

  function setTimer(t) { timer.value = { ...timer.value, ...t } }

  const SYSTEM_THEME_MAP = {
    none: 'none',
    default: 'default', dnd5e: 'dnd5e', coc: 'cthulhu', alien: 'alien',
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

  function applyBgImage(url) {
    const main = document.getElementById('main')
    if (!main) return
    if (url) {
      main.style.backgroundImage = `url(${JSON.stringify(url)})`
      main.classList.add('has-bg-image')
    } else {
      main.style.backgroundImage = ''
      main.classList.remove('has-bg-image')
    }
  }

  function applyTheme(system) {
    const theme = SYSTEM_THEME_MAP[system] || 'default'
    // Keep data-theme attribute for legacy [data-theme] variable rules
    document.documentElement.setAttribute('data-theme', theme === 'none' ? 'default' : theme)
    // Apply semantic theme class — remove existing theme-*, fx-*, dynamic-* classes first
    const cl = document.documentElement.classList
    Array.from(cl).filter(c =>
      c.startsWith('theme-') || c.startsWith('fx-') || c.startsWith('dynamic-')
    ).forEach(c => cl.remove(c))
    cl.add(`theme-${theme}`)
    // Layer 2: ambient FX alongside theme
    const FX_MAP = {
      alien:    'fx-crt',
      dune:     'fx-grain',
      cthulhu:  'fx-desaturate',
      achtung:  'fx-parchment',
      coriolis: 'fx-stars',
      dnd5e:    'fx-vignette',
    }
    if (FX_MAP[theme]) cl.add(FX_MAP[theme])
    // Layer 3: Dune house accent
    if (theme === 'dune' && activeCampaign.value?.dune_house) {
      cl.add(`dynamic-house-${activeCampaign.value.dune_house}`)
    }
    // Layer 3: D&D 5e setting/plane accent
    if (theme === 'dnd5e' && activeCampaign.value?.dnd_setting) {
      cl.add(`dynamic-setting-${activeCampaign.value.dnd_setting}`)
    }
    // Layer 3: Cthulhu sanity atmosphere
    if (theme === 'cthulhu') {
      const sanity = activeCampaign.value?.avg_sanity ?? 100
      const band = Math.min(4, Math.floor(sanity / 20))
      cl.add(`dynamic-sanity-${band}`)
    }
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
    if (!headers['X-Campaign-Id'] && activeCampaign.value?.id) {
      headers['X-Campaign-Id'] = activeCampaign.value.id
    }
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
      } else {
        applyTheme('none')
      }
      applyBgImage(activeCampaign.value?.bg_image || null)
      // Hydrate timer from campaign row
      const ac = activeCampaign.value
      if (ac) {
        timer.value = {
          label: ac.timer_label || '',
          end: ac.timer_end || null,
          remaining: ac.timer_remaining || 0,
          running: !!ac.timer_running,
        }
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
    applyBgImage(campaign.bg_image || null)
  }

  async function createCampaign(body) {
    const r = await apif('/api/campaigns', { method: 'POST', body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Failed to create')
    // Creator is always GM — set immediately so step 3 of wizard sees isGm=true
    isGm.value = true
    activeCampaign.value = { ...d.campaign, my_role: 'gm' }
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

  async function updateCampaign(id, fields) {
    const r = await apif(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(fields) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Failed to update campaign')
    if (activeCampaign.value?.id === id) {
      activeCampaign.value = { ...activeCampaign.value, ...fields }
    }
    return d.campaign
  }

  async function deleteCampaign(id) {
    const r = await apif(`/api/campaigns/${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Failed to delete campaign')
    if (activeCampaign.value?.id === id) {
      activeCampaign.value = null
      isGm.value = false
    }
    allCampaigns.value = allCampaigns.value.filter(c => c.id !== id)
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

  function leaveCampaign() {
    activeCampaign.value = null
    isGm.value = false
    applyTheme('none')
    applyBgImage(null)
  }

  return {
    activeCampaign, allCampaigns, isGm, currentPartyLocationId, timer, calendarVersion,
    SYSTEM_META, SYSTEM_THEME_MAP,
    applyTheme, applyCustomTheme, applyBgImage,
    loadCampaigns, switchCampaign, createCampaign, joinCampaign, updateCampaign, deleteCampaign, setPartyLocation, leaveCampaign, setTimer,
  }
})
