<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import blipFallbackUrl from '@/assets/audio/alien/478187__balcoran__motion-tracker-blip.wav'

// Try the proper mp4 first (dropped into client/public/audio/alien/),
// fall back to the bundled WAV if it 404s.
const BLIP_URLS = [
  '/audio/alien/motion-tracker-blip.mp4',
  blipFallbackUrl,
]

const props = defineProps({
  threatLevel: { type: Number, default: 0 },
  initialContacts: { type: Number, default: 3 }
})

const emit = defineEmits(['contact-proximate', 'contact-cleared'])

const radarRef = ref(null)
const overlayRef = ref(null)
const muted = ref(false)

// Reactive UI state
const uiContactCount = ref(0)
const uiBearing = ref('---')
const uiClosest = ref('--M')
const uiSignal = ref('--dB')
const uiStatus = ref('SCANNING...')
const uiStatusAlert = ref(false)
const uiContacts = ref([])

// Audio
let audioCtx = null
let blipBuffer = null
let lastPingTime = 0

// Canvas
let rc = null
let oc = null

// Radar state (mutable, not reactive — updated every animation frame)
const W = 340, H = 340, CX = 170, CY = 170, R = 158
let angle = 0
let contacts = []
let sweepTrail = []
let tickCount = 0
let animFrame = null
let prevProximate = false
let clearedEmitted = true

// ── Audio ──────────────────────────────────────────────────────────────────

function initAudio() {
  if (audioCtx) return
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  loadBlip(BLIP_URLS.slice())
}

function loadBlip(candidates) {
  const url = candidates.shift()
  if (!url) return
  fetch(url)
    .then(r => { if (!r.ok) throw new Error('not found'); return r.arrayBuffer() })
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(decoded => { blipBuffer = decoded })
    .catch(() => loadBlip(candidates))
}

function playPing(freq) {
  if (muted.value || !audioCtx || !blipBuffer) return
  const now = audioCtx.currentTime
  if (now - lastPingTime < 0.08) return
  lastPingTime = now
  const src = audioCtx.createBufferSource()
  const gain = audioCtx.createGain()
  src.buffer = blipBuffer
  src.connect(gain)
  gain.connect(audioCtx.destination)
  src.playbackRate.value = Math.max(0.5, Math.min(2, freq / 800))
  gain.gain.setValueAtTime(0.6, now)
  src.start(now)
}

function playSweepTick() {
  if (muted.value || !audioCtx) return
  const now = audioCtx.currentTime
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, now)
  gain.gain.setValueAtTime(0.04, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
  osc.start(now)
  osc.stop(now + 0.05)
}

// ── Contacts ───────────────────────────────────────────────────────────────

function spawnContact() {
  const a = Math.random() * Math.PI * 2
  const d = 0.2 + Math.random() * 0.75
  contacts.push({
    id: 'T-' + String(Math.floor(Math.random() * 900) + 100),
    a, d,
    x: CX + Math.cos(a) * d * R,
    y: CY + Math.sin(a) * d * R,
    lit: 0,
    vx: (Math.random() - 0.5) * 0.002,
    vy: (Math.random() - 0.5) * 0.002,
  })
}

function moveContacts() {
  contacts.forEach(c => {
    c.a += c.vx * 0.5
    c.d = Math.max(0.1, Math.min(0.95, c.d + c.vy * 0.3))
  })
}

// ── Canvas drawing ─────────────────────────────────────────────────────────

function drawRadar() {
  rc.clearRect(0, 0, W, H)
  rc.save()
  rc.beginPath()
  rc.arc(CX, CY, R, 0, Math.PI * 2)
  rc.clip()
  rc.fillStyle = '#000'
  rc.fillRect(0, 0, W, H)
  ;[0.25, 0.5, 0.75, 1].forEach(f => {
    rc.beginPath()
    rc.arc(CX, CY, R * f, 0, Math.PI * 2)
    rc.strokeStyle = f === 1 ? '#1a4a1a' : '#0d2a0d'
    rc.lineWidth = f === 1 ? 1.5 : 0.8
    rc.stroke()
  })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    rc.beginPath()
    rc.moveTo(CX, CY)
    rc.lineTo(CX + Math.cos(a) * R, CY + Math.sin(a) * R)
    rc.strokeStyle = '#0a1f0a'
    rc.lineWidth = 0.6
    rc.stroke()
  }
  const trailLen = 60
  sweepTrail.forEach((t, i) => {
    const alpha = (i / trailLen) * 0.45
    const spread = (Math.PI * 2) / trailLen
    rc.beginPath()
    rc.moveTo(CX, CY)
    rc.arc(CX, CY, R, t, t + spread * 1.5)
    rc.closePath()
    rc.fillStyle = `rgba(74,240,74,${alpha})`
    rc.fill()
  })
  rc.beginPath()
  rc.moveTo(CX, CY)
  rc.lineTo(CX + Math.cos(angle) * R, CY + Math.sin(angle) * R)
  rc.strokeStyle = '#4af04a'
  rc.lineWidth = 1.5
  rc.stroke()
  rc.restore()
}

function drawOverlay() {
  oc.clearRect(0, 0, W, H)
  oc.save()
  oc.beginPath()
  oc.arc(CX, CY, R, 0, Math.PI * 2)
  oc.clip()
  contacts.forEach(c => {
    c.x = CX + Math.cos(c.a) * c.d * R
    c.y = CY + Math.sin(c.a) * c.d * R
    const diff = ((c.a - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    if (diff < 0.15) {
      c.lit = 1.0
      playPing(600 + (1 - c.d) * 400)
    }
    if (c.lit > 0) {
      const pulse = c.lit
      oc.beginPath()
      oc.arc(c.x, c.y, 3 + (1 - pulse) * 4, 0, Math.PI * 2)
      oc.fillStyle = `rgba(74,240,74,${pulse * 0.3})`
      oc.fill()
      oc.beginPath()
      oc.arc(c.x, c.y, 3, 0, Math.PI * 2)
      oc.fillStyle = `rgba(143,255,143,${pulse})`
      oc.fill()
      c.lit = Math.max(0, c.lit - 0.008)
    }
  })
  oc.restore()
  // Mask beyond radar edge
  oc.fillStyle = '#000'
  oc.beginPath()
  oc.arc(CX, CY, R + 2, 0, Math.PI * 2)
  oc.arc(CX, CY, R + 20, 0, Math.PI * 2, true)
  oc.fill()
  // Border rings
  oc.strokeStyle = '#1a4a1a'
  oc.lineWidth = 2
  oc.beginPath()
  oc.arc(CX, CY, R, 0, Math.PI * 2)
  oc.stroke()
  oc.strokeStyle = '#0d2a0d'
  oc.lineWidth = 6
  oc.beginPath()
  oc.arc(CX, CY, R + 8, 0, Math.PI * 2)
  oc.stroke()
  // Cardinal labels
  oc.font = '10px "Share Tech Mono"'
  oc.fillStyle = '#1a5a1a'
  oc.textAlign = 'center'
  ;['N', 'E', 'S', 'W'].forEach((d, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2
    oc.fillText(d, CX + Math.cos(a) * (R + 14), CY + Math.sin(a) * (R + 14) + 4)
  })
}

// ── UI state update ────────────────────────────────────────────────────────

function updateUI() {
  const count = contacts.length
  uiContactCount.value = count
  const deg = Math.round(((angle + Math.PI / 2) * 180 / Math.PI + 360) % 360)
  uiBearing.value = String(deg).padStart(3, '0') + '\u00b0'

  if (count > 0) {
    const closest = contacts.reduce((m, c) => c.d < m.d ? c : m, contacts[0])
    const distM = Math.round(closest.d * 40)
    uiClosest.value = distM + 'M'
    uiSignal.value = Math.round(-40 - closest.d * 30) + 'dB'

    const proximate = distM < 8
    if (proximate && !prevProximate) emit('contact-proximate')
    prevProximate = proximate
    clearedEmitted = false

    if (distM < 8) {
      uiStatus.value = 'CONTACT PROXIMATE'
      uiStatusAlert.value = true
    } else if (distM < 18) {
      uiStatus.value = 'MULTIPLE CONTACTS'
      uiStatusAlert.value = true
    } else {
      uiStatus.value = 'TRACKING ' + count + ' CONTACT' + (count !== 1 ? 'S' : '')
      uiStatusAlert.value = false
    }
  } else {
    uiClosest.value = '--M'
    uiSignal.value = '--dB'
    uiStatus.value = 'SCANNING...'
    uiStatusAlert.value = false
    prevProximate = false
    if (!clearedEmitted) {
      emit('contact-cleared')
      clearedEmitted = true
    }
  }

  uiContacts.value = contacts.slice(0, 4).map(c => ({
    id: c.id,
    dist: Math.round(c.d * 40) + 'M',
    bear: String(Math.round(((c.a + Math.PI / 2) * 180 / Math.PI + 360) % 360)).padStart(3, '0') + '\u00b0',
    close: Math.round(c.d * 40) < 8,
  }))
}

// ── Animation loop ─────────────────────────────────────────────────────────

function tick() {
  angle += 0.025
  if (angle > Math.PI * 2) angle -= Math.PI * 2
  sweepTrail.push(angle)
  if (sweepTrail.length > 60) sweepTrail.shift()
  tickCount++
  if (tickCount % 3 === 0) playSweepTick()
  if (tickCount % 120 === 0) moveContacts()
  drawRadar()
  drawOverlay()
  updateUI()
  animFrame = requestAnimationFrame(tick)
}

function onFirstInteraction() {
  initAudio()
}

onMounted(() => {
  rc = radarRef.value.getContext('2d')
  oc = overlayRef.value.getContext('2d')
  for (let i = 0; i < props.initialContacts; i++) spawnContact()
  animFrame = requestAnimationFrame(tick)
  document.addEventListener('click', onFirstInteraction, { once: true })
  document.addEventListener('keydown', onFirstInteraction, { once: true })
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  document.removeEventListener('click', onFirstInteraction)
  document.removeEventListener('keydown', onFirstInteraction)
})

function toggleMute() {
  muted.value = !muted.value
}
</script>

<template>
  <div class="mt-widget">
    <div class="mt-screen">
      <div class="mt-body"></div>
      <canvas ref="radarRef" width="340" height="340" class="mt-canvas mt-canvas--radar"></canvas>
      <canvas ref="overlayRef" width="340" height="340" class="mt-canvas mt-canvas--overlay"></canvas>
    </div>

    <div class="mt-ui">
      <div class="mt-col">
        <span class="mt-label">CONTACTS</span>
        <span class="mt-val">{{ String(uiContactCount).padStart(2, '0') }}</span>
        <span class="mt-label mt-label--gap">RANGE</span>
        <span class="mt-val">40M</span>
      </div>
      <div class="mt-col mt-col--center">
        <span class="mt-label">BEARING</span>
        <span class="mt-val">{{ uiBearing }}</span>
        <span class="mt-label mt-label--gap">FREQ</span>
        <span class="mt-val">2.4KHz</span>
      </div>
      <div class="mt-col mt-col--right">
        <span class="mt-label">CLOSEST</span>
        <span class="mt-val">{{ uiClosest }}</span>
        <span class="mt-label mt-label--gap">SIGNAL</span>
        <span class="mt-val">{{ uiSignal }}</span>
      </div>
    </div>

    <div class="mt-footer">
      <span class="mt-status" :class="{ 'mt-status--alert': uiStatusAlert }">{{ uiStatus }}</span>
      <button
        class="mt-mute"
        :class="{ 'mt-mute--off': muted }"
        :title="muted ? 'Unmute' : 'Mute'"
        @click="toggleMute"
      >
        <svg v-if="!muted" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 5H4L7 2V12L4 9H2V5Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M9 4.5C10.2 5.3 11 6.1 11 7C11 7.9 10.2 8.7 9 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <path d="M10 2.5C12 3.8 13 5.3 13 7C13 8.7 12 10.2 10 11.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 5H4L7 2V12L4 9H2V5Z" stroke="currentColor" stroke-width="1.2"/>
          <path d="M9 5L13 9M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="mt-contacts">
      <div v-for="c in uiContacts" :key="c.id" class="mt-contact-row">
        <span class="c-id">{{ c.id }}</span>
        <span class="c-dist">{{ c.dist }}</span>
        <span class="c-bear">{{ c.bear }}</span>
        <span :class="c.close ? 'c-close' : 'c-track'">{{ c.close ? 'CLOSE' : 'TRACK' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mt-widget {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-drawer);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) var(--space-4);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  background: var(--color-bg-card, #030f03);
  border: 1px solid var(--color-border-default);
  box-shadow: 0 0 24px rgba(74, 240, 74, 0.08), inset 0 0 40px rgba(0,0,0,0.6);
}

.mt-screen {
  position: relative;
  width: 340px;
  height: 340px;
}

.mt-body {
  position: absolute;
  top: 0;
  left: 0;
  width: 340px;
  height: 340px;
  background: var(--color-bg-page);
  border: 2px solid #1a3a1a;
  border-radius: 50%;
  overflow: hidden;
}

.mt-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 340px;
  height: 340px;
}

.mt-canvas--overlay {
  pointer-events: none;
}

.mt-ui {
  width: 340px;
  margin-top: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.mt-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mt-col--center {
  align-items: center;
}

.mt-col--right {
  align-items: flex-end;
}

.mt-label {
  font-size: var(--text-xs);
  color: var(--color-text-hint);
  letter-spacing: 2px;
}

.mt-label--gap {
  margin-top: var(--space-1);
}

.mt-val {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: var(--text-xl);
  color: var(--alien-phosphor, #4af04a);
  letter-spacing: 2px;
}

.mt-footer {
  width: 340px;
  margin-top: var(--space-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mt-status {
  font-size: var(--text-xs);
  letter-spacing: 2px;
  color: var(--color-text-secondary);
}

@media (prefers-reduced-motion: no-preference) {
  .mt-status--alert {
    color: var(--alien-danger, #cc3333);
    animation: mt-blink 0.8s step-end infinite;
  }
}

@keyframes mt-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.mt-mute {
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: 0;
  color: var(--color-text-secondary);
  padding: var(--space-1) var(--space-2);
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color var(--duration-base) var(--ease-default),
    color var(--duration-base) var(--ease-default),
    background var(--duration-base) var(--ease-default);
}

.mt-mute:hover {
  border-color: var(--alien-phosphor, #4af04a);
  color: var(--alien-phosphor-bright, #8fff8f);
  background: rgba(74, 240, 74, 0.06);
}

.mt-mute--off {
  color: var(--color-text-disabled);
  border-color: rgba(74, 240, 74, 0.08);
}

.mt-contacts {
  width: 340px;
  margin-top: var(--space-2);
  border-top: 1px solid #0d2a0d;
  padding-top: var(--space-1);
  min-height: 48px;
}

.mt-contact-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  padding: 2px 0;
  border-bottom: 1px solid #060f06;
  letter-spacing: 1px;
}

.c-id   { color: var(--color-text-secondary); }
.c-dist { color: var(--alien-phosphor, #4af04a); }
.c-bear { color: var(--color-text-hint); }
.c-track { color: var(--color-text-hint); }

@media (prefers-reduced-motion: no-preference) {
  .c-close {
    color: var(--alien-danger, #cc3333);
    animation: mt-blink 1s step-end infinite;
  }
}
</style>
