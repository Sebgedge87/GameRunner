<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Characters</div>
    </div>

    <div v-if="loading" class="loading">Loading characters...</div>

    <div v-else class="char-tile-grid">
      <!-- Existing character tiles -->
      <div
        v-for="c in characters"
        :key="c.id"
        class="char-tile"
        @click="openCharacter(c)"
      >
        <!-- Portrait -->
        <div class="char-tile-portrait">
          <img v-if="c.portrait_url" :src="c.portrait_url" :alt="c.name" class="char-portrait-img" />
          <div v-else class="char-portrait-placeholder">{{ initials(c.name) }}</div>
        </div>

        <!-- Info -->
        <div class="char-tile-info">
          <div class="char-tile-name">{{ c.name }}</div>
          <div class="char-tile-meta">
            <span class="char-tile-system" :style="`color:${sysColor(c.system)};border-color:${sysColor(c.system)}40;background:${sysColor(c.system)}18`">
              {{ sysLabel(c.system) }}
            </span>
            <span v-if="c.sheet_data?.class" class="char-tile-class">{{ c.sheet_data.class }}</span>
          </div>
          <div v-if="c.sheet_data?.concept" class="char-tile-concept">{{ c.sheet_data.concept }}</div>
        </div>

        <!-- GM: show player name -->
        <div v-if="campaign.isGm" class="char-tile-player">{{ c.username }}</div>
      </div>

      <!-- New Character tile -->
      <div class="char-tile char-tile-new" @click="showCreate = true">
        <div class="char-tile-new-icon">+</div>
        <div class="char-tile-new-label">New Character</div>
      </div>
    </div>

    <!-- Create character modal -->
    <div v-if="showCreate" class="modal-overlay open" @click.self="showCreate = false">
      <div class="modal" style="max-width:480px">
        <div class="modal-title">New Character</div>
        <div class="form-group">
          <label>Character Name *</label>
          <input v-model="form.name" class="form-input" placeholder="Enter character name…" />
        </div>
        <div class="form-group">
          <label>System</label>
          <div style="font-size:0.82em;opacity:0.55;margin-bottom:6px">Inherited from campaign: <b>{{ sysLabel(activeSys) }}</b></div>
        </div>
        <div v-if="createError" class="status-msg status-err">{{ createError }}</div>
        <div class="modal-actions">
          <button class="modal-close" @click="showCreate = false">Cancel</button>
          <button class="submit-btn" :disabled="creating" @click="createCharacter">
            {{ creating ? 'Creating…' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const router = useRouter()

const characters = ref([])
const loading = ref(false)
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const form = ref({ name: '' })

const activeSys = computed(() => campaign.activeCampaign?.system || 'dnd5e')

const SYS_COLORS = {
  dnd5e: '#6b8cff', coc: '#9a7c1e', achtung: '#8b0000',
  alien: '#7fba00', coriolis: '#4c7ac9', vaesen: '#7e5c3b', mothership: '#4ec9b0',
}
const SYS_LABELS = {
  dnd5e: 'D&D 5e', coc: 'Call of Cthulhu', achtung: 'Achtung! Cthulhu',
  alien: 'ALIEN', coriolis: 'Coriolis', vaesen: 'Vaesen', mothership: 'Mothership',
}

function sysColor(sys) { return SYS_COLORS[sys] || '#888' }
function sysLabel(sys) { return SYS_LABELS[sys] || sys }
function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

async function apif(path, opts = {}) {
  const headers = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (campaign.activeCampaign?.id) headers['X-Campaign-Id'] = campaign.activeCampaign.id
  const r = await fetch(path, { ...opts, headers })
  if (r.status === 401) auth.logout?.()
  return r
}

async function loadCharacters() {
  loading.value = true
  try {
    const r = await apif('/api/characters')
    if (r.ok) {
      const d = await r.json()
      characters.value = d.characters || []
    }
  } finally {
    loading.value = false
  }
}

async function createCharacter() {
  createError.value = ''
  if (!form.value.name.trim()) { createError.value = 'Character name is required.'; return }
  creating.value = true
  try {
    const r = await apif('/api/characters', {
      method: 'POST',
      body: JSON.stringify({
        name: form.value.name.trim(),
        system: activeSys.value,
        campaign_id: campaign.activeCampaign?.id,
      }),
    })
    if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create') }
    const d = await r.json()
    showCreate.value = false
    form.value = { name: '' }
    ui.showToast(`Character "${d.character.name}" created!`, '', '✓')
    router.push(`/character-sheet?id=${d.character.id}`)
  } catch (e) {
    createError.value = e.message || 'Failed to create character'
  } finally {
    creating.value = false
  }
}

function openCharacter(c) {
  router.push(`/character-sheet?id=${c.id}`)
}

onMounted(loadCharacters)
</script>

<style scoped>
.char-tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding-bottom: 32px;
}

.char-tile {
  background: var(--card-bg, var(--surface));
  border: 1px solid var(--border);
  border-radius: var(--radius, 6px);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
}

.char-tile:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.char-tile-portrait {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--surface2, #2a2a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.char-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.char-portrait-placeholder {
  font-size: 2.5em;
  font-weight: 700;
  opacity: 0.2;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 2px;
}

.char-tile-info {
  padding: 12px 12px 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.char-tile-name {
  font-weight: 700;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.char-tile-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.char-tile-system {
  font-size: 0.68em;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid;
  border-radius: 3px;
  padding: 1px 5px;
  letter-spacing: 0.05em;
}

.char-tile-class {
  font-size: 0.78em;
  opacity: 0.6;
}

.char-tile-concept {
  font-size: 0.78em;
  opacity: 0.5;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.char-tile-player {
  padding: 4px 12px 8px;
  font-size: 0.7em;
  opacity: 0.4;
  font-family: 'JetBrains Mono', monospace;
}

/* New character tile */
.char-tile-new {
  min-height: 200px;
  border: 2px dashed var(--border);
  background: transparent;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.char-tile-new:hover {
  border-color: var(--accent);
  border-style: solid;
}

.char-tile-new-icon {
  font-size: 2em;
  opacity: 0.3;
  line-height: 1;
}

.char-tile-new-label {
  font-size: 0.8em;
  opacity: 0.4;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.1em;
}
</style>
