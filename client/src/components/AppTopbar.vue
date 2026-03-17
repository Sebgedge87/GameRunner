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
            {{ c.name }}
            <span v-if="c.my_role === 'gm'" style="font-size:10px;color:var(--accent);margin-left:auto">GM</span>
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
import { ref } from 'vue'
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
}

function searchNav(result) {
  searchDropOpen.value = false
  searchQ.value = ''
  const page = PAGE_MAP[result.type] || result.type
  router.push(`/${page}`)
}

// Close camp drop on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#camp-switcher')) campDropOpen.value = false
  if (!e.target.closest('#topbar-search-wrap')) searchDropOpen.value = false
})
</script>
