<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Inventory</div>
      <div class="page-sub">Party gear &amp; key items</div>
    </div>

    <!-- Party Inventory -->
    <div class="section-divider">Party Inventory</div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('inventory', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Item</div>
      </div>

      <div
        v-for="item in data.inventory"
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
          <button class="btn btn-sm" title="Pin" @click="data.addPin('inventory', item.id, item.name)">&#128204;</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="item.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('inventory', item.id)"
            >{{ item.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('inventory', item.id, item)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('inventory', item.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.inventory.length === 0" class="empty-state" style="margin-bottom:24px">
      No inventory items found.
    </div>

    <!-- Key Items -->
    <div class="section-divider" style="margin-top:24px">Key Items</div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('key-item', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Key Item</div>
      </div>

      <div
        v-for="item in data.keyItems"
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
          <button class="btn btn-sm" title="Pin" @click="data.addPin('key-item', item.id, item.name)">&#128204;</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="item.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('key-item', item.id)"
            >{{ item.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('key-item', item.id, item)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('key-item', item.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.keyItems.length === 0" class="empty-state">
      No key items found.
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()

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
