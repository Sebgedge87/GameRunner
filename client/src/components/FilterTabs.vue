<template>
  <div class="filter-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="filter-tab"
      :class="{ active: active === tab.value }"
      @click="onChange?.(tab.value)"
    >
      {{ tab.label }}
      <span v-if="tab.count != null" class="filter-tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs:     { type: Array,    required: true },   // [{ label, value, count? }]
  active:   {                  required: true },
  onChange: { type: Function, default: null },
})
</script>

<style scoped>
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filter-tab {
  height: 28px;
  padding: 0 14px;
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
</style>
