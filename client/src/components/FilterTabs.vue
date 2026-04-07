<template>
  <div class="filter-tabs-wrap">
    <div class="filter-tabs" role="toolbar" aria-label="Filters">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        class="filter-tab"
        :class="{ active: isActive(tab.value) }"
        :aria-pressed="String(isActive(tab.value))"
        @click="handleClick(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count != null" class="filter-tab-count">{{ tab.count }}</span>
      </button>
      <button
        v-if="showClearControl"
        type="button"
        class="filter-tab filter-clear"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tabs:     { type: Array,    required: true },   // [{ label, value, count? }]
  active:   { type: [Array, String], default: 'all' },
  onChange: { type: Function, default: null },
  onClear:  { type: Function, default: null },
  multi:    { type: Boolean,  default: false },
  allValue: { type: String,   default: 'all' },
})

const activeValues = computed(() => {
  if (Array.isArray(props.active)) return props.active
  if (props.active == null || props.active === '') return [props.allValue]
  return [props.active]
})

const showClearControl = computed(() => {
  if (!props.multi) return false
  const set = new Set(activeValues.value)
  return set.size > 0 && !(set.size === 1 && set.has(props.allValue))
})

function isActive(value) {
  return activeValues.value.includes(value)
}

function handleClick(value) {
  if (!props.multi) {
    props.onChange?.(value)
    return
  }

  if (value === props.allValue) {
    props.onChange?.([props.allValue])
    return
  }

  const next = new Set(activeValues.value)
  next.delete(props.allValue)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  props.onChange?.(next.size ? [...next] : [props.allValue])
}

function clearFilters() {
  if (props.onClear) props.onClear()
  else props.onChange?.([props.allValue])
}
</script>

<style scoped>
.filter-tabs-wrap {
  width: 100%;
}

.filter-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  gap: var(--space-2);
  padding-bottom: 2px;
}

.filter-tab {
  min-height: 34px;
  padding: 0 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
  transition: border-color var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default),
              background var(--duration-fast) var(--ease-default);
}

.filter-tab:hover:not(.active) {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.filter-tab.active {
  border-color: var(--color-border-active);
  color: var(--color-text-accent);
  background: rgba(212, 98, 26, 0.10);
  box-shadow: 0 0 0 1px rgba(212, 98, 26, 0.18), 0 0 12px rgba(212, 98, 26, 0.18);
}

.filter-tab-count {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
}

.filter-tab.active .filter-tab-count {
  color: var(--color-text-accent);
  opacity: 0.7;
}

.filter-clear {
  flex-shrink: 0;
}

.filter-clear:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
</style>
