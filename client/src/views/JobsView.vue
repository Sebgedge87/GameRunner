<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Job Board</div>
      <div class="page-sub">Contracts &amp; bounties</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search jobs…" style="max-width:320px" />
    </div>
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value" class="filter-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">{{ tab.label }}</button>
    </div>
    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('job', null, {})">
        <div class="add-tile-icon">+</div><div class="add-tile-label">Add Job</div>
      </div>
      <EntityCard
        v-for="job in filteredJobs" :key="job.id"
        :entity="job" type="job" :title="job.title" icon="💼"
        :expanded="expandedId === job.id" :reload-fn="data.loadJobs"
        @toggle="toggleExpand(job.id)"
      >
        <template #badges>
          <span v-if="job.type" class="tag">{{ job.type }}</span>
          <span v-if="job.status" class="tag" :class="statusClass(job.status)">{{ job.status }}</span>
          <span v-if="job.danger" class="tag tag-inactive">{{ job.danger }}</span>
        </template>
        <template #body>
          <div v-if="job.description" class="card-overview">{{ job.description }}</div>
          <div v-if="job.reward" class="card-meta">🎁 {{ job.reward }}</div>
          <div v-if="job.location" class="card-meta">📍 {{ job.location }}</div>
          <div v-if="job.employer" class="card-meta">Employer: {{ job.employer }}</div>
          <div v-if="job.connected_to?.length" class="card-meta">Linked: {{ job.connected_to.join(', ') }}</div>
        </template>
        <template #actions>
          <button v-if="job.status === 'open' && !campaign.isGm" class="btn btn-sm btn-primary" @click.stop="acceptJob(job)">Accept</button>
          <button v-if="campaign.isGm && !job.promoted_quest_id" class="btn btn-sm" @click.stop="promoteToQuest(job.id)">→ Quest</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredJobs.length === 0" class="empty-state">No jobs found.</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const search = ref('')
const activeTab = ref('all')
const expandedId = ref(null)

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const filteredJobs = computed(() => {
  let list = data.jobs
  if (activeTab.value !== 'all') list = list.filter(j => j.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.type?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.employer?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function statusClass(s) {
  const v = s?.toLowerCase()
  if (v === 'open') return 'tag-active'
  if (v === 'active') return 'tag-info'
  if (v === 'completed') return 'tag-completed'
  if (v === 'failed' || v === 'expired') return 'tag-inactive'
  return ''
}

async function acceptJob(job) {
  const r = await data.apif(`/api/jobs/${job.id}/accept`, { method: 'PUT' })
  if (r.ok) {
    ui.showToast('Job accepted!', job.title, '✓')
    await data.loadJobs()
  } else {
    const d = await r.json().catch(() => ({}))
    ui.showToast('Could not accept', d.error || '', '✗')
  }
}

async function promoteToQuest(jobId) {
  await data.apif(`/api/jobs/${jobId}`, { method: 'PUT', body: JSON.stringify({ status: 'taken', promoted_quest_id: -1 }) })
  ui.showToast('Job promoted to Quest', '', '→')
  await data.loadJobs()
  await data.loadQuests()
}

onMounted(() => { if (!data.jobs.length) data.loadJobs() })
</script>
