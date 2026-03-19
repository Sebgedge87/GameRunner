<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Inventory</div>
      <div class="page-sub">Party gear &amp; key items</div>
    </div>

    <!-- Transfer modal -->
    <div v-if="transferItem" class="modal-overlay open" @click.self="transferItem = null">
      <div class="modal" style="max-width:360px">
        <div class="modal-title">Give "{{ transferItem.name }}"</div>
        <div class="gm-modal-body">
          <div class="form-group">
            <label>Give to</label>
            <select v-model="transferTargetId" class="form-input">
              <option value="">Select player…</option>
              <option v-for="u in data.users.filter(u => u.id !== auth.user?.id)" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-close" @click="transferItem = null">CANCEL</button>
          <button class="submit-btn" :disabled="!transferTargetId || transferring" @click="doTransfer">{{ transferring ? 'GIVING…' : 'GIVE' }}</button>
        </div>
      </div>
    </div>

    <!-- Party Inventory -->
    <div class="section-divider">Party Inventory</div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="invSearch" class="form-input" placeholder="Search items…" style="max-width:300px" />
    </div>

    <div class="filter-tabs">
      <button v-for="tab in invTabs" :key="tab.value" class="filter-tab" :class="{ active: invTab === tab.value }" @click="invTab = tab.value">{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('inventory', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Item</div>
      </div>
      <EntityCard
        v-for="item in filteredInventory" :key="item.id"
        :entity="item" type="inventory" :title="item.name" icon="🎒"
        :expanded="invExpandedId === item.id" :reload-fn="data.loadInventory"
        :show-share="false"
        @toggle="invToggle(item.id)"
      >
        <template #badges>
          <span v-if="item.type" class="tag">{{ item.type }}</span>
          <span v-if="item.rarity" class="tag" :class="rarityClass(item.rarity)">{{ item.rarity }}</span>
          <span v-if="item.holder && item.holder !== 'party'" class="tag tag-info">{{ item.holder }}</span>
        </template>
        <template #body>
          <div v-if="item.quantity != null" class="card-meta">Qty: {{ item.quantity }}</div>
          <div v-if="item.description" class="card-overview">{{ item.description }}</div>
          <div v-if="item.weight != null" class="card-meta">Weight: {{ item.weight }}</div>
        </template>
        <template #actions>
          <button v-if="canGive(item)" class="btn btn-xs" @click.stop="openTransfer(item)">Give ↗</button>
        </template>
      </EntityCard>
    </div>

    <div v-if="filteredInventory.length === 0" class="empty-state" style="margin-bottom:24px">No inventory items found.</div>

    <!-- Key Items -->
    <div class="section-divider" style="margin-top:24px">Key Items</div>

    <div class="search-row" style="margin-bottom:16px">
      <input v-model="keySearch" class="form-input" placeholder="Search key items…" style="max-width:300px" />
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('key-item', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Key Item</div>
      </div>
      <EntityCard
        v-for="item in filteredKeyItems" :key="item.id"
        :entity="item" type="key-item" :title="item.name" icon="🗝️"
        :expanded="keyExpandedId === item.id" :reload-fn="data.loadInventory"
        :show-share="false"
        @toggle="keyToggle(item.id)"
      >
        <template #badges>
          <span v-if="item.type" class="tag">{{ item.type }}</span>
        </template>
        <template #body>
          <div v-if="item.description" class="card-overview">{{ item.description }}</div>
          <div v-if="item.connected_to?.length" class="card-meta">Linked: {{ item.connected_to.join(', ') }}</div>
        </template>
      </EntityCard>
    </div>

    <div v-if="filteredKeyItems.length === 0" class="empty-state">No key items found.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import EntityCard from '@/components/EntityCard.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const auth = useAuthStore()

const transferItem = ref(null)
const transferTargetId = ref('')
const transferring = ref(false)

function canGive(item) {
  if (campaign.isGm) return true
  return item.owner_id === auth.user?.id
}

function openTransfer(item) {
  transferItem.value = item
  transferTargetId.value = ''
}

async function doTransfer() {
  if (!transferTargetId.value || !transferItem.value) return
  transferring.value = true
  try {
    const r = await data.apif(`/api/inventory/${transferItem.value.id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify({ target_user_id: transferTargetId.value }),
    })
    if (r.ok) {
      const d = await r.json()
      ui.showToast(`Given to ${d.new_owner}`, transferItem.value.name, '↗')
      transferItem.value = null
      await data.loadInventory()
    } else {
      const d = await r.json().catch(() => ({}))
      ui.showToast('Transfer failed', d.error || '', '✗')
    }
  } finally {
    transferring.value = false
  }
}

const invSearch = ref('')
const invTab = ref('all')
const keySearch = ref('')
const invExpandedId = ref(null)
const keyExpandedId = ref(null)

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

function invToggle(id) { invExpandedId.value = invExpandedId.value === id ? null : id }
function keyToggle(id) { keyExpandedId.value = keyExpandedId.value === id ? null : id }

function rarityClass(r) {
  const v = r?.toLowerCase()
  if (v === 'uncommon') return 'tag-active'
  if (v === 'rare' || v === 'very rare') return 'tag-info'
  if (v === 'legendary') return 'tag-completed'
  if (v === 'artifact') return 'tag-inactive'
  return ''
}

onMounted(() => { if (!data.inventory.length && !data.keyItems.length) data.loadInventory() })
</script>
