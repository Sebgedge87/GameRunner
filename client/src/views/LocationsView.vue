<template>
  <div class="page-content">
    <div class="page-header">
      <div>
        <div class="page-title">Locations</div>
        <div v-if="campaign.isGm && campaign.currentPartyLocationId" class="page-sub">
          📍 Party at: <strong>{{ partyLocationName }}</strong>
          <button class="btn btn-xs" style="margin-left:8px" @click="campaign.setPartyLocation(null)">Clear</button>
        </div>
      </div>
      <!-- Add button only shown on Locations tab, not Notice Board -->
      <button
        v-if="campaign.isGm && mainTab === 'locations'"
        class="btn-add"
        @click="ui.openGmEdit('location', null, {})"
      >+ Add location</button>
    </div>

    <!-- Top-level tabs: Locations vs Notice Board -->
    <FilterTabs :tabs="mainTabs" :active="mainTab" :on-change="v => mainTab = v" style="margin-bottom:16px" />

    <!-- ── Locations tab ── -->
    <template v-if="mainTab === 'locations'">
      <div class="search-row" style="margin-bottom:12px">
        <input v-model="search" class="form-input" placeholder="Search locations…" style="max-width:320px" />
      </div>
      <FilterTabs :tabs="tabs" :active="activeTab" :on-change="v => activeTab = v" />

      <!-- Skeleton -->
      <div v-if="data.loading && !data.locations.length" class="card-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skeleton-line skeleton-img"></div>
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-body"></div>
        </div>
      </div>

      <!-- Empty state -->
      <EmptyState
        v-else-if="!data.locations.length"
        icon="📍"
        heading="No locations yet"
        description="Map the world — taverns, dungeons, cities and beyond."
        :cta-label="campaign.isGm ? '+ Add location' : null"
        :on-cta="campaign.isGm ? () => ui.openGmEdit('location', null, {}) : null"
      />

      <!-- Card grid -->
      <template v-else>
        <div class="card-grid">
          <EntityCard
            v-for="loc in filteredLocations" :key="loc.id"
            :entity="loc" type="location" :title="loc.title || loc.name" icon="📍"
            :image="loc.image_url || loc.image || null"
            :expanded="expandedId === loc.id" :reload-fn="data.loadLocations"
            @toggle="toggleExpand(loc.id)"
          >
            <template #badges>
              <span v-if="loc.location_type" class="tag">{{ loc.location_type }}</span>
              <span v-if="loc.danger_level > 0" class="tag tag-inactive">⚠️ Danger {{ loc.danger_level }}</span>
              <span v-if="campaign.currentPartyLocationId === String(loc.id)" class="tag tag-active">📍 Party here</span>
            </template>
            <template #body>
              <div v-if="loc.description" class="card-overview">{{ stripMd(loc.description) }}</div>
              <div v-if="loc.parent_location_id" class="card-meta">↳ Sub-location</div>
            </template>
            <template #actions>
              <button v-if="campaign.isGm" class="btn btn-xs"
                :class="campaign.currentPartyLocationId === String(loc.id) ? 'btn-active' : ''"
                @click.stop="campaign.setPartyLocation(campaign.currentPartyLocationId === String(loc.id) ? null : loc.id)">
                {{ campaign.currentPartyLocationId === String(loc.id) ? 'Party here ✓' : 'Set as party location' }}
              </button>
              <button class="btn btn-xs" @click.stop="openNoticeBoard(loc)">📋 Notice Board</button>
            </template>
          </EntityCard>
        </div>
        <p v-if="!filteredLocations.length" class="no-matches-msg">No matches — try a different search or filter.</p>
      </template>
    </template>

    <!-- ── Notice Board tab ── -->
    <template v-else-if="mainTab === 'board'">
      <div class="nb-toolbar">
        <select v-model="boardLocationId" class="form-input" style="max-width:280px">
          <option value="">All Locations</option>
          <option v-for="loc in data.locations" :key="loc.id" :value="String(loc.id)">{{ loc.title || loc.name }}</option>
        </select>
        <div v-if="campaign.currentPartyLocationId" class="nb-party-hint">
          📍 Party is at <strong>{{ partyLocationName }}</strong>
          <button class="btn btn-xs" style="margin-left:6px" @click="boardLocationId = String(campaign.currentPartyLocationId)">Show their board</button>
        </div>
      </div>
      <div class="card-grid" style="margin-top:12px">
        <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('job', null, { source_location_id: boardLocationId || null })">
          <div class="add-tile-icon">+</div><div class="add-tile-label">Post Job</div>
        </div>
        <div v-if="boardJobs.length === 0" class="empty-state" style="grid-column:1/-1">No jobs posted here.</div>
        <div v-for="job in boardJobs" :key="job.id" class="nb-job-card" :class="`nb-diff--${job.difficulty || 'medium'}`">
          <div class="nb-job-header">
            <span class="nb-job-title">{{ job.title }}</span>
            <span class="nb-job-diff tag" :class="diffClass(job.difficulty)">{{ job.difficulty || 'medium' }}</span>
          </div>
          <div v-if="job.description" class="nb-job-desc">{{ stripMd(job.description) }}</div>
          <div class="nb-job-footer">
            <span v-if="job.reward" class="nb-reward">💰 {{ job.reward }}</span>
            <span v-if="job.posted_by" class="nb-poster">by {{ job.posted_by }}</span>
            <span class="nb-status tag" :class="jobStatusClass(job.status)">{{ job.status }}</span>
          </div>
          <div v-if="job.status === 'open' && !campaign.isGm" class="nb-job-actions">
            <button class="btn btn-sm btn-primary" @click="acceptJob(job)">Accept</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { stripMd } from '@/utils/markdown'
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import EntityCard from '@/components/EntityCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import FilterTabs from '@/components/FilterTabs.vue'

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()
const search         = ref('')
const activeTab      = ref('all')
const expandedId     = ref(null)
const mainTab        = ref('locations')
const boardLocationId = ref('')

const mainTabs = [
  { value: 'locations', label: '📍 Locations' },
  { value: 'board',     label: '📋 Notice Board' },
]

const tabs = [
  { value: 'all',         label: 'All' },
  { value: 'city',        label: 'City/Town' },
  { value: 'dungeon',     label: 'Dungeon' },
  { value: 'wilderness',  label: 'Wilderness' },
]

const partyLocationName = computed(() => {
  if (!campaign.currentPartyLocationId) return ''
  const loc = data.locations.find(l => String(l.id) === String(campaign.currentPartyLocationId))
  return loc ? (loc.title || loc.name) : `#${campaign.currentPartyLocationId}`
})

const boardJobs = computed(() => {
  if (!boardLocationId.value) return data.jobs.filter(j => !j.hidden || campaign.isGm)
  return data.jobs.filter(j => String(j.source_location_id) === String(boardLocationId.value))
})

const filteredLocations = computed(() => {
  let list = data.locations
  if (activeTab.value !== 'all') {
    list = list.filter(l => l.location_type?.toLowerCase().includes(activeTab.value.toLowerCase()))
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l =>
      (l.title || l.name)?.toLowerCase().includes(q) ||
      l.location_type?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

function openNoticeBoard(loc) {
  boardLocationId.value = String(loc.id)
  mainTab.value = 'board'
}

function diffClass(d) {
  if (d === 'easy')   return 'tag-active'
  if (d === 'hard')   return 'tag-info'
  if (d === 'deadly') return 'tag-inactive'
  return ''
}

function jobStatusClass(s) {
  if (s === 'open')      return 'tag-active'
  if (s === 'active')    return 'tag-info'
  if (s === 'completed') return 'tag-completed'
  return 'tag-inactive'
}

async function acceptJob(job) {
  const r = await data.apif(`/api/jobs/${job.id}/accept`, { method: 'PUT' })
  if (r.ok) {
    ui.showToast('Job accepted!', job.title, '✓')
    await data.loadJobs()
  } else {
    const d = await r.json().catch(() => ({}))
    ui.showToast('Could not accept job', d.error || '', '✗')
  }
}

onMounted(() => {
  if (!data.locations.length) data.loadLocations()
  if (!data.jobs.length) data.loadJobs()
})
</script>

<style scoped>
.nb-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.nb-party-hint { font-size: 12px; color: var(--text3); }

.nb-job-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border2);
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nb-diff--easy   { border-left-color: var(--green, #4caf50); }
.nb-diff--hard   { border-left-color: var(--blue, #4a9fd4); }
.nb-diff--deadly { border-left-color: var(--red, #c94c4c); }

.nb-job-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.nb-job-title  { font-size: 14px; color: var(--text); }
.nb-job-diff   { font-size: 10px; }
.nb-job-desc   { font-size: 12px; color: var(--text2); line-height: 1.5; }
.nb-job-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--text3); }
.nb-reward     { color: var(--gold, #c9a84c); }
.nb-job-actions{ margin-top: 4px; }
</style>
