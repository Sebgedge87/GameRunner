<template>
  <div class="sticky-form-footer">
    <button
      type="button"
      class="sff-cancel"
      @click="onCancel?.()"
    >Cancel</button>
    <button
      type="button"
      class="sff-primary"
      :disabled="isLoading || isDisabled"
      @click="onPrimary?.()"
    >
      <span v-if="isLoading" class="sff-spinner" aria-hidden="true"></span>
      {{ primaryLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  primaryLabel: { type: String,   required: true },
  onPrimary:    { type: Function, default: null },
  onCancel:     { type: Function, default: null },
  isLoading:    { type: Boolean,  default: false },
  isDisabled:   { type: Boolean,  default: false },
})
</script>

<style scoped>
.sticky-form-footer {
  position: sticky;
  bottom: 0;
  padding: var(--space-4) var(--space-6);
  background: var(--color-bg-elevated);
  border-top: 1px solid var(--color-border-default);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-start;
  align-items: center;
  z-index: 1;
}

.sff-cancel {
  padding: 7px var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-default);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
}
.sff-cancel:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

.sff-primary {
  padding: 7px var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-active);
  background: transparent;
  color: var(--color-text-accent);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  transition: background var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
}
.sff-primary:hover:not(:disabled) {
  background: var(--color-bg-hover-surface);
}
.sff-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sff-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border-active);
  border-top-color: transparent;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .sff-spinner {
    animation: sff-spin 0.7s linear infinite;
  }
}
@keyframes sff-spin {
  to { transform: rotate(360deg); }
}
</style>
