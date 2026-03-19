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

    <div v-else-if="!sheet" class="empty-state">
      No character sheet found.
    </div>

    <template v-else>
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
            <div v-if="sheet.concept" style="font-size:0.85em;opacity:0.7;margin-top:8px;font-style:italic">
              {{ sheet.concept }}
            </div>
          </div>
        </div>
      </div>

      <!-- Stats / Core Numbers -->
      <div v-if="hasStats" class="card" style="margin-bottom:16px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">STATS</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px">
          <div v-for="stat in coreStats" :key="stat.key" class="stat-box">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ sheet[stat.key] ?? '—' }}</div>
          </div>
        </div>
      </div>

      <!-- HP / Stress / Condition bars -->
      <div v-if="sheet.hp_max != null || sheet.stress_max != null" class="card" style="margin-bottom:16px">
        <div style="font-size:0.7em;letter-spacing:1px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:12px">CONDITION</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div v-if="sheet.hp_max != null">
            <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
              <span>HP</span>
              <span>{{ sheet.hp_current ?? sheet.hp_max }} / {{ sheet.hp_max }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="`width:${hpPercent}%;background:var(--green,#4caf7d)`"></div>
            </div>
          </div>
          <div v-if="sheet.stress_max != null">
            <div style="display:flex;justify-content:space-between;font-size:0.8em;opacity:0.7;margin-bottom:4px">
              <span>Stress</span>
              <span>{{ sheet.stress_current ?? 0 }} / {{ sheet.stress_max }}</span>
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

      <!-- Ships / Vehicles (for sci-fi systems) -->
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

      <!-- Edit button (own sheet) -->
      <div v-if="!campaign.isGm" style="margin-top:24px">
        <button class="btn" @click="ui.openGmEdit('character-sheet', sheet.id, sheet)">Edit My Sheet</button>
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

const data = useDataStore()
const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()

const sheet = ref(null)
const ships = ref([])
const loading = ref(false)
const selectedUserId = ref('')

const coreStats = [
  { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' }, { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
  // Alien/Coriolis style
  { key: 'strength', label: 'Strength' }, { key: 'agility', label: 'Agility' },
  { key: 'wits', label: 'Wits' }, { key: 'empathy', label: 'Empathy' },
].filter((s, i, arr) => arr.findIndex(x => x.key === s.key) === i)

const hasStats = computed(() => coreStats.some(s => sheet.value?.[s.key] != null))

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
  if (v === 'damaged') return 'tag-inactive'
  if (v === 'destroyed') return 'tag-inactive'
  return ''
}

async function loadSheet() {
  loading.value = true
  try {
    const uid = campaign.isGm && selectedUserId.value ? selectedUserId.value : auth.currentUser?.id
    if (!uid) return
    const r = await data.apif(`/api/character-sheet?user_id=${uid}`)
    const d = await r.json()
    sheet.value = d.sheet || null
    ships.value = d.ships || []
  } catch (e) {
    console.error('[CharacterSheet]', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!campaign.isGm) loadSheet()
  if (!data.users.length) data.loadUsers()
})
</script>

<style scoped>
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
</style>
