<template>
  <div id="sidebar" :class="{ 'mobile-open': ui.sidebarOpen }">
    <div class="sidebar-top">
      <div class="sidebar-logo">⚔ THE CHRONICLE</div>
      <div class="sidebar-user">{{ userLabel }}</div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <!-- Lobby -->
      <RouterLink to="/home" class="nav-item" active-class="active" @click="goHome" :title="ui.sidebarCollapsed ? 'Main Menu' : ''">
        <span class="nav-icon">⌂</span>Main Menu
      </RouterLink>

      <!-- Campaign section -->
      <div v-if="campaign.activeCampaign">
        <!-- Campaign Home section -->
        <div class="nav-section" :class="{ collapsed: collapsed.campaign_home }" @click="toggle('campaign_home')">
          Campaign Home
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.campaign_home }">
          <RouterLink to="/dashboard" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Campaign Home' : ''">
            <span class="nav-icon">⚔</span>Campaign Home
          </RouterLink>
          <template v-if="campaign.isGm">
            <RouterLink to="/gm-dashboard" class="nav-item gm-only" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'GM Dashboard' : ''">
              <span class="nav-icon">👁</span>GM Dashboard
            </RouterLink>
            <RouterLink to="/combat" class="nav-item gm-only" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Combat' : ''">
              <span class="nav-icon">⚔</span>Combat
            </RouterLink>
          </template>
        </div>

        <!-- World -->
        <div class="nav-section" :class="{ collapsed: collapsed.world }" @click="toggle('world')">
          World
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.world }">
          <RouterLink to="/npcs" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'NPCs' : ''">
            <span class="nav-icon">👤</span>NPCs
          </RouterLink>
          <RouterLink to="/locations" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Locations' : ''">
            <span class="nav-icon">🗺</span>Locations
          </RouterLink>
          <RouterLink to="/factions" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Factions' : ''">
            <span class="nav-icon">⚑</span>Factions
          </RouterLink>
          <RouterLink to="/bestiary" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Bestiary' : ''">
            <span class="nav-icon">🐉</span>Bestiary
          </RouterLink>
        </div>

        <!-- Chronology -->
        <div class="nav-section" :class="{ collapsed: collapsed.chronology }" @click="toggle('chronology')">
          Chronology
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.chronology }">
          <RouterLink to="/timeline" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Timeline' : ''">
            <span class="nav-icon">⏳</span>Timeline
          </RouterLink>
          <RouterLink to="/calendar" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Calendar' : ''">
            <span class="nav-icon">📅</span>Calendar
          </RouterLink>
          <RouterLink to="/sessions" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Sessions' : ''">
            <span class="nav-icon">🎲</span>Sessions
          </RouterLink>
        </div>

        <!-- Knowledge -->
        <div class="nav-section" :class="{ collapsed: collapsed.knowledge }" @click="toggle('knowledge')">
          Knowledge
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.knowledge }">
          <RouterLink to="/maps" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Maps' : ''">
            <span class="nav-icon">🗾</span>Maps
          </RouterLink>
          <RouterLink to="/mindmap" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Mindmap' : ''">
            <span class="nav-icon">🕸</span>Mindmap
          </RouterLink>
          <RouterLink to="/theory-board" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Theory Board' : ''">
            <span class="nav-icon">🔍</span>Theory Board
          </RouterLink>
          <RouterLink to="/notes" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Notes' : ''">
            <span class="nav-icon">📝</span>Notes
          </RouterLink>
        </div>

        <!-- Player Bag -->
        <div class="nav-section" :class="{ collapsed: collapsed.player_bag }" @click="toggle('player_bag')">
          Player Bag
        </div>
        <div class="nav-group" :class="{ collapsed: collapsed.player_bag }">
          <RouterLink to="/handouts" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Handouts' : ''">
            <span class="nav-icon">📄</span>Handouts
            <span v-if="ui.unreadHandoutCount > 0" class="nav-badge">{{ ui.unreadHandoutCount }}</span>
          </RouterLink>
          <RouterLink to="/inventory" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Inventory' : ''">
            <span class="nav-icon">🎒</span>Inventory
          </RouterLink>
          <RouterLink to="/good-boy-cards" class="nav-item" active-class="active" @click="ui.closeSidebar(); ui.cardBadge = 0" :title="ui.sidebarCollapsed ? 'Cards' : ''">
            <span class="nav-icon">🃏</span>Cards
            <span v-if="ui.cardBadge > 0" class="nav-badge">{{ ui.cardBadge }}</span>
          </RouterLink>
          <RouterLink to="/hooks-rumours" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Hooks & Rumours' : ''">
            <span class="nav-icon">🪝</span>Hooks & Rumours
          </RouterLink>
          <!-- Keep Quests and Characters here as they are extremely relevant to players -->
          <RouterLink to="/quests" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Quests' : ''">
            <span class="nav-icon">📜</span>Quests
          </RouterLink>
          <RouterLink to="/characters" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Characters' : ''">
            <span class="nav-icon">🧙</span>Characters
          </RouterLink>
        </div>

      </div>

      <!-- Settings always visible -->
      <RouterLink to="/settings" class="nav-item" active-class="active" @click="ui.closeSidebar()" :title="ui.sidebarCollapsed ? 'Settings' : ''">
        <span class="nav-icon">⚙</span>Settings
      </RouterLink>

      <!-- Logout -->
      <div class="nav-item" style="margin-top:auto;color:var(--text3)" @click="confirmLogout" :title="ui.sidebarCollapsed ? 'Logout' : ''">
        <span class="nav-icon">⇥</span>Logout
      </div>

      <!-- Logout confirmation dialog -->
      <div v-if="showLogoutConfirm" class="logout-confirm-overlay" @click.self="showLogoutConfirm = false">
        <div class="logout-confirm-box">
          <div class="logout-confirm-title">Log out?</div>
          <div class="logout-confirm-sub">Your session will be invalidated on the server.</div>
          <div class="logout-confirm-actions">
            <button class="btn btn-danger" @click="logout">Log Out</button>
            <button class="btn" @click="showLogoutConfirm = false">Cancel</button>
          </div>
        </div>
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
import { computed, reactive, ref } from 'vue'
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
  campaign_home: !!saved['Campaign Home'],
  world: !!saved.World,
  chronology: !!saved.Chronology,
  knowledge: !!saved.Knowledge,
  player_bag: !!saved['Player Bag'],
})

function toggle(section) {
  collapsed[section] = !collapsed[section]
  const labels = { campaign_home: 'Campaign Home', world: 'World', chronology: 'Chronology', knowledge: 'Knowledge', player_bag: 'Player Bag' }
  const state = JSON.parse(localStorage.getItem('nav_collapsed') || '{}')
  state[labels[section]] = collapsed[section]
  localStorage.setItem('nav_collapsed', JSON.stringify(state))
}

function goHome() {
  campaign.leaveCampaign()
  ui.closeSidebar()
}

const showLogoutConfirm = ref(false)

function confirmLogout() {
  showLogoutConfirm.value = true
}

async function logout() {
  showLogoutConfirm.value = false
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.logout-confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.logout-confirm-box {
  background: var(--surface, #1a1a24);
  border: 1px solid var(--border, #2a2a3a);
  border-radius: 8px;
  padding: 24px;
  min-width: 260px;
  max-width: 320px;
}
.logout-confirm-title {
  font-size: 1.1em;
  font-weight: 700;
  margin-bottom: 6px;
}
.logout-confirm-sub {
  font-size: 0.82em;
  opacity: 0.6;
  margin-bottom: 18px;
}
.logout-confirm-actions {
  display: flex;
  gap: 10px;
}
</style>
