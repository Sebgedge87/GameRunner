<template>
  <!-- ═══════════════════════════════════════════════════════════════════
       ImmersionOverlay — per-system reactive VFX layer
       Rendered inside AppLayout, pointer-events: none on all children
       ═══════════════════════════════════════════════════════════════════ -->

  <!-- ── Alien: CRT brightness flicker + slime drips ─────────────────── -->
  <template v-if="system === 'alien'">
    <div class="imm-alien-flicker" aria-hidden="true" />
    <div class="imm-slime-container" aria-hidden="true">
      <div
        v-for="drip in slimeDrips"
        :key="drip.id"
        class="imm-slime-drip"
        :style="drip.style"
      />
    </div>
  </template>

  <!-- ── Coriolis: Tactical HUD bottom-right ──────────────────────────── -->
  <div v-else-if="system === 'coriolis'" class="imm-coriolis-hud" aria-hidden="true">
    <svg class="hud-ring hud-ring-outer" viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="56" class="hud-circle-track" />
      <circle cx="60" cy="60" r="56" class="hud-circle-arc" stroke-dasharray="90 266" />
      <circle cx="60" cy="60" r="56" class="hud-circle-arc hud-arc-dim" stroke-dasharray="30 326" stroke-dashoffset="200" />
    </svg>
    <svg class="hud-ring hud-ring-mid" viewBox="0 0 80 80" width="80" height="80">
      <circle cx="40" cy="40" r="36" class="hud-circle-track" />
      <circle cx="40" cy="40" r="36" class="hud-circle-arc" stroke-dasharray="55 171" />
      <line x1="40" y1="4" x2="40" y2="14" class="hud-tick" />
      <line x1="40" y1="66" x2="40" y2="76" class="hud-tick" />
      <line x1="4" y1="40" x2="14" y2="40" class="hud-tick" />
      <line x1="66" y1="40" x2="76" y2="40" class="hud-tick" />
    </svg>
    <svg class="hud-ring hud-ring-inner" viewBox="0 0 44 44" width="44" height="44">
      <circle cx="22" cy="22" r="18" class="hud-circle-track" />
      <polygon points="22,8 26,18 22,16 18,18" class="hud-pointer" />
    </svg>
    <div class="hud-readout">
      <span class="hud-label">SYS</span>
      <span class="hud-value">{{ coriolisSystemLabel }}</span>
      <span class="hud-label hud-label-sm">HORIZON</span>
    </div>
  </div>

  <!-- ── Dune: Sand sweep + House Banner placeholders ──────────────────── -->
  <template v-else-if="system === 'dune'">
    <div v-if="sandActive" class="imm-sand-sweep" aria-hidden="true">
      <div
        v-for="p in sandParticles"
        :key="p.id"
        class="sand-particle"
        :style="p.style"
      />
    </div>
    <div class="imm-house-banner imm-house-banner-left" aria-hidden="true">
      <div class="house-banner-cloth">
        <div class="house-banner-sigil">☽</div>
        <div class="house-banner-name">{{ houseName }}</div>
      </div>
    </div>
    <div class="imm-house-banner imm-house-banner-right" aria-hidden="true">
      <div class="house-banner-cloth">
        <div class="house-banner-sigil">✦</div>
        <div class="house-banner-name">{{ houseName }}</div>
      </div>
    </div>
  </template>

  <!-- ── CoC: Mythos runes ─────────────────────────────────────────────── -->
  <div v-else-if="system === 'coc'" class="imm-coc-runes" aria-hidden="true" :class="{ 'runes-triggered': runeTriggered }">
    <span v-for="r in runeGlyphs" :key="r.id" class="coc-rune" :style="r.style">{{ r.glyph }}</span>
  </div>

  <!-- ── Achtung!: Physical prop dossier elements ──────────────────────── -->
  <template v-else-if="system === 'achtung'">
    <div class="imm-prop imm-prop-knife" aria-hidden="true" title="Fairbairn-Sykes Fighting Knife">
      <svg viewBox="0 0 28 140" width="28" height="140" class="prop-knife-svg">
        <!-- Blade -->
        <path d="M14,4 L18,100 L14,112 L10,100 Z" fill="#8a8a7a" stroke="#555" stroke-width="0.5"/>
        <!-- Blood smear -->
        <path d="M15,85 Q18,88 17,95 Q15,90 13,95 Q12,88 15,85Z" fill="rgba(139,0,0,0.6)"/>
        <path d="M14,92 Q16,96 15,102" stroke="rgba(139,0,0,0.5)" stroke-width="1.5" fill="none"/>
        <!-- Guard -->
        <rect x="8" y="100" width="12" height="4" rx="1" fill="#6a6a5a" stroke="#444" stroke-width="0.5"/>
        <!-- Grip -->
        <rect x="10" y="104" width="8" height="28" rx="2" fill="#3a2a1a" stroke="#2a1a0a" stroke-width="0.5"/>
        <line x1="10" y1="108" x2="18" y2="108" stroke="#4a3a2a" stroke-width="0.5"/>
        <line x1="10" y1="113" x2="18" y2="113" stroke="#4a3a2a" stroke-width="0.5"/>
        <line x1="10" y1="118" x2="18" y2="118" stroke="#4a3a2a" stroke-width="0.5"/>
        <line x1="10" y1="123" x2="18" y2="123" stroke="#4a3a2a" stroke-width="0.5"/>
        <!-- Pommel -->
        <ellipse cx="14" cy="133" rx="5" ry="3" fill="#6a6a5a" stroke="#444" stroke-width="0.5"/>
      </svg>
    </div>

    <div class="imm-prop imm-prop-manual" aria-hidden="true" title="OSS Field Manual">
      <div class="oss-manual-cover">
        <div class="oss-manual-spine">OSS</div>
        <div class="oss-manual-title">FIELD<br>OPS<br>MANUAL</div>
        <div class="oss-manual-stamp">CLASSIFIED</div>
        <div class="oss-manual-serial">DO-437-C</div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'

const campaign = useCampaignStore()
const data = useDataStore()

const system = computed(() => campaign.activeCampaign?.system || null)

// ── Coriolis ────────────────────────────────────────────────────────────────
const coriolisSystemLabel = computed(() => {
  const name = campaign.activeCampaign?.name || 'ONLINE'
  return name.slice(0, 6).toUpperCase()
})

// ── CoC: rune glow when MP/Sanity change ────────────────────────────────────
const runeTriggered = ref(false)
let runeTimer = null

const RUNE_GLYPHS = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ','✦','⊕','⊗','☽','☿','♄']

const runeGlyphs = ref(
  Array.from({ length: 18 }, (_, i) => ({
    id: i,
    glyph: RUNE_GLYPHS[i % RUNE_GLYPHS.length],
    style: {
      left: `${4 + (i * 5.5) % 92}%`,
      top:  `${8 + (i * 7.3) % 82}%`,
      fontSize: `${14 + (i % 4) * 6}px`,
      animationDelay: `${(i * 0.37).toFixed(2)}s`,
      animationDuration: `${3.5 + (i % 5) * 0.8}s`,
    },
  }))
)

function triggerRuneGlow() {
  runeTriggered.value = true
  clearTimeout(runeTimer)
  runeTimer = setTimeout(() => { runeTriggered.value = false }, 2800)
}

// Watch character sheet data for sanity/mp changes
const prevSanity = ref(null)
const prevMp = ref(null)

watch(
  () => data.characterSheet,
  (sheet) => {
    if (!sheet || system.value !== 'coc') return
    const san = sheet.sanity ?? sheet.san ?? null
    const mp  = sheet.magic_points ?? sheet.mp ?? null
    if (prevSanity.value !== null && san !== prevSanity.value) triggerRuneGlow()
    if (prevMp.value !== null && mp !== prevMp.value) triggerRuneGlow()
    prevSanity.value = san
    prevMp.value = mp
  },
  { deep: true }
)

// ── Alien: slime drips ───────────────────────────────────────────────────────
const slimeDrips = ref([])
let slimeInterval = null
let slimeDripId = 0

function spawnSlimeDrip() {
  const id = slimeDripId++
  const left = 5 + Math.random() * 90
  const delay = Math.random() * 0.3
  const dur = 3.5 + Math.random() * 4
  const width = 3 + Math.random() * 5
  const isAlt = Math.random() > 0.5
  slimeDrips.value.push({
    id,
    style: {
      left: `${left}%`,
      width: `${width}px`,
      animationName: isAlt ? 'slime-drip-2' : 'slime-drip',
      animationDuration: `${dur}s`,
      animationDelay: `${delay}s`,
    },
  })
  // Clean up finished drips
  setTimeout(() => {
    const idx = slimeDrips.value.findIndex(d => d.id === id)
    if (idx !== -1) slimeDrips.value.splice(idx, 1)
  }, (dur + delay + 0.5) * 1000)
}

// ── Dune: sand sweep every 90 seconds ────────────────────────────────────────
const sandActive = ref(false)
const sandParticles = ref([])
let sandSweepTimer = null
let sandParticleId = 0

function launchSandSweep() {
  sandActive.value = true
  const count = 18 + Math.floor(Math.random() * 12)
  sandParticles.value = Array.from({ length: count }, (_, i) => {
    const id = sandParticleId++
    const topPct = 10 + Math.random() * 75
    const size = 2 + Math.random() * 4
    const dur = 6 + Math.random() * 5
    const delay = i * 0.15 + Math.random() * 0.5
    const isAlt = i % 3 === 0
    return {
      id,
      style: {
        top: `${topPct}%`,
        width: `${size}px`,
        height: `${size * 0.55}px`,
        animationName: isAlt ? 'sand-particle-drift-2' : 'sand-particle-drift',
        animationDuration: `${dur}s`,
        animationDelay: `${delay}s`,
      },
    }
  })
  // Clear after sweep completes
  setTimeout(() => {
    sandActive.value = false
    sandParticles.value = []
  }, 14000)
}

// ── House name placeholder ─────────────────────────────────────────────────
const houseName = computed(() => {
  const name = campaign.activeCampaign?.name
  if (!name) return 'ATREIDES'
  return name.split(/\s+/)[0].toUpperCase().slice(0, 8)
})

// ── Lifecycle ─────────────────────────────────────────────────────────────
function startEffects() {
  if (system.value === 'alien') {
    spawnSlimeDrip()
    slimeInterval = setInterval(spawnSlimeDrip, 7000 + Math.random() * 6000)
  }
  if (system.value === 'dune') {
    launchSandSweep()
    sandSweepTimer = setInterval(launchSandSweep, 90000)
  }
}

function stopEffects() {
  clearInterval(slimeInterval)
  clearInterval(sandSweepTimer)
  clearTimeout(runeTimer)
  slimeDrips.value = []
  sandParticles.value = []
}

watch(system, (newSys, oldSys) => {
  if (newSys !== oldSys) {
    stopEffects()
    startEffects()
  }
})

onMounted(startEffects)
onUnmounted(stopEffects)
</script>

<style scoped>
/* All overlay elements are pointer-events: none and fixed/absolute positioned */

/* ── Alien: brightness flicker overlay ─────────────────────────────────── */
.imm-alien-flicker {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  animation: alien-brightness-flicker 11s steps(1) infinite;
  mix-blend-mode: overlay;
  background: transparent;
}

/* ── Alien: slime drips ─────────────────────────────────────────────────── */
.imm-slime-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 999;
  overflow: visible;
}
.imm-slime-drip {
  position: absolute;
  top: 0;
  border-radius: 0 0 50% 50%;
  background: linear-gradient(
    to bottom,
    rgba(57, 255, 20, 0.0) 0%,
    rgba(57, 255, 20, 0.55) 30%,
    rgba(10, 180, 5, 0.65) 70%,
    rgba(5, 100, 2, 0.4) 100%
  );
  filter: blur(0.5px) drop-shadow(0 0 3px rgba(57, 255, 20, 0.5));
  transform-origin: top center;
  animation-fill-mode: forwards;
  animation-timing-function: ease-in;
}

/* ── Coriolis: Tactical HUD ─────────────────────────────────────────────── */
.imm-coriolis-hud {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 130px;
  height: 130px;
  pointer-events: none;
  z-index: 990;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: hud-holographic-pulse 3.5s ease-in-out infinite;
}
.hud-ring {
  position: absolute;
}
.hud-ring-outer { animation: hud-rotate-cw 18s linear infinite; }
.hud-ring-mid   { animation: hud-rotate-ccw 12s linear infinite; }
.hud-ring-inner { animation: hud-rotate-cw 6s linear infinite; }
.hud-circle-track {
  fill: none;
  stroke: rgba(0, 210, 255, 0.12);
  stroke-width: 1;
}
.hud-circle-arc {
  fill: none;
  stroke: rgba(0, 210, 255, 0.65);
  stroke-width: 1.5;
  stroke-linecap: round;
}
.hud-arc-dim { stroke: rgba(0, 210, 255, 0.3); stroke-width: 1; }
.hud-tick { stroke: rgba(0, 210, 255, 0.55); stroke-width: 1; }
.hud-pointer {
  fill: rgba(0, 210, 255, 0.8);
  filter: drop-shadow(0 0 3px rgba(0,210,255,0.9));
}
.hud-readout {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.hud-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.18em;
  color: rgba(0, 210, 255, 0.5);
  text-transform: uppercase;
}
.hud-label-sm { font-size: 6px; opacity: 0.6; }
.hud-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(0, 210, 255, 0.9);
  text-shadow: 0 0 6px rgba(0, 210, 255, 0.7);
}

/* ── Dune: sand sweep ───────────────────────────────────────────────────── */
.imm-sand-sweep {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 991;
  overflow: hidden;
}
.sand-particle {
  position: absolute;
  left: 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(226, 185, 100, 0.75) 0%, rgba(180, 120, 40, 0.3) 100%);
  filter: blur(0.8px);
  animation-fill-mode: forwards;
  animation-timing-function: linear;
}

/* ── Dune: house banners ────────────────────────────────────────────────── */
.imm-house-banner {
  position: fixed;
  top: 15vh;
  pointer-events: none;
  z-index: 980;
  animation: house-banner-sway 4s ease-in-out infinite;
}
.imm-house-banner-left  { left: -12px; transform-origin: top left; }
.imm-house-banner-right { right: -12px; transform-origin: top right; animation-delay: 1.8s; }
.house-banner-cloth {
  width: 44px;
  min-height: 100px;
  background: linear-gradient(
    to bottom,
    rgba(226, 114, 34, 0.18) 0%,
    rgba(180, 80, 20, 0.12) 100%
  );
  border: 1px solid rgba(226, 114, 34, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%);
}
.house-banner-sigil {
  font-size: 18px;
  color: rgba(226, 114, 34, 0.55);
  text-shadow: 0 0 4px rgba(226, 114, 34, 0.3);
}
.house-banner-name {
  font-family: 'Montserrat', 'Cinzel', sans-serif;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: rgba(226, 185, 100, 0.45);
  text-transform: uppercase;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* ── CoC: Mythos runes ──────────────────────────────────────────────────── */
.imm-coc-runes {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.coc-rune {
  position: absolute;
  color: rgba(154, 124, 30, 0.9);
  font-family: serif;
  user-select: none;
  animation: rune-ambient linear infinite;
}
.runes-triggered .coc-rune {
  animation-name: rune-triggered-glow !important;
  animation-duration: 2.8s !important;
  animation-iteration-count: 1 !important;
}

/* ── Achtung!: props ────────────────────────────────────────────────────── */
.imm-prop {
  position: fixed;
  pointer-events: none;
  z-index: 5;
  animation: prop-peek-in 1.2s ease-out forwards;
}
.imm-prop-knife {
  bottom: 18vh;
  right: -4px;
  opacity: 0.75;
  filter: drop-shadow(-2px 2px 4px var(--color-shadow-menu));
}
.prop-knife-svg { display: block; }

.imm-prop-manual {
  bottom: 12vh;
  left: -6px;
  opacity: 0.68;
  filter: drop-shadow(3px 2px 5px var(--color-bg-overlay-light));
  transform: rotate(-8deg);
  animation-delay: 0.6s;
}
.oss-manual-cover {
  width: 52px;
  height: 72px;
  background: linear-gradient(135deg, #2a2618 0%, #1e1c12 100%);
  border: 1px solid #3a3520;
  border-left: 6px solid #3d3820;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  gap: 2px;
}
.oss-manual-spine {
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  font-family: 'Cinzel', serif;
  font-size: 6px;
  letter-spacing: 0.15em;
  color: rgba(233, 196, 106, 0.5);
  white-space: nowrap;
}
.oss-manual-title {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: 0.08em;
  color: rgba(233, 196, 106, 0.65);
  text-align: center;
  line-height: 1.4;
}
.oss-manual-stamp {
  font-family: 'JetBrains Mono', monospace;
  font-size: 6px;
  letter-spacing: 0.05em;
  color: rgba(180, 30, 30, 0.65);
  border: 1px solid rgba(180, 30, 30, 0.4);
  padding: 1px 3px;
  text-transform: uppercase;
  transform: rotate(-12deg);
  margin-top: 4px;
}
.oss-manual-serial {
  font-family: 'JetBrains Mono', monospace;
  font-size: 5px;
  color: rgba(233, 196, 106, 0.3);
  margin-top: 2px;
}
</style>
