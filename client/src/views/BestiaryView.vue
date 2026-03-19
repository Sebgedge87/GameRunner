<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Bestiary</div></div>
    <div class="search-row" style="margin-bottom:16px">
      <input v-model="search" class="form-input" placeholder="Search creatures…" style="max-width:320px" />
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('bestiary', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Creature</div>
      </div>
      <EntityCard
        v-for="creature in filteredBestiary" :key="creature.id"
        :entity="creature" type="bestiary" :title="creature.name" icon="🐉"
        :image="creature.image_path || null"
        :expanded="expandedId === creature.id" :reload-fn="data.loadBestiary"
        @toggle="toggleExpand(creature.id)"
      >
        <template #badges>
          <span v-if="creature.stats?.cr != null" class="tag">CR {{ creature.stats.cr }}</span>
          <span v-if="creature.stats?.ac != null" class="tag">AC {{ creature.stats.ac }}</span>
          <span v-if="creature.stats?.hp != null" class="tag">HP {{ creature.stats.hp }}</span>
        </template>
        <template #body>
          <div v-if="creature.description" class="card-overview">{{ stripMd(creature.description) }}</div>
        </template>
        <template #actions>
          <button v-if="campaign.isGm" class="btn btn-sm" @click.stop="revealCreature(creature.id, !creature.revealed)">{{ creature.revealed ? '👁 Hide' : '⭐ Reveal' }}</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredBestiary.length === 0" class="empty-state">No creatures found.</div>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const search = ref('')
const expandedId = ref(null)

const filteredBestiary = computed(() => {
  if (!search.value.trim()) return data.bestiary
  const q = search.value.toLowerCase()
  return data.bestiary.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  )
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

async function revealCreature(id, val) {
  await data.apif(`/api/bestiary/${id}/reveal`, { method: 'PUT', body: JSON.stringify({ revealed: val }) })
  ui.showToast(val ? 'Creature revealed' : 'Creature hidden', '', val ? '⭐' : '👁')
  await data.loadBestiary()
}

onMounted(() => { if (!data.bestiary.length) data.loadBestiary() })
</script>
