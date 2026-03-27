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
      <div v-if="showSettings && isGm && draft" class="cal-settings-panel">
        <h3>Calendar Configuration</h3>
        <div class="cfg-tabs">
          <button v-for="t in CFG_TABS" :key="t" class="cfg-tab" :class="{ active: cfgTab === t }" @click="cfgTab = t">{{ t }}</button>
        </div>

        <!-- General -->
        <div v-if="cfgTab === 'General'" class="cfg-section">
          <div class="cfg-row">
            <label>Starting Weekday offset (0 = first day of week)</label>
            <input v-model.number="draft.epoch_weekday" type="number" min="0" class="form-input cfg-sm" />
          </div>
          <div class="cfg-row">
            <label>Active Era</label>
            <select v-model.number="draft.current_era_index" class="form-input">
              <option v-for="(era, i) in draft.eras" :key="i" :value="i">{{ era.name || `Era ${i + 1}` }}</option>
            </select>
          </div>
          <div class="cfg-row">
            <label>Current Date</label>
            <div class="cfg-inline">
              <div class="cfg-labeled-input"><span>Year</span><input v-model.number="draft.current_date.year" type="number" min="1" class="form-input cfg-sm" /></div>
              <div class="cfg-labeled-input"><span>Month</span><input v-model.number="draft.current_date.month" type="number" min="1" :max="draft.months.length" class="form-input cfg-sm" /></div>
              <div class="cfg-labeled-input"><span>Day</span><input v-model.number="draft.current_date.day" type="number" min="1" class="form-input cfg-sm" /></div>
            </div>
          </div>
        </div>

        <!-- Days of the week -->
        <div v-if="cfgTab === 'Days'" class="cfg-section">
          <div v-for="(d, i) in draft.days" :key="i" class="cfg-list-row">
            <input v-model="d.name" class="form-input" placeholder="Full name" />
            <input v-model="d.short" class="form-input cfg-short" placeholder="Short" maxlength="5" />
            <button class="cfg-rm-btn" @click="draft.days.splice(i, 1)" title="Remove">✕</button>
          </div>
          <button class="btn btn-sm cfg-add-btn" @click="draft.days.push({ name: '', short: '', real_day: '' })">+ Day</button>
        </div>

        <!-- Months -->
        <div v-if="cfgTab === 'Months'" class="cfg-section">
          <div class="cfg-col-heads"><span>Name</span><span>Short</span><span>Days</span></div>
          <div v-for="(m, i) in draft.months" :key="i" class="cfg-list-row">
            <input v-model="m.name" class="form-input" placeholder="Month name" />
            <input v-model="m.short" class="form-input cfg-short" placeholder="Short" maxlength="5" />
            <input v-model.number="m.days" type="number" min="1" class="form-input cfg-sm" />
            <button class="cfg-rm-btn" @click="draft.months.splice(i, 1)" title="Remove">✕</button>
          </div>
          <button class="btn btn-sm cfg-add-btn" @click="draft.months.push({ name: '', short: '', real_month: '', days: 30 })">+ Month</button>
        </div>

        <!-- Eras -->
        <div v-if="cfgTab === 'Eras'" class="cfg-section">
          <div class="cfg-col-heads"><span>Name</span><span>Suffix</span><span>Start yr</span><span>End yr</span></div>
          <div v-for="(era, i) in draft.eras" :key="i" class="cfg-list-row">
            <input v-model="era.name" class="form-input" placeholder="Era name" />
            <input v-model="era.suffix" class="form-input cfg-short" placeholder="e.g. AE" />
            <input v-model.number="era.start_year" type="number" class="form-input cfg-sm" />
            <input v-model.number="era.end_year" type="number" class="form-input cfg-sm" />
            <button class="cfg-rm-btn" @click="draft.eras.splice(i, 1)" title="Remove">✕</button>
          </div>
          <button class="btn btn-sm cfg-add-btn" @click="draft.eras.push({ id: Date.now(), name: '', suffix: '', start_year: 0, end_year: 9999 })">+ Era</button>
        </div>

        <!-- Seasons -->
        <div v-if="cfgTab === 'Seasons'" class="cfg-section">
          <div v-for="(s, i) in draft.seasons" :key="i" class="cfg-season-card">
            <div class="cfg-list-row">
              <input v-model="s.name" class="form-input" placeholder="Season name" />
              <input v-model="s.icon" class="form-input cfg-icon" placeholder="🌿" />
              <input v-model="s.color" type="color" class="form-input cfg-color" title="Colour" />
              <button class="cfg-rm-btn" @click="removeSeason(i)" title="Remove">✕</button>
            </div>
            <div class="cfg-months-grid">
              <label v-for="(m, mi) in draft.months" :key="mi" class="cfg-month-check">
                <input type="checkbox" :checked="s.months.includes(mi)" @change="toggleSeasonMonth(s, mi, $event.target.checked)" />
                {{ m.name || `Month ${mi + 1}` }}
              </label>
            </div>
          </div>
          <button class="btn btn-sm cfg-add-btn" @click="draft.seasons.push({ name: '', icon: '🌟', color: '#888888', months: [] })">+ Season</button>
        </div>

        <!-- Moons -->
        <div v-if="cfgTab === 'Moons'" class="cfg-section">
          <div v-for="(moon, i) in draft.moons" :key="i" class="cfg-moon-card">
            <div class="cfg-list-row">
              <input v-model="moon.name" class="form-input" placeholder="Moon name" />
              <input v-model="moon.color" type="color" class="form-input cfg-color" title="Colour" />
              <button class="cfg-rm-btn" @click="draft.moons.splice(i, 1)" title="Remove">✕</button>
            </div>
            <div class="cfg-row">
              <label>Cycle length (days)</label>
              <input v-model.number="moon.cycle_days" type="number" min="1" class="form-input cfg-sm" />
            </div>
            <div class="cfg-row">
              <label>Starting phase (0=New … 4=Full … 7=Waning Crescent)</label>
              <input v-model.number="moon.reference_phase_index" type="number" min="0" max="7" class="form-input cfg-sm" />
            </div>
            <div class="cfg-row">
              <label>Reference date (year / month / day)</label>
              <div class="cfg-inline">
                <input v-model.number="moon.reference_date.year" type="number" min="1" class="form-input cfg-sm" />
                <input v-model.number="moon.reference_date.month" type="number" min="1" class="form-input cfg-sm" />
                <input v-model.number="moon.reference_date.day" type="number" min="1" class="form-input cfg-sm" />
              </div>
            </div>
          </div>
          <button class="btn btn-sm cfg-add-btn" @click="addMoon">+ Moon</button>
        </div>

        <!-- Weather -->
        <div v-if="cfgTab === 'Weather'" class="cfg-section">
          <p class="cfg-hint">Season names must match those in the Seasons tab.</p>
          <div v-for="s in draft.seasons" :key="s.name" class="cfg-weather-season">
            <div class="cfg-weather-season-title">
              <span :style="{ color: s.color }">{{ s.icon }}</span> {{ s.name || '(unnamed season)' }}
            </div>
            <div class="cfg-col-heads"><span>Label</span><span>Icon</span><span>Weight</span></div>
            <div v-for="(w, wi) in draftWeather(s.name)" :key="wi" class="cfg-list-row">
              <input v-model="w.label" class="form-input" placeholder="e.g. Heavy Snow" />
              <input v-model="w.icon" class="form-input cfg-icon" placeholder="❄" />
              <input v-model.number="w.weight" type="number" min="1" class="form-input cfg-sm" title="Relative weight" />
              <button class="cfg-rm-btn" @click="removeWeather(s.name, wi)" title="Remove">✕</button>
            </div>
            <button class="btn btn-sm cfg-add-btn" @click="addWeather(s.name)">+ Entry</button>
          </div>
        </div>

        <div class="cfg-footer">
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
const viewMonth = ref(1)   // 1-based
const viewYear  = ref(1)

// ── Config editor ──────────────────────────────────────────────────────────
const CFG_TABS = ['General', 'Days', 'Months', 'Eras', 'Seasons', 'Moons', 'Weather']
const cfgTab = ref('General')
const draft = ref(null)

watch(showSettings, (open) => {
  if (open && config.value) {
    draft.value = JSON.parse(JSON.stringify(config.value))
    cfgTab.value = 'General'
  }
})

function draftWeather(seasonName) {
  if (!draft.value.weather) draft.value.weather = {}
  if (!draft.value.weather[seasonName]) draft.value.weather[seasonName] = []
  return draft.value.weather[seasonName]
}

function toggleSeasonMonth(season, monthIdx, checked) {
  if (checked) { if (!season.months.includes(monthIdx)) season.months.push(monthIdx) }
  else season.months = season.months.filter(m => m !== monthIdx)
}

function removeSeason(i) {
  const name = draft.value.seasons[i].name
  draft.value.seasons.splice(i, 1)
  if (name && draft.value.weather) delete draft.value.weather[name]
}

function addWeather(seasonName) {
  if (!draft.value.weather) draft.value.weather = {}
  if (!draft.value.weather[seasonName]) draft.value.weather[seasonName] = []
  draft.value.weather[seasonName].push({ label: '', icon: '☀', weight: 10 })
}

function removeWeather(seasonName, idx) {
  draft.value.weather[seasonName].splice(idx, 1)
}

function addMoon() {
  draft.value.moons.push({
    name: '', cycle_days: 28, reference_phase_index: 0,
    reference_date: { year: 1, month: 1, day: 1 }, color: '#ffffff',
  })
}

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
    const r = await apif('/api/calendar', { method: 'PUT', body: JSON.stringify({ config: draft.value }) })
    if (r.ok) {
      const d = await r.json()
      config.value = d.config
      showSettings.value = false
    }
  } catch (e) {
    alert('Save failed: ' + e.message)
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
  color: var(--text3); letter-spacing: .06em;
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

/* ── Settings panel ── */
.cal-settings-panel {
  margin-top: 24px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
  padding: 16px;
}
.cfg-tabs {
  display: flex; flex-wrap: wrap; gap: 4px; margin: 12px 0;
}
.cfg-tab {
  padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--surface); color: var(--text2); font-size: 12px; cursor: pointer;
}
.cfg-tab.active { background: var(--accent); color: #1a1008; border-color: var(--accent); font-weight: 700; }
.cfg-tab:hover:not(.active) { border-color: var(--accent); color: var(--accent); }

.cfg-section { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
.cfg-row { display: flex; flex-direction: column; gap: 4px; }
.cfg-row label { font-size: 11px; color: var(--text3); letter-spacing: .07em; }
.cfg-inline { display: flex; gap: 8px; flex-wrap: wrap; }
.cfg-labeled-input { display: flex; flex-direction: column; gap: 2px; }
.cfg-labeled-input span { font-size: 10px; color: var(--text3); }

.cfg-list-row { display: flex; gap: 6px; align-items: center; }
.cfg-col-heads { display: flex; gap: 6px; padding: 0 2px; }
.cfg-col-heads span { font-size: 10px; color: var(--text3); letter-spacing: .07em; flex: 1; }
.cfg-col-heads span:last-child { flex: 0 0 24px; }

.cfg-sm { width: 80px; flex-shrink: 0; }
.cfg-short { width: 80px; flex-shrink: 0; }
.cfg-icon { width: 60px; flex-shrink: 0; text-align: center; }
.cfg-color { width: 44px; flex-shrink: 0; padding: 2px; cursor: pointer; height: 34px; }
.cfg-rm-btn {
  flex-shrink: 0; background: none; border: 1px solid var(--border);
  border-radius: 4px; color: var(--text3); cursor: pointer; padding: 2px 6px;
  font-size: 11px; line-height: 1;
}
.cfg-rm-btn:hover { border-color: #c0392b; color: #c0392b; }
.cfg-add-btn { align-self: flex-start; margin-top: 2px; }

.cfg-season-card, .cfg-moon-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px;
}
.cfg-months-grid {
  display: flex; flex-wrap: wrap; gap: 6px; padding-top: 4px;
}
.cfg-month-check {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text2); cursor: pointer;
}

.cfg-weather-season {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 6px;
}
.cfg-weather-season-title { font-size: 13px; font-weight: 600; color: var(--text); }
.cfg-hint { font-size: 11px; color: var(--text3); margin: 0 0 4px; }
.cfg-footer { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: var(--color-bg-overlay-medium);
  z-index: 800; display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 10px; width: 360px; max-width: 94vw;
  box-shadow: 0 8px 32px var(--color-shadow-menu);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  font-weight: 600;
}
.modal-close { background: none; border: none; cursor: pointer; color: var(--text3); font-size: 14px; }
.modal-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.modal-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; }
.form-label { font-size: 11px; color: var(--text3); letter-spacing: .08em; }
.cal-color-pick { height: 36px; padding: 2px; cursor: pointer; }
</style>
