<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Inventory</div>
      <div class="page-sub">Party gear &amp; key items</div>
    </div>

    <!-- Party Inventory -->
    <div class="section-divider">Party Inventory</div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="invSearch" class="form-input" placeholder="Search items…" style="max-width:300px" />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in invTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: invTab === tab.value }"
        @click="invTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('inventory', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Item</div>
      </div>

      <div
        v-for="item in filteredInventory"
        :key="item.id"
        class="card"
        :class="{ hidden: item.hidden }"
        @click="ui.openDetail('inventory', item)"
      >
        <div class="card-body">
          <div class="card-title">{{ item.name }}</div>
          <div class="card-meta">
            <span v-if="item.type" class="tag">{{ item.type }}</span>
            <span v-if="item.rarity" class="tag" :class="rarityClass(item.rarity)">{{ item.rarity }}</span>
          </div>
          <div v-if="item.quantity != null" class="card-meta" style="font-size:0.85em;opacity:0.7;margin-top:4px">
            Qty: {{ item.quantity }}
          </div>
          <div v-if="item.description" class="card-meta" style="font-size:0.82em;opacity:0.65;margin-top:4px">
            {{ item.description }}
          </div>
          <div v-if="item.weight != null" class="card-meta" style="font-size:0.8em;opacity:0.55;margin-top:4px">
            Weight: {{ item.weight }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('inventory', item.id, item.name)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="item.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('inventory', item.id)"
            >{{ item.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('inventory', item.id, item)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('inventory', item.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredInventory.length === 0" class="empty-state" style="margin-bottom:24px">
      No inventory items found.
    </div>

    <!-- Key Items -->
    <div class="section-divider" style="margin-top:24px">Key Items</div>

    <div class="search-row" style="margin-bottom:16px">
      <input v-model="keySearch" class="form-input" placeholder="Search key items…" style="max-width:300px" />
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('key-item', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Key Item</div>
      </div>

      <div
        v-for="item in filteredKeyItems"
        :key="item.id"
        class="card"
        :class="{ hidden: item.hidden }"
        @click="ui.openDetail('key-item', item)"
      >
        <div class="card-body">
          <div class="card-title">{{ item.name }}</div>
          <div class="card-meta">
            <span v-if="item.type" class="tag">{{ item.type }}</span>
          </div>
          <div v-if="item.description" class="card-meta" style="font-size:0.82em;opacity:0.65;margin-top:4px">
            {{ item.description }}
          </div>
          <div v-if="item.connected_to?.length" class="card-meta" style="font-size:0.75em;opacity:0.5;margin-top:4px">
            Linked: {{ item.connected_to.join(', ') }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('key-item', item.id, item.name)">📌</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="item.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('key-item', item.id)"
            >{{ item.hidden ? '👁' : '🙈' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('key-item', item.id, item)">✏️</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('key-item', item.id)">🗑</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredKeyItems.length === 0" class="empty-state">
      No key items found.
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

const invSearch = ref('')
const invTab = ref('all')
const keySearch = ref('')

const invTabs = [
  { value: 'all', label: 'All' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'armour', label: 'Armour' },
  { value: 'gear', label: 'Gear' },
  { value: 'consumable', label: 'Consumable' },
]

const filteredInventory = computed(() => {
  let list = data.inventory
  if (invTab.value !== 'all') list = list.filter(i => i.type?.toLowerCase() === invTab.value)
  if (invSearch.value.trim()) {
    const q = invSearch.value.toLowerCase()
    list = list.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.type?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.rarity?.toLowerCase().includes(q)
    )
  }
  return list
})

const filteredKeyItems = computed(() => {
  if (!keySearch.value.trim()) return data.keyItems
  const q = keySearch.value.toLowerCase()
  return data.keyItems.filter(i =>
    i.name?.toLowerCase().includes(q) ||
    i.description?.toLowerCase().includes(q)
  )
})

function rarityClass(rarity) {
  const r = rarity?.toLowerCase()
  if (r === 'common') return ''
  if (r === 'uncommon') return 'tag-active'
  if (r === 'rare') return 'tag-info'
  if (r === 'very rare' || r === 'veryrare') return 'tag-info'
  if (r === 'legendary') return 'tag-completed'
  if (r === 'artifact') return 'tag-inactive'
  return ''
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadInventory()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this item?')) return
  await data.deleteItem(type, id)
  await data.loadInventory()
}

onMounted(() => {
  if (!data.inventory.length && !data.keyItems.length) data.loadInventory()
})
</script>
