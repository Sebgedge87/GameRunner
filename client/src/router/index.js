import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'

const C = true // requiresCampaign shorthand

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/HomeView.vue'), meta: { auth: true } },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/quests', component: () => import('@/views/QuestsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/jobs', component: () => import('@/views/JobsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/npcs', component: () => import('@/views/NpcsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/locations', component: () => import('@/views/LocationsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/hooks', component: () => import('@/views/HooksView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/factions', component: () => import('@/views/FactionsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/timeline', component: () => import('@/views/TimelineView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/calendar', component: () => import('@/views/CalendarView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/maps', component: () => import('@/views/MapsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/mindmap', component: () => import('@/views/MindmapView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/handouts', component: () => import('@/views/HandoutsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/inventory', component: () => import('@/views/InventoryView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/bestiary', component: () => import('@/views/BestiaryView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/rumours', component: () => import('@/views/RumoursView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/sessions', component: () => import('@/views/SessionsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/characters', component: () => import('@/views/CharactersView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/character-sheet', component: () => import('@/views/CharacterSheetView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/notes', component: () => import('@/views/NotesView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/theory-board', component: () => import('@/views/TheoryBoardView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/gm-dashboard', component: () => import('@/views/GmDashboardView.vue'), meta: { auth: true, requiresCampaign: C, gm: true } },
  { path: '/combat', component: () => import('@/views/CombatView.vue'), meta: { auth: true, requiresCampaign: C, gm: true } },
  { path: '/good-boy-cards', component: () => import('@/views/GoodBoyCardsView.vue'), meta: { auth: true, requiresCampaign: C } },
  { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { auth: true } },
  // Developer admin — isolated from standard auth, not linked in any nav
  { path: '/dev-admin', component: () => import('@/views/DeveloperConfigView.vue'), meta: { devOnly: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from) => {
  if (to.meta.auth) {
    const auth = useAuthStore()
    if (!auth.token) return '/login'
    const campaign = useCampaignStore()
    if (to.meta.requiresCampaign && !campaign.activeCampaign) return '/home'
    if (to.meta.gm && !campaign.isGm) return '/home'
  }

  // Native View Transitions API — simulate physical page turns
  if (
    document.startViewTransition &&
    from.name !== undefined &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(() => nextTick())
    // Don't return the transition — guard must return undefined to allow navigation
  }
})

export default router
