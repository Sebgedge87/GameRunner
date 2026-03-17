import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/HomeView.vue'), meta: { auth: true } },
  { path: '/dashboard', component: () => import('@/views/DashboardView.vue'), meta: { auth: true } },
  { path: '/quests', component: () => import('@/views/QuestsView.vue'), meta: { auth: true } },
  { path: '/jobs', component: () => import('@/views/JobsView.vue'), meta: { auth: true } },
  { path: '/npcs', component: () => import('@/views/NpcsView.vue'), meta: { auth: true } },
  { path: '/locations', component: () => import('@/views/LocationsView.vue'), meta: { auth: true } },
  { path: '/hooks', component: () => import('@/views/HooksView.vue'), meta: { auth: true } },
  { path: '/factions', component: () => import('@/views/FactionsView.vue'), meta: { auth: true } },
  { path: '/timeline', component: () => import('@/views/TimelineView.vue'), meta: { auth: true } },
  { path: '/maps', component: () => import('@/views/MapsView.vue'), meta: { auth: true } },
  { path: '/mindmap', component: () => import('@/views/MindmapView.vue'), meta: { auth: true } },
  { path: '/handouts', component: () => import('@/views/HandoutsView.vue'), meta: { auth: true } },
  { path: '/inventory', component: () => import('@/views/InventoryView.vue'), meta: { auth: true } },
  { path: '/bestiary', component: () => import('@/views/BestiaryView.vue'), meta: { auth: true } },
  { path: '/rumours', component: () => import('@/views/RumoursView.vue'), meta: { auth: true } },
  { path: '/sessions', component: () => import('@/views/SessionsView.vue'), meta: { auth: true } },
  { path: '/character-sheet', component: () => import('@/views/CharacterSheetView.vue'), meta: { auth: true } },
  { path: '/notes', component: () => import('@/views/NotesView.vue'), meta: { auth: true } },
  { path: '/theory-board', component: () => import('@/views/TheoryBoardView.vue'), meta: { auth: true } },
  { path: '/gm-dashboard', component: () => import('@/views/GmDashboardView.vue'), meta: { auth: true, gm: true } },
  { path: '/combat', component: () => import('@/views/CombatView.vue'), meta: { auth: true, gm: true } },
  { path: '/settings', component: () => import('@/views/SettingsView.vue'), meta: { auth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.auth) {
    const auth = useAuthStore()
    if (!auth.token) return '/login'
  }
})

export default router
