<template>
  <span
    class="status-badge"
    :class="[`status-badge--${entry.variant}`, `status-badge--${size}`]"
  >{{ entry.label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  size:   { type: String, default: 'sm' },   // 'sm' | 'md'
})

const STATUS_MAP = {
  active:    { label: 'Active',    variant: 'active' },
  completed: { label: 'Completed', variant: 'done'   },
  delivered: { label: 'Delivered', variant: 'done'   },
  done:      { label: 'Done',      variant: 'done'   },
  missed:    { label: 'Missed',    variant: 'missed' },
  expired:   { label: 'Expired',   variant: 'missed' },
  hostile:   { label: 'Hostile',   variant: 'hostile'},
  neutral:   { label: 'Neutral',   variant: 'neutral'},
  allied:    { label: 'Allied',    variant: 'allied' },
  true:      { label: 'True',      variant: 'allied' },
  false:     { label: 'False',     variant: 'hostile'},
  exposed:   { label: 'Exposed',   variant: 'done'   },
}

const entry = computed(() => {
  const key = props.status?.toLowerCase()
  return STATUS_MAP[key] ?? { label: props.status, variant: 'neutral' }
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-pill);
  border: 1px solid;
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-badge--sm { padding: 1px var(--space-2); }
.status-badge--md { padding: 2px var(--space-3); }

.status-badge--active {
  color: var(--color-status-active);
  background: var(--color-status-active-bg);
  border-color: var(--color-status-active);
}
.status-badge--done {
  color: var(--color-status-done);
  background: var(--color-status-done-bg);
  border-color: var(--color-status-done);
}
.status-badge--missed {
  color: var(--color-status-missed);
  background: var(--color-status-missed-bg);
  border-color: var(--color-status-missed);
}
.status-badge--hostile {
  color: var(--color-hostile);
  background: var(--color-hostile-bg);
  border-color: var(--color-hostile);
}
.status-badge--neutral {
  color: var(--color-neutral);
  background: var(--color-neutral-bg);
  border-color: var(--color-neutral);
}
.status-badge--allied {
  color: var(--color-allied);
  background: var(--color-allied-bg);
  border-color: var(--color-allied);
}
</style>
