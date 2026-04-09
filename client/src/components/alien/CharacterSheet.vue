<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  ef: { type: Object, required: true },
})

// ── Live clock ──────────────────────────────────────────────────────────────
const clock = ref('--:--:--')
let clockInterval = null
function updateClock() {
  const now = new Date()
  clock.value =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0') + ' UTC'
}
onMounted(() => { updateClock(); clockInterval = setInterval(updateClock, 1000) })
onUnmounted(() => clearInterval(clockInterval))

// ── Static config ───────────────────────────────────────────────────────────
const ATTRS = [
  { key: 'strength', label: 'STRENGTH' },
  { key: 'agility',  label: 'AGILITY'  },
  { key: 'wits',     label: 'WITS'     },
  { key: 'empathy',  label: 'EMPATHY'  },
]

const SKILLS = [
  { key: 'sk_close_combat',  label: 'CLOSE COMBAT',    attr: 'STR' },
  { key: 'sk_heavy_mach',    label: 'HEAVY MACHINERY',  attr: 'STR' },
  { key: 'sk_stamina',       label: 'STAMINA',           attr: 'STR' },
  { key: 'sk_ranged_combat', label: 'RANGED COMBAT',     attr: 'AGI' },
  { key: 'sk_mobility',      label: 'MOBILITY',          attr: 'AGI' },
  { key: 'sk_piloting',      label: 'PILOTING',          attr: 'AGI' },
  { key: 'sk_observation',   label: 'OBSERVATION',       attr: 'WIT' },
  { key: 'sk_comtech',       label: 'COMTECH',           attr: 'WIT' },
  { key: 'sk_survival',      label: 'SURVIVAL',          attr: 'WIT' },
  { key: 'sk_command',       label: 'COMMAND',           attr: 'EMP' },
  { key: 'sk_manipulation',  label: 'MANIPULATION',      attr: 'EMP' },
  { key: 'sk_medical_aid',   label: 'MEDICAL AID',       attr: 'EMP' },
]

const BADGES = [
  { key: 'cond_combat_ready', label: 'COMBAT READY', danger: false },
  { key: 'cond_suppressed',   label: 'SUPPRESSED',   danger: false },
  { key: 'cond_panicked',     label: 'PANICKED',     danger: true  },
  { key: 'cond_stealth',      label: 'STEALTH',      danger: false },
  { key: 'cond_infected',     label: 'INFECTED',     danger: true  },
  { key: 'cond_overwatch',    label: 'OVERWATCH',    danger: false },
  { key: 'cond_bunkered',     label: 'BUNKERED',     danger: false },
]

const WOUNDS = [
  { key: 'wound_head',      label: 'HEAD',      max: 2 },
  { key: 'wound_torso',     label: 'TORSO',     max: 4 },
  { key: 'wound_left_arm',  label: 'LEFT ARM',  max: 2 },
  { key: 'wound_right_arm', label: 'RIGHT ARM', max: 2 },
  { key: 'wound_left_leg',  label: 'LEFT LEG',  max: 3 },
  { key: 'wound_right_leg', label: 'RIGHT LEG', max: 3 },
]

// ── HP ──────────────────────────────────────────────────────────────────────
const hpClass = computed(() => {
  const max = props.ef.hp_max || 1
  const cur = props.ef.hp_current ?? max
  const pct = cur / max
  if (pct <= 0.25) return 'as-vital--danger'
  if (pct <= 0.50) return 'as-vital--warn'
  return ''
})

function adjustHP(d) {
  const max = props.ef.hp_max || 0
  props.ef.hp_current = Math.max(0, Math.min(max, (props.ef.hp_current ?? max) + d))
}

// ── Stress ──────────────────────────────────────────────────────────────────
const stressClass = computed(() => {
  const s = props.ef.stress_current ?? 0
  if (s >= 8) return 'as-vital--danger'
  if (s >= 5) return 'as-vital--warn'
  return ''
})

const stressFillClass = computed(() => {
  const s = props.ef.stress_current ?? 0
  if (s >= 8) return 'as-sfill--danger'
  if (s >= 5) return 'as-sfill--warn'
  return ''
})

const stressMessage = computed(() => {
  const s = props.ef.stress_current ?? 0
  if (s >= 8) return 'CRITICAL STRESS \xb7 PANIC IMMINENT'
  if (s >= 6) return 'HIGH ANXIETY \xb7 RISK OF PANIC'
  if (s >= 4) return 'ELEVATED STRESS \xb7 CAUTION'
  if (s >= 2) return 'MILD TENSION \xb7 MONITORING'
  return 'NOMINAL \xb7 NO ANOMALIES DETECTED'
})

function adjustStress(d) {
  props.ef.stress_current = Math.max(0, Math.min(10, (props.ef.stress_current ?? 0) + d))
}

function setStressFromBar(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  props.ef.stress_current = Math.round(pct * 10)
}

// ── Armor ───────────────────────────────────────────────────────────────────
function adjustArmor(d) {
  props.ef.armor = Math.max(0, Math.min(10, (props.ef.armor ?? 0) + d))
}

// ── Speed (derived from Agility) ────────────────────────────────────────────
const speedRating = computed(() => {
  const agi = props.ef.agility ?? 0
  if (agi >= 10) return 5
  if (agi >= 7)  return 4
  if (agi >= 4)  return 3
  if (agi >= 1)  return 2
  return 1
})

// ── Core attributes ─────────────────────────────────────────────────────────
function attrFillClass(key) {
  const v = (props.ef[key] ?? 0) / 12
  if (v > 0.75) return 'as-sfill--high'
  if (v > 0.40) return 'as-sfill--med'
  if (v > 0.25) return 'as-sfill--low'
  return 'as-sfill--critical'
}

function clickAttr(key) {
  props.ef[key] = ((props.ef[key] ?? 0) % 12) + 1
}

// ── Skills ──────────────────────────────────────────────────────────────────
function setSkillDot(key, val) {
  props.ef[key] = (props.ef[key] ?? 0) === val ? val - 1 : val
}

// ── Wounds ──────────────────────────────────────────────────────────────────
function toggleWound(key, idx) {
  const cur = props.ef[key] ?? 0
  props.ef[key] = cur > idx ? idx : idx + 1
}

// ── XP ──────────────────────────────────────────────────────────────────────
const xpPercent = computed(() => Math.round(((props.ef.xp ?? 0) / 500) * 100))

function setXP(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  props.ef.xp = Math.round(pct * 500)
}

// ── Inventory ───────────────────────────────────────────────────────────────
function setInventory(i, val) {
  if (!props.ef.alien_inventory) props.ef.alien_inventory = Array(12).fill('')
  props.ef.alien_inventory[i] = val
}

function inventorySlot(i) {
  return props.ef.alien_inventory?.[i] ?? ''
}

// ── Objectives ──────────────────────────────────────────────────────────────
function addObjective() {
  if (!props.ef.alien_objectives) props.ef.alien_objectives = []
  props.ef.alien_objectives.push({ text: '', done: false })
}

function toggleObjective(i) {
  if (props.ef.alien_objectives?.[i] != null) {
    props.ef.alien_objectives[i].done = !props.ef.alien_objectives[i].done
  }
}

function removeObjective(i) {
  props.ef.alien_objectives?.splice(i, 1)
}
</script>

<template>
  <div class="as-sheet">

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="as-header">
      <div class="as-header-left">
        <div class="as-logo">
          WEYLAND-YUTANI CORP
          <span class="as-logo-sub">MU/TH/UR 6000 &middot; PERSONNEL UPLINK &middot; BUILD 4.2.1</span>
        </div>
        <div class="as-clearance">USCM COLONIAL MARINES &middot; CLASSIFIED LEVEL 4 <span class="as-blink">_</span></div>
      </div>
      <div class="as-header-right">
        <div class="as-clock">{{ clock }}</div>
        <div class="as-vessel-row">
          VESSEL:
          <input v-model="ef.alien_vessel" class="as-editable as-vessel-input" placeholder="USS SULACO" />
        </div>
        <div class="as-tags">
          <span class="as-tag as-tag--active">ACTIVE FILE</span>
          <span class="as-tag">ENCRYPTED</span>
        </div>
      </div>
    </div>

    <!-- ── Row 1: Personnel | Biometrics ──────────────────────────────────── -->
    <div class="as-grid-2">

      <!-- Left: Personnel Record + Morale & Status -->
      <div>
        <div class="as-section-title">[ PERSONNEL RECORD ]</div>
        <div class="as-panel-grid">
          <div class="as-panel">
            <div class="as-panel-label">DESIGNATION</div>
            <input v-model="ef.name" class="as-editable as-fv" placeholder="LAST, FIRST" />
          </div>
          <div class="as-panel">
            <div class="as-panel-label">RANK / ROLE</div>
            <input v-model="ef.class" class="as-editable as-fv" placeholder="WARRANT OFFICER" />
          </div>
          <div class="as-panel">
            <div class="as-panel-label">SPECIES / ORIGIN</div>
            <input v-model="ef.race" class="as-editable as-fv" placeholder="HUMAN &middot; EARTH" />
          </div>
          <div class="as-panel">
            <div class="as-panel-label">MOS / SPECIALTY</div>
            <input v-model="ef.signature_item" class="as-editable as-fv" placeholder="SPECIALISATION" />
          </div>
        </div>

        <!-- Morale & Status -->
        <div class="as-mt">
          <div class="as-section-title">[ MORALE &amp; STATUS ]</div>
          <div class="as-badges">
            <div
              v-for="b in BADGES" :key="b.key"
              class="as-badge"
              :class="{ 'as-badge--active': ef[b.key], 'as-badge--danger': b.danger, 'as-badge--danger-active': b.danger && ef[b.key] }"
              @click="ef[b.key] = !ef[b.key]"
            >{{ b.label }}</div>
          </div>

          <!-- Stress Log bar -->
          <div class="as-panel as-mt-sm">
            <div class="as-panel-label">STRESS LOG</div>
            <div class="as-stress-msg">{{ stressMessage }}</div>
            <div class="as-stress-bar" @click="setStressFromBar">
              <div
                class="as-stress-fill"
                :class="stressFillClass"
                :style="{ width: ((ef.stress_current ?? 0) / 10 * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Biometrics + Wound Track -->
      <div>
        <div class="as-section-title">[ BIOMETRICS ]</div>
        <div class="as-vitals-grid">

          <!-- HP -->
          <div class="as-vital-box">
            <div class="as-vital-unit">HEALTH POINTS</div>
            <div class="as-vital-num" :class="hpClass">{{ ef.hp_current ?? ef.hp_max ?? 0 }}</div>
            <div class="as-vital-sub">/ {{ ef.hp_max ?? 0 }}</div>
            <div class="as-controls">
              <button class="as-btn as-btn--danger" @click="adjustHP(-1)">- DMG</button>
              <button class="as-btn" @click="adjustHP(1)">+ HEAL</button>
            </div>
          </div>

          <!-- Stress -->
          <div class="as-vital-box">
            <div class="as-vital-unit">STRESS / PANIC</div>
            <div class="as-vital-num" :class="stressClass">{{ ef.stress_current ?? 0 }}</div>
            <div class="as-vital-sub">/ 10</div>
            <div class="as-controls">
              <button class="as-btn as-btn--danger" @click="adjustStress(1)">+ STRESS</button>
              <button class="as-btn" @click="adjustStress(-1)">REDUCE</button>
            </div>
          </div>

          <!-- Armor -->
          <div class="as-vital-box">
            <div class="as-vital-unit">ARMOR RATING</div>
            <div class="as-vital-num">{{ ef.armor ?? 0 }}</div>
            <div class="as-controls as-controls--mt">
              <button class="as-btn" @click="adjustArmor(-1)">&#9660;</button>
              <button class="as-btn" @click="adjustArmor(1)">&#9650;</button>
            </div>
          </div>

          <!-- Speed -->
          <div class="as-vital-box">
            <div class="as-vital-unit">SPEED RATING</div>
            <div class="as-vital-num as-vital--bright">{{ speedRating }}</div>
            <div class="as-vital-sub">GRID UNITS</div>
          </div>

        </div>

        <!-- Wound Track -->
        <div class="as-section-title as-mt">[ WOUND TRACK ]</div>
        <div class="as-panel">
          <div class="as-panel-label">TRAUMA LOCI</div>
          <div class="as-wounds-grid">
            <div v-for="loc in WOUNDS" :key="loc.key">
              <div class="as-wound-label">{{ loc.label }}</div>
              <div class="as-wound-row">
                <div
                  v-for="i in loc.max" :key="i"
                  class="as-wound-box"
                  :class="{ 'as-wound-box--marked': (ef[loc.key] ?? 0) >= i }"
                  @click="toggleWound(loc.key, i - 1)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /row 1 -->

    <!-- ── Row 2: Core Attributes | Skills ────────────────────────────────── -->
    <div class="as-grid-2 as-mt">

      <!-- Left: Core Attributes -->
      <div>
        <div class="as-section-title">[ CORE ATTRIBUTES ]</div>
        <div
          v-for="a in ATTRS" :key="a.key"
          class="as-stat-row"
        >
          <div class="as-stat-label">{{ a.label }}</div>
          <div class="as-stat-bar" @click="clickAttr(a.key)">
            <div
              class="as-stat-fill"
              :class="attrFillClass(a.key)"
              :style="{ width: ((ef[a.key] ?? 0) / 12 * 100) + '%' }"
            ></div>
          </div>
          <div class="as-stat-val">{{ ef[a.key] ?? 0 }}</div>
        </div>
      </div>

      <!-- Right: Skills + XP -->
      <div>
        <div class="as-section-title">[ SKILLS &amp; TRAINING ]</div>
        <div class="as-skills-list">
          <div v-for="sk in SKILLS" :key="sk.key" class="as-skill-item">
            <div class="as-skill-name">{{ sk.label }}</div>
            <div class="as-skill-dots">
              <div
                v-for="d in 5" :key="d"
                class="as-dot"
                :class="{ 'as-dot--filled': (ef[sk.key] ?? 0) >= d }"
                @click="setSkillDot(sk.key, d)"
              ></div>
            </div>
            <div class="as-skill-rank">{{ ef[sk.key] ?? 0 }}</div>
          </div>
        </div>

        <!-- XP bar -->
        <div class="as-mt-sm">
          <div class="as-section-title as-section-title--sm">[ EXPERIENCE ]</div>
          <div class="as-xp-labels">
            <span>MISSION XP</span>
            <span>{{ ef.xp ?? 0 }} / 500</span>
          </div>
          <div class="as-xp-bar" @click="setXP">
            <div class="as-xp-fill" :style="{ width: xpPercent + '%' }"></div>
          </div>
        </div>
      </div>

    </div><!-- /row 2 -->

    <!-- ── Row 3: Loadout | Mission Notes ─────────────────────────────────── -->
    <div class="as-grid-2 as-mt">

      <!-- Left: Loadout & Gear -->
      <div>
        <div class="as-section-title">[ LOADOUT &amp; GEAR ]</div>
        <div class="as-inv-grid">
          <div v-for="i in 12" :key="i" class="as-inv-slot">
            <input
              :value="inventorySlot(i - 1)"
              @input="setInventory(i - 1, $event.target.value)"
              class="as-inv-input"
              placeholder="-- EMPTY SLOT --"
            />
          </div>
        </div>
        <div class="as-panel as-mt-sm">
          <div class="as-panel-label">TINY ITEMS</div>
          <textarea
            v-model="ef.tiny_items"
            class="as-notes-area"
            style="min-height:38px"
            placeholder="Ammo, med-kits, data discs&#x2026;"
          ></textarea>
        </div>
      </div>

      <!-- Right: Mission Notes + Objectives -->
      <div>
        <div class="as-section-title">[ MISSION NOTES ]</div>
        <textarea
          v-model="ef.notes"
          class="as-notes-area"
          placeholder="// FIELD REPORT ENTRY&#10;// TIMESTAMP: AUTO&#10;// OPERATOR: ----&#10;&#10;..."
        ></textarea>

        <div class="as-mt-sm">
          <div class="as-section-title as-section-title--sm">[ OBJECTIVE TRACKER ]</div>
          <div
            v-for="(obj, i) in (ef.alien_objectives || [])" :key="i"
            class="as-obj-row"
          >
            <span class="as-obj-check" @click="toggleObjective(i)">{{ obj.done ? '[&#x2713;]' : '[ ]' }}</span>
            <input
              :value="obj.text"
              @input="obj.text = $event.target.value"
              @click.stop
              class="as-obj-input"
              placeholder="OBJECTIVE&#x2026;"
            />
            <button class="as-obj-del" @click="removeObjective(i)">&times;</button>
          </div>
          <button class="as-btn as-btn--sm as-mt-sm" @click="addObjective">+ OBJECTIVE</button>
        </div>
      </div>

    </div><!-- /row 3 -->

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <div class="as-footer">
      <div>WEYLAND-YUTANI CORP &middot; DIVISION 19 &middot; PROPERTY OF W-Y</div>
      <div><span class="as-blink">&#x258c;</span> TERMINAL ACTIVE &middot; ENCRYPTION LAYER 4 &middot; SECURE CHANNEL</div>
    </div>

  </div>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────────────────────── */
.as-sheet {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  background: var(--color-bg-page, #000);
  color: var(--alien-phosphor, #4af04a);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: var(--font-size-base, 13px);
  line-height: 1.4;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='20' viewBox='0 0 13 20'%3E%3Cpath d='M1 1 L1 15 L4.5 11.5 L7 19 L9 18 L6.5 10.5 L11 10.5 Z' fill='%234af04a' stroke='%23001800' stroke-width='.75' stroke-linejoin='round'/%3E%3C/svg%3E") 1 1, default;
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.as-header {
  border-bottom: 1px solid var(--alien-phosphor, #4af04a);
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.as-logo {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 28px;
  color: var(--alien-phosphor-bright, #8fff8f);
  letter-spacing: var(--letter-spacing-heading, 4px);
}

.as-logo-sub {
  display: block;
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 12px;
  color: var(--alien-phosphor, #4af04a);
  letter-spacing: var(--letter-spacing-label, 2px);
}

.as-clearance {
  font-size: 10px;
  color: var(--alien-phosphor-dim, #1a6a1a);
  margin-top: 4px;
  letter-spacing: var(--letter-spacing-label, 2px);
}

.as-header-right {
  text-align: right;
  font-size: 11px;
  color: var(--color-text-secondary, #2a9a2a);
  line-height: 1.8;
}

.as-clock {
  color: var(--alien-phosphor-bright, #8fff8f);
  font-size: 12px;
}

.as-vessel-row {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.as-vessel-input {
  width: 120px;
  text-align: right;
  font-size: 12px;
}

.as-tags {
  margin-top: 4px;
}

.as-tag {
  display: inline-block;
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  font-size: 9px;
  padding: 1px 5px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  margin-left: 4px;
}

.as-tag--active {
  border-color: var(--alien-phosphor, #4af04a);
  color: var(--alien-phosphor, #4af04a);
  background: rgba(74, 240, 74, 0.10);
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
.as-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.as-mt    { margin-top: 8px; }
.as-mt-sm { margin-top: 6px; }

/* ── Section titles ─────────────────────────────────────────────────────── */
.as-section-title {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 18px;
  color: var(--alien-phosphor-bright, #8fff8f);
  letter-spacing: var(--letter-spacing-heading, 3px);
  margin-bottom: 6px;
  padding: 2px 8px;
  border-left: 3px solid var(--alien-phosphor, #4af04a);
}

.as-section-title--sm {
  font-size: 14px;
}

/* ── Panels ─────────────────────────────────────────────────────────────── */
.as-panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.as-panel {
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  padding: 8px 10px;
  background: rgba(0, 60, 0, 0.20);
  position: relative;
}

.as-panel-label {
  font-size: 10px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  margin-bottom: 4px;
}

/* ── Editable fields ────────────────────────────────────────────────────── */
.as-editable {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  color: var(--alien-phosphor-bright, #8fff8f);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 18px;
  width: 100%;
  outline: none;
  letter-spacing: 1px;
  padding: 4px 0;
  cursor: text;
}

.as-editable:focus {
  border-bottom-color: var(--alien-phosphor, #4af04a);
  background: rgba(74, 240, 74, 0.04);
}

.as-fv {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 21px;
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
.as-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.as-badge {
  padding: 2px 8px;
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  font-size: 10px;
  letter-spacing: var(--letter-spacing-label, 2px);
  cursor: inherit;
  color: var(--color-text-secondary, #2a9a2a);
  user-select: none;
}

.as-badge--active {
  background: rgba(0, 51, 0, 0.8);
  border-color: var(--alien-phosphor, #4af04a);
  color: var(--alien-phosphor-bright, #8fff8f);
}

.as-badge--danger {
  border-color: rgba(74, 26, 26, 0.6);
  color: rgba(106, 42, 42, 0.9);
}

.as-badge--danger-active {
  background: rgba(26, 0, 0, 0.8);
  border-color: var(--alien-danger, #cc3333);
  color: #ff4444;
}

/* ── Stress bar ─────────────────────────────────────────────────────────── */
.as-stress-msg {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 13px;
  color: var(--alien-phosphor-dim, #1a6a1a);
  margin-top: 4px;
  min-height: 18px;
  letter-spacing: 1px;
}

.as-stress-bar {
  height: 12px;
  background: rgba(0, 26, 0, 0.8);
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  margin-top: 6px;
  cursor: inherit;
  position: relative;
}

.as-stress-fill {
  height: 100%;
  background: var(--color-status-active, #2a6e2a);
  transition: width 0.1s;
}

.as-sfill--warn    { background: #6e6e1a; }
.as-sfill--danger  { background: rgba(122, 26, 26, 0.9); }

/* ── Vitals ─────────────────────────────────────────────────────────────── */
.as-vitals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.as-vital-box {
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  padding: 6px 10px;
  text-align: center;
  background: rgba(0, 60, 0, 0.20);
}

.as-vital-unit {
  font-size: 10px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: var(--letter-spacing-label, 2px);
}

.as-vital-num {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 40px;
  color: var(--alien-phosphor-bright, #8fff8f);
  line-height: 1;
}

.as-vital-sub {
  font-size: 10px;
  color: var(--color-text-secondary, #2a9a2a);
}

.as-vital--danger { color: var(--alien-danger, #cc3333); }
.as-vital--warn   { color: #aa8800; }
.as-vital--bright { color: var(--alien-phosphor-bright, #8fff8f); }

.as-controls {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  justify-content: center;
}

.as-controls--mt { margin-top: 6px; }

/* ── Buttons ────────────────────────────────────────────────────────────── */
.as-btn {
  background: transparent;
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  color: var(--alien-phosphor, #4af04a);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 11px;
  padding: 2px 10px;
  cursor: pointer;
  letter-spacing: 1px;
}

.as-btn:hover {
  background: rgba(0, 26, 0, 0.6);
  border-color: var(--alien-phosphor, #4af04a);
  color: var(--alien-phosphor-bright, #8fff8f);
}

.as-btn:active { background: rgba(0, 51, 0, 0.8); }

.as-btn--danger {
  border-color: rgba(74, 26, 26, 0.5);
  color: #aa4444;
}

.as-btn--danger:hover {
  background: rgba(26, 0, 0, 0.6);
  border-color: var(--alien-danger, #cc3333);
  color: #ff6666;
}

.as-btn--sm {
  font-size: 10px;
  padding: 1px 8px;
}

/* ── Wound track ────────────────────────────────────────────────────────── */
.as-wounds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}

.as-wound-label {
  font-size: 9px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  margin-bottom: 3px;
}

.as-wound-row {
  display: flex;
  gap: 4px;
}

.as-wound-box {
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  cursor: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.as-wound-box--marked {
  background: rgba(58, 0, 0, 0.7);
  border-color: var(--alien-danger, #cc3333);
  color: #aa2222;
}

.as-wound-box--marked::after { content: 'X'; }

/* ── Core attributes ────────────────────────────────────────────────────── */
.as-stat-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.as-stat-label {
  width: 90px;
  font-size: 11px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  flex-shrink: 0;
}

.as-stat-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 26, 0, 0.8);
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  position: relative;
  cursor: inherit;
}

.as-stat-fill {
  height: 100%;
  transition: width 0.1s;
}

.as-sfill--high     { background: var(--alien-phosphor-bright, #8fff8f); }
.as-sfill--med      { background: var(--alien-phosphor, #4af04a); }
.as-sfill--low      { background: var(--alien-phosphor-dim, #1a7a1a); }
.as-sfill--critical { background: rgba(122, 26, 26, 0.9); }

.as-stat-val {
  width: 24px;
  text-align: right;
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 16px;
  color: var(--alien-phosphor-bright, #8fff8f);
}

/* ── Skills ─────────────────────────────────────────────────────────────── */
.as-skills-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
}

.as-skill-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 11px;
}

.as-skill-name {
  flex: 1;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  font-size: 10px;
}

.as-skill-dots {
  display: flex;
  gap: 2px;
}

.as-dot {
  width: 8px;
  height: 8px;
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  cursor: inherit;
}

.as-dot--filled {
  background: var(--alien-phosphor, #4af04a);
}

.as-skill-rank {
  font-family: var(--font-display, 'VT323', monospace);
  font-size: 16px;
  color: var(--alien-phosphor, #4af04a);
  width: 18px;
  text-align: center;
}

/* ── XP bar ─────────────────────────────────────────────────────────────── */
.as-xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-text-secondary, #2a9a2a);
  letter-spacing: 1px;
  margin-top: 2px;
}

.as-xp-bar {
  height: 4px;
  background: rgba(0, 26, 0, 0.8);
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  margin-top: 4px;
  cursor: inherit;
  position: relative;
}

.as-xp-fill {
  height: 100%;
  background: var(--color-status-active, #2a6e2a);
  transition: width 0.15s;
}

/* ── Inventory ──────────────────────────────────────────────────────────── */
.as-inv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  font-size: 11px;
  margin-bottom: 8px;
}

.as-inv-slot {
  border: 1px solid rgba(26, 58, 26, 0.6);
  padding: 6px 8px;
  min-height: 34px;
  display: flex;
  align-items: center;
}

.as-inv-input {
  background: transparent;
  border: none;
  color: var(--alien-phosphor-bright, #8fff8f);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 15px;
  width: 100%;
  outline: none;
  cursor: text;
}

.as-inv-input::placeholder {
  color: var(--alien-phosphor-dim, #1a5a1a);
}

/* ── Notes textarea ─────────────────────────────────────────────────────── */
.as-notes-area {
  width: 100%;
  background: rgba(0, 20, 0, 0.40);
  border: 1px solid var(--color-border-default, rgba(74,240,74,0.18));
  color: var(--alien-phosphor, #4af04a);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 15px;
  padding: 8px;
  resize: vertical;
  outline: none;
  min-height: 100px;
  line-height: 1.5;
  letter-spacing: 0.5px;
  box-sizing: border-box;
  cursor: text;
}

.as-notes-area:focus {
  border-color: var(--alien-phosphor, #4af04a);
  background: rgba(0, 30, 0, 0.50);
}

/* ── Objectives ─────────────────────────────────────────────────────────── */
.as-obj-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(10, 42, 10, 0.8);
  letter-spacing: 1px;
}

.as-obj-check {
  flex-shrink: 0;
  cursor: pointer;
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  color: var(--alien-phosphor, #4af04a);
  user-select: none;
}

.as-obj-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--alien-phosphor, #4af04a);
  font-family: var(--font-body, 'Share Tech Mono', monospace);
  font-size: 15px;
  outline: none;
  cursor: text;
  letter-spacing: 1px;
}

.as-obj-input::placeholder { color: var(--alien-phosphor-dim, #1a5a1a); }

.as-obj-del {
  background: transparent;
  border: none;
  color: var(--alien-phosphor-dim, #1a5a1a);
  cursor: inherit;
  font-size: 12px;
  padding: 0 2px;
  line-height: 1;
}

.as-obj-del:hover { color: var(--alien-danger, #cc3333); }

/* ── Footer ─────────────────────────────────────────────────────────────── */
.as-footer {
  border-top: 1px solid rgba(26, 58, 26, 0.6);
  margin-top: 12px;
  padding-top: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--alien-phosphor-dim, #1a5a1a);
  letter-spacing: 1px;
}

/* ── Blink animation ────────────────────────────────────────────────────── */
@keyframes as-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.as-blink {
  animation: as-blink 1s step-end infinite;
}

/* ── Danger pulse ───────────────────────────────────────────────────────── */
@keyframes as-danger-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

@media (prefers-reduced-motion: no-preference) {
  .as-vital--danger.as-vital-num {
    animation: as-danger-pulse 0.8s ease-in-out infinite;
  }
}

/* ── Scrollbar ──────────────────────────────────────────────────────────── */
.as-sheet ::-webkit-scrollbar { width: 6px; }
.as-sheet ::-webkit-scrollbar-track { background: #000; }
.as-sheet ::-webkit-scrollbar-thumb {
  background: var(--alien-phosphor-dim, #1a5a1a);
  border-radius: 0;
}

/* ── Mobile responsive ──────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .as-sheet { padding: 8px; }

  /* Stack the two-column sections vertically */
  .as-grid-2 { grid-template-columns: 1fr; gap: 8px; }

  /* Header: stack logo above clock/vessel */
  .as-header { flex-direction: column; gap: 8px; }
  .as-header-right { text-align: left; }
  .as-vessel-row { justify-content: flex-start; }

  /* Keep vitals 2-up but smaller */
  .as-vitals-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
  .as-vital-num { font-size: 30px; }

  /* Wounds 3-up (head/torso/larm/rarm/lleg/rleg all fit in 2) */
  .as-wounds-grid { grid-template-columns: 1fr 1fr 1fr; }

  /* Skills single column */
  .as-skills-list { grid-template-columns: 1fr; }

  /* Inventory single column */
  .as-inv-grid { grid-template-columns: 1fr; }

  /* Badges wrap tightly */
  .as-badges { gap: 4px; }
  .as-badge { font-size: 9px; padding: 2px 6px; }

  /* Input sizes stay large for touch — just ensure full width */
  .as-editable { font-size: 16px; }
  .as-inv-input { font-size: 14px; }
  .as-notes-area { font-size: 14px; }

  /* Section titles slightly smaller */
  .as-section-title { font-size: 15px; }

  /* Logo smaller on mobile */
  .as-logo { font-size: 20px; }
}

@media (max-width: 480px) {
  .as-vitals-grid { grid-template-columns: 1fr 1fr; }
  .as-wounds-grid { grid-template-columns: 1fr 1fr; }
  .as-vital-num { font-size: 26px; }
  .as-panel-grid { grid-template-columns: 1fr; }
}
</style>
