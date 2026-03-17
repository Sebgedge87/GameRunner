<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Timeline</div>
      <div v-if="campaign.isGm" style="margin-left:auto">
        <button class="btn btn-primary btn-sm" @click="ui.openGmEdit('timeline', null, {})">+ Add Event</button>
      </div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search events…" style="max-width:320px" />
    </div>

    <div class="filter-tabs" style="margin-bottom:16px">
      <button class="filter-tab" :class="{ active: sessionFilter === '' }" @click="sessionFilter = ''">All Sessions</button>
      <button
        v-for="sn in sessionNumbers"
        :key="sn"
        class="filter-tab"
        :class="{ active: sessionFilter === sn }"
        @click="sessionFilter = sn"
      >Session {{ sn }}</button>
    </div>

    <div v-if="filteredTimeline.length === 0" class="empty-state">
      No timeline events yet.
    </div>

    <div class="timeline">
      <div
        v-for="event in filteredTimeline"
        :key="event.id"
        class="timeline-item"
        :class="{ hidden: event.hidden }"
        @click="ui.openDetail('timeline', event)"
      >
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1">
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
              <button class="btn btn-sm" title="Pin" @click="data.addPin('timeline', event.id, event.title)">📌</button>
              <template v-if="campaign.isGm">
                <button
                  class="btn btn-sm"
                  :title="event.hidden ? 'Reveal' : 'Hide'"
                  @click="toggleHidden('timeline', event.id)"
                >{{ event.hidden ? '👁' : '🙈' }}</button>
                <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('timeline', event.id, event)">✏️</button>
                <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('timeline', event.id)">🗑</button>
              </template>
            </div>
          </div>
        </div>
      </div>
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
const sessionFilter = ref('')

const sessionNumbers = computed(() => {
  const nums = [...new Set(data.timeline.map(e => e.session_number).filter(Boolean))].sort((a, b) => a - b)
  return nums
})

const filteredTimeline = computed(() => {
  let list = data.timeline
  if (sessionFilter.value !== '') list = list.filter(e => e.session_number === sessionFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.in_world_date?.toLowerCase().includes(q)
    )
  }
  return list
})

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadTimeline()
}

async function deleteItem(type, id) {
  if (!await ui.confirm('Delete this event?')) return
  await data.deleteItem(type, id)
  await data.loadTimeline()
}

onMounted(() => {
  if (!data.timeline.length) data.loadTimeline()
})
</script>
