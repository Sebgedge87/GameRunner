<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Notes</div><div class="page-sub">Your journal</div></div>
    <div class="notes-layout">
      <!-- Notes list -->
      <div id="notes-list-col">
        <div class="msg-list">
          <div v-if="!data.notes.length" class="empty-state">No notes yet.</div>
          <div v-for="n in data.notes" :key="n.id" class="note-card">
            <div class="note-card-title">{{ n.title }}</div>
            <div class="card-meta" style="margin:3px 0 6px">
              <span :class="`tag tag-${n.privacy === 'public' ? 'active' : 'inactive'}`">{{ n.privacy }}</span>
              <span>{{ n.category }}</span>
              <span v-if="n.shared_with_gm">shared w/GM</span>
            </div>
            <div class="note-card-body">{{ (n.body || '').slice(0, 120) }}{{ (n.body || '').length > 120 ? '…' : '' }}</div>
            <div class="note-card-footer">
              <span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace">{{ fmt(n.updated_at) }}</span>
              <button class="delete-btn" @click="deleteNote(n.id)">DELETE</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Compose -->
      <div>
        <div class="note-composer">
          <div class="composer-title">NEW NOTE</div>
          <div class="field-group"><label>Title</label><input v-model="form.title" type="text" placeholder="Session notes…" /></div>
          <div class="field-group"><label>Body</label><textarea v-model="form.body"></textarea></div>
          <div class="field-group"><label>Category</label>
            <select v-model="form.category">
              <option>Notes</option><option>Clues</option><option>Plans</option><option>Lore</option>
            </select>
          </div>
          <div class="field-group"><label>Privacy</label>
            <select v-model="form.privacy">
              <option value="private">Private</option><option value="public">Public</option>
            </select>
          </div>
          <div class="check-row">
            <input type="checkbox" v-model="form.share_gm" id="note-share-gm" />
            <label for="note-share-gm">Share with GM</label>
          </div>
          <button class="submit-btn" @click="createNote">SAVE NOTE</button>
          <div v-if="status" :class="['status-msg', statusOk ? 'status-ok' : 'status-err']">{{ status }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { useUiStore } from '@/stores/ui'

const data = useDataStore()
const ui = useUiStore()

const status = ref('')
const statusOk = ref(false)
const form = reactive({ title: '', body: '', category: 'Notes', privacy: 'private', share_gm: false })

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

async function createNote() {
  status.value = ''
  if (!form.title) { status.value = 'Title required.'; statusOk.value = false; return }
  const r = await data.apif('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title: form.title, body: form.body, category: form.category, privacy: form.privacy, shared_with_gm: form.share_gm }),
  })
  if (r.ok) {
    status.value = 'Saved.'
    statusOk.value = true
    form.title = ''
    form.body = ''
    await data.loadNotes()
  } else {
    const d = await r.json()
    status.value = d.error || 'Failed.'
    statusOk.value = false
  }
}

async function deleteNote(id) {
  if (!confirm('Delete?')) return
  const r = await data.apif(`/api/notes/${id}`, { method: 'DELETE' })
  if (r.ok) await data.loadNotes()
}

onMounted(async () => {
  if (!data.notes.length) await data.loadNotes()
})
</script>
