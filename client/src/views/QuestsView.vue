<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Quests</div>
      <div v-if="campaign.isGm" class="page-header-actions">
        <button class="btn btn-sm" @click="ui.openGmEdit('quest', null, {})">+ New Quest</button>
      </div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search quests…" style="max-width:320px" />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div
        v-for="quest in filteredQuests"
        :key="quest.id"
        class="card quest-card"
        :class="{
          hidden: quest.hidden,
          'edit-mode': editingId === quest.id,
          [`urgency-${quest.urgency}`]: quest.urgency && quest.urgency !== 'none',
        }"
      >
        <!-- ── Header ─────────────────────────────── -->
        <div class="quest-card-header" @click="editingId !== quest.id && ui.openDetail('quest', quest)">
          <div class="quest-title-wrap">
            <span class="card-title">{{ quest.title }}</span>
            <div class="quest-badges">
              <span class="tag" :class="statusClass(quest.status)">{{ quest.status }}</span>
              <span v-if="quest.quest_type" class="tag">{{ quest.quest_type }}</span>
              <span
                v-if="quest.urgency && quest.urgency !== 'none'"
                class="doom-clock"
                :class="`doom-${quest.urgency}`"
                :title="quest.deadline ? `Deadline: ${quest.deadline}` : 'Time-sensitive'"
              >⏳{{ quest.deadline ? ' ' + quest.deadline : '' }}</span>
            </div>
          </div>
        </div>

        <!-- ── Description ───────────────────────── -->
        <div class="quest-description" @click.stop>
          <textarea
            v-if="editingId === quest.id"
            v-model="editDraft.description"
            class="inline-field"
            rows="3"
            placeholder="Quest description…"
          ></textarea>
          <div v-else class="card-overview" @click="editingId !== quest.id && ui.openDetail('quest', quest)">
            {{ quest.description || 'No description.' }}
          </div>
        </div>

        <!-- ── Urgency/Deadline (edit mode only) ─── -->
        <div v-if="editingId === quest.id" class="quest-inline-row" @click.stop>
          <div class="inline-field-group">
            <label class="inline-label">Urgency</label>
            <select v-model="editDraft.urgency" class="inline-select">
              <option value="none">None</option>
              <option value="low">Low (amber)</option>
              <option value="high">High — urgent (red)</option>
            </select>
          </div>
          <div class="inline-field-group">
            <label class="inline-label">Deadline</label>
            <input v-model="editDraft.deadline" class="inline-input" placeholder="e.g. 3 sessions / Day 14" />
          </div>
        </div>

        <!-- ── Entity Connections ─────────────────── -->
        <div
          v-if="editingId === quest.id || quest.connected_location || parseNpcs(quest.connected_npcs).length"
          class="quest-connections"
          @click.stop
        >
          <span class="conn-label">Involved</span>
          <template v-if="editingId === quest.id">
            <input v-model="editDraft.connected_location" class="inline-input" placeholder="📍 Location name" style="flex:1;min-width:120px" />
            <input v-model="editDraft.connected_npcs" class="inline-input" placeholder="🧑 NPC names, comma-separated" style="flex:2;min-width:160px" />
          </template>
          <template v-else>
            <button
              v-if="quest.connected_location"
              class="conn-badge"
              @click.stop="openEntityDetail('location', quest.connected_location)"
            >📍 {{ quest.connected_location }}</button>
            <button
              v-for="npc in parseNpcs(quest.connected_npcs)"
              :key="npc"
              class="conn-badge"
              @click.stop="openEntityDetail('npc', npc)"
            >🧑 {{ npc }}</button>
            <button
              v-if="quest.connected_location || parseNpcs(quest.connected_npcs).length"
              class="conn-badge conn-mindmap"
              @click.stop="$router.push('/mindmap')"
            >🧠 Mindmap</button>
          </template>
        </div>

        <!-- ── Reward Ribbon ──────────────────────── -->
        <div class="reward-ribbon" :class="{ 'has-reward': hasReward(quest), 'edit-mode': editingId === quest.id }" @click.stop>
          <template v-if="editingId === quest.id">
            <span class="reward-icon">💰</span>
            <input v-model="editDraft.reward_gold" class="reward-input" placeholder="Gold GP" />
            <span class="reward-icon">🎖️</span>
            <input v-model="editDraft.reward_xp" class="reward-input" placeholder="XP" />
            <span class="reward-icon">⚔️</span>
            <input v-model="editDraft.reward_items" class="reward-input" placeholder="Items (comma-sep)" style="flex:2" />
          </template>
          <template v-else-if="hasReward(quest)">
            <span v-if="quest.reward_gold" class="reward-pill">💰 {{ quest.reward_gold }} GP</span>
            <span v-if="quest.reward_xp" class="reward-pill">🎖️ +{{ quest.reward_xp }} XP</span>
            <span v-if="quest.reward_items" class="reward-pill">⚔️ {{ quest.reward_items }}</span>
          </template>
          <button v-else-if="campaign.isGm" class="reward-add" @click.stop="startEdit(quest)">
            + Add Reward
          </button>
          <span v-else class="reward-empty">No reward set</span>
        </div>

        <!-- ── GM Private Note (edit mode) ───────── -->
        <div v-if="editingId === quest.id" class="quest-gm-note" @click.stop>
          <span class="gm-note-label">🔒 GM Note</span>
          <textarea v-model="editDraft.gm_notes" class="inline-field" rows="2" placeholder="Private GM notes…"></textarea>
        </div>
        <div v-else-if="campaign.isGm && quest.gm_notes" class="quest-gm-note-preview" @click.stop>
          <span class="gm-note-label">🔒</span> {{ quest.gm_notes }}
        </div>

        <!-- ── Card Actions ───────────────────────── -->
        <div class="card-actions" @click.stop>
          <template v-if="editingId === quest.id">
            <button class="btn btn-sm btn-gold" :disabled="saving" @click.stop="saveInline">
              {{ saving ? '…' : '💾 Save' }}
            </button>
            <button class="btn btn-sm" @click.stop="cancelEdit">✕ Cancel</button>
            <span v-if="saveError" class="inline-error">{{ saveError }}</span>
          </template>
          <template v-else>
            <button class="btn btn-sm" title="Pin" @click="data.addPin('quest', quest.id, quest.title)">📌</button>
            <template v-if="campaign.isGm">
              <button class="btn btn-sm" title="Quick Edit" @click="startEdit(quest)">✏️</button>
              <button class="btn btn-sm" :title="quest.hidden ? 'Reveal' : 'Hide'" @click="toggleHidden('quest', quest.id)">
                {{ quest.hidden ? '👁' : '🙈' }}
              </button>
              <button class="btn btn-sm" title="Share" @click="ui.openShare('quest', quest.id, quest.title)">🔗</button>
              <button class="btn btn-sm" title="Full Edit" @click="ui.openGmEdit('quest', quest.id, quest)">⚙️</button>
              <button class="btn btn-sm btn-danger" title="Delete" @click="deleteItem('quest', quest.id)">🗑</button>
            </template>
          </template>
        </div>
      </div>
    </div>

    <div v-if="filteredQuests.length === 0" class="empty-state">No quests found.</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const campaign = useCampaignStore()
const ui = useUiStore()
const router = useRouter()

const search = ref('')
const activeTab = ref('all')
const editingId = ref(null)
const saving = ref(false)
const saveError = ref('')
const editDraft = reactive({
  description: '', status: 'active', quest_type: 'main',
  reward_gold: '', reward_xp: '', reward_items: '',
  urgency: 'none', deadline: '', gm_notes: '',
  connected_location: '', connected_npcs: '',
})

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const filteredQuests = computed(() => {
  let list = data.quests
  if (activeTab.value !== 'all') list = list.filter(q => q.status?.toLowerCase() === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(quest =>
      quest.title?.toLowerCase().includes(q) ||
      quest.quest_type?.toLowerCase().includes(q) ||
      quest.location?.toLowerCase().includes(q) ||
      quest.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function statusClass(status) {
  const s = status?.toLowerCase()
  if (s === 'active') return 'tag-active'
  if (s === 'completed') return 'tag-completed'
  if (s === 'failed') return 'tag-inactive'
  return ''
}

function hasReward(quest) {
  return quest.reward_gold || quest.reward_xp || quest.reward_items
}

function parseNpcs(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

function startEdit(quest) {
  editDraft.description = quest.description || ''
  editDraft.status = quest.status || 'active'
  editDraft.quest_type = quest.quest_type || 'main'
  editDraft.reward_gold = quest.reward_gold || ''
  editDraft.reward_xp = quest.reward_xp || ''
  editDraft.reward_items = quest.reward_items || ''
  editDraft.urgency = quest.urgency || 'none'
  editDraft.deadline = quest.deadline || ''
  editDraft.gm_notes = quest.gm_notes || ''
  editDraft.connected_location = quest.connected_location || ''
  editDraft.connected_npcs = quest.connected_npcs || ''
  editingId.value = quest.id
  saveError.value = ''
}

function cancelEdit() {
  editingId.value = null
  saveError.value = ''
}

async function saveInline() {
  saving.value = true
  saveError.value = ''
  try {
    const r = await data.apif(`/api/quests/${editingId.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        description: editDraft.description,
        reward_gold: editDraft.reward_gold || null,
        reward_xp: editDraft.reward_xp || null,
        reward_items: editDraft.reward_items || null,
        urgency: editDraft.urgency || 'none',
        deadline: editDraft.deadline || null,
        gm_notes: editDraft.gm_notes || null,
        connected_location: editDraft.connected_location || null,
        connected_npcs: editDraft.connected_npcs || null,
      }),
    })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      throw new Error(d.error || 'Save failed')
    }
    await data.loadQuests()
    editingId.value = null
    ui.showToast('Quest updated', '', '✏️')
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

function openEntityDetail(type, name) {
  const store = type === 'location' ? data.locations : data.npcs
  const entity = store?.find(e => (e.title || e.name)?.toLowerCase() === name?.toLowerCase())
  if (entity) ui.openDetail(type, entity)
  else ui.showToast(`${name} not found`, '', '🔍')
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadQuests()
}

async function deleteItem(type, id) {
  if (!await ui.confirm('Delete this quest?')) return
  await data.deleteItem(type, id)
  await data.loadQuests()
}

onMounted(() => {
  if (!data.quests.length) data.loadQuests()
})
</script>
