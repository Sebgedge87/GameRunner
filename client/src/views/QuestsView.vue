<template>
  <div class="page-content">
    <div class="page-header">
      <div class="page-title">Quests</div>
    </div>

    <div class="search-row" style="margin-bottom:12px">
      <input v-model="search" class="form-input" placeholder="Search quests…" style="max-width:320px" />
    </div>

    <div class="filter-tabs">
      <button
        v-for="tab in tabs" :key="tab.value"
        class="filter-tab" :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >{{ tab.label }}</button>
    </div>

    <div class="card-grid">
      <div v-if="campaign.isGm" class="add-tile" @click="ui.openGmEdit('quest', null, {})">
        <div class="add-tile-icon">+</div>
        <div class="add-tile-label">Add Quest</div>
      </div>

      <div
        v-for="quest in filteredQuests"
        :key="quest.id"
        class="card quest-card"
        :class="{ hidden: quest.hidden, 'quest-editing': editingId === quest.id }"
        @click="editingId !== quest.id && ui.openDetail('quest', quest)"
      >
        <!-- ── Body ── -->
        <div class="card-body" @click.stop="editingId === quest.id ? null : ui.openDetail('quest', quest)">

          <!-- Title row -->
          <div class="quest-header-row">
            <input
              v-if="editingId === quest.id"
              v-model="ef.title"
              class="edit-field-title"
              placeholder="Quest title…"
              @click.stop
            />
            <div v-else class="card-title">{{ quest.title }}</div>
          </div>

          <!-- Badges row -->
          <div class="quest-badges-row">
            <template v-if="editingId === quest.id">
              <select v-model="ef.quest_type" class="edit-badge-select" @click.stop>
                <option value="main">main</option>
                <option value="side">side</option>
                <option value="faction">faction</option>
                <option value="personal">personal</option>
              </select>
              <select v-model="ef.status" class="edit-badge-select" @click.stop>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="failed">failed</option>
                <option value="on-hold">on-hold</option>
              </select>
              <!-- Urgency picker -->
              <select v-model="ef.urgency" class="edit-badge-select edit-urgency-select" @click.stop>
                <option value="">⏳ No urgency</option>
                <option value="low">⏳ Low</option>
                <option value="medium">⏳ Medium</option>
                <option value="high">⏳ Urgent!</option>
              </select>
              <input v-model="ef.expires_in" class="edit-field-sm" placeholder="e.g. 3 sessions" @click.stop />
            </template>
            <template v-else>
              <span v-if="quest.quest_type" class="tag">{{ quest.quest_type }}</span>
              <span class="tag" :class="statusClass(quest.status)">{{ quest.status }}</span>
              <span v-if="quest.urgency || quest.expires_in" class="doom-clock" :class="urgencyClass(quest)" @click.stop>
                ⏳ <span v-if="quest.expires_in">{{ quest.expires_in }}</span>
                <span v-else-if="quest.urgency === 'high'">Urgent!</span>
                <span v-else-if="quest.urgency === 'medium'">Soon</span>
                <span v-else>Pending</span>
              </span>
            </template>
          </div>

          <!-- Description -->
          <div class="quest-desc-block" @click.stop>
            <textarea
              v-if="editingId === quest.id"
              v-model="ef.description"
              class="edit-field-textarea"
              rows="3"
              placeholder="Describe this quest…"
            ></textarea>
            <div v-else-if="quest.description" class="card-overview">{{ quest.description }}</div>
          </div>

          <!-- Progress bar (view only) -->
          <div v-if="editingId !== quest.id && quest.progress != null" class="progress-bar" style="margin-top:8px">
            <div class="progress-fill" :style="`width:${quest.progress}%`"></div>
          </div>

          <!-- Connections -->
          <div class="quest-connections" @click.stop>
            <template v-if="editingId === quest.id">
              <div class="connections-edit-label">Connections</div>
              <input v-model="ef.location" class="edit-field-sm" placeholder="📍 Location name…" style="margin-bottom:4px" />
              <input v-model="ef.connected_npcs" class="edit-field-sm" placeholder="👤 NPCs (comma-sep)…" style="margin-bottom:4px" />
              <input v-model="ef.connected_quests" class="edit-field-sm" placeholder="🔗 Linked quests (comma-sep)…" />
            </template>
            <template v-else>
              <div v-if="quest.location || quest.connected_npcs?.length || quest.connected_to?.length" class="connection-chips">
                <span v-if="quest.location" class="connection-chip" @click.stop="goToLocation(quest.location)">
                  📍 {{ quest.location }}
                </span>
                <span
                  v-for="npc in asList(quest.connected_npcs)"
                  :key="npc"
                  class="connection-chip"
                  @click.stop="goTo('/npcs')"
                >👤 {{ npc }}</span>
                <span
                  v-for="q in asList(quest.connected_to)"
                  :key="q"
                  class="connection-chip"
                  @click.stop
                >🔗 {{ q }}</span>
                <span v-if="quest.location" class="connection-chip connection-chip-muted" @click.stop="router.push('/mindmap')">
                  🧠 Mindmap
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- ── Reward Ribbon ── -->
        <div class="quest-reward-ribbon" @click.stop>
          <template v-if="editingId === quest.id">
            <div class="reward-edit-row">
              <label class="reward-edit-item">
                <span class="reward-icon">💰</span>
                <input v-model.number="ef.reward_gold" type="number" min="0" class="reward-input" placeholder="0 GP" />
              </label>
              <label class="reward-edit-item">
                <span class="reward-icon">🎖</span>
                <input v-model.number="ef.reward_xp" type="number" min="0" class="reward-input" placeholder="0 XP" />
              </label>
              <label class="reward-edit-item" style="flex:2">
                <span class="reward-icon">⚔️</span>
                <input v-model="ef.reward_items" class="reward-input" placeholder="Items…" />
              </label>
            </div>
          </template>
          <template v-else>
            <div v-if="quest.reward_gold || quest.reward_xp || quest.reward_items" class="reward-display">
              <span v-if="quest.reward_gold" class="reward-chip">💰 {{ quest.reward_gold }} GP</span>
              <span v-if="quest.reward_xp" class="reward-chip">🎖 {{ quest.reward_xp }} XP</span>
              <span v-if="quest.reward_items" class="reward-chip">⚔️ {{ quest.reward_items }}</span>
            </div>
            <div v-else-if="campaign.isGm" class="reward-empty" @click.stop="startEdit(quest)">
              <span>+ Add Reward</span>
            </div>
            <div v-else class="reward-empty-hint">No rewards listed</div>
          </template>
        </div>

        <!-- ── Actions ── -->
        <div class="card-actions" @click.stop>
          <template v-if="editingId === quest.id">
            <button class="btn btn-sm btn-primary" :disabled="saving" @click.stop="saveEdit(quest)">
              {{ saving ? '…' : 'Save' }}
            </button>
            <button class="btn btn-sm" @click.stop="cancelEdit">Cancel</button>
          </template>
          <template v-else>
            <button class="btn btn-sm" title="Pin" @click.stop="data.addPin('quest', quest.id, quest.title)">📌</button>
            <template v-if="campaign.isGm">
              <button class="btn btn-sm" :title="quest.hidden ? 'Reveal' : 'Hide'" @click.stop="toggleHidden('quest', quest.id)">
                {{ quest.hidden ? '👁' : '🙈' }}
              </button>
              <button class="btn btn-sm" title="Share" @click.stop="ui.openShare('quest', quest.id, quest.title)">🔗</button>
              <button class="btn btn-sm" title="Edit inline" @click.stop="startEdit(quest)">✏️</button>
              <button class="btn btn-sm btn-danger" title="Delete" @click.stop="deleteItem(quest.id)">🗑</button>
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

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

// Edit form state
const ef = reactive({
  title: '', description: '', status: 'active', quest_type: 'main',
  location: '', connected_npcs: '', connected_quests: '',
  reward_gold: '', reward_xp: '', reward_items: '',
  urgency: '', expires_in: '',
})

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

function urgencyClass(quest) {
  const u = quest.urgency?.toLowerCase()
  if (u === 'high') return 'doom-high'
  if (u === 'medium') return 'doom-medium'
  return 'doom-low'
}

function asList(val) {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  return String(val).split(',').map(s => s.trim()).filter(Boolean)
}

function goToLocation(name) {
  router.push('/locations')
}

function goTo(path) {
  router.push(path)
}

function startEdit(quest) {
  editingId.value = quest.id
  Object.assign(ef, {
    title: quest.title || '',
    description: quest.description || '',
    status: quest.status || 'active',
    quest_type: quest.quest_type || quest.type || 'main',
    location: quest.location || '',
    connected_npcs: asList(quest.connected_npcs).join(', '),
    connected_quests: asList(quest.connected_to).join(', '),
    reward_gold: quest.reward_gold ?? '',
    reward_xp: quest.reward_xp ?? '',
    reward_items: quest.reward_items || '',
    urgency: quest.urgency || '',
    expires_in: quest.expires_in || '',
  })
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit(quest) {
  saving.value = true
  try {
    const body = {
      title: ef.title,
      description: ef.description,
      status: ef.status,
      quest_type: ef.quest_type,
      location: ef.location || null,
      connected_npcs: ef.connected_npcs ? ef.connected_npcs.split(',').map(s => s.trim()).filter(Boolean) : [],
      connected_to: ef.connected_quests ? ef.connected_quests.split(',').map(s => s.trim()).filter(Boolean) : [],
      reward_gold: ef.reward_gold !== '' ? Number(ef.reward_gold) : null,
      reward_xp: ef.reward_xp !== '' ? Number(ef.reward_xp) : null,
      reward_items: ef.reward_items || null,
      urgency: ef.urgency || null,
      expires_in: ef.expires_in || null,
    }
    const r = await data.apif(`/api/quests/${quest.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    if (r.ok) {
      await data.loadQuests()
      editingId.value = null
      ui.showToast('Quest updated', '', '✓')
    } else {
      ui.showToast('Save failed', '', '✕')
    }
  } finally {
    saving.value = false
  }
}

async function toggleHidden(type, id) {
  await data.toggleHidden(type, id)
  await data.loadQuests()
}

async function deleteItem(id) {
  if (!await ui.confirm('Delete this quest?')) return
  await data.deleteItem('quest', id)
  await data.loadQuests()
}

onMounted(() => {
  if (!data.quests.length) data.loadQuests()
})
</script>
