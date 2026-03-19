<template>
  <div class="page-content tl-page">
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

    <div v-if="filteredTimeline.length === 0" class="empty-state">No timeline events yet.</div>

    <!-- ── Horizontal timeline ── -->
    <div v-else class="tl-scroll">
      <div class="tl-row">
        <div class="tl-line"></div>

        <div
          v-for="(event, i) in filteredTimeline"
          :key="event.id"
          class="tl-event"
          :class="{ 'tl-above': i % 2 === 0, 'tl-below': i % 2 === 1, 'tl-hidden': event.hidden }"
        >
          <!-- Top half: card shown here for even events -->
          <div class="tl-half tl-half--top">
            <template v-if="i % 2 === 0">
              <div class="tl-card" @click="ui.openDetail('timeline', event)">
                <div class="tl-card-inner">
                  <div class="tl-card-title">{{ event.title }}</div>
                  <div class="tl-card-meta">
                    <span v-if="event.in_world_date" class="tag">{{ event.in_world_date }}</span>
                    <span v-if="event.session_number" class="tag">S{{ event.session_number }}</span>
                  </div>
                  <div v-if="event.description" class="tl-card-desc">{{ event.description }}</div>
                </div>
                <div class="tl-card-actions" @click.stop>
                  <button class="btn btn-xs" title="Pin" @click="data.addPin('timeline', event.id, event.title)">📌</button>
                  <template v-if="campaign.isGm">
                    <button class="btn btn-xs" :title="event.hidden ? 'Reveal' : 'Hide'" @click="toggleHidden('timeline', event.id)">{{ event.hidden ? '👁' : '🙈' }}</button>
                    <button class="btn btn-xs" title="Edit" @click="ui.openGmEdit('timeline', event.id, event)">✏️</button>
                    <button class="btn btn-xs btn-danger" title="Delete" @click="deleteItem('timeline', event.id)">🗑</button>
                  </template>
                </div>
              </div>
              <div class="tl-stem"></div>
            </template>
          </div>

          <!-- Node dot — always sits on the center line -->
          <div class="tl-dot-row">
            <div class="tl-dot" :class="sigClass(event.significance)">
              <span v-if="event.significance === 'world-changing'" class="tl-dot-pulse"></span>
            </div>
          </div>

          <!-- Bottom half: card shown here for odd events -->
          <div class="tl-half tl-half--bot">
            <template v-if="i % 2 === 1">
              <div class="tl-stem"></div>
              <div class="tl-card" @click="ui.openDetail('timeline', event)">
                <div class="tl-card-inner">
                  <div class="tl-card-title">{{ event.title }}</div>
                  <div class="tl-card-meta">
                    <span v-if="event.in_world_date" class="tag">{{ event.in_world_date }}</span>
                    <span v-if="event.session_number" class="tag">S{{ event.session_number }}</span>
                  </div>
                  <div v-if="event.description" class="tl-card-desc">{{ event.description }}</div>
                </div>
                <div class="tl-card-actions" @click.stop>
                  <button class="btn btn-xs" title="Pin" @click="data.addPin('timeline', event.id, event.title)">📌</button>
                  <template v-if="campaign.isGm">
                    <button class="btn btn-xs" :title="event.hidden ? 'Reveal' : 'Hide'" @click="toggleHidden('timeline', event.id)">{{ event.hidden ? '👁' : '🙈' }}</button>
                    <button class="btn btn-xs" title="Edit" @click="ui.openGmEdit('timeline', event.id, event)">✏️</button>
                    <button class="btn btn-xs btn-danger" title="Delete" @click="deleteItem('timeline', event.id)">🗑</button>
                  </template>
                </div>
              </div>
            </template>
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

function sigClass(sig) {
  if (sig === 'world-changing') return 'tl-dot--world'
  if (sig === 'major') return 'tl-dot--major'
  if (sig === 'notable') return 'tl-dot--notable'
  return ''
}

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

<style scoped>
.tl-page { padding-bottom: 48px; }

/* ── Scroll wrapper ── */
.tl-scroll {
  overflow-x: auto;
  overflow-y: visible;
  padding: 4px 0 20px;
}

/* ── Main row ── */
.tl-row {
  display: flex;
  align-items: stretch;
  position: relative;
  min-width: max-content;
  padding: 0 48px;
}

/* ── Center line ── */
.tl-line {
  position: absolute;
  left: 0; right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0px,
    var(--accent, #c9a84c) 48px,
    var(--accent, #c9a84c) calc(100% - 48px),
    transparent 100%
  );
  opacity: .7;
  pointer-events: none;
  z-index: 0;
}

/* ── Event column ── */
.tl-event {
  width: 170px;
  min-width: 170px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Halves — each 150px tall ── */
.tl-half {
  flex: 0 0 150px;
  display: flex;
}
.tl-half--top {
  flex-direction: column;
  justify-content: flex-end; /* card pushed to bottom of top half → near the line */
}
.tl-half--bot {
  flex-direction: column;
  justify-content: flex-start; /* card pushed to top of bottom half → near the line */
}

/* ── Dot node (sits exactly on the center line) ── */
.tl-dot-row {
  flex: 0 0 0;
  height: 0;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.tl-dot {
  position: absolute;
  top: -9px; /* half of 18px */
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 2px solid var(--accent, #c9a84c);
  background: var(--bg, #0d0d0f);
  transition: transform .18s, box-shadow .18s;
}
.tl-event:hover .tl-dot {
  transform: scale(1.35);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent, #c9a84c) 60%, transparent);
}

/* Significance sizes */
.tl-dot--notable { border-color: var(--gold, #c9a84c); width: 20px; height: 20px; top: -10px; }
.tl-dot--major   { border-color: #e8c44b; width: 22px; height: 22px; top: -11px; box-shadow: 0 0 8px rgba(232,196,75,.35); }
.tl-dot--world   { border-color: #ff8080; width: 26px; height: 26px; top: -13px; box-shadow: 0 0 14px rgba(255,128,128,.5); }

.tl-dot-pulse {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid #ff8080;
  animation: tl-pulse 1.8s ease-in-out infinite;
  pointer-events: none;
}
@keyframes tl-pulse {
  0%, 100% { transform: scale(1); opacity: .5; }
  50%       { transform: scale(1.7); opacity: 0; }
}

/* ── Stem ── */
.tl-stem {
  flex: 0 0 20px;
  width: 2px;
  background: var(--border2, #2a2a3a);
  align-self: center;
}

/* ── Card ── */
.tl-card {
  flex: 1;
  margin: 0 10px;
  background: var(--surface);
  border: 1px solid var(--border2, #2a2a3a);
  border-radius: 6px;
  padding: 10px 11px 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: border-color .15s, box-shadow .15s;
  /* prevent card from growing too tall */
  max-height: 128px;
}
.tl-event:hover .tl-card {
  border-color: var(--accent, #c9a84c);
  box-shadow: 0 2px 16px rgba(0,0,0,.45);
}
.tl-hidden .tl-card { opacity: .4; border-style: dashed; }
.tl-hidden .tl-dot  { opacity: .4; }

.tl-card-inner { overflow: hidden; }

.tl-card-title {
  font-family: 'Cinzel', serif;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
  margin-bottom: 5px;
}
.tl-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 5px;
}
.tl-card-meta .tag { font-size: 9px; padding: 1px 5px; }
.tl-card-desc {
  font-size: 11px;
  color: var(--text3);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Action buttons — fade in on card hover ── */
.tl-card-actions {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, var(--surface) 50%);
  padding: 10px 8px 5px;
  display: flex;
  gap: 3px;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity .15s;
  pointer-events: none;
}
.tl-card:hover .tl-card-actions {
  opacity: 1;
  pointer-events: all;
}

/* ── Mobile fallback: vertical list ── */
@media (max-width: 640px) {
  .tl-scroll { overflow-x: visible; }
  .tl-row {
    flex-direction: column;
    min-width: 0;
    padding: 0 0 0 32px;
    min-height: 0;
  }
  .tl-line {
    left: 8px; right: auto;
    top: 0; bottom: 0;
    width: 2px; height: auto;
    transform: none;
    background: linear-gradient(to bottom, transparent, var(--accent, #c9a84c) 20px, var(--accent, #c9a84c) calc(100% - 20px), transparent);
  }
  .tl-event {
    width: auto; min-width: 0;
    flex-direction: row;
    min-height: 0;
    margin-bottom: 12px;
  }
  .tl-half--top { flex: 0 0 0; overflow: hidden; }
  .tl-half--bot { flex: 1; }
  .tl-half--bot .tl-stem { display: none; }
  .tl-above .tl-half--top { display: none; }
  .tl-above .tl-half--bot { flex: 1; display: flex; flex-direction: column; }
  .tl-above .tl-half--bot .tl-card, .tl-below .tl-half--bot .tl-card { display: flex; flex-direction: column; }
  .tl-dot-row { position: absolute; left: -24px; top: 14px; }
  .tl-dot { position: static; }
  .tl-card-actions { position: static; opacity: 1; pointer-events: all; background: none; padding: 5px 0 0; justify-content: flex-start; }
}
</style>

