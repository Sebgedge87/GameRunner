<template>
  <MarkdownEditor
    v-if="isRich"
    :model-value="modelValue"
    :placeholder="placeholder"
    :min-height="minHeight ? `${minHeight}px` : '120px'"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <textarea
    v-else
    ref="taRef"
    class="form-input rft-plain"
    :value="modelValue"
    :placeholder="placeholder"
    :style="minHeight ? { minHeight: `${minHeight}px` } : {}"
    @input="onInput"
  />
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import MarkdownEditor from './MarkdownEditor.vue'

const props = defineProps({
  fieldType:   { type: String, required: true },
  modelValue:  { type: String, default: '' },
  placeholder: { type: String, default: '' },
  minHeight:   { type: Number, default: null },   // px
})

const emit = defineEmits(['update:modelValue'])

const RICH_TYPES = new Set([
  'biography',
  'description',
  'lore',
  'briefing',
  'gm-notes',
  'private-notes',
  'content',
  'body',
])

const isRich = computed(() => RICH_TYPES.has(props.fieldType))

// ── Plain textarea auto-resize ────────────────────────────────────────────

const taRef = ref(null)

function resize() {
  const el = taRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function onInput(e) {
  emit('update:modelValue', e.target.value)
  resize()
}

// Resize when value changes externally (e.g. data loaded after mount)
watch(() => props.modelValue, () => {
  if (!isRich.value) nextTick(resize)
}, { immediate: true })
</script>

<style scoped>
.rft-plain {
  resize: none;
  overflow: hidden;
  min-height: 72px;
  line-height: var(--leading-normal);
}
</style>
