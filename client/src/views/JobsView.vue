<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Job Board</div>
      <div class="page-sub">Contracts &amp; bounties</div>
    </div>
    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search jobs…" style="max-width:320px" />
    </div>
    <FilterTabs :tabs="tabs" :active="activeTabs" :multi="true" :on-change="v => activeTabs = v" :on-clear="() => activeTabs = ['all']" />
    <div class="card-grid">
      <div v-if="campaign.isGm" class="create-card" @click="ui.openGmEdit('job', null, {})">
        <div class="create-card-icon">+</div><span>Add Job</span>
      </div>
      <EntityCard
        v-for="job in filteredJobs" :key="job.id"
        :entity="job" type="job" :title="job.title" icon="💼"
        :reload-fn="data.loadJobs"
      >
        <template #badges>
          <span v-if="job.type" class="tag">{{ job.type }}</span>
          <span v-if="job.status" class="tag" :class="statusClass(job.status)">{{ job.status }}</span>
          <span v-if="job.danger" class="tag tag-inactive">{{ job.danger }}</span>
        </template>
        <template #preview>
          <div v-if="job.description">{{ stripMd(job.description).slice(0, 80) }}</div>
          <div v-else-if="job.reward" style="opacity:0.7">🎁 {{ job.reward }}</div>
        </template>
        <template #actions>
          <button v-if="job.status === 'open' && !campaign.isGm" class="btn btn-sm btn-primary" @click.stop="acceptJob(job)">Accept</button>
          <button v-if="campaign.isGm && !job.promoted_quest_id" class="btn btn-sm" @click.stop="promoteToQuest(job.id)">→ Quest</button>
        </template>
      </EntityCard>
    </div>
    <div v-if="filteredJobs.length === 0" class="empty-state">
      <span class="empty-state-icon">📋</span>
      <div class="empty-state-title">{{ data.jobs.length ? 'No Matches' : 'Notice Board Empty' }}</div>
      <div class="empty-state-hint">{{ data.jobs.length ? 'Try a different search or filter.' : 'GM: post available work for hire — bounties, escorts, investigations.' }}</div>
    </div>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const search = ref('')
const activeTabs = ref(['all'])
const expandedId = ref(null) // kept for legacy compat, unused

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const filteredJobs = computed(() => {
  let list = data.jobs
  const selected = new Set(activeTabs.value || ['all'])
  if (!selected.has('all')) list = list.filter(j => selected.has(j.status?.toLowerCase()))
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
