<template>
  <div v-if="ui.gmEditModal" class="modal-overlay open" @click.self="ui.closeGmEdit()">
    <div class="modal" :style="{ maxWidth: type === 'bestiary' ? '680px' : '520px' }">
      <div class="modal-title">{{ title }}</div>
      <div class="gm-modal-body">
        <!-- Quest -->
        <template v-if="type === 'quest'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="4"></textarea></div>
          <div class="form-group"><label>Status</label>
            <select v-model="f.status" class="form-input">
              <option>active</option><option>completed</option><option>failed</option><option>hidden</option>
            </select>
          </div>
          <div class="form-group"><label>Type</label>
            <select v-model="f.quest_type" class="form-input">
              <option>main</option><option>side</option><option>personal</option>
            </select>
          </div>
        </template>

        <!-- NPC -->
        <template v-else-if="type === 'npc'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Role / Occupation</label><input v-model="f.role" class="form-input" placeholder="Innkeeper, guard..." /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Notes (GM only)</label><textarea v-model="f.gm_notes" class="form-input" rows="2"></textarea></div>
          <div class="form-group"><label>Image</label><input type="file" ref="imgInput" class="form-input" accept="image/*" /></div>
        </template>

        <!-- Location -->
        <template v-else-if="type === 'location'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="4"></textarea></div>
          <div class="form-group"><label>Image</label><input type="file" ref="imgInput" class="form-input" accept="image/*" /></div>
        </template>

        <!-- Hook -->
        <template v-else-if="type === 'hook'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Status</label>
            <select v-model="f.status" class="form-input">
              <option>active</option><option>resolved</option><option>hidden</option>
            </select>
          </div>
        </template>

        <!-- Handout -->
        <template v-else-if="type === 'handout'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Content</label><textarea v-model="f.content" class="form-input" rows="5"></textarea></div>
          <div class="form-group"><label>Target Player</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">All Players</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group"><label>Image</label><input type="file" ref="imgInput" class="form-input" accept="image/*" /></div>
        </template>

        <!-- Session -->
        <template v-else-if="type === 'session'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Summary</label><textarea v-model="f.description" class="form-input" rows="4"></textarea></div>
          <div class="form-group"><label>Session Date</label><input v-model="f.date" class="form-input" type="date" /></div>
        </template>

        <!-- Map -->
        <template v-else-if="type === 'map'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Type</label>
            <select v-model="f.map_type" class="form-input">
              <option value="world">World</option><option value="region">Region</option>
              <option value="city">City</option><option value="dungeon">Dungeon</option><option value="encounter">Encounter</option>
            </select>
          </div>
          <div class="form-group"><label>Map Image</label><input type="file" ref="imgInput" class="form-input" accept="image/*" /></div>
        </template>

        <!-- Faction -->
        <template v-else-if="type === 'faction'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Goals</label><textarea v-model="f.goals" class="form-input" rows="2" placeholder="What does this faction want?"></textarea></div>
          <div class="form-group"><label>Known Members</label><input v-model="f.known_members" class="form-input" placeholder="Comma-separated names" /></div>
        </template>

        <!-- Timeline -->
        <template v-else-if="type === 'timeline'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" /></div>
          <div class="form-group"><label>In-World Date</label><input v-model="f.in_world_date" class="form-input" placeholder="Day 14, Year 1502…" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Linked Quest (optional)</label><input v-model="f.linked_quest" class="form-input" /></div>
        </template>

        <!-- Inventory -->
        <template v-else-if="type === 'inventory'">
          <div class="form-group"><label>Item Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Quantity</label><input v-model.number="f.quantity" class="form-input" type="number" min="0" /></div>
          <div class="form-group"><label>Holder</label><input v-model="f.holder" class="form-input" placeholder="party, character name…" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="2"></textarea></div>
        </template>

        <!-- Key Item -->
        <template v-else-if="type === 'key-item'">
          <div class="form-group"><label>Name</label><input v-model="f.name" class="form-input" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Significance</label><textarea v-model="f.significance" class="form-input" rows="2" placeholder="Why is this important?"></textarea></div>
          <div class="form-group"><label>Linked Quest</label><input v-model="f.linked_quest" class="form-input" /></div>
          <div class="form-group"><label>Image</label><input type="file" ref="imgInput" class="form-input" accept="image/*" /></div>
        </template>

        <!-- Job -->
        <template v-else-if="type === 'job'">
          <div class="form-group"><label>Title</label><input v-model="f.title" class="form-input" placeholder="Escort the merchant…" /></div>
          <div class="form-group"><label>Description</label><textarea v-model="f.description" class="form-input" rows="3"></textarea></div>
          <div class="form-group"><label>Reward</label><input v-model="f.reward" class="form-input" placeholder="500gp, favour, item…" /></div>
          <div class="form-group"><label>Difficulty</label>
            <select v-model="f.difficulty" class="form-input">
              <option>easy</option><option>medium</option><option>hard</option><option>deadly</option>
            </select>
          </div>
          <div class="form-group"><label>Posted By (NPC)</label><input v-model="f.posted_by" class="form-input" /></div>
          <div class="form-group"><label>Location</label><input v-model="f.location" class="form-input" /></div>
        </template>

        <!-- Bestiary -->
        <template v-else-if="type === 'bestiary'">
          <!-- ── Header: Portrait + Creature Name ── -->
          <div class="bst-header">
            <div class="bst-portrait-col">
              <div class="bst-avatar" :style="portraitPreview ? `background-image:url(${portraitPreview})` : ''">
                <span v-if="!portraitPreview" class="bst-avatar-icon">🐉</span>
              </div>
              <label class="btn btn-sm bst-upload-btn">
                Upload Portrait
                <input type="file" ref="imgInput" accept="image/*" style="display:none" @change="onPortraitChange" />
              </label>
            </div>
            <div class="bst-name-col">
              <label class="bst-label">Creature Name</label>
              <input v-model="f.name" class="form-input bst-name-input" placeholder="e.g. Ancient Red Dragon…" />
            </div>
          </div>

          <!-- ── Main Body: Stat Block + Description ── -->
          <div class="bst-body">
            <div class="bst-stat-block">
              <div class="bst-stat-title">Stat Block</div>
              <div class="form-group">
                <label class="bst-label">CR</label>
                <input v-model.number="f.cr" class="form-input bst-stat-input" type="number" step="0.25" min="0" placeholder="—" />
              </div>
              <div class="form-group">
                <label class="bst-label">AC</label>
                <input v-model.number="f.ac" class="form-input bst-stat-input" type="number" min="0" placeholder="—" />
              </div>
              <div class="form-group">
                <label class="bst-label">HP</label>
                <input v-model.number="f.hp" class="form-input bst-stat-input" type="number" min="0" placeholder="—" />
              </div>
            </div>
            <div class="bst-desc-col">
              <label class="bst-label">Description</label>
              <textarea v-model="f.description" class="form-input bst-desc-area" rows="7"
                placeholder="Describe this creature's appearance, behaviour, and lore…"></textarea>
            </div>
          </div>

          <!-- ── Player Notes ── -->
          <div class="form-group bst-player-notes">
            <label class="bst-label">Player Notes</label>
            <textarea v-model="f.player_notes" class="form-input" rows="3"
              placeholder="Notes visible to all players in the campaign…"></textarea>
          </div>

          <!-- ── DM Private Notes (GM only) ── -->
          <div class="bst-gm-notes">
            <div class="bst-gm-notes-hdr">
              <span class="bst-gm-badge">🔒 GM Only</span>
              <span class="bst-gm-notes-title">Private Notes</span>
            </div>
            <textarea v-model="f.gm_notes" class="form-input bst-gm-textarea" rows="3"
              placeholder="Secret information, hidden motivations, encounter tactics… not visible to players."></textarea>
          </div>
        </template>

        <!-- Rumour -->
        <template v-else-if="type === 'rumour'">
          <div class="form-group"><label>Rumour Text</label><textarea v-model="f.text" class="form-input" rows="3" placeholder="They say the blacksmith…"></textarea></div>
          <div class="form-group"><label>Source NPC</label><input v-model="f.source_npc" class="form-input" /></div>
          <div class="form-group"><label>Source Location</label><input v-model="f.source_location" class="form-input" /></div>
          <div class="form-group"><label>Is True?</label>
            <select v-model="f.is_true" class="form-input">
              <option :value="true">True</option>
              <option :value="false">False</option>
            </select>
          </div>
        </template>

        <!-- Poll -->
        <template v-else-if="type === 'poll'">
          <div class="form-group"><label>Question</label><input v-model="f.question" class="form-input" placeholder="Which day works best?" /></div>
          <div class="form-group"><label>Options (one per line)</label><textarea v-model="f.options_text" class="form-input" rows="5" placeholder="Saturday evening&#10;Sunday afternoon"></textarea></div>
          <div class="form-group"><label>Results visible to players?</label>
            <select v-model="f.results_public" class="form-input">
              <option :value="0">Hidden until you reveal</option>
              <option :value="1">Visible immediately</option>
            </select>
          </div>
        </template>

        <!-- Schedule -->
        <template v-else-if="type === 'schedule'">
          <div class="form-group"><label>Proposed Date &amp; Time</label><input v-model="f.proposed_date" class="form-input" type="datetime-local" /></div>
          <div class="form-group"><label>Label (optional)</label><input v-model="f.title" class="form-input" placeholder="Session 14 — The Vault…" /></div>
        </template>

        <!-- Agenda -->
        <template v-else-if="type === 'agenda'">
          <div class="form-group"><label>Player</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">Select player…</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group"><label>Agenda Title</label><input v-model="f.title" class="form-input" placeholder="Session objective…" /></div>
          <div class="form-group"><label>Body / Details</label><textarea v-model="f.content" class="form-input" rows="5"></textarea></div>
        </template>

        <!-- Message -->
        <template v-else-if="type === 'message'">
          <div class="form-group"><label>To</label>
            <select v-model="f.user_id" class="form-input">
              <option value="">All Players</option>
              <option v-for="u in players" :key="u.id" :value="u.id">{{ u.username }}</option>
            </select>
          </div>
          <div class="form-group"><label>Subject</label><input v-model="f.subject" class="form-input" /></div>
          <div class="form-group"><label>Message</label><textarea v-model="f.content" class="form-input" rows="5"></textarea></div>
        </template>

        <!-- Fallback -->
        <template v-else>
          <div class="empty-state" style="padding:12px">No form for type: {{ type }}</div>
        </template>
      </div>

      <div v-if="saveError" class="status-msg status-err" style="margin-bottom:8px">{{ saveError }}</div>

      <div class="modal-actions">
        <button class="modal-close" @click="ui.closeGmEdit()">CANCEL</button>
        <button class="submit-btn" @click="save" :disabled="saving">
          {{ saving ? 'SAVING…' : (isEdit ? 'UPDATE' : 'CREATE') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const ui = useUiStore()
const data = useDataStore()

const imgInput = ref(null)
const saving = ref(false)
const saveError = ref('')
const portraitPreview = ref('')

function onPortraitChange(e) {
  const file = e.target.files?.[0]
  if (file) portraitPreview.value = URL.createObjectURL(file)
}

const f = reactive({
  title: '', name: '', description: '', status: 'active', quest_type: 'main',
  role: '', gm_notes: '', player_notes: '', goals: '', known_members: '', date: '', in_world_date: '',
  linked_quest: '', quantity: 1, holder: 'party', significance: '', reward: '',
  difficulty: 'medium', posted_by: '', location: '', text: '', source_npc: '',
  source_location: '', is_true: true, cr: null, ac: null, hp: null, map_type: 'world',
  content: '', user_id: '', subject: '', question: '', options_text: '',
  results_public: 0, proposed_date: '', subtitle: '',
})

const type = computed(() => ui.gmEditModal?.type || '')
const isEdit = computed(() => !!ui.gmEditModal?.id)
const title = computed(() => {
  const t = type.value
  const cap = t.charAt(0).toUpperCase() + t.slice(1)
  return isEdit.value ? `Edit ${cap}` : `Create ${cap}`
})

const players = computed(() => data.users.filter(u => u.role !== 'gm'))

const TYPE_ENDPOINT = {
  quest: '/api/quests', npc: '/api/npcs', location: '/api/locations',
  hook: '/api/hooks', handout: '/api/handouts', map: '/api/maps',
  session: '/api/sessions', faction: '/api/factions', timeline: '/api/timeline',
  inventory: '/api/inventory', 'key-item': '/api/key-items', job: '/api/jobs',
  bestiary: '/api/bestiary', rumour: '/api/rumours', agenda: '/api/agenda',
  poll: '/api/sessions/polls', schedule: '/api/sessions/scheduling', message: '/api/messages',
}

const TYPE_RELOAD = {
  quest: () => data.loadQuests(), npc: () => data.loadNpcs(),
  location: () => data.loadLocations(), hook: () => data.loadHooks(),
  faction: () => data.loadFactions(), timeline: () => data.loadTimeline(),
  inventory: () => data.loadInventory(), 'key-item': () => data.loadInventory(),
  job: () => data.loadJobs(), bestiary: () => data.loadBestiary(),
  rumour: () => data.loadRumours(), map: () => data.loadMaps(),
  handout: () => data.loadHandouts(), session: () => data.loadSessions(),
  poll: () => data.loadSessions(), schedule: () => data.loadSessions(),
  agenda: () => data.loadAgenda(), message: () => data.loadMessages(),
  notes: () => data.loadNotes(),
}

// Prefill form when editing
watch(() => ui.gmEditModal, (modal) => {
  if (!modal) return
  // Reset
  Object.keys(f).forEach(k => {
    if (typeof f[k] === 'number') f[k] = 0
    else if (typeof f[k] === 'boolean') f[k] = false
    else f[k] = ''
  })
  portraitPreview.value = ''
  f.status = 'active'; f.quest_type = 'main'; f.difficulty = 'medium'
  f.quantity = 1; f.holder = 'party'; f.map_type = 'world'; f.is_true = true
  f.results_public = 0
  if (!modal.data) return
  const d = modal.data
  f.title = d.title || ''
  f.name = d.name || d.title || ''
  f.description = d.description || ''
  f.status = d.status || 'active'
  f.quest_type = d.quest_type || d.type || 'main'
  f.role = d.role || ''
  f.gm_notes = d.gm_notes || ''
  f.goals = d.goals || ''
  f.known_members = d.known_members || ''
  f.date = d.session_date || d.in_world_date || ''
  f.in_world_date = d.in_world_date || ''
  f.linked_quest = d.linked_quest || ''
  f.quantity = d.quantity || 1
  f.holder = d.holder || 'party'
  f.significance = d.significance || ''
  f.reward = d.reward || ''
  f.difficulty = d.difficulty || 'medium'
  f.posted_by = d.posted_by || ''
  f.location = d.location || d.source_location || ''
  f.text = d.text || ''
  f.source_npc = d.source_npc || ''
  f.source_location = d.source_location || ''
  f.is_true = d.is_true !== undefined ? d.is_true : true
  f.cr = d.stats?.cr ?? null
  f.ac = d.stats?.ac ?? null
  f.hp = d.stats?.hp ?? null
  f.player_notes = d.player_notes || ''
  if (modal.type === 'bestiary') portraitPreview.value = d.image_path || d.image_url || ''
  f.map_type = d.map_type || 'world'
  f.content = d.body || d.content || ''
  f.subject = d.subject || ''
  if (type.value === 'session') {
    f.date = d.played_at ? d.played_at.slice(0, 10) : ''
  }
}, { immediate: true })

async function uploadImage() {
  const input = imgInput.value
  if (!input || !input.files || !input.files[0]) return null
  const fd = new FormData()
  fd.append('file', input.files[0])
  const token = localStorage.getItem('chronicle_token')
  const r = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
  if (r.ok) { const d = await r.json(); return d.url || d.path || null }
  return null
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    const t = type.value
    let imageUrl = null
    if (imgInput.value?.files?.[0]) imageUrl = await uploadImage()

    const endpoint = TYPE_ENDPOINT[t]
    if (!endpoint) throw new Error('Unknown type')

    let body = {}
    switch (t) {
      case 'quest':
        body = { title: f.title, description: f.description, status: f.status, quest_type: f.quest_type }; break
      case 'npc':
        body = { name: f.name, role: f.role, description: f.description, gm_notes: f.gm_notes }
        if (imageUrl) body.image_url = imageUrl
        break
      case 'location':
        body = { name: f.name, description: f.description }
        if (imageUrl) body.image_url = imageUrl
        break
      case 'hook':
        body = { title: f.title, description: f.description, status: f.status }; break
      case 'handout':
        body = { title: f.title, body: f.content, file_path: imageUrl || null, file_type: imageUrl ? 'image' : 'text', share_with: f.user_id ? [Number(f.user_id)] : [] }; break
      case 'session':
        body = { title: f.title, summary: f.description, session_date: f.date }; break
      case 'map':
        body = { title: f.title, description: f.description, map_type: f.map_type }
        if (imageUrl) body.image_path = imageUrl
        else if (!isEdit.value) throw new Error('Map image is required')
        break
      case 'faction':
        body = { name: f.name, description: f.description, goals: f.goals, known_members: f.known_members }; break
      case 'timeline':
        body = { title: f.title, description: f.description, in_world_date: f.in_world_date, linked_quest: f.linked_quest || null }; break
      case 'inventory':
        body = { name: f.name, quantity: f.quantity || 1, holder: f.holder || 'party', description: f.description }; break
      case 'key-item':
        body = { name: f.name, description: f.description, significance: f.significance, linked_quest: f.linked_quest || null, image_path: imageUrl }; break
      case 'job':
        body = { title: f.title, description: f.description, reward: f.reward, difficulty: f.difficulty || 'medium', posted_by: f.posted_by, location: f.location }; break
      case 'bestiary':
        body = { name: f.name, description: f.description, stats: { cr: f.cr, ac: f.ac, hp: f.hp }, player_notes: f.player_notes, gm_notes: f.gm_notes, image_path: imageUrl }; break
      case 'rumour':
        body = { text: f.text, source_npc: f.source_npc, source_location: f.source_location, is_true: f.is_true }; break
      case 'agenda':
        if (!f.user_id) throw new Error('Select a player')
        body = { user_id: f.user_id, title: f.title, body: f.content }; break
      case 'poll': {
        const opts = (f.options_text || '').split('\n').map(o => o.trim()).filter(Boolean)
        if (!opts.length) throw new Error('Add at least one option')
        body = { question: f.question, options: opts, results_public: Number(f.results_public || 0) }; break
      }
      case 'schedule':
        body = { proposed_date: f.proposed_date, title: f.title || undefined }; break
      case 'message':
        body = { to_user_id: f.user_id ? Number(f.user_id) : null, subject: f.subject || 'Message', body: f.content }; break
      default:
        throw new Error(`Unknown type: ${t}`)
    }

    const id = ui.gmEditModal.id
    const url = isEdit.value ? `${endpoint}/${id}` : endpoint
    const method = isEdit.value ? 'PUT' : 'POST'
    const r = await data.apif(url, { method, body: JSON.stringify(body) })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      throw new Error(d.error || 'Save failed')
    }

    ui.showToast(`${t.charAt(0).toUpperCase() + t.slice(1)} ${isEdit.value ? 'updated' : 'created'}`, '', '✓')
    TYPE_RELOAD[t]?.()
    ui.closeGmEdit()
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Bestiary Form ───────────────────────────────────────────────────────── */
.bst-label {
  display: block;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text3);
  margin-bottom: 5px;
}

/* Header row: portrait left, name right */
.bst-header {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.bst-portrait-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bst-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px solid var(--border2);
  background: var(--bg3) center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color .2s;
}
.bst-avatar:hover { border-color: var(--gold); }
.bst-avatar-icon { font-size: 34px; opacity: .5; }

.bst-upload-btn {
  font-size: 10px;
  letter-spacing: .04em;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 4px;
  color: var(--text2);
  transition: border-color .15s, color .15s;
}
.bst-upload-btn:hover { border-color: var(--gold); color: var(--gold2); }

.bst-name-col { display: flex; flex-direction: column; justify-content: center; }

.bst-name-input {
  font-family: 'Cinzel', serif !important;
  font-size: 20px !important;
  font-weight: 600;
  color: var(--text) !important;
  letter-spacing: .03em;
  height: 52px;
  padding: 0 14px;
}
.bst-name-input:focus { border-color: var(--gold) !important; box-shadow: 0 0 0 2px rgba(201,168,76,.18); }

/* Main body: stat block left, description right */
.bst-body {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 18px;
  margin-bottom: 14px;
}

.bst-stat-block {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bst-stat-title {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  color: var(--gold);
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 6px;
}

.bst-stat-input {
  text-align: center;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 16px !important;
  font-weight: 700;
  color: var(--gold2) !important;
  padding: 6px 8px;
  height: auto;
}
.bst-stat-input:focus { border-color: var(--gold) !important; }

.bst-desc-col { display: flex; flex-direction: column; }

.bst-desc-area {
  flex: 1;
  resize: vertical;
  min-height: 160px;
  line-height: 1.65;
}

/* Player notes */
.bst-player-notes { margin-bottom: 4px; }

/* DM Private Notes */
.bst-gm-notes {
  background: rgba(180, 40, 40, .07);
  border: 1px solid rgba(201, 76, 76, .35);
  border-radius: 6px;
  padding: 14px;
  margin-top: 8px;
}

.bst-gm-notes-hdr {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.bst-gm-badge {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--red);
  background: rgba(201, 76, 76, .14);
  border: 1px solid rgba(201, 76, 76, .35);
  padding: 2px 8px;
  border-radius: 3px;
}

.bst-gm-notes-title {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  color: var(--red);
  letter-spacing: .05em;
}

.bst-gm-textarea { resize: vertical; }
.bst-gm-textarea:focus { border-color: var(--red) !important; box-shadow: 0 0 0 2px rgba(201, 76, 76, .15); }

/* Tablet/mobile: stack header and body vertically */
@media (max-width: 560px) {
  .bst-header { grid-template-columns: 1fr; }
  .bst-portrait-col { flex-direction: row; gap: 12px; align-items: center; }
  .bst-body { grid-template-columns: 1fr; }
  .bst-stat-block { flex-direction: row; flex-wrap: wrap; gap: 12px; }
  .bst-stat-block .form-group { flex: 1; min-width: 60px; }
}
</style>
