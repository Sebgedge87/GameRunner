<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Quests</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search quests…"
        style="max-width:320px"
      />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('quest', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Quest</div>
      </div>

      <div
        v-for="quest in filteredQuests"
        :key="quest.id"
        class="card"
        :class="{ hidden: quest.hidden }"
        @click="ui.openDetail('quest', quest)"
      >
        <div class="card-body">
          <div class="card-title">{{ quest.title }}</div>
          <div class="card-meta">
            <span v-if="quest.type" class="tag">{{ quest.type }}</span>
            <span class="tag" :class="statusClass(quest.status)">{{ quest.status }}</span>
          </div>
          <div v-if="quest.description" class="card-overview">{{ quest.description }}</div>
          <div v-if="quest.location" class="card-meta">
            <span style="opacity:0.6;font-size:0.8em">📍 {{ quest.location }}</span>
          </div>
          <div v-if="quest.progress != null" class="progress-bar" style="margin-top:6px">
            <div class="progress-fill" :style="`width:${quest.progress}%`"></div>
          </div>
          <div v-if="quest.connected_to?.length" class="card-meta" style="margin-top:6px">
            <span style="opacity:0.5;font-size:0.75em">Linked: {{ quest.connected_to.join(', ') }}</span>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('quest', quest.id, quest.title)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="quest.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('quest', quest.id)"
            >{{ quest.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('quest', quest.id, quest.title)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('quest', quest.id, quest)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('quest', quest.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredQuests.length === 0" class="empty-state">
      No quests found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const search = ref('')
const activeTab = ref('all')

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const filteredQuests = computed(() => {
  let list = data.quests
  if (activeTab.value !== 'all') list = list.filter(q => q.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(quest =>
      quest.title?.toLowerCase().includes(q) ||
      quest.type?.toLowerCase().includes(q) ||
      quest.location?.toLowerCase().includes(q)
    )
  }
  return list
})

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'active') return 'tag-active'
  if (s === 'completed') return 'tag-completed'
  if (s === 'failed') return 'tag-inactive'
  return ''
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadQuests()
}

async function deleteItem(type, id) {
  if (!await ui.confirm('Delete this quest?')) return
  await data.deleteItem(type, id)
  await data.loadQuests()
}

onMounted(() => {
  if (!data.quests.length) data.loadQuests()
})
</script>
