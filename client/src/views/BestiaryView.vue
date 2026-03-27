<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Bestiary</div></div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search creatures…" style="max-width:320px" />
    </div>
    <div v-if="data.loading && !data.bestiary.length" class="card-grid">
      <div v-for="n in 6" :key="n" class="skeleton-card">
        <div class="skeleton-line skeleton-img"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-body"></div>
      </div>
    </div>
    <div v-else class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('bestiary', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Creature</div>
      </div>
      <OverlayCard
        v-for="creature in filteredBestiary"
        :key="creature.id"
        icon="🐉"
        :title="creature.name"
        :status="creature.revealed ? 'active' : null"
        :actions="creatureActions(creature)"
        :is-expanded="expandedId === creature.id"
        :on-toggle="() => toggleExpand(creature.id)"
        @delete="confirmDelete = { id: creature.id, name: creature.name }"
      >
        <img
          v-if="creature.image_path"
          :src="creature.image_path"
          style="width:100%;max-height:180px;object-fit:cover;display:block;margin-bottom:8px;border-radius:var(--radius-sm)"
          alt=""
        />
        <div
          v-if="creature.stats?.cr != null || creature.stats?.ac != null || creature.stats?.hp != null"
          style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px"
        >
          <span v-if="creature.stats?.cr != null" class="tag">CR {{ creature.stats.cr }}</span>
          <span v-if="creature.stats?.ac != null" class="tag">AC {{ creature.stats.ac }}</span>
          <span v-if="creature.stats?.hp != null" class="tag">HP {{ creature.stats.hp }}</span>
        </div>
        <div v-if="creature.description" class="card-overview">{{ stripMd(creature.description) }}</div>
      </OverlayCard>
    </div>
    <div v-if="!data.loading && filteredBestiary.length === 0" class="empty-state">
      <span class="empty-state-icon">🐉</span>
      <div class="empty-state-title">{{ data.bestiary.length ? 'No Matches' : 'Bestiary Empty' }}</div>
      <div class="empty-state-hint">{{ data.bestiary.length ? 'Try a different search or filter.' : 'GM: catalogue the creatures your party may encounter.' }}</div>
    </div>

    <ConfirmDialog
      :is-open="!!confirmDelete"
      entity-type="creature"
      :entity-name="confirmDelete?.name"
      :on-confirm="doDelete"
      :on-cancel="() => confirmDelete = null"
    />
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import OverlayCard from '@/components/OverlayCard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search        = ref('')
const expandedId    = ref(null)
const confirmDelete = ref(null)

const filteredBestiary = computed(() => {
  if (!search.value.trim()) return data.bestiary
  const q = search.value.toLowerCase()
  return data.bestiary.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  )
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function creatureActions(creature) {
  const base = [
    { label: 'Pin', icon: '📌', onClick: () => data.addPin('bestiary', creature.id, creature.name) },
  ]
  if (!campaign.isGm) return base
  return [
    ...base,
    {
      label:   creature.revealed ? 'Hide' : 'Reveal',
      icon:    creature.revealed ? '👁' : '⭐',
      onClick: () => revealCreature(creature.id, !creature.revealed),
    },
    { label: 'Edit',   icon: '✏️', onClick: () => ui.openGmEdit('bestiary', creature.id, creature) },
    { type: 'divider' },
    { label: 'Delete', icon: '🗑️', variant: 'danger', onClick: () => {} },
  ]
}

async function revealCreature(id, val) {
  await data.apif(`/api/bestiary/${id}/reveal`, { method: 'PUT', body: JSON.stringify({ revealed: val }) })
  ui.showToast(val ? 'Creature revealed' : 'Creature hidden', '', val ? '⭐' : '👁')
  await data.loadBestiary()
}

async function doDelete() {
  await data.deleteItem('bestiary', confirmDelete.value.id)
  await data.loadBestiary()
  confirmDelete.value = null
}

onMounted(() => { if (!data.bestiary.length) data.loadBestiary() })
</script>
