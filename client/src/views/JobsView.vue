<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Job Board</div>
      <div class="page-sub">Contracts &amp; bounties</div>
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('job', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Post Job</div>
      </div>

      <div
        v-for="job in filteredJobs"
        :key="job.id"
        class="card"
        :class="{ hidden: job.hidden }"
        @click="ui.openDetail('job', job)"
      >
        <div class="card-body">
          <div class="card-title">{{ job.title }}</div>
          <div class="card-meta">
            <span v-if="job.type" class="tag">{{ job.type }}</span>
            <span v-if="job.status" class="tag" :class="statusClass(job.status)">{{ job.status }}</span>
            <span v-if="job.danger" class="tag tag-inactive">{{ job.danger }}</span>
          </div>
          <div v-if="job.reward" class="card-meta" style="font-size:0.85em;opacity:0.75;margin-top:6px">
            &#127873; {{ job.reward }}
          </div>
          <div v-if="job.location" class="card-meta" style="font-size:0.8em;opacity:0.6;margin-top:4px">
            &#128205; {{ job.location }}
          </div>
          <div v-if="job.employer" class="card-meta" style="font-size:0.8em;opacity:0.6;margin-top:4px">
            Employer: {{ job.employer }}
          </div>
          <div v-if="job.connected_to?.length" class="card-meta" style="font-size:0.75em;opacity:0.5;margin-top:6px">
            Linked: {{ job.connected_to.join(', ') }}
          </div>
        </div>
        <div class="card-actions" @click.stop>
          <button class="btn btn-sm" title="Pin" @click="data.addPin('job', job.id, job.title)">&#128204;</button>
          <template v-if="campaign.isGm">
            <button
              class="btn btn-sm"
              :title="job.hidden ? 'Reveal' : 'Hide'"
              @click="toggleHidden(job.id)"
            >{{ job.hidden ? '&#128065;' : '&#128584;' }}</button>
            <button
              v-if="!job.promoted_quest_id"
              class="btn btn-sm"
              title="Promote to Quest"
              @click="promoteToQuest(job.id)"
            >&#8594; Quest</button>
            <button class="btn btn-sm" title="Edit" @click="ui.openGmEdit('job', job.id, job)">&#9999;&#65039;</button>
            <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem(job.id)">&#128465;</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredJobs.length === 0" class="empty-state">
      No jobs found.
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

const activeTab = ref('all')

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const filteredJobs = computed(() => {
  if (activeTab.value === 'all') return data.jobs
  return data.jobs.filter(j => j.status?.toLowerCase() === activeTab.value)
})

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'open') return 'tag-active'
  if (s === 'active') return 'tag-info'
  if (s === 'completed') return 'tag-completed'
  if (s === 'failed' || s === 'expired') return 'tag-inactive'
  return ''
}

async function promoteToQuest(jobId) {
  const r = await data.apif(`/api/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'taken', promoted_quest_id: -1 }),
  })
  if (r.ok) {
    ui.showToast('Job promoted to quest', '', '✓')
    await data.loadJobs()
    await data.loadQuests()
  } else {
    ui.showToast('Promote failed', '', '✕')
  }
}

async function toggleHidden(id) {
  await data.toggleHidden('job', id)
  await data.loadJobs()
}

async function deleteItem(id) {
  if (!confirm('Delete this job?')) return
  await data.deleteItem('job', id)
  await data.loadJobs()
}

onMounted(() => {
  if (!data.jobs.length) data.loadJobs()
})
</script>
