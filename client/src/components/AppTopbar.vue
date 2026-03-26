<template>
  <div id="topbar">
    <!-- Hamburger -->
    <button class="hamburger" @click="ui.toggleSidebar()">☰</button>

    <!-- Campaign switcher -->
    <div id="camp-switcher" v-if="campaign.allCampaigns.length > 0">
      <div id="camp-switcher-drop" :class="{ open: campDropOpen }">
        <button id="camp-switcher-btn" @click="campDropOpen = !campDropOpen">
          {{ campaign.activeCampaign?.name || 'No Campaign' }}
        </button>
        <div id="camp-drop-list" v-if="campDropOpen">
          <div
            v-for="c in campaign.allCampaigns"
            :key="c.id"
            class="camp-switch-item"
            :class="{ active: c.id === campaign.activeCampaign?.id }"
            @click="switchTo(c.id)"
          >
            <span :class="c.id === campaign.activeCampaign?.id ? 'dot' : 'dot-empty'"></span>
            <span style="flex:1">{{ c.name }}</span>
            <span v-if="c.my_role === 'gm'" style="font-size:10px;color:var(--accent)">GM</span>
          </div>
          <!-- Invite code for active GM campaign -->
          <div v-if="campaign.activeCampaign && campaign.isGm && campaign.activeCampaign.invite_code"
               style="border-top:1px solid var(--border);margin-top:4px;padding:8px 12px;display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace">INVITE</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.1em;color:var(--accent);font-weight:700">{{ campaign.activeCampaign.invite_code }}</span>
            <button class="btn btn-sm" style="margin-left:auto;padding:2px 8px;font-size:10px" @click.stop="copyCode">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div id="topbar-search-wrap" style="flex:1;position:relative">
      <input
        id="topbar-search"
        v-model="searchQ"
        type="text"
        placeholder="Search… (⌘K)"
        class="topbar-search-input"
        @input="debounceSearch"
        @focus="searchDropOpen = !!searchResults.length"
        @keydown.escape="searchDropOpen = false"
      />
      <div id="search-dropdown" :class="{ open: searchDropOpen }">
        <div v-if="!searchResults.length" class="search-result" style="color:var(--text3)">No results</div>
        <div
          v-for="r in searchResults"
          :key="r.id + r.type"
          class="search-result"
          @click="searchNav(r)"
        >
          <span class="search-result-type">{{ r.type }}</span>
          <div>
            <div class="search-result-title">{{ r.title }}</div>
            <div v-if="r.subtitle" class="search-result-sub">{{ r.subtitle }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Icons -->
    <div class="topbar-icons">
      <!-- Messages -->
      <button class="topbar-icon-btn" @click="ui.openFlyout('msgs')">
        ✉
        <span v-if="ui.unreadMsgCount > 0" class="nav-badge">{{ ui.unreadMsgCount }}</span>
      </button>
      <!-- Notifications -->
      <button class="topbar-icon-btn" @click="ui.openFlyout('notifs')">
        🔔
        <span v-if="ui.unreadNotifCount > 0" class="nav-badge">{{ ui.unreadNotifCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const data = useDataStore()
const router = useRouter()

const campDropOpen = ref(false)
const searchQ = ref('')
const searchResults = ref([])
const searchDropOpen = ref(false)
let searchTimer = null

function copyCode() {
  const code = campaign.activeCampaign?.invite_code
  if (!code) return
  navigator.clipboard.writeText(code).then(() => ui.showToast(`Invite code copied: ${code}`, '', '✓'))
}

async function switchTo(id) {
  campDropOpen.value = false
  try {
    await campaign.switchCampaign(id)
    ui.showToast('Campaign switched', '', '✓')
    await data.loadAll()
  } catch (e) {
    ui.showToast('Switch failed', e.message, '✕')
  }
}

function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 250)
}

async function runSearch() {
  const q = searchQ.value.trim()
  if (q.length < 2) { searchDropOpen.value = false; return }
  try {
    const r = await data.apif(`/api/search?q=${encodeURIComponent(q)}`)
    const d = await r.json()
    searchResults.value = d.results || []
    searchDropOpen.value = true
  } catch { }
}

const PAGE_MAP = {
  quest: 'quests', npc: 'npcs', location: 'locations', hook: 'hooks',
  inventory: 'inventory', 'key-item': 'inventory', faction: 'factions',
  note: 'notes', session: 'sessions', job: 'jobs',
  bestiary: 'bestiary', map: 'maps', rumour: 'rumours', handout: 'handouts',
}

// Types that have a detail modal — look up the full entity and open it directly
const DETAIL_STORE = {
  quest:     () => data.quests,
  npc:       () => data.npcs,
  location:  () => data.locations,
  hook:      () => data.hooks,
  faction:   () => data.factions,
  inventory: () => data.inventory,
  'key-item':() => data.keyItems,
  job:       () => data.jobs,
  bestiary:  () => data.bestiary,
  map:       () => data.maps,
  rumour:    () => data.rumours,
}

function searchNav(result) {
  searchDropOpen.value = false
  searchQ.value = ''
  const store = DETAIL_STORE[result.type]
  if (store) {
    const entity = store().find(e => String(e.id) === String(result.id))
    if (entity) { ui.openDetail(result.type, entity); return }
  }
  // Fallback: navigate to list page (notes, sessions, etc.)
  const page = PAGE_MAP[result.type] || result.type
  router.push(`/${page}`)
}

function handleOutsideClick(e) {
  if (!e.target.closest('#camp-switcher')) campDropOpen.value = false
  if (!e.target.closest('#topbar-search-wrap')) searchDropOpen.value = false
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))
</script>
