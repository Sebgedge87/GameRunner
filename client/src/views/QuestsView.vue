<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Quests</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search quests…" style="max-width:320px" />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs" :key="tab.value"
        class="filter-tab" :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <div v-if="data.loading && !data.quests.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-sub"></div>
        <div class="skeleton-line skeleton-body"></div>
      </div>
    </div>
    <div v-else class="card-grid">
      <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('quest', null, {})">
        <span class="create-card-icon">+</span>
        <span>New Quest</span>
      </div>
      <QuestCard
        v-for="quest in filteredQuests"
        :key="quest.id"
        :quest="quest"
        :expanded="expandedId === quest.id"
        @toggle="toggleExpand(quest.id)"
      />
    </div>

    <div v-if="!data.loading && filteredQuests.length === 0" class="empty-state">
      <span class="empty-state-icon">⚔️</span>
      <div class="empty-state-title">{{ data.quests.length ? 'No Matches' : 'No Quests Yet' }}</div>
      <div class="empty-state-hint">{{ data.quests.length ? 'Try a different search or filter.' : 'GM: use + New Quest to start your first adventure.' }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import QuestCard from '@/components/QuestCard.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()

const search     = ref('')
const activeTab  = ref('all')
const expandedId = ref(null)

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

// Edit form state
const ef = reactive({
  title: '', description: '', status: 'active', quest_type: 'main',
  location: '', connected_npcs: '', connected_quests: '',
  reward_gold: '', reward_xp: '', reward_items: '',
  urgency: '', expires_in: '',
})

const filteredQuests = computed(() => {
  let list = data.quests
  if (activeTab.value !== 'all') list = list.filter(q => q.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(quest =>
      quest.title?.toLowerCase().includes(q) ||
      quest.quest_type?.toLowerCase().includes(q) ||
      quest.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}


onMounted(() => {
  if (!data.quests.length) data.loadQuests()
  if (!data.locations.length) data.loadLocations()
  if (!data.factions.length) data.loadFactions()
  if (!data.npcs.length) data.loadNpcs()
})
</script>
