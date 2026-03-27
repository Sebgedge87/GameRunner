<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close'])

const router   = useRouter()
const campaign = useCampaignStore()
const data     = useDataStore()
const ui       = useUiStore()
const auth     = useAuthStore()

const STEPS = ['Name', 'Game system', 'Review defaults', 'First entity']

const step = ref(0)

/* ── Step 0 — name ─────────────────────────────────────── */
const nameForm = reactive({ name: '', subtitle: '' })

/* ── Step 1 — system ───────────────────────────────────── */
const selectedSystem = ref('dnd5e')

/* ── Step 2 — create ───────────────────────────────────── */
const saving     = ref(false)
const saveError  = ref('')

/* ── Step 3 — first entity ─────────────────────────────── */
const importTab    = ref(0)
const entitySaving = ref(false)
const entityForm   = reactive({
  type: 'NPC', name: '', role: '', location: '', description: '', notes: '',
})

/* ─────────────────────────────────────────────────────────
   System preview data
   ───────────────────────────────────────────────────────── */
const SYSTEM_PREVIEWS = {
  dnd5e: {
    calendar:        'Forgotten Realms — Harptos calendar',
    faction_types:   ['Guild', 'Kingdom', 'Religion', 'Thieves'],
    location_types:  ['Town', 'Dungeon', 'Wilderness', 'Planar'],
    npc_roles:       ['Hero', 'Villain', 'Merchant', 'Noble', 'Guard'],
    quest_structures:['Dungeon delve', 'Escort', 'Diplomacy'],
  },
  coc: {
    calendar:        'Gregorian · 1920s epoch',
    faction_types:   ['Cult', 'Agency', 'Institution', 'Criminal'],
    location_types:  ['City', 'Ruin', 'Wilderness', 'Dreamlands'],
    npc_roles:       ['Investigator', 'Cultist', 'Bystander', 'Deep One', 'Ally'],
    quest_structures:['Investigation', 'Retrieval', 'Survival'],
  },
  alien: {
    calendar:        'Standard Gregorian · 22nd century',
    faction_types:   ['Corporation', 'Colonial Marines', 'Weyland-Yutani', 'Independents'],
    location_types:  ['Colony', 'Ship', 'Installation', 'Derelict'],
    npc_roles:       ['Colonist', 'Marine', 'Synthetic', 'Executive', 'Hostile'],
    quest_structures:['Survival', 'Extraction', 'Investigation'],
  },
  coriolis: {
    calendar:        'Coriolis station time — cycles & watches',
    faction_types:   ['Crew', 'Icon Order', 'Merchant', 'Corsair'],
    location_types:  ['Station', 'Planet', 'Derelict', 'Asteroid'],
    npc_roles:       ['Contact', 'Agent', 'Corsair', 'Merchant', 'Icon Emissary'],
    quest_structures:['Contract', 'Exploration', 'Faction mission'],
  },
  dune: {
    calendar:        'Imperial standard — Guild calendar',
    faction_types:   ['Great House', 'Fremen Sietch', 'Spacing Guild', 'Bene Gesserit'],
    location_types:  ['Sietch', 'City', 'Desert', 'Orbital'],
    npc_roles:       ['Fremen', 'Noble', 'Mentat', 'Bene Gesserit', 'Harkonnen'],
    quest_structures:['Political intrigue', 'Desert survival', 'Spice operation'],
  },
  achtung: {
    calendar:        'Gregorian · World War II era',
    faction_types:   ['Allied unit', 'Axis', 'Occult order', 'Resistance'],
    location_types:  ['Battlefield', 'Bunker', 'City', 'Ruins', 'Facility'],
    npc_roles:       ['Soldier', 'Spy', 'Occultist', 'Resistance', 'Officer'],
    quest_structures:['Mission', 'Infiltration', 'Occult investigation'],
  },
  default: {
    calendar:        'Standard Gregorian',
    faction_types:   ['Faction A', 'Faction B', 'Faction C'],
    location_types:  ['City', 'Wilderness', 'Dungeon'],
    npc_roles:       ['Hero', 'Villain', 'Bystander'],
    quest_structures:['Main quest', 'Side quest'],
  },
  custom: {
    calendar:        'Define your own time system',
    faction_types:   ['You choose the categories'],
    location_types:  ['You choose the tags'],
    npc_roles:       ['You define the roles'],
    quest_structures:['You name the phases'],
  },
}

const ENTITY_TYPES = ['NPC', 'Location', 'Faction', 'Quest']

const preview = computed(() => SYSTEM_PREVIEWS[selectedSystem.value] || SYSTEM_PREVIEWS.default)

/* ── Escape to close (only pre-creation steps) ─────────── */
function onKey(e) { if (e.key === 'Escape' && step.value < 3) emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

/* ── Helpers ───────────────────────────────────────────── */
function apif(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
  return fetch(path, { ...opts, headers })
}

function canAdvanceFrom0() { return nameForm.name.trim().length > 0 }

function nextStep() {
  if (step.value === 0 && !canAdvanceFrom0()) return
  if (step.value < STEPS.length - 1) step.value++
}
function prevStep() { if (step.value > 0) step.value-- }

/* ── Create campaign (step 2 → 3) ─────────────────────── */
async function createAndProceed() {
  saveError.value = ''
  if (!nameForm.name.trim()) { step.value = 0; return }
  saving.value = true
  try {
    const c = await campaign.createCampaign({
      name: nameForm.name.trim(),
      subtitle: nameForm.subtitle.trim() || undefined,
      system: selectedSystem.value,
      max_players: 4,
    })
    await campaign.switchCampaign(c.id)
    await data.loadAll()
    step.value = 3
  } catch (e) {
    saveError.value = e.message || 'Failed to create campaign'
  } finally {
    saving.value = false
  }
}

/* ── First entity (step 3) ─────────────────────────────── */
async function saveEntity() {
  if (!entityForm.name.trim()) { ui.showToast('Entity name is required', '', '✕'); return }
  entitySaving.value = true
  try {
    const type = entityForm.type
    let endpoint, body
    if (type === 'NPC') {
      endpoint = '/api/npcs'
      body = { name: entityForm.name, role: entityForm.role, description: entityForm.description, gm_notes: entityForm.notes }
    } else if (type === 'Location') {
      endpoint = '/api/locations'
      body = { name: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes }
    } else if (type === 'Faction') {
      endpoint = '/api/factions'
      body = { name: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes }
    } else {
      endpoint = '/api/quests'
      body = { title: entityForm.name, description: entityForm.description, gm_notes: entityForm.notes, status: 'active', quest_type: 'main' }
    }
    const r = await apif(endpoint, { method: 'POST', body: JSON.stringify(body) })
    if (!r.ok) { const d = await r.json(); throw new Error(d.error || r.status) }
    ui.showToast(`${type} "${entityForm.name}" created!`, '', '✓')
    emit('close')
    router.push('/dashboard')
  } catch (e) {
    ui.showToast(e.message || 'Failed to create entity', '', '✕')
  } finally {
    entitySaving.value = false
  }
}

function skipEntity() {
  emit('close')
  router.push('/dashboard')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="wiz-overlay"
      @click.self="step < 3 && emit('close')"
    >
      <div class="wiz-card">

        <!-- Close button -->
        <button
          v-if="step < 3"
          class="wiz-close"
          title="Close"
          @click="emit('close')"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
          </svg>
        </button>

        <!-- Step bar -->
        <div class="wiz-step-bar">
          <template v-for="(label, i) in STEPS" :key="i">
            <div class="wiz-step" :class="{ active: i === step, done: i < step }">
              <div class="wiz-step-num">
                <svg v-if="i < step" viewBox="0 0 12 12" width="10" height="10" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="wiz-step-label">{{ label }}</span>
            </div>
            <div v-if="i < STEPS.length - 1" class="wiz-step-line" />
          </template>
        </div>

        <!-- ── STEP 0 — Name ───────────────────────────── -->
        <template v-if="step === 0">
          <h2 class="wiz-title">Name your campaign</h2>
          <p class="wiz-sub">You can change these details any time from campaign settings.</p>

          <div class="wiz-field-group">
            <div class="wiz-field">
              <label>Campaign name <span class="wiz-req">*</span></label>
              <input
                v-model="nameForm.name"
                type="text"
                placeholder="The Shattered Crown…"
                autofocus
                @keydown.enter="nextStep"
              />
            </div>
            <div class="wiz-field">
              <label>Subtitle <span class="wiz-opt">(optional)</span></label>
              <input
                v-model="nameForm.subtitle"
                type="text"
                placeholder="An optional tagline"
                @keydown.enter="nextStep"
              />
            </div>
          </div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="emit('close')">Cancel</button>
            <button class="wiz-btn primary" :disabled="!canAdvanceFrom0()" @click="nextStep">
              Choose system →
            </button>
          </div>
        </template>

        <!-- ── STEP 1 — System ─────────────────────────── -->
        <template v-if="step === 1">
          <h2 class="wiz-title">Choose a game system</h2>
          <p class="wiz-sub">Defaults for calendar, factions, locations, NPCs and quests will be pre-configured.</p>

          <div class="wiz-system-grid">
            <div
              v-for="(meta, key) in campaign.SYSTEM_META"
              :key="key"
              class="wiz-sys-card"
              :class="{ selected: selectedSystem === key, custom: key === 'custom' }"
              @click="selectedSystem = key"
            >
              <div class="wiz-sys-icon">{{ meta.icon }}</div>
              <div class="wiz-sys-name">{{ meta.label }}</div>
              <div class="wiz-sys-desc">{{ SYSTEM_PREVIEWS[key]?.calendar?.split('·')[0]?.split('—')[0]?.trim() || 'Custom' }}</div>
            </div>
          </div>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">What gets configured</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Calendar</div>
                <div class="wiz-preview-val">{{ preview.calendar }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Faction types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.faction_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Location types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.location_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">NPC roles</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Quest structures</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="prevStep">← Back</button>
            <button class="wiz-btn primary" @click="nextStep">Review defaults →</button>
          </div>
        </template>

        <!-- ── STEP 2 — Review ─────────────────────────── -->
        <template v-if="step === 2">
          <h2 class="wiz-title">Review &amp; confirm defaults</h2>
          <p class="wiz-sub">These are applied when your campaign is created. You can customise everything after.</p>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">Campaign</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Name</div>
                <div class="wiz-preview-val" style="font-weight:500;color:rgba(255,255,255,.9)">{{ nameForm.name }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">System</div>
                <div class="wiz-preview-val">
                  {{ campaign.SYSTEM_META[selectedSystem]?.icon }}
                  {{ campaign.SYSTEM_META[selectedSystem]?.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="wiz-preview-box">
            <div class="wiz-preview-title">Factions, locations &amp; NPCs</div>
            <div class="wiz-preview-grid">
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Calendar</div>
                <div class="wiz-preview-val">{{ preview.calendar }}</div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Faction types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.faction_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Location types</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.location_types" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">NPC roles</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
              <div class="wiz-preview-item">
                <div class="wiz-preview-label">Quest structures</div>
                <div class="wiz-preview-val">
                  <span v-for="t in preview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="saveError" class="wiz-error">{{ saveError }}</div>

          <div class="wiz-btn-row">
            <button class="wiz-btn ghost" @click="prevStep">← Back</button>
            <button class="wiz-btn primary" :disabled="saving" @click="createAndProceed">
              {{ saving ? 'Creating…' : 'Create campaign →' }}
            </button>
          </div>
        </template>

        <!-- ── STEP 3 — First entity ───────────────────── -->
        <template v-if="step === 3">
          <h2 class="wiz-title">Add your first entity</h2>
          <p class="wiz-sub">Kick off your world with an NPC, location, faction or quest — or skip and add them later.</p>

          <div class="wiz-import-tabs">
            <button class="wiz-itab" :class="{ active: importTab === 0 }" @click="importTab = 0">Guided wizard</button>
            <button class="wiz-itab" :class="{ active: importTab === 1 }" @click="importTab = 1">Paste JSON / Markdown</button>
            <button class="wiz-itab" :class="{ active: importTab === 2 }" @click="importTab = 2">Upload file</button>
          </div>

          <!-- Guided -->
          <div v-if="importTab === 0">
            <div class="wiz-field-row">
              <div class="wiz-field">
                <label>Entity type</label>
                <select v-model="entityForm.type">
                  <option v-for="t in ENTITY_TYPES" :key="t">{{ t }}</option>
                </select>
              </div>
              <div class="wiz-field">
                <label>Name <span class="wiz-req">*</span></label>
                <input v-model="entityForm.name" type="text" placeholder="e.g. Ezekiel Marsh…" />
              </div>
            </div>
            <div v-if="entityForm.type === 'NPC'" class="wiz-field-row">
              <div class="wiz-field">
                <label>Role</label>
                <select v-model="entityForm.role">
                  <option value="">— select —</option>
                  <option v-for="r in preview.npc_roles" :key="r">{{ r }}</option>
                </select>
              </div>
              <div class="wiz-field">
                <label>Location</label>
                <input v-model="entityForm.location" type="text" placeholder="e.g. Innsmouth, MA…" />
              </div>
            </div>
            <div class="wiz-field-row wiz-full">
              <div class="wiz-field">
                <label>Description</label>
                <input v-model="entityForm.description" type="text" placeholder="One-line summary…" />
              </div>
            </div>
            <div class="wiz-field-row wiz-full">
              <div class="wiz-field">
                <label>GM Notes</label>
                <textarea v-model="entityForm.notes" placeholder="Background, secrets, connections…" />
              </div>
            </div>
          </div>

          <!-- Paste -->
          <div v-if="importTab === 1">
            <div class="wiz-warning">
              <div class="wiz-warning-dot" />
              <span>Paste import is coming soon — use the guided wizard for now.</span>
            </div>
          </div>

          <!-- Upload -->
          <div v-if="importTab === 2">
            <div class="wiz-upload-zone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="margin:0 auto 10px;display:block;opacity:.3">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div class="wiz-upload-label">Drop a file here or click to browse</div>
              <div class="wiz-upload-hint">File upload is coming soon</div>
              <div class="wiz-file-badges">
                <span class="wiz-file-badge">.json</span>
                <span class="wiz-file-badge">.md</span>
                <span class="wiz-file-badge">.csv</span>
              </div>
            </div>
          </div>

          <div class="wiz-btn-row" style="margin-top:16px">
            <button class="wiz-btn ghost" @click="skipEntity">Skip for now</button>
            <button
              v-if="importTab === 0"
              class="wiz-btn primary"
              :disabled="entitySaving || !entityForm.name.trim()"
              @click="saveEntity"
            >
              {{ entitySaving ? 'Saving…' : 'Add entity & enter campaign' }}
            </button>
            <button v-else class="wiz-btn primary" @click="skipEntity">Enter campaign →</button>
          </div>
        </template>

      </div><!-- .wiz-card -->
    </div><!-- .wiz-overlay -->
  </Teleport>
</template>

<style scoped>
/* ── Overlay ──────────────────────────────────────────── */
.wiz-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.wiz-card {
  position: relative;
  background: var(--surface2, #1e2120);
  border: 0.5px solid rgba(255,255,255,.12);
  border-radius: 12px;
  width: 100%;
  max-width: 780px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 32px;
  box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 4px 16px rgba(0,0,0,.4);
}

/* ── Close ────────────────────────────────────────────── */
.wiz-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 0.5px solid rgba(255,255,255,.1);
  background: transparent;
  color: rgba(255,255,255,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
}
.wiz-close:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.7); }

/* ── Step bar ─────────────────────────────────────────── */
.wiz-step-bar {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}

.wiz-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,.28);
  letter-spacing: .5px;
  white-space: nowrap;
}
.wiz-step.active { color: var(--accent, #a8c080); }
.wiz-step.done   { color: rgba(255,255,255,.5); }

.wiz-step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500; flex-shrink: 0;
}
.wiz-step.active .wiz-step-num {
  border-color: var(--accent, #a8c080);
  background: rgba(168,192,128,.15);
  color: var(--accent, #a8c080);
}
.wiz-step.done .wiz-step-num {
  border-color: rgba(255,255,255,.3);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.5);
}

.wiz-step-label { display: none; }
@media (min-width: 520px) { .wiz-step-label { display: inline; } }

.wiz-step-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,.08);
  margin: 0 8px;
  min-width: 8px;
}

/* ── Typography ───────────────────────────────────────── */
.wiz-title {
  font-size: 20px; font-weight: 500;
  margin-bottom: 4px;
  color: rgba(255,255,255,.9);
}
.wiz-sub {
  font-size: 13px;
  color: rgba(255,255,255,.4);
  margin-bottom: 22px;
}
.wiz-req { color: var(--accent, #a8c080); }
.wiz-opt { color: rgba(255,255,255,.25); font-size: 10px; font-weight: 400; }

/* ── Fields ───────────────────────────────────────────── */
.wiz-field-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 22px; }

.wiz-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.wiz-full { grid-template-columns: 1fr; }

.wiz-field { display: flex; flex-direction: column; gap: 4px; }
.wiz-field label { font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(255,255,255,.35); }
.wiz-field input,
.wiz-field select,
.wiz-field textarea {
  background: rgba(255,255,255,.05);
  border: 0.5px solid rgba(255,255,255,.12);
  border-radius: 8px;
  color: rgba(255,255,255,.8);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  width: 100%;
  font-family: inherit;
  transition: border-color .15s;
}
.wiz-field input:focus,
.wiz-field select:focus,
.wiz-field textarea:focus { border-color: rgba(168,192,128,.5); }
.wiz-field input::placeholder,
.wiz-field textarea::placeholder { color: rgba(255,255,255,.2); }
.wiz-field textarea { resize: vertical; min-height: 80px; font-family: monospace; font-size: 12px; }
.wiz-field select option { background: var(--bg, #1c1f1a); }

/* ── System cards ─────────────────────────────────────── */
.wiz-system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}
.wiz-sys-card {
  border: 1.5px solid rgba(255,255,255,.1);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  background: rgba(255,255,255,.03);
}
.wiz-sys-card:hover   { border-color: rgba(168,192,128,.4); background: rgba(168,192,128,.05); }
.wiz-sys-card.selected { border-color: var(--accent, #a8c080); background: rgba(168,192,128,.1); }
.wiz-sys-card.custom  { border-style: dashed; }
.wiz-sys-icon {
  width: 30px; height: 30px;
  border-radius: 6px;
  background: rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
  font-size: 15px;
}
.wiz-sys-name { font-size: 12px; font-weight: 500; color: rgba(255,255,255,.85); margin-bottom: 2px; }
.wiz-sys-desc { font-size: 10px; color: rgba(255,255,255,.35); }

/* ── Preview box ──────────────────────────────────────── */
.wiz-preview-box {
  border: 0.5px solid rgba(255,255,255,.1);
  border-radius: 8px;
  background: rgba(255,255,255,.02);
  padding: 14px;
  margin-bottom: 14px;
}
.wiz-preview-title {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,.25);
  margin-bottom: 10px;
}
.wiz-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.wiz-preview-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,.04);
  border: 0.5px solid rgba(255,255,255,.06);
}
.wiz-preview-label {
  font-size: 10px; letter-spacing: .5px;
  color: rgba(255,255,255,.28);
  margin-bottom: 3px;
  text-transform: uppercase;
}
.wiz-preview-val { font-size: 12px; color: rgba(255,255,255,.7); line-height: 1.6; }

.wiz-tag {
  display: inline-block;
  font-size: 10px;
  background: rgba(168,192,128,.12);
  color: var(--accent, #a8c080);
  border-radius: 4px;
  padding: 2px 5px;
  margin: 2px 2px 0 0;
}

/* ── Buttons ──────────────────────────────────────────── */
.wiz-btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }

.wiz-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid rgba(255,255,255,.15);
  background: transparent;
  color: rgba(255,255,255,.6);
  transition: all .15s;
  font-family: inherit;
}
.wiz-btn:hover:not(:disabled) { background: rgba(255,255,255,.06); color: rgba(255,255,255,.9); }
.wiz-btn:disabled { opacity: .4; cursor: default; }
.wiz-btn.primary { background: var(--accent, #a8c080); border-color: var(--accent, #a8c080); color: #1c1f1a; }
.wiz-btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.wiz-btn.ghost { border-color: transparent; color: rgba(255,255,255,.3); }
.wiz-btn.ghost:hover:not(:disabled) { color: rgba(255,255,255,.55); background: transparent; }

/* ── Import tabs ──────────────────────────────────────── */
.wiz-import-tabs {
  display: flex;
  border-bottom: 0.5px solid rgba(255,255,255,.1);
  margin-bottom: 16px;
}
.wiz-itab {
  padding: 7px 14px;
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,.35);
  cursor: pointer;
  border: none; background: transparent;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s;
  font-family: inherit;
}
.wiz-itab.active { color: var(--accent, #a8c080); border-bottom-color: var(--accent, #a8c080); }
.wiz-itab:hover:not(.active) { color: rgba(255,255,255,.6); }

/* ── Warning / error ──────────────────────────────────── */
.wiz-warning {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-radius: 8px;
  background: rgba(186,117,23,.1);
  border: 0.5px solid rgba(186,117,23,.3);
  margin-bottom: 10px;
  font-size: 11px; color: #EF9F27;
}
.wiz-warning-dot { width: 6px; height: 6px; border-radius: 50%; background: #BA7517; flex-shrink: 0; }

.wiz-error {
  color: var(--red, #e74c3c);
  font-size: 12px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(231,76,60,.1);
  border: 0.5px solid rgba(231,76,60,.25);
}

/* ── Upload zone ──────────────────────────────────────── */
.wiz-upload-zone {
  border: 1.5px dashed rgba(255,255,255,.12);
  border-radius: 8px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s;
  color: rgba(255,255,255,.3);
}
.wiz-upload-label { font-size: 13px; color: rgba(255,255,255,.5); margin-bottom: 4px; }
.wiz-upload-hint  { font-size: 11px; color: rgba(255,255,255,.25); margin-bottom: 10px; }
.wiz-file-badges  { display: flex; justify-content: center; gap: 6px; }
.wiz-file-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 4px;
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.4);
  border: 0.5px solid rgba(255,255,255,.1);
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 600px) {
  .wiz-card { padding: 20px 16px; border-radius: 10px; }
  .wiz-field-row { grid-template-columns: 1fr; }
  .wiz-preview-grid { grid-template-columns: 1fr; }
  .wiz-system-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
}
</style>
