<template>
  <div v-if="ui.shareModal" class="modal-overlay open" @click.self="ui.closeShare()">
    <div class="modal" style="max-width:440px">
      <div class="modal-title">Share "{{ ui.shareModal.title }}"</div>

      <div v-if="loading" class="loading" style="padding:20px">Loading players…</div>

      <template v-else>
        <div style="font-size:0.82em;opacity:0.6;margin-bottom:12px">
          Select players to share this item with. Hold Ctrl/Cmd to select multiple.
        </div>

        <div style="margin-bottom:16px">
          <label style="font-size:0.75em;letter-spacing:1px;color:var(--text3);font-family:var(--font-sans);display:block;margin-bottom:6px">Players</label>
          <select
            v-model="selectedIds"
            multiple
            class="form-input"
            style="min-height:140px"
          >
            <option v-for="u in players" :key="u.id" :value="u.id">
              {{ u.username }}{{ u.character_name ? ` (${u.character_name})` : '' }}
            </option>
          </select>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn" @click="ui.closeShare()">Cancel</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save Sharing' }}
          </button>
        </div>

        <div v-if="status" :class="['status-msg', statusOk ? 'status-ok' : 'status-err']" style="margin-top:8px">{{ status }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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
      ui.showToast('Sharing updated', '', '✓')
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
