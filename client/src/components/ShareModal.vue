<template>
  <div v-if="ui.shareModal" class="modal-overlay open" @click.self="ui.closeShare()">
    <div class="modal" style="max-width:440px">
      <div class="modal-title">Share "{{ ui.shareModal.title }}"</div>

      <div v-if="loading" class="loading" style="padding:20px">Loading players…</div>

      <template v-else>
        <!-- Currently shared with -->
        <div style="margin-bottom:16px">
          <div style="font-size:0.75em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);margin-bottom:6px;text-transform:uppercase">
            Currently shared with
          </div>
          <div v-if="sharedWithNames.length" style="display:flex;flex-wrap:wrap;gap:6px">
            <span
              v-for="name in sharedWithNames" :key="name"
              class="tag tag-active"
              style="font-size:0.82em"
            >{{ name }}</span>
          </div>
          <div v-else style="font-size:0.82em;color:var(--text3);font-style:italic">
            Not shared with anyone yet
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label style="font-size:0.75em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);text-transform:uppercase">Players</label>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm" @click="selectedIds = players.map(u => u.id)">All</button>
              <button class="btn btn-sm" @click="selectedIds = []">None</button>
            </div>
          </div>
          <select
            v-model="selectedIds"
            multiple
            class="form-input"
            style="min-height:120px"
          >
            <option v-for="u in players" :key="u.id" :value="u.id">
              {{ u.character_name || u.username }}{{ u.username !== (u.character_name || u.username) ? ` (${u.username})` : '' }}
            </option>
          </select>
          <div style="font-size:0.78em;color:var(--text3);margin-top:4px">Hold Ctrl/Cmd to select multiple</div>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="ui.closeShare()">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
        </div>

        <div v-if="status" :class="['status-msg', statusOk ? 'status-ok' : 'status-err']" style="margin-top:8px">{{ status }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useDataStore } from '@/stores/data'

const ui = useUiStore()
const data = useDataStore()

const loading = ref(false)
const saving = ref(false)
const status = ref('')
const statusOk = ref(false)
const players = ref([])
const selectedIds = ref([])

const sharedWithNames = computed(() =>
  players.value
    .filter(u => selectedIds.value.includes(u.id))
    .map(u => u.character_name || u.username)
)

watch(() => ui.shareModal, async (val) => {
  if (!val) return
  status.value = ''
  loading.value = true
  try {
    const [uR, sR] = await Promise.all([
      data.apif('/api/users'),
      data.apif(`/api/shares/${val.itemType}/${val.itemId}`),
    ])
    const allUsers = (await uR.json()).users || []
    players.value = allUsers.filter(u => u.role !== 'gm')
    const sharedIds = (await sR.json()).user_ids || []
    selectedIds.value = sharedIds
  } catch (e) {
    status.value = 'Failed to load'
    statusOk.value = false
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  status.value = ''
  try {
    const r = await data.apif('/api/shares', {
      method: 'POST',
      body: JSON.stringify({
        item_type: ui.shareModal.itemType,
        item_id: ui.shareModal.itemId,
        user_ids: selectedIds.value,
      }),
    })
    if (r.ok) {
      ui.showToast('Sharing updated', sharedWithNames.value.join(', ') || 'Cleared', '✓')
      ui.closeShare()
    } else {
      status.value = 'Save failed'
      statusOk.value = false
    }
  } finally {
    saving.value = false
  }
}
</script>
