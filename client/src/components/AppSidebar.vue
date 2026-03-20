<template>
  <div id="sidebar" :class="{ 'mobile-open': ui.sidebarOpen }">
    <div class="sidebar-top">
      <div class="sidebar-logo">⚔ THE CHRONICLE</div>
      <div class="sidebar-user">{{ userLabel }}</div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <!-- Lobby -->
      <RouterLink to="/home" class="nav-item" active-class="active" @click="goHome">
        <span class="nav-icon">⌂</span>Home
      </RouterLink>

      <!-- Campaign section -->
      <div v-if="campaign.activeCampaign">
        <div class="nav-section" :class="{ collapsed: collapsed.campaign }" @click="toggle('campaign')">
          Campaign
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.campaign }">
          <RouterLink to="/dashboard" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">⚔</span>Dashboard
          </RouterLink>
          <RouterLink to="/quests" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">📜</span>Quests
          </RouterLink>
          <RouterLink to="/jobs" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">📌</span>Job Board
          </RouterLink>
        </div>

        <div class="nav-section" :class="{ collapsed: collapsed.world }" @click="toggle('world')">
          World
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.world }">
          <RouterLink to="/npcs" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">👤</span>NPCs
          </RouterLink>
          <RouterLink to="/locations" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🗺</span>Locations
          </RouterLink>
          <RouterLink to="/hooks" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🪝</span>Hooks
          </RouterLink>
          <RouterLink to="/factions" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">⚑</span>Factions
          </RouterLink>
          <RouterLink to="/timeline" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">⏳</span>Timeline
          </RouterLink>
          <RouterLink to="/calendar" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">📅</span>Calendar
          </RouterLink>
          <RouterLink to="/maps" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🗾</span>Maps
          </RouterLink>
          <RouterLink to="/mindmap" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🕸</span>Mindmap
          </RouterLink>
        </div>

        <div class="nav-section" :class="{ collapsed: collapsed.player }" @click="toggle('player')">
          Player
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.player }">
          <RouterLink to="/handouts" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">📄</span>Handouts
            <span v-if="ui.unreadHandoutCount > 0" class="nav-badge">{{ ui.unreadHandoutCount }}</span>
          </RouterLink>
          <RouterLink to="/inventory" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🎒</span>Inventory
          </RouterLink>
          <RouterLink to="/bestiary" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🐉</span>Bestiary
          </RouterLink>
          <RouterLink to="/rumours" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">💬</span>Rumours
          </RouterLink>
          <RouterLink to="/sessions" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🎲</span>Sessions
          </RouterLink>
          <RouterLink to="/good-boy-cards" class="nav-item" active-class="active" @click="ui.closeSidebar(); ui.cardBadge = 0">
            <span class="nav-icon">🃏</span>Cards
            <span v-if="ui.cardBadge > 0" class="nav-badge">{{ ui.cardBadge }}</span>
          </RouterLink>
        </div>

        <div class="nav-section" :class="{ collapsed: collapsed.tools }" @click="toggle('tools')">
          Tools
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.tools }">
          <RouterLink to="/character-sheet" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🧙</span>Sheet
          </RouterLink>
          <RouterLink to="/notes" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">📝</span>Notes
          </RouterLink>
          <RouterLink to="/theory-board" class="nav-item" active-class="active" @click="ui.closeSidebar()">
            <span class="nav-icon">🔍</span>Theory Board
          </RouterLink>
        </div>

        <!-- GM section -->
        <template v-if="campaign.isGm">
          <div class="nav-section" :class="{ collapsed: collapsed.gm }" @click="toggle('gm')">
            GM
          </div>
          <div class="nav-group" :class="{ collapsed: collapsed.gm }">
            <RouterLink to="/gm-dashboard" class="nav-item gm-only" active-class="active" @click="ui.closeSidebar()">
              <span class="nav-icon">👁</span>GM Dashboard
            </RouterLink>
            <RouterLink to="/combat" class="nav-item gm-only" active-class="active" @click="ui.closeSidebar()">
              <span class="nav-icon">⚔</span>Combat
            </RouterLink>
          </div>
        </template>
      </div>

      <!-- Settings always visible -->
      <RouterLink to="/settings" class="nav-item" active-class="active" @click="ui.closeSidebar()">
        <span class="nav-icon">⚙</span>Settings
      </RouterLink>

      <!-- Logout -->
      <div class="nav-item" style="margin-top:auto;color:var(--text3)" @click="logout">
        <span class="nav-icon">⇥</span>Logout
      </div>
    </nav>
    <!-- Sidebar collapse toggle -->
    <div class="sidebar-collapse-btn" @click="ui.toggleSidebarCollapse()" :title="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
      <span class="sidebar-collapse-icon">{{ ui.sidebarCollapsed ? '›' : '‹' }}</span>
      <span class="sidebar-collapse-label">Collapse</span>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const router = useRouter()

const userLabel = computed(() => {
  const u = auth.currentUser
  if (!u) return ''
  return (u.character_name || u.username) + (u.character_class ? ` · ${u.character_class}` : '')
})

// Collapsible nav sections
const saved = JSON.parse(localStorage.getItem('nav_collapsed') || '{}')
const collapsed = reactive({
  campaign: !!saved.Campaign,
  world: !!saved.World,
  player: !!saved.Player,
  tools: !!saved.Tools,
  gm: !!saved.GM,
})

function toggle(section) {
  collapsed[section] = !collapsed[section]
  const labels = { campaign: 'Campaign', world: 'World', player: 'Player', tools: 'Tools', gm: 'GM' }
  const state = JSON.parse(localStorage.getItem('nav_collapsed') || '{}')
  state[labels[section]] = collapsed[section]
  localStorage.setItem('nav_collapsed', JSON.stringify(state))
}

function goHome() {
  campaign.leaveCampaign()
  ui.closeSidebar()
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
