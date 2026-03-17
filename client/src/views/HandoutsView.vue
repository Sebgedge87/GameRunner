<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Handouts</div>
      <div class="page-sub">Documents &amp; artefacts</div>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('handout', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Handout</div>
      </div>

      <div
        v-for="handout in data.handouts"
        :key="handout.id"
        class="card"
        :class="{ hidden: handout.hidden }"
        @click="ui.openDetail('handout', handout)"
      >
        <div class="card-body">
          <div v-if="handout.image_url" class="card-img">
            <img :src="handout.image_url" :alt="handout.title" />
          </div>
          <div class="card-title">{{ handout.title }}</div>
          <div v-if="handout.type" class="card-meta">
            <span class="tag">{{ handout.type }}</span>
          </div>
          <div v-if="handout.session_delivered" class="card-meta" style="font-size:0.8em;opacity:0.6;margin-top:4px">
            Session {{ handout.session_delivered }}
          </div>
          <div v-if="handout.description" class="card-meta" style="font-size:0.85em;opacity:0.75;margin-top:4px">
            {{ handout.description }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('handout', handout.id, handout.title)">&#128204;</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="handout.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden(handout.id)"
            >{{ handout.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('handout', handout.id, handout)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem(handout.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="data.handouts.length === 0" class="empty-state">
      No handouts found.
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

async function toggleHidden(id) {
  await data.toggleHidden('handout', id)
  await data.loadHandouts()
}

async function deleteItem(id) {
  if (!confirm('Delete this handout?')) return
  await data.deleteItem('handout', id)
  await data.loadHandouts()
}

onMounted(() => {
  if (!data.handouts.length) data.loadHandouts()
})
</script>
