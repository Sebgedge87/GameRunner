<template>
  <button
    v-if="campaign.isGm && showFab"
    id="gm-fab"
    class="show"
    @click="openCreate"
    :title="`Add ${fabLabel}`"
  >
    +
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const campaign = useCampaignStore()
const ui = useUiStore()
const route = useRoute()

const GM_PAGES = ['quests', 'npcs', 'locations', 'hooks', 'factions', 'timeline',
  'inventory', 'maps', 'bestiary', 'rumours', 'jobs', 'sessions', 'handouts']

const PAGE_TYPE = {
  quests: 'quest', npcs: 'npc', locations: 'location', hooks: 'hook',
  factions: 'faction', timeline: 'timeline', inventory: 'inventory',
  maps: 'map', bestiary: 'bestiary', rumours: 'rumour', jobs: 'job',
  sessions: 'session', handouts: 'handout',
}

const currentPage = computed(() => route.path.replace('/', ''))
const showFab = computed(() => GM_PAGES.includes(currentPage.value))
const fabLabel = computed(() => PAGE_TYPE[currentPage.value] || currentPage.value)

function openCreate() {
  ui.openGmEdit(fabLabel.value, null, null)
}
</script>

<style scoped>
#gm-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  color: var(--accent2);
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--color-shadow-menu);
  transition: transform .15s, background .2s;
  z-index: 100;
}
#gm-fab:hover { background: color-mix(in srgb, var(--accent-dim) 80%, white); transform: scale(1.05); }
</style>
