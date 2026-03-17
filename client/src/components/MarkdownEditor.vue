<template>
  <div class="md-editor-wrap">
    <!-- Toolbar -->
    <div class="md-toolbar">
      <button type="button" class="md-btn" title="Bold" @mousedown.prevent="insert('**','**')"><b>B</b></button>
      <button type="button" class="md-btn" title="Italic" @mousedown.prevent="insert('_','_')"><i>I</i></button>
      <button type="button" class="md-btn" title="Heading 2" @mousedown.prevent="insertLine('## ')">H2</button>
      <button type="button" class="md-btn" title="Heading 3" @mousedown.prevent="insertLine('### ')">H3</button>
      <button type="button" class="md-btn" title="Bullet list" @mousedown.prevent="insertLine('- ')">•</button>
      <button type="button" class="md-btn" title="To-do" @mousedown.prevent="insertLine('- [ ] ')">☐</button>
      <button type="button" class="md-btn" title="Blockquote" @mousedown.prevent="insertLine('> ')">❝</button>
      <button type="button" class="md-btn" title="Inline code" @mousedown.prevent="insert('`','`')">&lt;/&gt;</button>
      <button type="button" class="md-btn" title="Divider" @mousedown.prevent="insertLine('---\n')">—</button>
      <div class="md-toolbar-spacer"></div>
      <button type="button" class="md-btn" :class="{ active: preview }" @mousedown.prevent="preview = !preview">
        {{ preview ? 'Edit' : 'Preview' }}
      </button>
    </div>

    <!-- Edit mode -->
    <textarea
      v-if="!preview"
      ref="taEl"
      class="form-input md-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :style="{ minHeight: minHeight }"
      @input="onInput"
      @keydown="onKeydown"
    ></textarea>

    <!-- Preview mode -->
    <div
      v-else
      class="md-preview"
      :style="{ minHeight: minHeight }"
      v-html="rendered"
    ></div>

    <!-- Slash command menu -->
    <div
      v-if="slashOpen"
      ref="slashMenu"
      class="slash-menu"
      :style="{ top: slashPos.top + 'px', left: slashPos.left + 'px' }"
    >
      <div
        v-for="(cmd, idx) in slashFiltered"
        :key="cmd.key"
        class="slash-item"
        :class="{ active: idx === slashIdx }"
        @mousedown.prevent="applySlash(cmd)"
      >
        <span class="slash-icon">{{ cmd.icon }}</span>{{ cmd.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write something… (type / for commands)' },
  minHeight: { type: String, default: '140px' },
})
const emit = defineEmits(['update:modelValue'])

const taEl = ref(null)
const slashMenu = ref(null)
const preview = ref(false)

// Slash command state
const slashOpen = ref(false)
const slashIdx = ref(0)
const slashPos = ref({ top: 0, left: 0 })
const slashFiltered = ref([])

const SLASH_CMDS = [
  { key: 'h1', label: 'Heading 1', icon: 'H1', insert: '# ' },
  { key: 'h2', label: 'Heading 2', icon: 'H2', insert: '## ' },
  { key: 'h3', label: 'Heading 3', icon: 'H3', insert: '### ' },
  { key: 'bold', label: 'Bold', icon: 'B', insert: '**bold**' },
  { key: 'italic', label: 'Italic', icon: 'I', insert: '_italic_' },
  { key: 'list', label: 'Bullet list', icon: '•', insert: '- ' },
  { key: 'todo', label: 'To-do item', icon: '☐', insert: '- [ ] ' },
  { key: 'quote', label: 'Blockquote', icon: '❝', insert: '> ' },
  { key: 'code', label: 'Code block', icon: '<>', insert: '```\n\n```' },
  { key: 'hr', label: 'Divider', icon: '—', insert: '---\n' },
  { key: 'table', label: 'Table', icon: '⊞', insert: '| Col 1 | Col 2 |\n|-------|-------|\n| Cell  | Cell  |\n' },
]

// Markdown renderer (minimal, no dependencies)
const rendered = computed(() => renderMd(props.modelValue || ''))

function renderMd(raw) {
  let html = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold/italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // hr
    .replace(/^---$/gm, '<hr>')
    // todo
    .replace(/^- \[ \] (.+)$/gm, '<li class="todo"><input type="checkbox" disabled> $1</li>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="todo done"><input type="checkbox" checked disabled> $1</li>')
    // bullets
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    // paragraphs: double newlines
    .replace(/\n\n/g, '</p><p>')
    // single newlines
    .replace(/\n/g, '<br>')
  return '<p>' + html + '</p>'
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  checkSlash(e.target)
}

function onKeydown(e) {
  if (slashOpen.value) {
    if (e.key === 'ArrowDown') { e.preventDefault(); slashIdx.value = (slashIdx.value + 1) % slashFiltered.value.length }
    else if (e.key === 'ArrowUp') { e.preventDefault(); slashIdx.value = (slashIdx.value - 1 + slashFiltered.value.length) % slashFiltered.value.length }
    else if (e.key === 'Enter') { e.preventDefault(); applySlash(slashFiltered.value[slashIdx.value]) }
    else if (e.key === 'Escape') { slashOpen.value = false }
    else if (e.key === 'Backspace') { nextTick(() => checkSlash(taEl.value)) }
  }
}

function checkSlash(ta) {
  if (!ta) return
  const pos = ta.selectionStart
  const text = ta.value.slice(0, pos)
  const lineStart = text.lastIndexOf('\n') + 1
  const line = text.slice(lineStart)
  if (line.startsWith('/')) {
    const q = line.slice(1).toLowerCase()
    const filtered = SLASH_CMDS.filter(c => !q || c.key.startsWith(q) || c.label.toLowerCase().startsWith(q))
    if (filtered.length) {
      slashFiltered.value = filtered
      slashIdx.value = 0
      slashOpen.value = true
      // Position below textarea
      const rect = ta.getBoundingClientRect()
      slashPos.value = { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX }
      return
    }
  }
  slashOpen.value = false
}

function applySlash(cmd) {
  if (!cmd || !taEl.value) return
  const ta = taEl.value
  const pos = ta.selectionStart
  const text = ta.value
  const lineStart = text.slice(0, pos).lastIndexOf('\n') + 1
  const newVal = text.slice(0, lineStart) + cmd.insert + text.slice(pos)
  emit('update:modelValue', newVal)
  slashOpen.value = false
  nextTick(() => {
    ta.value = newVal
    ta.selectionStart = ta.selectionEnd = lineStart + cmd.insert.length
    ta.focus()
  })
}

function insert(before, after) {
  const ta = taEl.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = ta.value.slice(start, end) || 'text'
  const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end)
  emit('update:modelValue', newVal)
  nextTick(() => {
    ta.value = newVal
    ta.selectionStart = start + before.length
    ta.selectionEnd = start + before.length + selected.length
    ta.focus()
  })
}

function insertLine(prefix) {
  const ta = taEl.value
  if (!ta) return
  const pos = ta.selectionStart
  const text = ta.value
  const lineStart = text.slice(0, pos).lastIndexOf('\n') + 1
  const newVal = text.slice(0, lineStart) + prefix + text.slice(lineStart)
  emit('update:modelValue', newVal)
  nextTick(() => {
    ta.value = newVal
    ta.selectionStart = ta.selectionEnd = lineStart + prefix.length
    ta.focus()
  })
}
</script>

<style scoped>
.md-editor-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.md-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 6px;
  background: var(--surface2, #20202e);
  border: 1px solid var(--border, #2a2a3a);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}
.md-btn {
  background: transparent;
  border: none;
  color: var(--text2, #a09890);
  cursor: pointer;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  transition: background 0.1s, color 0.1s;
}
.md-btn:hover, .md-btn.active {
  background: var(--border2, #333348);
  color: var(--text, #e8e4d9);
}
.md-toolbar-spacer { flex: 1; }
.md-textarea {
  border-radius: 0 0 6px 6px !important;
  resize: vertical;
}
.md-preview {
  background: var(--surface, #1a1a24);
  border: 1px solid var(--border, #2a2a3a);
  border-radius: 0 0 6px 6px;
  padding: 10px 12px;
  font-size: 0.88em;
  line-height: 1.65;
  color: var(--text, #e8e4d9);
  overflow-y: auto;
}
.md-preview :deep(h1) { font-size: 1.3em; margin: 10px 0 6px; color: var(--accent, #c9a84c); }
.md-preview :deep(h2) { font-size: 1.15em; margin: 8px 0 5px; color: var(--accent, #c9a84c); }
.md-preview :deep(h3) { font-size: 1.05em; margin: 6px 0 4px; color: var(--text2); }
.md-preview :deep(strong) { color: var(--text); font-weight: 700; }
.md-preview :deep(em) { font-style: italic; opacity: 0.85; }
.md-preview :deep(code) { background: var(--bg3, #16161d); padding: 1px 5px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; }
.md-preview :deep(blockquote) { border-left: 3px solid var(--accent, #c9a84c); padding-left: 10px; margin: 6px 0; opacity: 0.8; }
.md-preview :deep(hr) { border: none; border-top: 1px solid var(--border2); margin: 10px 0; }
.md-preview :deep(ul) { padding-left: 18px; margin: 4px 0; }
.md-preview :deep(li) { margin: 2px 0; }
.md-preview :deep(p) { margin: 0 0 6px; }
.slash-menu {
  position: fixed;
  z-index: 2000;
  background: var(--surface, #1a1a24);
  border: 1px solid var(--border2, #333348);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
  min-width: 200px;
  overflow: hidden;
}
.slash-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text2, #a09890);
  transition: background 0.1s;
}
.slash-item.active, .slash-item:hover {
  background: var(--accent-dim, #7a6230);
  color: var(--text, #e8e4d9);
}
.slash-icon {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text3, #6a6460);
  width: 20px;
  text-align: center;
}
</style>
