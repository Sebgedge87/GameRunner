<template>
  <Teleport to="body">
    <div v-if="visible" class="timer-root" :class="{ 'timer-urgent': urgent, 'timer-expired': expired }">
      <div class="timer-label" v-if="timer.label">{{ timer.label }}</div>
      <div class="timer-display">{{ displayTime }}</div>

      <!-- GM controls -->
      <div v-if="campaign.isGm" class="timer-controls">
        <!-- Set duration quick buttons -->
        <div class="timer-presets">
          <button v-for="p in PRESETS" :key="p.s" class="timer-preset-btn" @click="preset(p.s)">{{ p.l }}</button>
        </div>
        <!-- Custom input + label -->
        <div class="timer-set-row">
          <input v-model="inputLabel" placeholder="Label…" class="timer-input" />
          <input v-model="inputMins" type="number" min="0" placeholder="min" class="timer-input timer-input-sm" />
          <input v-model="inputSecs" type="number" min="0" max="59" placeholder="sec" class="timer-input timer-input-sm" />
          <button class="btn btn-sm" @click="setTimer">Set</button>
        </div>
        <!-- Start / pause / reset -->
        <div class="timer-action-row">
          <button class="btn btn-sm timer-btn-start" @click="start" :disabled="expired && !timer.running">
            {{ timer.running ? '⏸ Pause' : '▶ Start' }}
          </button>
          <button class="btn btn-sm" @click="reset">↺ Reset</button>
          <button class="btn btn-sm btn-danger" @click="clear" title="Hide timer">✕</button>
        </div>
      </div>

      <!-- Non-GM: just a close button to hide locally -->
      <button v-else class="timer-hide-btn" @click="localHide = true" title="Hide">✕</button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'

const campaign = useCampaignStore()
const data = useDataStore()

// Timer state comes from campaign store (synced via SSE)
const timer = computed(() => campaign.timer || { label: '', end: null, remaining: 0, running: false })

// Local visibility (players can hide locally; GM hides by resetting)
const localHide = ref(false)

// Show widget whenever there's any timer data set (label or duration > 0)
const visible = computed(() => {
  if (localHide.value && !campaign.isGm) return false
  const t = timer.value
  return !!(t.label || t.remaining > 0 || t.running || t.end)
})

// ── Countdown ──────────────────────────────────────────────────────────────
const nowSecs = ref(Math.floor(Date.now() / 1000))
let ticker = null

onMounted(() => { ticker = setInterval(() => { nowSecs.value = Math.floor(Date.now() / 1000) }, 500) })
onUnmounted(() => clearInterval(ticker))

const remaining = computed(() => {
  const t = timer.value
  if (t.running && t.end) return Math.max(t.end - nowSecs.value, 0)
  return t.remaining || 0
})

const expired = computed(() => timer.value.running && remaining.value <= 0)
const urgent  = computed(() => remaining.value > 0 && remaining.value <= 30)

const displayTime = computed(() => {
  const s = remaining.value
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
})

// ── GM inputs ──────────────────────────────────────────────────────────────
const inputLabel = ref('')
const inputMins  = ref('')
const inputSecs  = ref('')

const PRESETS = [
  { l: '1m',  s: 60  },
  { l: '2m',  s: 120 },
  { l: '5m',  s: 300 },
  { l: '10m', s: 600 },
  { l: '30m', s: 1800 },
]

async function apiTimer(body) {
  const cid = campaign.activeCampaign?.id
  if (!cid) return
  const r = await data.apif(`/api/campaigns/${cid}/timer`, { method: 'PUT', body: JSON.stringify(body) })
  const d = await r.json()
  if (d.timer) campaign.setTimer(d.timer)
}

function preset(s) {
  inputMins.value = Math.floor(s / 60)
  inputSecs.value = s % 60
  apiTimer({ action: 'set', label: inputLabel.value || timer.value.label, duration: s })
}

async function setTimer() {
  const mins = parseInt(inputMins.value) || 0
  const secs = parseInt(inputSecs.value) || 0
  const duration = mins * 60 + secs
  await apiTimer({ action: 'set', label: inputLabel.value || timer.value.label, duration })
  inputMins.value = ''
  inputSecs.value = ''
}

function start() {
  if (timer.value.running) {
    apiTimer({ action: 'pause' })
  } else {
    apiTimer({ action: 'start' })
  }
}

function reset() {
  apiTimer({ action: 'reset', duration: timer.value.remaining })
}

async function clear() {
  await apiTimer({ action: 'reset', label: '', duration: 0 })
  localHide.value = false
}

// Reset local hide when a new timer comes in from SSE
watch(() => timer.value.end, () => { localHide.value = false })
</script>

<style scoped>
.timer-root {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 900;
  background: var(--surface2, #1e1e1e);
  border: 1px solid var(--border, #333);
  border-radius: 10px;
  padding: 14px 18px;
  min-width: 200px;
  max-width: 280px;
  box-shadow: 0 4px 24px var(--color-shadow-menu);
  font-family: 'JetBrains Mono', monospace;
  transition: border-color 0.3s;
  user-select: none;
}
.timer-root.timer-urgent {
  border-color: var(--red, #e05252);
  animation: timer-pulse 1s ease-in-out infinite;
}
.timer-root.timer-expired {
  border-color: var(--red, #e05252);
  background: rgba(224,82,82,0.15);
}
@keyframes timer-pulse {
  0%, 100% { box-shadow: 0 4px 24px var(--color-shadow-menu); }
  50% { box-shadow: 0 4px 32px rgba(224,82,82,0.5); }
}
.timer-label {
  font-size: 10px;
  text-transform: none;
  letter-spacing: .12em;
  color: var(--text3, #888);
  margin-bottom: 2px;
}
.timer-display {
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--accent, #c9a84c);
  letter-spacing: .06em;
  line-height: 1;
  margin-bottom: 8px;
}
.timer-urgent .timer-display,
.timer-expired .timer-display { color: var(--red, #e05252); }

.timer-controls { display: flex; flex-direction: column; gap: 6px; }
.timer-presets { display: flex; gap: 4px; flex-wrap: wrap; }
.timer-preset-btn {
  background: var(--surface3, #2a2a2a);
  border: 1px solid var(--border, #333);
  border-radius: 4px;
  color: var(--text2, #bbb);
  font-family: inherit;
  font-size: 10px;
  padding: 2px 7px;
  cursor: pointer;
}
.timer-preset-btn:hover { border-color: var(--accent, #c9a84c); color: var(--accent, #c9a84c); }

.timer-set-row { display: flex; gap: 4px; align-items: center; }
.timer-input {
  background: var(--surface3, #2a2a2a);
  border: 1px solid var(--border, #333);
  border-radius: 4px;
  color: var(--text, #eee);
  font-family: inherit;
  font-size: 11px;
  padding: 3px 6px;
  flex: 1;
}
.timer-input-sm { flex: 0 0 46px; }
.timer-action-row { display: flex; gap: 4px; }
.timer-btn-start { flex: 1; }

.timer-hide-btn {
  position: absolute;
  top: 6px; right: 8px;
  background: none;
  border: none;
  color: var(--text3, #888);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
.timer-hide-btn:hover { color: var(--text, #eee); }
</style>
