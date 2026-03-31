<template>
  <div
    class="dropzone"
    :class="[variant, { 'drag-over': isDragOver }]"
    @click="onClick"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="hasValue">
      <img :src="localUrl" class="dropzone-preview" alt="Preview" />
      <button type="button" class="dropzone-remove" @click.stop="onRemove?.()">×</button>
    </template>
    <template v-else>
      <span class="dropzone-icon" aria-hidden="true">↑</span>
      <span class="dropzone-text">{{ label || 'Click or drag to upload' }}</span>
      <span v-if="hint" class="dropzone-hint">{{ hint }}</span>
    </template>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      style="display:none"
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'

const props = defineProps({
  accept:   { type: String,   default: 'image/*' },
  value:    {                  default: null },
  onChange: { type: Function, default: null },
  onRemove: { type: Function, default: null },
  label:    { type: String,   default: '' },
  hint:     { type: String,   default: '' },
  variant:  { type: String,   default: 'square' },  // 'square' | 'banner'
})

const inputRef   = ref(null)
const isDragOver = ref(false)
const localUrl   = ref(null)

const hasValue = computed(() => !!props.value)

watchEffect((onCleanup) => {
  if (props.value instanceof File) {
    const url = URL.createObjectURL(props.value)
    localUrl.value = url
    onCleanup(() => URL.revokeObjectURL(url))
  } else {
    localUrl.value = props.value || null
  }
})

function onClick() {
  if (!hasValue.value) inputRef.value?.click()
}

function handleChange(e) {
  const file = e.target.files?.[0]
  if (file) props.onChange?.(file)
  e.target.value = ''  // reset so same file can be re-selected
}

function handleDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) props.onChange?.(file)
}
</script>

<style scoped>
.dropzone {
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-default),
              background var(--duration-fast) var(--ease-default);
  background: transparent;
  position: relative;
  overflow: hidden;
}
.dropzone.square { width: 180px; height: 180px; }
.dropzone.banner { width: 100%; height: 120px; }

.dropzone:hover,
.dropzone.drag-over {
  border-color: var(--color-border-active);
  background: rgba(212, 98, 26, 0.06);
}

.dropzone-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: calc(var(--radius-md) - 1px);
}

.dropzone-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  color: var(--color-text-primary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--duration-fast) var(--ease-default);
}
.dropzone-remove:hover { background: var(--color-danger); }

.dropzone-icon {
  font-size: 24px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
  line-height: 1;
}

.dropzone-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
}

.dropzone-hint {
  font-size: var(--text-xs);
  color: var(--color-text-hint);
  font-family: var(--font-sans);
  margin-top: var(--space-1);
}
</style>
