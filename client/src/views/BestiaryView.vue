<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Bestiary</div>
    </div>

    <div class="search-row" style="margin-bottom:16px">
      <input
        v-model="search"
        class="form-input"
        placeholder="Search creatures&#8230;"
        style="max-width:320px"
      />
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('bestiary', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Creature</div>
      </div>

      <div
        v-for="creature in filteredBestiary"
        :key="creature.id"
        class="card"
        :class="{ hidden: creature.hidden }"
        @click="ui.openDetail('bestiary', creature)"
      >
        <div v-if="creature.image" class="card-image">
          <img :src="creature.image" :alt="creature.name" style="width:100%;height:120px;object-fit:cover;border-radius:4px 4px 0 0" />
        </div>
        <div class="card-body">
          <div class="card-title">{{ creature.name }}</div>
          <div class="card-meta" style="flex-wrap:wrap;gap:4px">
            <span v-if="creature.cr != null" class="tag">CR {{ creature.cr }}</span>
            <span v-if="creature.ac != null" class="tag">AC {{ creature.ac }}</span>
            <span v-if="creature.hp != null" class="tag">HP {{ creature.hp }}</span>
          </div>
          <div v-if="creature.description" style="font-size:0.82em;opacity:0.7;margin-top:6px;line-height:1.4">
            {{ creature.description }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="creature.hidden ? 'Reveal to players' : 'Hide from players'"
              @click="toggleHidden('bestiary', creature.id)"
            >{{ creature.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('bestiary', creature.id, creature)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('bestiary', creature.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredBestiary.length === 0" class="empty-state">
      No creatures found.
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

const filteredBestiary = computed(() => {
  if (!search.value.trim()) return data.bestiary
  const q = search.value.toLowerCase()
  return data.bestiary.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q)
  )
})

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadBestiary()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this creature?')) return
  await data.deleteItem(type, id)
  await data.loadBestiary()
}

onMounted(() => {
  if (!data.bestiary.length) data.loadBestiary()
})
</script>
