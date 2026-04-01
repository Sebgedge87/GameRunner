<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Combat Tracker</div>
      <div class="page-sub">Initiative &amp; encounter management</div>
    </div>

    <!-- Encounter Controls -->
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);margin-bottom:6px">Encounter</div>
          <input v-model="encounterName" class="form-input" placeholder="Encounter name…" style="width:100%" />
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding-top:20px">
          <button class="btn btn-sm btn-ct-outline" @click="startEncounter" :disabled="combatants.length === 0">
            {{ active ? '⏸ Pause' : '▶ Start' }}
          </button>
          <button class="btn-ct-primary" @click="nextTurn" :disabled="!active">Next Turn →</button>
          <button class="btn-ct-ghost" @click="clearEncounter">Clear</button>
        </div>
        <div v-if="active" style="padding-top:20px;font-size:0.85em;opacity:0.7">
          Round {{ round }} &mdash; Turn {{ currentTurn + 1 }} / {{ combatants.length }}
        </div>
      </div>
    </div>

    <!-- Add Combatant -->
    <div class="card" style="margin-bottom:16px">
      <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);margin-bottom:10px">Add combatant</div>
      <div style="display:grid;grid-template-columns:1fr 80px 80px 80px auto;gap:8px;align-items:end">
        <div class="field-group" style="margin:0">
          <label>Name</label>
          <input v-model="newCombatant.name" class="form-input ct-input" placeholder="Name…" @keyup.enter="addCombatant" />
        </div>
        <div class="field-group" style="margin:0">
          <label>Init</label>
          <input v-model.number="newCombatant.initiative" class="form-input ct-input" type="number" placeholder="0" />
        </div>
        <div class="field-group" style="margin:0">
          <label>HP</label>
          <input v-model.number="newCombatant.hp_max" class="form-input ct-input" type="number" placeholder="10" />
        </div>
        <div class="field-group" style="margin:0">
          <label>AC</label>
          <input v-model.number="newCombatant.ac" class="form-input ct-input" type="number" placeholder="10" />
        </div>
        <div style="display:flex;gap:6px;padding-bottom:1px">
          <select v-model="newCombatant.type" class="form-input ct-input" style="width:90px">
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="ally">Ally</option>
            <option value="neutral">Neutral</option>
          </select>
          <button class="btn" @click="addCombatant" :disabled="!newCombatant.name">+ Add</button>
        </div>
      </div>

      <!-- Import from Bestiary -->
      <div v-if="data.bestiary.length" style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);margin-bottom:8px">Import from bestiary</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="selectedCreature" class="form-input" style="max-width:220px">
            <option value="">— Select creature —</option>
            <option v-for="c in data.bestiary" :key="c.id" :value="c">{{ c.name }}</option>
          </select>
          <input v-model.number="importCount" class="form-input" type="number" min="1" max="20" style="width:60px" title="Count" />
          <button class="btn btn-sm" :disabled="!selectedCreature" @click="importFromBestiary">Import ×{{ importCount }}</button>
        </div>
      </div>
    </div>

    <!-- Initiative Order -->
    <div v-if="combatants.length === 0" class="empty-state">
      No combatants yet. Add some above.
    </div>

    <div v-else>
      <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);margin-bottom:10px">Initiative order</div>
      <div
        v-for="(c, idx) in sorted"
        :key="c.id"
        class="card"
        :class="{
          'combatant-active': active && idx === currentTurn,
          'combatant-dead': c.hp_current <= 0,
        }"
        style="margin-bottom:8px"
      >
        <div class="card-body" style="display:flex;align-items:center;gap:12px">
          <!-- Turn indicator -->
          <div style="width:28px;text-align:center;font-size:1.1em">
            <span v-if="active && idx === currentTurn">▶</span>
            <span v-else style="opacity:0.3">{{ idx + 1 }}</span>
          </div>

          <!-- Init badge -->
          <div style="width:36px;text-align:center">
            <div style="font-size:0.65em;opacity:0.5;margin-bottom:2px">INIT</div>
            <div style="font-weight:700;font-size:1.1em;color:var(--accent)">{{ c.initiative }}</div>
          </div>

          <!-- Name + type + conditions -->
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:0.95em;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span>{{ c.name }}</span>
              <span class="tag" :class="typeClass(c.type)" style="font-size:0.65em">{{ c.type }}</span>
              <span
                v-for="cond in (c.conditions || [])"
                :key="cond"
                class="tag tag-inactive"
                style="font-size:0.65em;cursor:pointer"
                :title="`Click to remove ${cond}`"
                @click="removeCondition(c, cond)"
              >{{ cond }} ✕</span>
            </div>
            <!-- HP bar -->
            <div v-if="c.hp_max" style="margin-top:6px">
              <div style="display:flex;justify-content:space-between;font-size:0.72em;opacity:0.6;margin-bottom:3px">
                <span>HP</span>
                <span>{{ c.hp_current }} / {{ c.hp_max }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="`width:${hpPercent(c)}%;background:${hpColor(c)}`"
                ></div>
              </div>
            </div>
            <!-- Inline notes -->
            <div v-if="editingNotesId === c.id" style="margin-top:6px;display:flex;gap:6px">
              <input v-model="c.notes" class="form-input" style="flex:1;font-size:12px;padding:3px 8px" placeholder="Notes…" @blur="editingNotesId = null" @keyup.enter="editingNotesId = null" />
            </div>
            <div v-else-if="c.notes" style="padding-top:4px;font-size:0.8em;opacity:0.6;cursor:pointer" @click="editingNotesId = c.id">{{ c.notes }}</div>
          </div>

          <!-- AC -->
          <div v-if="c.ac" style="text-align:center;min-width:40px">
            <div style="font-size:0.65em;opacity:0.5;margin-bottom:2px">AC</div>
            <div style="font-weight:600">{{ c.ac }}</div>
          </div>

          <!-- Controls -->
          <div style="display:flex;gap:4px;flex-shrink:0" @click.stop>
            <button class="btn btn-sm" title="Damage" @click="applyDamage(c)" style="min-width:32px">-HP</button>
            <button class="btn btn-sm" title="Heal" @click="applyHeal(c)" style="min-width:32px">+HP</button>
            <button class="btn btn-sm" title="Add Condition" @click="addCondition(c)">🎲</button>
            <button class="btn btn-sm" title="Notes" @click="editingNotesId = c.id">📝</button>
            <button class="btn btn-sm btn-danger" title="Remove" @click="removeCombatant(c.id)">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Damage/Heal Modal -->
    <div v-if="hpDialog.open" class="modal-backdrop" @click.self="hpDialog.open = false">
      <div class="modal-box" style="max-width:320px">
        <div style="font-weight:600;margin-bottom:12px">{{ hpDialog.mode === 'damage' ? 'Apply Damage' : 'Apply Healing' }} — {{ hpDialog.target?.name }}</div>
        <input
          v-model.number="hpDialog.amount"
          class="form-input"
          type="number"
          min="0"
          placeholder="Amount"
          style="width:100%"
          @keyup.enter="confirmHp"
          ref="hpInput"
        />
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
          <button class="btn" @click="hpDialog.open = false">Cancel</button>
          <button class="btn" :class="hpDialog.mode === 'damage' ? 'btn-danger' : ''" @click="confirmHp">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const ui = useUiStore()

let idCounter = 0

const encounterName = ref('')
const active = ref(false)
const round = ref(1)
const currentTurn = ref(0)
const combatants = ref([])
const editingNotesId = ref(null)

const newCombatant = ref({ name: '', initiative: 0, hp_max: null, ac: null, type: 'enemy' })
const selectedCreature = ref('')
const importCount = ref(1)

const hpDialog = ref({ open: false, target: null, mode: 'damage', amount: 0 })
const hpInput = ref(null)

const sorted = computed(() =>
  [...combatants.value].sort((a, b) => b.initiative - a.initiative)
)

function addCombatant() {
  if (!newCombatant.value.name) return
  combatants.value.push({
    id: ++idCounter,
    name: newCombatant.value.name,
    initiative: newCombatant.value.initiative ?? 0,
    hp_max: newCombatant.value.hp_max || null,
    hp_current: newCombatant.value.hp_max || null,
    ac: newCombatant.value.ac || null,
    type: newCombatant.value.type,
    conditions: [],
    notes: '',
  })
  newCombatant.value = { name: '', initiative: 0, hp_max: null, ac: null, type: 'enemy' }
}

function importFromBestiary() {
  if (!selectedCreature.value) return
  const c = selectedCreature.value
  const count = Math.max(1, importCount.value || 1)
  for (let i = 0; i < count; i++) {
    const suffix = count > 1 ? ` ${i + 1}` : ''
    combatants.value.push({
      id: ++idCounter,
      name: c.name + suffix,
      initiative: Math.floor(Math.random() * 20) + 1,
      hp_max: c.stats?.hp || null,
      hp_current: c.stats?.hp || null,
      ac: c.stats?.ac || null,
      type: 'enemy',
      conditions: [],
      notes: '',
    })
  }
  selectedCreature.value = ''
  importCount.value = 1
}

function removeCombatant(id) {
  combatants.value = combatants.value.filter(c => c.id !== id)
  if (currentTurn.value >= sorted.value.length) currentTurn.value = 0
}

function startEncounter() {
  active.value = !active.value
  if (active.value) {
    round.value = 1
    currentTurn.value = 0
  }
}

function nextTurn() {
  if (!active.value || combatants.value.length === 0) return
  currentTurn.value++
  if (currentTurn.value >= sorted.value.length) {
    currentTurn.value = 0
    round.value++
  }
}

async function clearEncounter() {
  if (!await ui.confirm('Clear all combatants?')) return
  combatants.value = []
  active.value = false
  round.value = 1
  currentTurn.value = 0
}

function applyDamage(c) {
  hpDialog.value = { open: true, target: c, mode: 'damage', amount: 0 }
  nextTick(() => hpInput.value?.focus())
}

function applyHeal(c) {
  hpDialog.value = { open: true, target: c, mode: 'heal', amount: 0 }
  nextTick(() => hpInput.value?.focus())
}

function confirmHp() {
  const c = hpDialog.value.target
  const amt = hpDialog.value.amount || 0
  const target = combatants.value.find(x => x.id === c.id)
  if (!target) return
  if (hpDialog.value.mode === 'damage') {
    target.hp_current = Math.max(0, (target.hp_current ?? target.hp_max ?? 0) - amt)
  } else {
    target.hp_current = Math.min(target.hp_max ?? Infinity, (target.hp_current ?? 0) + amt)
  }
  hpDialog.value.open = false
}

async function addCondition(c) {
  const cond = await ui.prompt('Condition (e.g. Stunned, Poisoned):')
  if (!cond) return
  const target = combatants.value.find(x => x.id === c.id)
  if (target) target.conditions = [...(target.conditions || []), cond.trim()]
}

function removeCondition(c, cond) {
  const target = combatants.value.find(x => x.id === c.id)
  if (target) target.conditions = target.conditions.filter(x => x !== cond)
}

function hpPercent(c) {
  if (!c.hp_max) return 100
  return Math.round(((c.hp_current ?? c.hp_max) / c.hp_max) * 100)
}

function hpColor(c) {
  const pct = hpPercent(c)
  if (pct > 60) return 'var(--green, #4caf7d)'
  if (pct > 25) return 'var(--gold, #c9a84c)'
  return 'var(--red, #c94c4c)'
}

function typeClass(type) {
  if (type === 'player') return 'tag-active'
  if (type === 'enemy') return 'tag-inactive'
  if (type === 'ally') return 'tag-completed'
  return ''
}

onMounted(() => {
  if (!data.bestiary.length) data.loadBestiary()
})
</script>

<style scoped>
/* ── Active combatant row ──────────────────────────────────────────────── */
.combatant-active {
  border-left: 3px solid var(--color-text-accent) !important;
  background: rgba(212, 98, 26, 0.08) !important;
}

.combatant-dead {
  opacity: 0.45;
}

/* ── Add-combatant dark inputs ─────────────────────────────────────────── */
.ct-input {
  background: var(--color-bg-input) !important;
  color: var(--color-text-primary) !important;
  border-color: var(--color-border-default) !important;
}
.ct-input::placeholder {
  color: var(--color-text-hint);
}

/* ── Button hierarchy ──────────────────────────────────────────────────── */
.btn-ct-primary {
  height: 32px;
  padding: 0 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-active);
  background: rgba(212, 98, 26, 0.15);
  color: var(--color-text-accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}
.btn-ct-primary:hover:not(:disabled) {
  background: rgba(212, 98, 26, 0.25);
}
.btn-ct-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-ct-outline {
  /* Keep the global .btn look — outline is the default btn style */
}

.btn-ct-ghost {
  height: 32px;
  padding: 0 10px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-default);
}
.btn-ct-ghost:hover {
  color: var(--color-text-primary);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: var(--surface, #1a1a24);
  border: 1px solid var(--border, #2a2a3a);
  border-radius: 10px;
  padding: 20px;
  width: 90%;
}
</style>
