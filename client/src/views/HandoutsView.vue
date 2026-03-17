<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Handouts</div>
      <div class="page-sub">Documents &amp; artefacts</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search handouts…"
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
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('handout', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Handout</div>
      </div>

      <div
        v-for="handout in filteredHandouts"
        :key="handout.id"
        class="card"
        :class="{ hidden: handout.hidden }"
        @click="ui.openDetail('handout', handout)"
      >
        <div v-if="handout.image_url" class="card-img">
          <img :src="handout.image_url" :alt="handout.title" style="width:100%;height:120px;object-fit:cover;border-radius:4px 4px 0 0" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ handout.title }}</div>
          <div v-if="handout.type" class="card-meta">
            <span class="tag">{{ handout.type }}</span>
          </div>
          <div v-if="handout.session_delivered" class="card-meta" style="font-size:0.8em;opacity:0.6;margin-top:4px">
            Session {{ handout.session_delivered }}
          </div>
          <div v-if="handout.description" class="card-meta" style="font-size:0.85em;opacity:0.75;margin-top:4px">
            {{ handout.description }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('handout', handout.id, handout.title)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="handout.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden(handout.id)"
            >{{ handout.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('handout', handout.id, handout.title)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('handout', handout.id, handout)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem(handout.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredHandouts.length === 0" class="empty-state">
      No handouts found.
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
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'map', label: 'Map' },
  { value: 'letter', label: 'Letter' },
]

const filteredHandouts = computed(() => {
  let list = data.handouts
  if (activeTab.value !== 'all') list = list.filter(h => h.type?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(h =>
      h.title?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q) ||
      h.type?.toLowerCase().includes(q)
    )
  }
  return list
})

async function toggleHidden(id) {
  await data.toggleHidden('handout', id)
  await data.loadHandouts()
}

async function deleteItem(id) {
  if (!await ui.confirm('Delete this handout?')) return
  await data.deleteItem('handout', id)
  await data.loadHandouts()
}

onMounted(() => {
  if (!data.handouts.length) data.loadHandouts()
})
</script>
