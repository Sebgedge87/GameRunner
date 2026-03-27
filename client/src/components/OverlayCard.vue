<!--
  OverlayCard — Standard two-state entity card for list views.

  Usage:
    <OverlayCard
      icon="🗡"
      title="Crimson Hand"
      status="hostile"
      :actions="actions"
      :is-expanded="expanded"
      :on-toggle="() => expanded = !expanded"
      @delete="showConfirm = true"
    >
      <p>Card body content shown when expanded.</p>
    </OverlayCard>
    <ConfirmDialog
      :is-open="showConfirm"
      entity-type="Faction"
      :entity-name="faction.name"
      :on-confirm="doDelete"
      :on-cancel="() => showConfirm = false"
    />

  Grid container — apply to the wrapping list element:
    class="overlay-card-grid"
    → grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))

  Delete pattern:
    OverflowMenu emits 'delete' → OverlayCard re-emits 'delete'.
    Parent opens ConfirmDialog on @delete.
    OverlayCard never executes delete itself.

  Icon slot:
    Pass a simple emoji string via the icon prop, or use the named
    #icon slot for any custom content.

  Status values with built-in styling:
    'active' | 'done' | 'missed' | 'hostile' | 'neutral' | 'allied'
    Any other string renders with the default muted style.
    (These will transfer to StatusBadge when that component is built.)
-->
<template>
  <div
    class="overlay-card"
    :class="{
      'overlay-card--expanded': isExpanded,
      'overlay-card--selected': isSelected,
    }"
  >
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div
      class="overlay-card-header"
      :class="{ 'overlay-card-header--clickable': !!onToggle }"
      @click="onToggle?.()"
    >
      <!-- Entity icon — named slot or plain icon prop -->
      <span class="overlay-card-icon" aria-hidden="true">
        <slot name="icon">{{ icon }}</slot>
      </span>

      <!-- Title — text-transform: none enforced in CSS -->
      <span class="overlay-card-title">{{ title }}</span>

      <!-- Inline status badge (placeholder until StatusBadge component is built) -->
      <span
        v-if="status"
        class="overlay-card-status-badge"
        :class="`overlay-card-status-badge--${status}`"
        :aria-label="`Status: ${status}`"
      >{{ status }}</span>

      <!-- Edit pencil — visible on card hover only; the only permitted inline action -->
      <button
        v-if="editAction"
        class="overlay-card-edit-btn"
        type="button"
        aria-label="Edit"
        @click.stop="editAction.onClick?.()"
      >✏️</button>

      <!-- OverflowMenu wrapper — stops click from bubbling to header toggle -->
      <div @click.stop>
        <OverflowMenu :actions="actions" @delete="$emit('delete')" />
      </div>
    </div>

    <!-- ── Body (expanded only) ────────────────────────────────────────── -->
    <div v-if="isExpanded" class="overlay-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import OverflowMenu from './OverflowMenu.vue'

const props = defineProps({
  icon:       { type: String,   default: '' },
  title:      { type: String,   required: true },
  status:     { type: String,   default: null },
  actions:    { type: Array,    required: true },
  isExpanded: { type: Boolean,  default: false },
  onToggle:   { type: Function, default: null },
  isSelected: { type: Boolean,  default: false },
})

defineEmits(['delete'])

// Finds the Edit action in the actions array for the pencil shortcut.
// Returns null if no Edit action exists (button is hidden).
const editAction = computed(() =>
  props.actions.find(a => a.type !== 'divider' && a.label === 'Edit' && !a.disabled) ?? null
)
</script>

<!-- Utility class for list containers — unscoped so parents can use it -->
<style>
.overlay-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-card-gap);
}
</style>

<style scoped>
/* ── Card container ──────────────────────────────────────────────────── */
.overlay-card {
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  transition:
    border-color var(--duration-fast) var(--ease-default),
    box-shadow   var(--duration-fast) var(--ease-default);
}

/* ── Corner bracket decoration — brand element ───────────────────────── */
.overlay-card::before,
.overlay-card::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--color-border-bracket);
  border-style: solid;
  pointer-events: none;
}
.overlay-card::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}
.overlay-card::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

/* ── Expanded state ──────────────────────────────────────────────────── */
.overlay-card--expanded {
  border-color: var(--color-border-active);
}

/* ── Selected state ──────────────────────────────────────────────────── */
.overlay-card--selected {
  border-color: var(--color-border-active);
  border-left: 3px solid var(--color-text-accent);
}

/* ── Header ──────────────────────────────────────────────────────────── */
.overlay-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  min-height: 44px;
  cursor: default;
  user-select: none;
}

.overlay-card-header--clickable {
  cursor: pointer;
}

.overlay-card-icon {
  font-size: var(--text-base);
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

/* Title: flex:1 pushes status badge + controls to the right */
.overlay-card-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-base);
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  text-transform: none;     /* spec: NEVER uppercase the title */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Inline status badge ─────────────────────────────────────────────── */
/* Placeholder until StatusBadge component is built (Task 10) */
.overlay-card-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  text-transform: none;
  white-space: nowrap;
  flex-shrink: 0;
  /* Default style for any unrecognised status value */
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
}

.overlay-card-status-badge--active {
  color: var(--color-status-active);
  background: var(--color-status-active-bg);
}
.overlay-card-status-badge--done {
  color: var(--color-status-done);
  background: var(--color-status-done-bg);
}
.overlay-card-status-badge--missed {
  color: var(--color-status-missed);
  background: var(--color-status-missed-bg);
}
.overlay-card-status-badge--hostile {
  color: var(--color-hostile);
  background: var(--color-hostile-bg);
}
.overlay-card-status-badge--neutral {
  color: var(--color-neutral);
  background: var(--color-neutral-bg);
}
.overlay-card-status-badge--allied {
  color: var(--color-allied);
  background: var(--color-allied-bg);
}

/* ── Edit shortcut — visible on card hover only ──────────────────────── */
.overlay-card-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-sm);
  line-height: 1;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  opacity: 0;
  transition:
    opacity    var(--duration-fast) var(--ease-default),
    background var(--duration-fast) var(--ease-default);
}

.overlay-card:hover .overlay-card-edit-btn {
  opacity: 1;
}

.overlay-card-edit-btn:hover {
  background: var(--color-bg-hover-surface);
  color: var(--color-text-primary);
}

/* ── Body ────────────────────────────────────────────────────────────── */
.overlay-card-body {
  padding: 0 var(--space-3) var(--space-3);
  border-top: 1px solid var(--color-border-default);
}
</style>
