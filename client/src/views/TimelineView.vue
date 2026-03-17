<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Timeline</div>
      <div v-if="campaign.isGm" style="margin-left:auto">
        <button class="btn btn-primary btn-sm" @click="ui.openGmEdit('timeline', null, {})">+ Add Event</button>
      </div>
    </div>

    <div v-if="data.timeline.length === 0" class="empty-state">
      No timeline events yet.
    </div>

    <div class="timeline">
      <div
        v-for="event in data.timeline"
        :key="event.id"
        class="timeline-item"
        :class="{ hidden: event.hidden }"
        @click="ui.openDetail('timeline', event)"
      >
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div>
              <div class="card-title" style="margin-bottom:4px">{{ event.title }}</div>
              <div class="card-meta">
                <span v-if="event.in_world_date" class="tag">{{ event.in_world_date }}</span>
                <span v-if="event.session_number" class="tag">Session {{ event.session_number }}</span>
              </div>
              <div v-if="event.description" style="font-size:0.85em;opacity:0.75;margin-top:6px">
                {{ event.description }}
              </div>
            </div>
            <div class="card-actions" style="flex-shrink:0" @click.stop>
              <template v-if="campaign.isGm">
                <button
                  class="btn btn-sm"
                  :title="event.hidden ? 'Reveal' : 'Hide'"
                  @click="toggleHidden('timeline', event.id)"
                >{{ event.hidden ? '&#128065;' : '&#128584;' }}</button>
                <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('timeline', event.id, event)">&#9999;&#65039;</button>
                <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('timeline', event.id)">&#128465;</button>
              </template>
            </div>
          </div>
        </div>
      </div>
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

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadTimeline()
}

async function deleteItem(type, id) {
  if (!confirm('Delete this event?')) return
  await data.deleteItem(type, id)
  await data.loadTimeline()
}

onMounted(() => {
  if (!data.timeline.length) data.loadTimeline()
})
</script>
