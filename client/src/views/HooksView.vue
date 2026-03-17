<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Plot Hooks</div>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('hook', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Hook</div>
      </div>

      <div
        v-for="hook in data.hooks"
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
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="hook.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('hook', hook.id)"
            >{{ hook.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('hook', hook.id, hook)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('hook', hook.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.hooks.length === 0" class="empty-state">
      No hooks found.
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
  if (!confirm('Delete this hook?')) return
  await data.deleteItem(type, id)
  await data.loadHooks()
}

onMounted(() => {
  if (!data.hooks.length) data.loadHooks()
})
</script>
