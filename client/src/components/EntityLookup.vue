<template>
  <div class="el-wrap" ref="wrapRef">
    <div class="el-field" :class="{ 'el-field--focus': isOpen }" @click="focusInput">
      <!-- Multi mode: ID pills with name labels -->
      <template v-if="multiple">
        <span v-for="id in (modelValue || [])" :key="id" class="el-pill">
          {{ labelFor(id) }}
          <button type="button" class="el-pill-x" @click.stop="removeId(id)">×</button>
        </span>
      </template>
      <!-- Single mode: show selected name -->
      <span v-else-if="!multiple && modelValue != null && modelValue !== ''" class="el-pill el-pill--single">
        {{ labelFor(modelValue) }}
        <button type="button" class="el-pill-x" @click.stop="clearSingle">×</button>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        class="el-input"
        :placeholder="hasSelection ? '' : placeholder"
        @focus="isOpen = true"
        @input="isOpen = true"
        @keydown.escape="close"
        @keydown.enter.prevent="selectFirst"
        @keydown.backspace="onBackspace"
      />
    </div>
    <ul v-if="isOpen && filtered.length" class="el-dropdown">
      <li
        v-for="opt in filtered"
        :key="opt.id"
        class="el-option"
        @mousedown.prevent="select(opt)"
      >
        <span class="el-opt-name">{{ optLabel(opt) }}</span>
        <span v-if="opt.subtitle" class="el-opt-sub">{{ opt.subtitle }}</span>
      </li>
    </ul>
    <div v-else-if="isOpen && query && !filtered.length" class="el-empty">No matches</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  // Single: modelValue = id (number|null). Multi: modelValue = id[] (number[])
  modelValue: { default: null },
  options:    { type: Array, default: () => [] },   // [{ id, title|name, subtitle? }]
  multiple:   { type: Boolean, default: false },
  labelKey:   { type: String, default: 'title' },
  placeholder:{ type: String, default: 'Search…' },
})
const emit = defineEmits(['update:modelValue'])

const wrapRef  = ref(null)
const inputRef = ref(null)
const query    = ref('')
const isOpen   = ref(false)

function optLabel(opt) { return opt[props.labelKey] || opt.name || opt.title || String(opt.id) }

function labelFor(id) {
  const match = props.options.find(o => String(o.id) === String(id))
  return match ? optLabel(match) : `#${id}`
}

const hasSelection = computed(() => {
  if (props.multiple) return (props.modelValue?.length || 0) > 0
  return props.modelValue != null && props.modelValue !== ''
})

const selectedIds = computed(() => {
  if (!props.multiple) return []
  return (props.modelValue || []).map(String)
})

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  return props.options.filter(opt => {
    if (props.multiple && selectedIds.value.includes(String(opt.id))) return false
    return !q || optLabel(opt).toLowerCase().includes(q)
  })
})

function focusInput() { inputRef.value?.focus() }

function select(opt) {
  if (props.multiple) {
    emit('update:modelValue', [...(props.modelValue || []), opt.id])
  } else {
    emit('update:modelValue', opt.id)
  }
  query.value = ''
  isOpen.value = false
}

function removeId(id) {
  emit('update:modelValue', (props.modelValue || []).filter(x => String(x) !== String(id)))
}

function clearSingle() {
  emit('update:modelValue', null)
  query.value = ''
}

function selectFirst() {
  if (filtered.value.length) select(filtered.value[0])
}

function onBackspace() {
  if (!query.value && props.multiple && (props.modelValue?.length || 0) > 0) {
    const arr = props.modelValue || []
    emit('update:modelValue', arr.slice(0, -1))
  }
}

function close() { isOpen.value = false; query.value = '' }

function onClickOutside(e) {
  if (wrapRef.value && !wrapRef.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.el-wrap { position: relative; }

.el-field {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 8px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: text;
  transition: border-color 0.15s;
}
.el-field--focus { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent); }

.el-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 3px;
  padding: 1px 6px 1px 7px;
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
}
.el-pill--single { background: color-mix(in srgb, var(--accent) 12%, var(--bg3)); border-color: var(--accent); }
.el-pill-x {
  background: none; border: none; color: var(--text3);
  font-size: 14px; line-height: 1; padding: 0; cursor: pointer;
  display: flex; align-items: center;
}
.el-pill-x:hover { color: var(--red); }

.el-input {
  flex: 1;
  min-width: 80px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  padding: 2px 0;
}
.el-input::placeholder { color: var(--text3); }

.el-dropdown {
  position: absolute;
  z-index: 200;
  top: calc(100% + 2px);
  left: 0; right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 4px;
  list-style: none;
  margin: 0; padding: 4px 0;
  box-shadow: 0 4px 16px var(--color-shadow-menu);
}
.el-option {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
}
.el-option:hover { background: var(--bg3); }
.el-opt-name { font-size: 13px; color: var(--text); }
.el-opt-sub  { font-size: 11px; color: var(--text3); }

.el-empty {
  position: absolute; z-index: 200;
  top: calc(100% + 2px); left: 0; right: 0;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px; color: var(--text3); font-style: italic;
}
</style>
