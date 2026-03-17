<template>
  <div class="page-content">
    <div class="page-header"><div class="page-title">Notes</div><div class="page-sub">Your journal</div></div>
    <div class="notes-layout">
      <!-- Notes list -->
      <div id="notes-list-col">
        <div class="search-row" style="margin-bottom:10px">
          <input v-model="search" class="form-input" placeholder="Search notes…" style="width:100%" />
        </div>
        <div class="filter-tabs" style="margin-bottom:10px">
          <button
            v-for="cat in categories"
            :key="cat"
            class="filter-tab"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat"
          >{{ cat }}</button>
        </div>

        <div class="msg-list">
          <div v-if="!filteredNotes.length" class="empty-state">No notes yet.</div>
          <div v-for="n in filteredNotes" :key="n.id" class="note-card" style="cursor:pointer" @click="selectNote(n)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
              <div class="note-card-title" style="flex:1">{{ n.title }}</div>
              <span v-if="selectedNote?.id === n.id" style="font-size:10px;color:var(--accent);font-family:'JetBrains Mono',monospace">editing</span>
            </div>
            <div class="card-meta" style="margin:3px 0 6px">
              <span :class="`tag tag-${n.privacy === 'public' ? 'active' : 'inactive'}`">{{ n.privacy }}</span>
              <span v-if="n.category" class="tag">{{ n.category }}</span>
              <span v-if="n.shared_with_gm" style="font-size:10px;color:var(--text3)">shared w/GM</span>
            </div>
            <div class="note-card-body">{{ (n.body || '').slice(0, 120) }}{{ (n.body || '').length > 120 ? '…' : '' }}</div>
            <div class="note-card-footer">
              <span style="font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace">{{ fmt(n.updated_at) }}</span>
              <button class="delete-btn" @click.stop="deleteNote(n.id)">DELETE</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Compose / Edit panel -->
      <div>
        <div class="note-composer">
          <div class="composer-title">{{ selectedNote ? 'EDIT NOTE' : 'NEW NOTE' }}</div>
          <div class="field-group"><label>Title</label><input v-model="form.title" type="text" placeholder="Session notes…" /></div>
          <div class="field-group">
            <label>Body</label>
            <MarkdownEditor v-model="form.body" min-height="160px" />
          </div>
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
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="submit-btn" @click="saveNote">{{ selectedNote ? 'UPDATE NOTE' : 'SAVE NOTE' }}</button>
            <button v-if="selectedNote" class="btn" @click="clearForm">Cancel</button>
          </div>
          <div v-if="status" :class="['status-msg', statusOk ? 'status-ok' : 'status-err']">{{ status }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const data = useDataStore()

const status = ref('')
const statusOk = ref(false)
const search = ref('')
const activeCategory = ref('All')
const selectedNote = ref(null)

const categories = ['All', 'Notes', 'Clues', 'Plans', 'Lore']

const form = reactive({ title: '', body: '', category: 'Notes', privacy: 'private', share_gm: false })

const filteredNotes = computed(() => {
  let list = data.notes
  if (activeCategory.value !== 'All') list = list.filter(n => n.category === activeCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.body?.toLowerCase().includes(q)
    )
  }
  return list
})

function fmt(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function selectNote(n) {
  selectedNote.value = n
  form.title = n.title || ''
  form.body = n.body || ''
  form.category = n.category || 'Notes'
  form.privacy = n.privacy || 'private'
  form.share_gm = !!n.shared_with_gm
  status.value = ''
}

function clearForm() {
  selectedNote.value = null
  form.title = ''
  form.body = ''
  form.category = 'Notes'
  form.privacy = 'private'
  form.share_gm = false
  status.value = ''
}

async function saveNote() {
  status.value = ''
  if (!form.title) { status.value = 'Title required.'; statusOk.value = false; return }
  const body = JSON.stringify({ title: form.title, body: form.body, category: form.category, privacy: form.privacy, shared_with_gm: form.share_gm })
  const r = selectedNote.value
    ? await data.apif(`/api/notes/${selectedNote.value.id}`, { method: 'PUT', body })
    : await data.apif('/api/notes', { method: 'POST', body })
  if (r.ok) {
    status.value = selectedNote.value ? 'Updated.' : 'Saved.'
    statusOk.value = true
    clearForm()
    await data.loadNotes()
  } else {
    const d = await r.json()
    status.value = d.error || 'Failed.'
    statusOk.value = false
  }
}

async function deleteNote(id) {
  if (!await ui.confirm('Delete?')) return
  if (selectedNote.value?.id === id) clearForm()
  const r = await data.apif(`/api/notes/${id}`, { method: 'DELETE' })
  if (r.ok) await data.loadNotes()
}

onMounted(async () => {
  if (!data.notes.length) await data.loadNotes()
})
</script>
