<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Rumours</div>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('rumour', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Rumour</div>
      </div>

      <div
        v-for="rumour in data.rumours"
        :key="rumour.id"
        class="card"
        :class="{ hidden: rumour.hidden }"
        @click="ui.openDetail('rumour', rumour)"
      >
        <div class="card-body">
          <div style="font-size:0.9em;line-height:1.5;font-style:italic;opacity:0.9;margin-bottom:8px">
            &#8220;{{ rumour.text }}&#8221;
          </div>
          <div class="card-meta">
            <span v-if="rumour.source_npc" class="tag">&#128100; {{ rumour.source_npc }}</span>
            <span v-if="rumour.source_location" class="tag">&#128205; {{ rumour.source_location }}</span>
            <template v-if="campaign.isGm">
              <span
                class="tag"
                :class="rumour.is_true ? 'tag-active' : 'tag-inactive'"
                style="margin-left:auto"
              >{{ rumour.is_true ? 'True' : 'False' }}</span>
            </template>
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="rumour.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden('rumour', rumour.id)"
            >{{ rumour.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Expose to players" @click="exposeRumour(rumour.id)">&#128226;</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('rumour', rumour.id, rumour)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('rumour', rumour.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.rumours.length === 0" class="empty-state">
      No rumours found.
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

async function exposeRumour(id) {
  const r = await data.apif(`/api/rumours/${id}/expose`, { method: 'POST', body: JSON.stringify({ user_ids: [] }) })
  if (r.ok) { ui.showToast('Rumour exposed to players', '', '📢'); await data.loadRumours() }
  else ui.showToast('Expose failed', '', '✕')
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadRumours()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this rumour?')) return
  await data.deleteItem(type, id)
  await data.loadRumours()
}

onMounted(() => {
  if (!data.rumours.length) data.loadRumours()
})
</script>
