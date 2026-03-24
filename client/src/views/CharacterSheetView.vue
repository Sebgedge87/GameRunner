<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Character Sheet</div>
    </div>

    <!-- GM: player selector -->
    <div v-if="campaign.isGm" class="gm-only" style="margin-bottom:16px;max-width:280px">
      <div class="field-group">
        <label>View Player</label>
        <select v-model="selectedUserId" @change="loadSheet">
          <option value="">— Select Player —</option>
          <option v-for="u in data.users" :key="u.id" :value="u.id">{{ u.username }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading sheet...</div>

    <!-- No sheet yet -->
    <div v-else-if="!sheet && !editing" class="empty-state">
      <div>No character sheet yet.</div>
      <button v-if="!campaign.isGm" class="btn" style="margin-top:12px" @click="startEdit">Create Sheet</button>
    </div>

    <!-- ── EDIT MODE ──────────────────────────────────── -->
    <template v-else-if="editing">
      <div class="card" style="margin-bottom:16px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:14px">EDIT SHEET</div>

        <!-- D&D Beyond URL (5e only) -->
        <template v-if="hasDndBeyond">
          <div class="field-group" style="margin-bottom:16px">
            <label>D&amp;D Beyond Character URL</label>
            <input v-model="ef.dnd_beyond_url" class="form-input" placeholder="https://www.dndbeyond.com/characters/…" />
            <div style="font-size:0.78em;opacity:0.5;margin-top:4px">Paste the URL from your D&amp;D Beyond character page. Players and GMs can open it directly from here.</div>
          </div>
        </template>

        <!-- Built-in sheet fields (non-5e systems) -->
        <template v-if="hasBuiltinSheet">
          <div class="edit-grid">
            <div class="field-group">
              <label>Character Name</label>
              <input v-model="ef.name" class="form-input" />
            </div>
            <div class="field-group">
              <label>Class / Role</label>
              <input v-model="ef.class" class="form-input" placeholder="e.g. Investigator, Marine…" />
            </div>
            <div class="field-group">
              <label>Race / Species</label>
              <input v-model="ef.race" class="form-input" placeholder="e.g. Human, Android…" />
            </div>
            <div class="field-group">
              <label>Level / Rank</label>
              <input v-model.number="ef.level" type="number" class="form-input" min="1" />
            </div>
            <div class="field-group">
              <label>Background / Occupation</label>
              <input v-model="ef.background" class="form-input" />
            </div>
            <div class="field-group">
              <label>Concept</label>
              <input v-model="ef.concept" class="form-input" placeholder="One-line character concept…" />
            </div>
          </div>

          <!-- Core stats (system-specific) -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Core Stats</div>
          <div class="edit-stats-grid">
            <div v-for="stat in coreStats" :key="stat.key" class="field-group">
              <label>{{ stat.label }}</label>
              <input v-model.number="ef[stat.key]" type="number" class="form-input" placeholder="0" />
            </div>
          </div>

          <!-- HP / Condition -->
          <div style="font-size:0.75em;opacity:0.55;margin:16px 0 8px;letter-spacing:.05em;text-transform:uppercase">Condition</div>
          <div class="edit-grid">
            <div class="field-group">
              <label>HP (Current)</label>
              <input v-model.number="ef.hp_current" type="number" class="form-input" />
            </div>
            <div class="field-group">
              <label>HP (Max)</label>
              <input v-model.number="ef.hp_max" type="number" class="form-input" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>Stress (Current)</label>
              <input v-model.number="ef.stress_current" type="number" class="form-input" />
            </div>
            <div v-if="hasStress" class="field-group">
              <label>Stress (Max)</label>
              <input v-model.number="ef.stress_max" type="number" class="form-input" />
            </div>
          </div>

          <!-- Skills / Abilities (comma-separated for simplicity) -->
          <div class="edit-grid" style="margin-top:4px">
            <div class="field-group" style="grid-column:1/-1">
              <label>Skills <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
              <input v-model="ef.skills_text" class="form-input" placeholder="Firearms, First Aid, Spot Hidden…" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Abilities / Talents <span style="opacity:.5;font-weight:400">(comma-separated)</span></label>
              <input v-model="ef.abilities_text" class="form-input" placeholder="Combat Training, Nerves of Steel…" />
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Backstory</label>
              <textarea v-model="ef.backstory" class="form-input" style="min-height:80px;resize:vertical"></textarea>
            </div>
            <div class="field-group" style="grid-column:1/-1">
              <label>Notes</label>
              <textarea v-model="ef.notes" class="form-input" style="min-height:60px;resize:vertical"></textarea>
            </div>
          </div>
        </template>

        <!-- Portrait URL (all systems) -->
        <div class="field-group" style="margin-top:12px">
          <label>Portrait URL <span style="opacity:.5;font-weight:400">(optional)</span></label>
          <input v-model="ef.portrait_url" class="form-input" placeholder="https://…" />
        </div>

        <div v-if="saveError" class="status-msg status-err" style="margin-top:10px">{{ saveError }}</div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn" @click="saveSheet" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
          <button class="btn" style="opacity:.7" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </template>

    <!-- ── VIEW MODE ──────────────────────────────────── -->
    <template v-else>

      <!-- D&D Beyond banner (5e with URL set) -->
      <div v-if="hasDndBeyond && sheet.dnd_beyond_url" class="beyond-banner">
        <div class="beyond-banner-info">
          <div class="beyond-banner-name">{{ sheet.name || auth.currentUser?.username }}</div>
          <div class="beyond-banner-sub">D&amp;D Beyond character sheet</div>
        </div>
        <a :href="sheet.dnd_beyond_url" target="_blank" rel="noopener" class="btn beyond-btn">Open in D&amp;D Beyond ↗</a>
      </div>

      <!-- 5e: nudge to add Beyond URL if missing -->
      <div v-else-if="hasDndBeyond && !sheet.dnd_beyond_url" class="beyond-placeholder">
        <div style="opacity:.6;font-size:.9em">No D&amp;D Beyond link set.</div>
        <button v-if="!campaign.isGm" class="btn btn-sm" style="margin-top:8px" @click="startEdit">Add D&amp;D Beyond URL</button>
      </div>

      <!-- Built-in sheet for other systems -->
      <template v-if="hasBuiltinSheet">
        <!-- Character Header -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-body" style="display:flex;gap:20px;align-items:flex-start">
            <div v-if="sheet.portrait_url" style="flex-shrink:0">
              <img :src="sheet.portrait_url" alt="Portrait" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--border)" />
            </div>
            <div style="flex:1">
              <div style="font-size:1.3em;font-weight:600;color:var(--accent)">{{ sheet.name }}</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                <span v-if="sheet.class" class="tag">{{ sheet.class }}</span>
                <span v-if="sheet.race" class="tag">{{ sheet.race }}</span>
                <span v-if="sheet.level" class="tag tag-active">Level {{ sheet.level }}</span>
                <span v-if="sheet.background" class="tag">{{ sheet.background }}</span>
              </div>
              <div v-if="sheet.concept" style="font-size:0.85em;opacity:0.7;margin-top:8px;font-style:italic">{{ sheet.concept }}</div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="hasStats" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">STATS</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
            <div v-for="stat in coreStats" :key="stat.key" v-show="sheet[stat.key] != null" class="stat-box">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ sheet[stat.key] ?? '—' }}</div>
            </div>
          </div>
        </div>

        <!-- HP / Condition -->
        <div v-if="sheet.hp_max != null || sheet.stress_max != null" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CONDITION</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-if="sheet.hp_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>HP</span><span>{{ sheet.hp_current ?? sheet.hp_max }} / {{ sheet.hp_max }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="`width:${hpPercent}%;background:var(--green,#4caf7d)`"></div>
              </div>
            </div>
            <div v-if="sheet.stress_max != null">
              <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
                <span>Stress</span><span>{{ sheet.stress_current ?? 0 }} / {{ sheet.stress_max }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="`width:${stressPercent}%;background:var(--red,#c94c4c)`"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Skills / Abilities -->
        <div v-if="sheet.skills?.length || sheet.abilities?.length" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">SKILLS &amp; ABILITIES</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span v-for="s in (sheet.skills || [])" :key="s" class="tag">{{ s }}</span>
            <span v-for="a in (sheet.abilities || [])" :key="a" class="tag tag-active">{{ a }}</span>
          </div>
        </div>

        <!-- Notes / Backstory -->
        <div v-if="sheet.notes || sheet.backstory" class="card" style="margin-bottom:16px">
          <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">NOTES</div>
          <div v-if="sheet.backstory" class="prose" style="font-size:0.85em;opacity:0.8;margin-bottom:10px;line-height:1.6" v-html="renderMd(sheet.backstory)"></div>
          <div v-if="sheet.notes" class="prose" style="font-size:0.85em;opacity:0.7;line-height:1.6" v-html="renderMd(sheet.notes)"></div>
        </div>

        <!-- Ships / Vehicles -->
        <template v-if="ships.length">
          <div class="section-divider" style="margin-top:24px">Ships &amp; Vehicles</div>
          <div class="card-grid" style="margin-top:12px">
            <div v-for="ship in ships" :key="ship.id" class="card" @click="ui.openDetail('ship', ship)">
              <div class="card-body">
                <div class="card-title">{{ ship.name }}</div>
                <div class="card-meta">
                  <span v-if="ship.class" class="tag">{{ ship.class }}</span>
                  <span v-if="ship.condition" class="tag" :class="conditionClass(ship.condition)">{{ ship.condition }}</span>
                </div>
                <div v-if="ship.hull_max != null" style="margin-top:8px">
                  <div style="font-size:0.75em;opacity:0.6;margin-bottom:3px">Hull: {{ ship.hull_current ?? ship.hull_max }} / {{ ship.hull_max }}</div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="`width:${hullPercent(ship)}%;background:var(--blue,#4c7ac9)`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- Edit button (players edit their own; GM can edit any) -->
      <div v-if="!campaign.isGm || selectedUserId" style="margin-top:24px">
        <button class="btn" @click="startEdit">Edit Sheet</button>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { renderMd } from '@/utils/markdown'
import { useDataStore } from '@/stores/data'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'
import { useSystemFeatures } from '@/composables/useSystemFeatures'

const data = useDataStore()
const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const { hasStress, hasDndBeyond, hasBuiltinSheet, coreStats } = useSystemFeatures()

const sheet = ref(null)
const ships = ref([])
const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const selectedUserId = ref('')

// Edit form
const ef = ref({})

function startEdit() {
  const s = sheet.value || {}
  ef.value = {
    name: s.name || '',
    class: s.class || '',
    race: s.race || '',
    level: s.level || 1,
    background: s.background || '',
    concept: s.concept || '',
    portrait_url: s.portrait_url || '',
    hp_current: s.hp_current ?? null,
    hp_max: s.hp_max ?? null,
    stress_current: s.stress_current ?? null,
    stress_max: s.stress_max ?? null,
    skills_text: (s.skills || []).join(', '),
    abilities_text: (s.abilities || []).join(', '),
    backstory: s.backstory || '',
    notes: s.notes || '',
    dnd_beyond_url: s.dnd_beyond_url || '',
    // core stats
    str: s.str ?? null, dex: s.dex ?? null, con: s.con ?? null,
    int: s.int ?? null, wis: s.wis ?? null, cha: s.cha ?? null,
    strength: s.strength ?? null, agility: s.agility ?? null,
    wits: s.wits ?? null, empathy: s.empathy ?? null,
    siz: s.siz ?? null, app: s.app ?? null, edu: s.edu ?? null,
    pow: s.pow ?? null, luck: s.luck ?? null,
    bod: s.bod ?? null, agi: s.agi ?? null, mnd: s.mnd ?? null,
    soc: s.soc ?? null, spi: s.spi ?? null,
  }
  editing.value = true
  saveError.value = ''
}

function cancelEdit() {
  editing.value = false
  saveError.value = ''
}

const hasStats = computed(() => coreStats.value.some(s => sheet.value?.[s.key] != null))

const hpPercent = computed(() => {
  if (!sheet.value?.hp_max) return 0
  return Math.round(((sheet.value.hp_current ?? sheet.value.hp_max) / sheet.value.hp_max) * 100)
})

const stressPercent = computed(() => {
  if (!sheet.value?.stress_max) return 0
  return Math.round(((sheet.value.stress_current ?? 0) / sheet.value.stress_max) * 100)
})

function hullPercent(ship) {
  if (!ship.hull_max) return 0
  return Math.round(((ship.hull_current ?? ship.hull_max) / ship.hull_max) * 100)
}

function conditionClass(c) {
  const v = c?.toLowerCase()
  if (v === 'operational') return 'tag-active'
  if (v === 'damaged' || v === 'destroyed') return 'tag-inactive'
  return ''
}

async function loadSheet() {
  loading.value = true
  editing.value = false
  try {
    const uid = campaign.isGm && selectedUserId.value ? selectedUserId.value : auth.currentUser?.id
    if (!uid) return
    const r = await data.apif(`/api/character-sheets/${uid}`)
    if (r.ok) {
      const d = await r.json()
      const raw = d.sheet
      sheet.value = raw ? { ...raw, ...(raw.sheet_data || {}) } : null
    } else {
      sheet.value = null
    }
    const rs = await data.apif('/api/character-sheets/ships/all')
    if (rs.ok) ships.value = (await rs.json()).ships || []
  } catch (e) {
    console.error('[CharacterSheet]', e)
    sheet.value = null
  } finally {
    loading.value = false
  }
}

async function saveSheet() {
  saving.value = true
  saveError.value = ''
  try {
    const uid = campaign.isGm && selectedUserId.value ? selectedUserId.value : auth.currentUser?.id
    if (!uid) throw new Error('No user selected')
    const campId = campaign.activeCampaign?.id
    const sys = campaign.activeCampaign?.system || 'custom'

    const sheetData = {}
    if (hasBuiltinSheet.value) {
      const statKeys = ['str','dex','con','int','wis','cha','strength','agility','wits','empathy',
                        'siz','app','edu','pow','luck','bod','agi','mnd','soc','spi']
      statKeys.forEach(k => { if (ef.value[k] != null) sheetData[k] = ef.value[k] })
      sheetData.name = ef.value.name
      sheetData.class = ef.value.class
      sheetData.race = ef.value.race
      sheetData.level = ef.value.level
      sheetData.background = ef.value.background
      sheetData.concept = ef.value.concept
      sheetData.hp_current = ef.value.hp_current
      sheetData.hp_max = ef.value.hp_max
      sheetData.stress_current = ef.value.stress_current
      sheetData.stress_max = ef.value.stress_max
      sheetData.skills = ef.value.skills_text.split(',').map(s => s.trim()).filter(Boolean)
      sheetData.abilities = ef.value.abilities_text.split(',').map(s => s.trim()).filter(Boolean)
      sheetData.backstory = ef.value.backstory
      sheetData.notes = ef.value.notes
    }
    if (ef.value.portrait_url) sheetData.portrait_url = ef.value.portrait_url

    const r = await data.apif(`/api/character-sheets/${uid}`, {
      method: 'PUT',
      body: JSON.stringify({
        campaign_id: campId,
        system: sys,
        sheet_data: sheetData,
        dnd_beyond_url: ef.value.dnd_beyond_url || null,
      }),
    })
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
    ui.showToast('Sheet saved', '', '✓')
    await loadSheet()
    editing.value = false
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (!campaign.isGm) loadSheet()
  if (!data.users.length) data.loadUsers()
})
</script>

<style scoped>
/* Stat display boxes */
.stat-box {
  background: var(--surface2, #20202e);
  border: 1px solid var(--border, #2a2a3a);
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}
.stat-label {
  font-size: 0.65em;
  letter-spacing: 1px;
  color: var(--text3, #6a6460);
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 1.4em;
  font-weight: 700;
  color: var(--accent, #c9a84c);
}

/* HP/stress progress bars */
.progress-bar {
  background: var(--border);
  border-radius: 99px;
  height: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.3s ease;
  min-width: 2px;
}

/* D&D Beyond banner */
.beyond-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px solid var(--accent);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
}
.beyond-banner-name { font-size: 1.1em; font-weight: 700; color: var(--accent); }
.beyond-banner-sub { font-size: 0.8em; opacity: 0.55; margin-top: 2px; }
.beyond-btn { flex-shrink: 0; }

.beyond-placeholder {
  background: var(--surface2, rgba(255,255,255,.04));
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

/* Edit form grids */
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.edit-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

@media (max-width: 600px) {
  .edit-grid { grid-template-columns: 1fr; }
  .beyond-banner { flex-direction: column; align-items: flex-start; }
}
</style>
