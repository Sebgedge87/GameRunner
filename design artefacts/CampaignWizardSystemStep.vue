<script setup>
/**
 * DESIGN ARTEFACT: CampaignWizardSystemStep.vue
 * -----------------------------------------------
 * Shell component for campaign creation wizard — game system selection,
 * defaults preview, and first entity import.
 *
 * INTEGRATION NOTES:
 *   - Drop into your existing campaign creation wizard at the correct step
 *   - system_templates fetched from GET /api/system-templates
 *   - On confirm: POST /api/campaigns with { system_template_id, ... }
 *   - parseEntityInput(raw, type, format) — implement in src/lib/parseEntity.js
 *   - Entity import also accessible standalone from NPC/Location/Faction pages
 *
 * DB SCHEMA:
 *   system_templates (id, system_slug, name, is_builtin, owner_id, config JSONB)
 *   config shape: { calendar, factions, location_types, npc_roles, quest_structures }
 *
 * EMITS:
 *   confirm(selectedSystemId, skipEntity)  — wizard proceeds
 *   back                                    — wizard goes back
 */

import { ref, computed } from 'vue'

const emit = defineEmits(['confirm', 'back'])

const STEPS = ['Name', 'Game system', 'Review defaults', 'First entity']

// ─── Replace with your API call ───
const BUILT_IN_SYSTEMS = [
  { slug: 'coc',    name: 'Call of Cthulhu', desc: '7th Edition · 1920s', icon: '☠' },
  { slug: 'dnd',    name: 'D&D 5e',           desc: 'Fantasy · Gregorian', icon: '◆' },
  { slug: 'dg',     name: 'Delta Green',       desc: 'Modern · Handler',   icon: '■' },
  { slug: 'blades', name: 'Blades in the Dark',desc: 'Scoundrels · Doskvol',icon: '▶' },
  { slug: 'custom', name: 'Custom system',     desc: 'Build your own',     icon: '+', isCustom: true },
]

const SYSTEM_PREVIEWS = {
  coc: {
    calendar:       'Gregorian · 1920s epoch',
    faction_types:  ['Cult','Agency','Institution','Criminal'],
    location_types: ['City','Ruin','Wilderness','Dreamlands'],
    npc_roles:      ['Investigator','Cultist','Bystander','Deep One'],
    quest_structures:['Investigation','Retrieval','Survival'],
  },
  dnd: {
    calendar:       'Forgotten Realms — Harptos calendar',
    faction_types:  ['Guild','Kingdom','Religion','Thieves'],
    location_types: ['Town','Dungeon','Wilderness','Planar'],
    npc_roles:      ['Hero','Villain','Merchant','Noble','Guard'],
    quest_structures:['Dungeon delve','Escort','Diplomacy'],
  },
  dg: {
    calendar:       'Gregorian · Modern epoch',
    faction_types:  ['Handler cell','Unnatural','Government','Civilian'],
    location_types: ['Safe house','Site','Urban','Remote'],
    npc_roles:      ['Handler','Agent','Asset','Threat','Bystander'],
    quest_structures:['Operation','Containment','Elimination'],
  },
  blades: {
    calendar:       'Doskvol custom — 6 seasons',
    faction_types:  ['Crew','Noble house','Cult','City watch'],
    location_types: ['District','Lair','Haunt','The Void Sea'],
    npc_roles:      ['Contact','Rival','Mark','Ghost','Demon'],
    quest_structures:['Score','Downtime','Entanglement'],
  },
}

const ENTITY_TYPES = ['NPC', 'Location', 'Faction', 'Quest / Hook']

const currentStep  = ref(1) // 0-indexed within this component; wizard may offset
const selectedSlug = ref('coc')
const importTab    = ref(0) // 0=wizard 1=paste 2=upload
const pasteInput   = ref('')

const entityForm = ref({
  type: 'NPC', name: '', role: '', location: '', description: '', notes: '',
})

const selectedPreview = computed(() => SYSTEM_PREVIEWS[selectedSlug.value] || {})

function selectSystem(slug) { selectedSlug.value = slug }

function nextStep() { if (currentStep.value < 2) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }

function handleConfirm(skipEntity = false) {
  emit('confirm', { systemSlug: selectedSlug.value, skipEntity, entity: skipEntity ? null : entityForm.value })
}

// ─── Replace with your actual parse pipeline ───
function parsePaste() {
  // parseEntityInput(pasteInput.value, entityForm.value.type, 'markdown')
  //   .then(result => { Object.assign(entityForm.value, result.fields) })
  console.log('Parse paste — wire to src/lib/parseEntity.js')
}
</script>

<template>
  <div class="wiz-wrap">

    <!-- Step indicator -->
    <div class="wiz-step-bar">
      <template v-for="(label, i) in STEPS" :key="i">
        <div class="wiz-step"
          :class="{ active: i === currentStep + 1, done: i < currentStep + 1 }">
          <div class="wiz-step-num">{{ i + 1 }}</div>
          <span>{{ label }}</span>
        </div>
        <div v-if="i < STEPS.length - 1" class="wiz-step-line" />
      </template>
    </div>

    <!-- ── STEP 0: System selection ── -->
    <div v-if="currentStep === 0">
      <h2 class="wiz-title">Choose a game system</h2>
      <p class="wiz-sub">Defaults for calendar, factions, locations, NPCs and quests will be pre-configured. You can customise everything after.</p>

      <div class="wiz-system-grid">
        <div
          v-for="sys in BUILT_IN_SYSTEMS"
          :key="sys.slug"
          class="wiz-sys-card"
          :class="{ selected: selectedSlug === sys.slug, custom: sys.isCustom }"
          @click="selectSystem(sys.slug)"
        >
          <div class="wiz-sys-icon">{{ sys.icon }}</div>
          <div class="wiz-sys-name">{{ sys.name }}</div>
          <div class="wiz-sys-desc">{{ sys.desc }}</div>
        </div>
      </div>

      <div class="wiz-preview-box">
        <div class="wiz-preview-title">What gets configured</div>
        <div class="wiz-preview-grid">
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Calendar</div>
            <div class="wiz-preview-val">{{ selectedPreview.calendar }}</div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Faction types</div>
            <div class="wiz-preview-val">
              <span v-for="t in selectedPreview.faction_types" :key="t" class="wiz-tag">{{ t }}</span>
            </div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Location types</div>
            <div class="wiz-preview-val">
              <span v-for="t in selectedPreview.location_types" :key="t" class="wiz-tag">{{ t }}</span>
            </div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">NPC roles</div>
            <div class="wiz-preview-val">
              <span v-for="t in selectedPreview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span>
            </div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Quest structures</div>
            <div class="wiz-preview-val">
              <span v-for="t in selectedPreview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="wiz-btn-row">
        <button class="wiz-btn ghost" @click="emit('back')">← Back</button>
        <button class="wiz-btn primary" @click="nextStep">Review defaults →</button>
      </div>
    </div>

    <!-- ── STEP 1: Review defaults ── -->
    <div v-if="currentStep === 1">
      <h2 class="wiz-title">Review &amp; customise defaults</h2>
      <p class="wiz-sub">These will be applied when your campaign is created. Toggle off anything you don't need.</p>

      <div class="wiz-preview-box">
        <div class="wiz-preview-title">Calendar</div>
        <div class="wiz-preview-grid">
          <div class="wiz-preview-item"><div class="wiz-preview-label">System</div><div class="wiz-preview-val">{{ selectedPreview.calendar }}</div></div>
          <div class="wiz-preview-item"><div class="wiz-preview-label">Moons</div><div class="wiz-preview-val">Standard lunar cycle</div></div>
        </div>
      </div>

      <div class="wiz-preview-box">
        <div class="wiz-preview-title">Factions, locations &amp; NPCs</div>
        <div class="wiz-preview-grid">
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Faction types</div>
            <div class="wiz-preview-val"><span v-for="t in selectedPreview.faction_types" :key="t" class="wiz-tag">{{ t }}</span></div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Location types</div>
            <div class="wiz-preview-val"><span v-for="t in selectedPreview.location_types" :key="t" class="wiz-tag">{{ t }}</span></div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">NPC roles</div>
            <div class="wiz-preview-val"><span v-for="t in selectedPreview.npc_roles" :key="t" class="wiz-tag">{{ t }}</span></div>
          </div>
          <div class="wiz-preview-item">
            <div class="wiz-preview-label">Quest structures</div>
            <div class="wiz-preview-val"><span v-for="t in selectedPreview.quest_structures" :key="t" class="wiz-tag">{{ t }}</span></div>
          </div>
        </div>
      </div>

      <div class="wiz-btn-row">
        <button class="wiz-btn ghost" @click="prevStep">← Back</button>
        <button class="wiz-btn primary" @click="nextStep">Create campaign →</button>
      </div>
    </div>

    <!-- ── STEP 2: First entity / import ── -->
    <div v-if="currentStep === 2">
      <h2 class="wiz-title">Add your first entity</h2>
      <p class="wiz-sub">Use the guided wizard, paste raw text, or upload a file — all three feed the same form.</p>

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
            <label>Name</label>
            <input v-model="entityForm.name" type="text" placeholder="e.g. Ezekiel Marsh..."/>
          </div>
        </div>
        <div class="wiz-field-row">
          <div class="wiz-field">
            <label>Role / type</label>
            <select v-model="entityForm.role">
              <option v-for="r in selectedPreview.npc_roles" :key="r">{{ r }}</option>
            </select>
          </div>
          <div class="wiz-field">
            <label>Location</label>
            <input v-model="entityForm.location" type="text" placeholder="e.g. Innsmouth, MA..."/>
          </div>
        </div>
        <div class="wiz-field-row wiz-full">
          <div class="wiz-field">
            <label>Description</label>
            <input v-model="entityForm.description" type="text" placeholder="One-line summary..."/>
          </div>
        </div>
        <div class="wiz-field-row wiz-full">
          <div class="wiz-field">
            <label>Notes</label>
            <textarea v-model="entityForm.notes" placeholder="Background, secrets, connections..."/>
          </div>
        </div>
      </div>

      <!-- Paste -->
      <div v-if="importTab === 1">
        <div class="wiz-warning">
          <div class="wiz-warning-dot" />
          <span>Fields Claude isn't confident about will be highlighted for you to confirm after parsing.</span>
        </div>
        <div class="wiz-field-row wiz-full">
          <div class="wiz-field">
            <label>Paste JSON or Markdown</label>
            <textarea v-model="pasteInput" placeholder="# Ezekiel Marsh&#10;**Role:** Cultist&#10;**Location:** Innsmouth, MA&#10;..."/>
          </div>
        </div>
        <button class="wiz-parse-btn" @click="parsePaste">Parse and prefill fields →</button>
      </div>

      <!-- Upload -->
      <div v-if="importTab === 2">
        <div class="wiz-upload-zone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="margin:0 auto 10px;display:block;">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          <div class="wiz-upload-label">Drop a file here or click to browse</div>
          <div class="wiz-upload-hint">Parsed fields will prefill the guided wizard for review</div>
          <div class="wiz-file-badges">
            <span class="wiz-file-badge">.json</span>
            <span class="wiz-file-badge">.md</span>
            <span class="wiz-file-badge">.csv</span>
          </div>
        </div>
      </div>

      <div class="wiz-btn-row" style="margin-top:16px;">
        <button class="wiz-btn ghost" @click="prevStep">← Back</button>
        <div style="display:flex;gap:8px;">
          <button class="wiz-btn" @click="handleConfirm(true)">Skip for now</button>
          <button class="wiz-btn primary" @click="handleConfirm(false)">Add entity &amp; finish</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.wiz-wrap { max-width: 780px; margin: 0 auto; padding: 32px; color: rgba(255,255,255,.85); }

.wiz-step-bar { display: flex; align-items: center; gap: 0; margin-bottom: 32px; }
.wiz-step { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,.3); letter-spacing: .5px; }
.wiz-step.active { color: #a8c080; }
.wiz-step.done { color: rgba(255,255,255,.5); }
.wiz-step-num { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; flex-shrink: 0; }
.wiz-step.active .wiz-step-num { border-color: #a8c080; background: rgba(168,192,128,.15); color: #a8c080; }
.wiz-step.done .wiz-step-num { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.06); }
.wiz-step-line { flex: 1; height: 1px; background: rgba(255,255,255,.08); margin: 0 8px; }

.wiz-title { font-size: 20px; font-weight: 500; margin-bottom: 4px; color: rgba(255,255,255,.9); }
.wiz-sub { font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 24px; }

.wiz-system-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; margin-bottom: 24px; }
.wiz-sys-card { border: 1.5px solid rgba(255,255,255,.1); border-radius: 8px; padding: 14px; cursor: pointer; transition: border-color .15s, background .15s; background: rgba(255,255,255,.03); }
.wiz-sys-card:hover { border-color: rgba(168,192,128,.4); background: rgba(168,192,128,.05); }
.wiz-sys-card.selected { border-color: #a8c080; background: rgba(168,192,128,.1); }
.wiz-sys-card.custom { border-style: dashed; }
.wiz-sys-icon { width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,.07); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; font-size: 14px; }
.wiz-sys-name { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.85); margin-bottom: 2px; }
.wiz-sys-desc { font-size: 11px; color: rgba(255,255,255,.35); }

.wiz-preview-box { border: 0.5px solid rgba(255,255,255,.1); border-radius: 8px; background: rgba(255,255,255,.03); padding: 16px; margin-bottom: 16px; }
.wiz-preview-title { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,.3); margin-bottom: 12px; }
.wiz-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.wiz-preview-item { padding: 10px 12px; border-radius: 6px; background: rgba(255,255,255,.04); border: 0.5px solid rgba(255,255,255,.07); }
.wiz-preview-label { font-size: 10px; letter-spacing: .5px; color: rgba(255,255,255,.3); margin-bottom: 4px; text-transform: uppercase; }
.wiz-preview-val { font-size: 12px; color: rgba(255,255,255,.7); }
.wiz-tag { display: inline-block; font-size: 10px; background: rgba(168,192,128,.12); color: #a8c080; border-radius: 4px; padding: 2px 6px; margin: 2px 2px 0 0; }

.wiz-btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.wiz-btn { padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1.5px solid rgba(255,255,255,.15); background: transparent; color: rgba(255,255,255,.6); transition: all .15s; }
.wiz-btn:hover { background: rgba(255,255,255,.06); color: rgba(255,255,255,.9); }
.wiz-btn.primary { background: #a8c080; border-color: #a8c080; color: #1c1f1a; }
.wiz-btn.primary:hover { background: #b8d090; }
.wiz-btn.ghost { border-color: transparent; color: rgba(255,255,255,.3); }

.wiz-import-tabs { display: flex; border-bottom: 0.5px solid rgba(255,255,255,.1); margin-bottom: 16px; }
.wiz-itab { padding: 8px 16px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,.35); cursor: pointer; border: none; background: transparent; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s; }
.wiz-itab.active { color: #a8c080; border-bottom-color: #a8c080; }
.wiz-itab:hover:not(.active) { color: rgba(255,255,255,.6); }

.wiz-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.wiz-full { grid-template-columns: 1fr; }
.wiz-field { display: flex; flex-direction: column; gap: 4px; }
.wiz-field label { font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: rgba(255,255,255,.35); }
.wiz-field input, .wiz-field select, .wiz-field textarea { background: rgba(255,255,255,.05); border: 0.5px solid rgba(255,255,255,.12); border-radius: 8px; color: rgba(255,255,255,.8); font-size: 13px; padding: 8px 10px; outline: none; width: 100%; font-family: inherit; }
.wiz-field input:focus, .wiz-field select:focus, .wiz-field textarea:focus { border-color: rgba(168,192,128,.5); }
.wiz-field input::placeholder, .wiz-field textarea::placeholder { color: rgba(255,255,255,.2); }
.wiz-field textarea { resize: vertical; min-height: 90px; font-family: monospace; font-size: 12px; }
.wiz-field select option { background: #2a2d28; }

.wiz-parse-btn { padding: 6px 14px; font-size: 12px; border: 0.5px solid rgba(168,192,128,.4); border-radius: 8px; background: rgba(168,192,128,.08); color: #a8c080; cursor: pointer; margin-top: 6px; }

.wiz-warning { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; background: rgba(186,117,23,.1); border: 0.5px solid rgba(186,117,23,.3); margin-bottom: 10px; font-size: 11px; color: #EF9F27; }
.wiz-warning-dot { width: 6px; height: 6px; border-radius: 50%; background: #BA7517; flex-shrink: 0; }

.wiz-upload-zone { border: 1.5px dashed rgba(255,255,255,.12); border-radius: 8px; padding: 28px; text-align: center; cursor: pointer; transition: border-color .15s; margin-bottom: 12px; color: rgba(255,255,255,.3); }
.wiz-upload-zone:hover { border-color: rgba(168,192,128,.4); }
.wiz-upload-label { font-size: 13px; color: rgba(255,255,255,.5); margin-bottom: 4px; }
.wiz-upload-hint { font-size: 11px; color: rgba(255,255,255,.25); margin-bottom: 10px; }
.wiz-file-badges { display: flex; justify-content: center; gap: 6px; }
.wiz-file-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); border: 0.5px solid rgba(255,255,255,.1); }
</style>
