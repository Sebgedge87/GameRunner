<template>
  <div class="page-content">
    <div class="page-header">
      <div>
        <div class="page-title">Inventory</div>
        <div class="page-sub">Party gear &amp; key items</div>
      </div>
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
        <StickyFormFooter
          primary-label="Give"
          :on-primary="doTransfer"
          :on-cancel="() => transferItem = null"
          :is-loading="transferring"
          :is-disabled="!transferTargetId"
        />
      </div>
    </div>

    <!-- ── Party Inventory ──────────────────────────────────────── -->
    <div class="section-head">
      <span>Party Inventory</span>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('inventory', null, {})">+ Add item</button>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="invSearch" class="form-input" placeholder="Search items…" style="max-width:300px" />
    </div>

    <div class="filter-tabs">
      <button v-for="tab in invTabs" :key="tab.value" class="filter-tab" :class="{ active: invTab === tab.value }" @click="invTab = tab.value">{{ tab.label }}</button>
    </div>

    <!-- Inventory empty state -->
    <EmptyState
      v-if="!data.inventory.length"
      icon="🎒"
      heading="No items yet"
      description="Track the party's weapons, armour, gear and consumables."
      :cta-label="campaign.isGm ? '+ Add item' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('inventory', null, {}) : null"
    />

    <!-- Inventory card grid -->
    <template v-else>
      <div class="card-grid">
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
            <div v-if="item.description" class="card-overview">{{ stripMd(item.description) }}</div>
            <div v-if="item.weight != null" class="card-meta">Weight: {{ item.weight }}</div>
          </template>
          <template #actions>
            <button v-if="canGive(item)" class="btn btn-xs" @click.stop="openTransfer(item)">Give ↗</button>
          </template>
        </EntityCard>
      </div>
      <p v-if="!filteredInventory.length" class="no-matches-msg">No matches — try a different search or filter.</p>
    </template>

    <!-- ── Key Items ────────────────────────────────────────────── -->
    <div class="section-head" style="margin-top:32px">
      <span>Key Items</span>
      <button v-if="campaign.isGm" class="btn-add" @click="ui.openGmEdit('key-item', null, {})">+ Add key item</button>
    </div>

    <div class="search-row" style="margin-bottom:16px">
      <input v-model="keySearch" class="form-input" placeholder="Search key items…" style="max-width:300px" />
    </div>

    <!-- Key items empty state -->
    <EmptyState
      v-if="!data.keyItems.length"
      icon="🗝️"
      heading="No key items yet"
      description="Add artefacts, quest items and plot-critical objects."
      :cta-label="campaign.isGm ? '+ Add key item' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('key-item', null, {}) : null"
    />

    <!-- Key items card grid -->
    <template v-else>
      <div class="card-grid">
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
            <div v-if="item.description" class="card-overview">{{ stripMd(item.description) }}</div>
            <div v-if="item.connected_to?.length" class="card-meta">Linked: {{ item.connected_to.join(', ') }}</div>
          </template>
        </EntityCard>
      </div>
      <p v-if="!filteredKeyItems.length" class="no-matches-msg">No matches — try a different search.</p>
    </template>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import EntityCard from '@/components/EntityCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import StickyFormFooter from '@/components/StickyFormFooter.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const auth     = useAuthStore()

const transferItem     = ref(null)
const transferTargetId = ref('')
const transferring     = ref(false)

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

const invSearch     = ref('')
const invTab        = ref('all')
const keySearch     = ref('')
const invExpandedId = ref(null)
const keyExpandedId = ref(null)

const invTabs = [
  { value: 'all',        label: 'All' },
  { value: 'weapon',     label: 'Weapon' },
  { value: 'armour',     label: 'Armour' },
  { value: 'gear',       label: 'Gear' },
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

<style scoped>
/* Section header row — replaces .section-divider for sections that need a right-side button */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: var(--text);
  margin: 18px 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border);
  letter-spacing: 1px;
}
</style>
