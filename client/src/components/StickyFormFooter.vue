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
  padding: 14px 28px;
  background: #070910;
  border-top: 1px solid rgba(26,120,255,0.2);
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  align-items: center;
  z-index: 10;
  flex-shrink: 0;
}

.sff-cancel {
  padding: 8px 18px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.14);
  background: transparent;
  color: rgba(255,255,255,0.45);
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.sff-cancel:hover {
  border-color: rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.75);
}

.sff-primary {
  padding: 8px 22px;
  border-radius: 4px;
  border: 1px solid rgba(26,120,255,0.7);
  background: rgba(26,120,255,0.12);
  color: #3d9bff;
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.sff-primary:hover:not(:disabled) {
  background: rgba(26,120,255,0.22);
  border-color: rgba(26,120,255,0.9);
  box-shadow: 0 0 16px rgba(26,120,255,0.2);
}
.sff-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.sff-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(26,120,255,0.4);
  border-top-color: #3d9bff;
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
