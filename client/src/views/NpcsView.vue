<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">NPCs</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search NPCs…"
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
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('npc', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add NPC</div>
      </div>

      <div
        v-for="npc in filteredNpcs"
        :key="npc.id"
        class="card"
        :class="{ hidden: npc.hidden }"
        @click="ui.openDetail('npc', npc)"
      >
        <div v-if="npc.image" class="card-img">
          <img :src="npc.image" :alt="npc.name" style="width:100%;height:120px;object-fit:cover;border-radius:4px 4px 0 0" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ npc.name }}</div>
          <div class="card-meta">
            <span v-if="npc.role" class="tag">{{ npc.role }}</span>
            <span v-if="npc.disposition" class="tag" :class="dispositionClass(npc.disposition)">{{ npc.disposition }}</span>
          </div>
          <div v-if="npc.faction" class="card-meta">
            <span style="opacity:0.6;font-size:0.8em">⚔️ {{ npc.faction }}</span>
          </div>
          <div v-if="npc.location" class="card-meta">
            <span style="opacity:0.6;font-size:0.8em">📍 {{ npc.location }}</span>
          </div>
          <div v-if="npc.connected_to?.length" class="card-meta" style="margin-top:4px">
            <span style="opacity:0.5;font-size:0.75em">Linked: {{ npc.connected_to.join(', ') }}</span>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('npc', npc.id, npc.name)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="npc.revealed ? 'Hide from players' : 'Reveal to players'"
              @click="revealNpc(npc.id, !npc.revealed)"
            >{{ npc.revealed ? '👁' : '⭐' }}</button>
            <button
              class="btn btn-sm"
              :title="npc.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('npc', npc.id)"
            >{{ npc.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Share" @click="ui.openShare('npc', npc.id, npc.name)">🔗</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('npc', npc.id, npc)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('npc', npc.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredNpcs.length === 0" class="empty-state">
      No NPCs found.
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
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
]

const filteredNpcs = computed(() => {
  let list = data.npcs
  if (activeTab.value !== 'all') list = list.filter(n => n.disposition?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(n =>
      n.name?.toLowerCase().includes(q) ||
      n.role?.toLowerCase().includes(q) ||
      n.faction?.toLowerCase().includes(q) ||
      n.location?.toLowerCase().includes(q)
    )
  }
  return list
})

function dispositionClass(disposition) {
  const d = disposition?.toLowerCase()
  if (d === 'friendly' || d === 'allied') return 'tag-active'
  if (d === 'hostile' || d === 'unfriendly') return 'tag-inactive'
  return ''
}

async function revealNpc(id, val) {
  await data.apif(`/api/npcs/${id}/reveal`, { method: 'PUT', body: JSON.stringify({ revealed: val }) })
  ui.showToast(val ? 'NPC revealed to players' : 'NPC hidden', '', val ? '⭐' : '👁')
  await data.loadNpcs()
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadNpcs()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this NPC?')) return
  await data.deleteItem(type, id)
  await data.loadNpcs()
}

onMounted(() => {
  if (!data.npcs.length) data.loadNpcs()
})
</script>
