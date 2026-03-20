<template>
  <div class="page-content cal-page">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="page-title">Calendar</div>
      <div class="cal-header-right">
        <!-- Current in-world date chip -->
        <div class="cal-today-chip" v-if="config">
          <span class="cal-today-icon">📌</span>
          {{ formatDate(config.current_date, config.current_era_index) }}
        </div>
        <button v-if="isGm" class="btn btn-sm btn-outline" @click="showSettings = !showSettings">
          ⚙ Configure
        </button>
        <button v-if="isGm" class="btn btn-primary btn-sm" @click="openAddEvent(null)">
          + Event
        </button>
      </div>
    </div>

    <div v-if="!config" class="empty-state">Loading calendar…</div>

    <template v-else>
      <!-- ── Month navigation ─────────────────────────────────────────────── -->
      <div class="cal-nav">
        <button class="cal-nav-btn" @click="prevMonth">‹</button>
        <div class="cal-nav-center">
          <span class="cal-month-name">{{ currentMonthObj?.name || '?' }}</span>
          <span class="cal-year">{{ viewYear }} {{ currentEra?.suffix }}</span>
          <span class="cal-season" v-if="currentSeason" :style="{ color: currentSeason.color }">
            {{ currentSeason.icon }} {{ currentSeason.name }}
          </span>
        </div>
        <button class="cal-nav-btn" @click="nextMonth">›</button>
        <button class="cal-nav-btn cal-goto-today" @click="gotoToday" title="Go to current date">◎</button>
      </div>

      <!-- ── GM: Generate weather / Advance date ─────────────────────────── -->
      <div v-if="isGm" class="cal-gm-bar">
        <button class="btn btn-sm" @click="generateWeather">🌦 Generate Weather (month)</button>
        <button class="btn btn-sm" @click="showAdvance = !showAdvance">⏩ Advance Date</button>
        <div v-if="showAdvance" class="cal-advance-row">
          <input v-model.number="advanceDays" type="number" min="0" class="form-input cal-advance-input" placeholder="days" />
          <button class="btn btn-sm btn-primary" @click="advanceDate">Advance</button>
          <button class="btn btn-sm" @click="setDateToView">Set to {{ currentMonthObj?.name }} 1</button>
        </div>
      </div>

      <!-- ── Day-of-week headers ──────────────────────────────────────────── -->
      <div class="cal-grid">
        <div class="cal-dow" v-for="d in config.days" :key="d.name">{{ d.short }}</div>

        <!-- ── Blank cells before month start ──────────────────────────────── -->
        <div class="cal-blank" v-for="n in startBlank" :key="'b'+n"></div>

        <!-- ── Day cells ────────────────────────────────────────────────────── -->
        <div
          v-for="day in daysInMonth"
          :key="day"
          class="cal-cell"
          :class="{
            'cal-today': isToday(day),
            'cal-has-events': eventsForDay(day).length > 0,
          }"
          @click="isGm ? openAddEvent(day) : null"
        >
          <!-- Day number + moon phase -->
          <div class="cal-cell-top">
            <span class="cal-day-num">{{ day }}</span>
            <span v-for="moon in moonsForDay(day)" :key="moon.name" class="cal-moon" :title="moon.phaseName" :style="{ color: moon.color }">
              {{ moon.phaseIcon }}
            </span>
          </div>

          <!-- Events -->
          <div class="cal-events">
            <div
              v-for="ev in eventsForDay(day)"
              :key="ev.id"
              class="cal-event"
              :class="{ 'cal-event-weather': ev.type === 'weather', 'cal-event-gm': ev.is_gm_only }"
              :style="ev.type !== 'weather' ? { borderLeftColor: ev.color } : {}"
              :title="ev.title"
              @click.stop="isGm ? editEvent(ev) : null"
            >
              <span v-if="ev.weather_icon" class="cal-ev-icon">{{ ev.weather_icon }}</span>
              <span class="cal-ev-label">{{ ev.title }}</span>
              <span v-if="ev.is_gm_only" class="cal-ev-gm-badge" title="GM only">👁</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Settings Panel ──────────────────────────────────────────────── -->
      <div v-if="showSettings && isGm" class="cal-settings-panel">
        <h3>Calendar Configuration</h3>
        <p style="color:var(--text3);font-size:12px">Edit the raw JSON config. Changes are saved immediately.</p>
        <textarea v-model="configJson" class="cal-config-textarea" rows="20"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click="saveConfig">Save Config</button>
          <button class="btn btn-sm" @click="showSettings = false">Cancel</button>
        </div>
      </div>
    </template>

    <!-- ── Add/Edit Event Modal ────────────────────────────────────────────── -->
    <div v-if="modal.open" class="modal-overlay" @click.self="modal.open = false">
      <div class="modal-box">
        <div class="modal-header">
          <span>{{ modal.id ? 'Edit Event' : 'Add Event' }}</span>
          <button class="modal-close" @click="modal.open = false">✕</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Title</label>
          <input v-model="modal.title" class="form-input" placeholder="Event title" />

          <label class="form-label">Day</label>
          <input v-model.number="modal.day" type="number" min="1" :max="currentMonthObj?.days" class="form-input" />

          <label class="form-label">Description (optional)</label>
          <textarea v-model="modal.description" class="form-input" rows="3"></textarea>

          <label class="form-label">Type</label>
          <select v-model="modal.type" class="form-input">
            <option value="event">Event</option>
            <option value="session">Session</option>
            <option value="holiday">Holiday</option>
            <option value="quest">Quest</option>
            <option value="combat">Combat</option>
          </select>

          <label class="form-label">Colour</label>
          <input v-model="modal.color" type="color" class="form-input cal-color-pick" />

          <label class="form-label">
            <input type="checkbox" v-model="modal.is_gm_only" style="margin-right:6px" />
            GM only (hidden from players)
          </label>
        </div>
        <div class="modal-footer">
          <button v-if="modal.id" class="btn btn-danger btn-sm" @click="deleteEvent">Delete</button>
          <button class="btn btn-sm" @click="modal.open = false">Cancel</button>
          <button class="btn btn-primary btn-sm" @click="saveEvent">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'

const campaign = useCampaignStore()
const data = useDataStore()
const isGm = computed(() => campaign.isGm)

// ── State ──────────────────────────────────────────────────────────────────
const config = ref(null)
const events = ref([])  // events for the currently viewed month
const showSettings = ref(false)
const showAdvance = ref(false)
const advanceDays = ref(1)
const configJson = ref('')
const viewMonth = ref(1)   // 1-based
const viewYear  = ref(1)

// ── Derived calendar objects ───────────────────────────────────────────────
const currentMonthObj = computed(() => config.value?.months[viewMonth.value - 1])
const daysInMonth     = computed(() => currentMonthObj.value?.days || 30)
const currentEra      = computed(() => config.value?.eras[config.value?.current_era_index] || null)

const currentSeason = computed(() => {
  if (!config.value) return null
  return config.value.seasons.find(s => s.months.includes(viewMonth.value - 1)) || null
})

// Day offset so month starts on the right weekday
const startBlank = computed(() => {
  if (!config.value) return 0
  const epoch = config.value.epoch_weekday || 0
  const yearDays = config.value.months.reduce((s, m) => s + m.days, 0)
  let d = (viewYear.value - 1) * yearDays
  for (let m = 0; m < viewMonth.value - 1; m++) d += config.value.months[m]?.days || 30
  return ((d + epoch) % config.value.days.length + config.value.days.length) % config.value.days.length
})

// ── Moon phases ────────────────────────────────────────────────────────────
const MOON_ICONS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
const MOON_NAMES = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']

function moonPhase(moon, year, month, day) {
  if (!config.value) return null
  const yearDays = config.value.months.reduce((s, m) => s + m.days, 0)
  function dse(y, mo, d) {
    let t = (y - 1) * yearDays
    for (let m = 0; m < mo - 1; m++) t += config.value.months[m]?.days || 30
    return t + d - 1
  }
  const ref = moon.reference_date
  const refIdx = moon.reference_phase_index || 0
  const diff = dse(year, month, day) - dse(ref.year, ref.month, ref.day)
  const phase = ((diff % moon.cycle_days) + moon.cycle_days) % moon.cycle_days
  const segments = 8
  const idx = Math.round((phase / moon.cycle_days) * segments) % segments
  const adjusted = (idx + refIdx) % segments
  return { phaseIcon: MOON_ICONS[adjusted], phaseName: MOON_NAMES[adjusted], color: moon.color || '#fff' }
}

function moonsForDay(day) {
  if (!config.value?.moons) return []
  return config.value.moons.map(m => ({ name: m.name, ...moonPhase(m, viewYear.value, viewMonth.value, day) }))
}

// ── Events helpers ─────────────────────────────────────────────────────────
function eventsForDay(day) {
  return events.value.filter(e => e.day === day)
}

function isToday(day) {
  if (!config.value) return false
  const cd = config.value.current_date
  return cd.year === viewYear.value && cd.month === viewMonth.value && cd.day === day &&
         (config.value.current_era_index || 0) === (config.value.current_era_index || 0)
}

function formatDate(d, eraIdx) {
  if (!config.value || !d) return ''
  const m = config.value.months[d.month - 1]
  const era = config.value.eras[eraIdx]
  return `${d.day} ${m?.name || '?'} ${d.year} ${era?.suffix || ''}`
}

// ── API helpers ────────────────────────────────────────────────────────────
async function apif(path, opts = {}) {
  return data.apif(path, opts)
}

async function loadConfig() {
  const r = await apif('/api/calendar')
  if (r.ok) {
    const d = await r.json()
    config.value = d.config
    configJson.value = JSON.stringify(d.config, null, 2)
    // Init view to current date
    viewYear.value  = d.config.current_date?.year  || 1
    viewMonth.value = d.config.current_date?.month || 1
  }
}

async function loadEvents() {
  if (!config.value) return
  const eraIdx = config.value.current_era_index || 0
  const r = await apif(`/api/calendar/events?year=${viewYear.value}&month=${viewMonth.value}&era_index=${eraIdx}`)
  if (r.ok) {
    const d = await r.json()
    events.value = d.events || []
  }
}

onMounted(async () => {
  await loadConfig()
  await loadEvents()
})

watch([viewMonth, viewYear], loadEvents)
watch(() => campaign.calendarVersion, async () => { await loadConfig(); await loadEvents() })

// ── Navigation ─────────────────────────────────────────────────────────────
function prevMonth() {
  if (viewMonth.value === 1) { viewMonth.value = config.value.months.length; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === config.value.months.length) { viewMonth.value = 1; viewYear.value++ }
  else viewMonth.value++
}
function gotoToday() {
  if (!config.value) return
  viewYear.value  = config.value.current_date.year
  viewMonth.value = config.value.current_date.month
}

// ── GM: Generate weather ───────────────────────────────────────────────────
async function generateWeather() {
  const r = await apif('/api/calendar/weather', {
    method: 'POST',
    body: JSON.stringify({
      start: { year: viewYear.value, month: viewMonth.value, day: 1 },
      days: currentMonthObj.value?.days || 30,
      era_index: config.value.current_era_index || 0,
    }),
  })
  if (r.ok) await loadEvents()
}

// ── GM: Advance date ───────────────────────────────────────────────────────
async function advanceDate() {
  if (!config.value) return
  let { year, month, day } = config.value.current_date
  let remaining = advanceDays.value
  while (remaining > 0) {
    const monthLen = config.value.months[month - 1]?.days || 30
    const tillEnd = monthLen - day
    if (remaining <= tillEnd) { day += remaining; remaining = 0 }
    else {
      remaining -= tillEnd + 1
      day = 1
      month++
      if (month > config.value.months.length) { month = 1; year++ }
    }
  }
  const r = await apif('/api/calendar/current-date', {
    method: 'PUT',
    body: JSON.stringify({ date: { year, month, day }, era_index: config.value.current_era_index || 0 }),
  })
  if (r.ok) {
    const d = await r.json()
    config.value = d.config
    advanceDays.value = 1
    showAdvance.value = false
  }
}

async function setDateToView() {
  const r = await apif('/api/calendar/current-date', {
    method: 'PUT',
    body: JSON.stringify({ date: { year: viewYear.value, month: viewMonth.value, day: 1 }, era_index: config.value.current_era_index || 0 }),
  })
  if (r.ok) {
    const d = await r.json()
    config.value = d.config
    showAdvance.value = false
  }
}

// ── GM: Save config ────────────────────────────────────────────────────────
async function saveConfig() {
  try {
    const parsed = JSON.parse(configJson.value)
    const r = await apif('/api/calendar', { method: 'PUT', body: JSON.stringify({ config: parsed }) })
    if (r.ok) {
      const d = await r.json()
      config.value = d.config
      showSettings.value = false
    }
  } catch (e) {
    alert('Invalid JSON: ' + e.message)
  }
}

// ── Event modal ────────────────────────────────────────────────────────────
const modal = ref({ open: false, id: null, day: 1, title: '', description: '', type: 'event', color: '#c9a84c', is_gm_only: false })

function openAddEvent(day) {
  modal.value = { open: true, id: null, day: day || 1, title: '', description: '', type: 'event', color: '#c9a84c', is_gm_only: false }
}

function editEvent(ev) {
  modal.value = { open: true, id: ev.id, day: ev.day, title: ev.title, description: ev.description || '', type: ev.type, color: ev.color, is_gm_only: !!ev.is_gm_only }
}

async function saveEvent() {
  const body = {
    era_index: config.value.current_era_index || 0,
    year: viewYear.value, month: viewMonth.value,
    day: modal.value.day, title: modal.value.title,
    description: modal.value.description, type: modal.value.type,
    color: modal.value.color, is_gm_only: modal.value.is_gm_only,
  }
  if (modal.value.id) {
    await apif(`/api/calendar/events/${modal.value.id}`, { method: 'PUT', body: JSON.stringify(body) })
  } else {
    await apif('/api/calendar/events', { method: 'POST', body: JSON.stringify(body) })
  }
  modal.value.open = false
  await loadEvents()
}

async function deleteEvent() {
  if (!modal.value.id) return
  await apif(`/api/calendar/events/${modal.value.id}`, { method: 'DELETE' })
  modal.value.open = false
  await loadEvents()
}
</script>

<style scoped>
.cal-page { max-width: 960px; }

.cal-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-wrap: wrap; }
.cal-today-chip {
  display: flex; align-items: center; gap: 6px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 4px 12px;
  font-size: 12px; color: var(--accent);
}

/* ── Navigation ── */
.cal-nav {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px;
}
.cal-nav-center { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: center; }
.cal-month-name { font-size: 1.4rem; font-weight: 700; color: var(--text); }
.cal-year { font-size: 1rem; color: var(--text3); }
.cal-season { font-size: 0.85rem; font-weight: 600; }
.cal-nav-btn {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 6px; color: var(--text); font-size: 1.1rem;
  padding: 4px 12px; cursor: pointer; line-height: 1;
}
.cal-nav-btn:hover { border-color: var(--accent); color: var(--accent); }
.cal-goto-today { font-size: 0.9rem; }

/* ── GM bar ── */
.cal-gm-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
}
.cal-advance-row { display: flex; align-items: center; gap: 6px; }
.cal-advance-input { width: 70px; }

/* ── Grid ── */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.cal-dow {
  background: var(--surface2);
  text-align: center; padding: 6px 4px;
  font-size: 11px; font-weight: 600;
  color: var(--text3); text-transform: uppercase; letter-spacing: .06em;
}
.cal-blank { background: var(--surface); min-height: 80px; }
.cal-cell {
  background: var(--surface);
  min-height: 90px; padding: 5px;
  cursor: default;
  transition: background 0.15s;
  position: relative;
}
.cal-cell:hover { background: var(--surface2); }
.cal-today { background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
.cal-today .cal-day-num { color: var(--accent); font-weight: 700; }

.cal-cell-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
.cal-day-num { font-size: 12px; color: var(--text3); font-weight: 600; }
.cal-moon { font-size: 16px; line-height: 1; }

/* ── Events ── */
.cal-events { display: flex; flex-direction: column; gap: 2px; }
.cal-event {
  font-size: 11px; padding: 2px 5px;
  border-radius: 3px;
  border-left: 2px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 4px;
  cursor: pointer;
}
.cal-event:hover { filter: brightness(1.2); }
.cal-event-weather {
  border-left-color: transparent;
  background: transparent;
  color: var(--text2);
}
.cal-event-gm { opacity: 0.75; }
.cal-ev-icon { flex-shrink: 0; font-size: 15px; }
.cal-ev-label { overflow: hidden; text-overflow: ellipsis; flex: 1; }
.cal-ev-gm-badge { font-size: 11px; flex-shrink: 0; }

/* ── Settings ── */
.cal-settings-panel {
  margin-top: 24px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
  padding: 16px;
}
.cal-config-textarea {
  width: 100%; font-family: 'JetBrains Mono', monospace; font-size: 11px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  color: var(--text); padding: 8px; resize: vertical;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 800; display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; width: 360px; max-width: 94vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  font-weight: 600;
}
.modal-close { background: none; border: none; cursor: pointer; color: var(--text3); font-size: 14px; }
.modal-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.modal-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; }
.form-label { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; }
.cal-color-pick { height: 36px; padding: 2px; cursor: pointer; }
</style>
