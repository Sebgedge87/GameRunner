<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Plot Hooks</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search hooks…"
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
      >{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('hook', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Hook</div>
      </div>

      <div
        v-for="hook in filteredHooks"
        :key="hook.id"
        class="card"
        :class="{ hidden: hook.hidden }"
        @click="ui.openDetail('hook', hook)"
      >
        <div class="card-body">
          <div class="card-title">{{ hook.title }}</div>
          <div class="card-meta">
            <span v-if="hook.type" class="tag">{{ hook.type }}</span>
            <span v-if="hook.status" class="tag" :class="statusClass(hook.status)">{{ hook.status }}</span>
          </div>
          <div v-if="hook.session_delivered" class="card-meta">
            <span style="opacity:0.6;font-size:0.8em">Delivered: Session {{ hook.session_delivered }}</span>
          </div>
          <div v-if="hook.connected_to?.length" class="card-meta" style="margin-top:4px">
            <span style="opacity:0.5;font-size:0.75em">Linked: {{ hook.connected_to.join(', ') }}</span>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('hook', hook.id, hook.title)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="hook.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('hook', hook.id)"
            >{{ hook.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('hook', hook.id, hook.title)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('hook', hook.id, hook)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('hook', hook.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredHooks.length === 0" class="empty-state">
      No hooks found.
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
  { value: 'delivered', label: 'Delivered' },
  { value: 'missed', label: 'Missed' },
  { value: 'expired', label: 'Expired' },
]

const filteredHooks = computed(() => {
  let list = data.hooks
  if (activeTab.value !== 'all') list = list.filter(h => h.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(h =>
      h.title?.toLowerCase().includes(q) ||
      h.type?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'active' || s === 'delivered') return 'tag-active'
  if (s === 'missed' || s === 'expired') return 'tag-inactive'
  return ''
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadHooks()
}

async function deleteItem(type, id) {
  if (!await ui.confirm('Delete this hook?')) return
  await data.deleteItem(type, id)
  await data.loadHooks()
}

onMounted(() => {
  if (!data.hooks.length) data.loadHooks()
})
</script>
