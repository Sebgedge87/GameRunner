<template>
  <div class="ss-wrap" ref="wrapRef">
    <div class="ss-field" @click="focusInput">
      <!-- Selected pills -->
      <template v-if="multiple">
        <span v-for="v in modelValue" :key="v" class="ss-pill">
          {{ v }}
          <button type="button" class="ss-pill-x" @click.stop="remove(v)">×</button>
        </span>
      </template>
      <span v-else-if="!multiple && selectedLabel" class="ss-pill ss-pill-single">
        {{ selectedLabel }}
        <button type="button" class="ss-pill-x" @click.stop="clear">×</button>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        class="ss-input"
        :placeholder="modelValue?.length || selectedLabel ? '' : placeholder"
        @focus="isOpen = true"
        @input="isOpen = true"
        @keydown.escape="close"
        @keydown.enter.prevent="selectFirst"
        @keydown.backspace="onBackspace"
      />
    </div>
    <ul v-if="isOpen && filtered.length" class="ss-dropdown">
      <li
        v-for="opt in filtered"
        :key="optId(opt)"
        class="ss-option"
        @mousedown.prevent="select(opt)"
      >{{ optLabel(opt) }}</li>
    </ul>
    <div v-else-if="isOpen && query && !filtered.length" class="ss-empty">No matches</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { default: () => [] },   // array of strings (multi) or id/null (single)
  options:    { type: Array, default: () => [] },
  multiple:   { type: Boolean, default: true },
  labelKey:   { type: String, default: 'title' },
  valueKey:   { type: String, default: null },   // null = use label as value (multi default)
  placeholder:{ type: String, default: 'Search…' },
})
const emit = defineEmits(['update:modelValue'])

const wrapRef  = ref(null)
const inputRef = ref(null)
const query    = ref('')
const isOpen   = ref(false)

function optLabel(opt) { return opt[props.labelKey] || opt.name || opt.title || String(opt) }
function optId(opt)    { return props.valueKey ? opt[props.valueKey] : optLabel(opt) }

const selectedLabel = computed(() => {
  if (props.multiple) return null
  if (props.modelValue == null) return ''
  const match = props.options.find(o => optId(o) == props.modelValue)
  return match ? optLabel(match) : ''
})

const filtered = computed(() => {
  const q = query.value.toLowerCase()
  return props.options.filter(opt => {
    if (props.multiple && props.modelValue.includes(optLabel(opt))) return false
    return !q || optLabel(opt).toLowerCase().includes(q)
  })
})

function focusInput() { inputRef.value?.focus() }

function select(opt) {
  if (props.multiple) {
    emit('update:modelValue', [...props.modelValue, optLabel(opt)])
  } else {
    emit('update:modelValue', optId(opt))
  }
  query.value = ''
  isOpen.value = false
}

function remove(v) {
  emit('update:modelValue', props.modelValue.filter(x => x !== v))
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
}

function selectFirst() {
  if (filtered.value.length) select(filtered.value[0])
}

function onBackspace() {
  if (!query.value && props.multiple && props.modelValue.length) {
    remove(props.modelValue[props.modelValue.length - 1])
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
.ss-wrap { position: relative; }

.ss-field {
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
.ss-field:focus-within { border-color: var(--gold); }

.ss-pill {
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
.ss-pill-x {
  background: none;
  border: none;
  color: var(--text3);
  font-size: 14px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.ss-pill-x:hover { color: var(--red); }

.ss-input {
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
.ss-input::placeholder { color: var(--text3); }

.ss-dropdown {
  position: absolute;
  z-index: 200;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  max-height: 180px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 4px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,.5);
}
.ss-option {
  padding: 7px 12px;
  font-size: 13px;
  color: var(--text2);
  cursor: pointer;
}
.ss-option:hover { background: var(--bg3); color: var(--text); }

.ss-empty {
  position: absolute;
  z-index: 200;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text3);
  font-style: italic;
}
</style>
