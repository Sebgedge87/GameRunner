<!--
  ConfirmDialog — two usage modes:

  1. Props-based delete confirmation (new):
     <ConfirmDialog
       :is-open="showDelete"
       entity-type="Quest"
       entity-name="The Missing Merchant"
       :on-confirm="() => deleteQuest(quest.id)"
       :on-cancel="() => showDelete = false"
     />

  2. Store-based generic confirm / prompt (existing, via ui store):
     const confirmed = await ui.confirm('Clear all combatants?')
     const value     = await ui.prompt('New password:', '')
-->
<template>
  <Teleport to="body">

    <!-- ── Props-based delete dialog ─────────────────────────────────────── -->
    <div
      v-if="isOpen"
      class="confirm-overlay"
      @click.self="onCancel"
      @keydown.esc.prevent="onCancel"
      tabindex="-1"
      ref="deleteOverlayEl"
    >
      <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-heading">
        <h2 id="confirm-heading" class="confirm-heading">Delete {{ entityType }}?</h2>
        <p class="confirm-body">
          <span class="confirm-entity-name">"{{ entityName }}"</span>
          will be permanently deleted. This cannot be undone.
        </p>
        <div class="confirm-actions">
          <button ref="cancelBtnEl" class="btn confirm-cancel-btn" @click="onCancel">Cancel</button>
          <button class="btn confirm-delete-btn" @click="onConfirm">Delete</button>
        </div>
      </div>
    </div>

    <!-- ── Store-based generic confirm / prompt dialog ────────────────────── -->
    <div
      v-else-if="ui.confirmDialog"
      class="confirm-overlay"
      @click.self="cancel"
      @keydown.esc.prevent="cancel"
      tabindex="-1"
    >
      <div class="confirm-box" role="dialog" aria-modal="true">
        <div class="confirm-icon">⚠</div>
        <div class="confirm-message">{{ ui.confirmDialog.message }}</div>

        <input
          v-if="ui.confirmDialog?.isPrompt"
          ref="inputEl"
          v-model="ui.confirmDialog.inputValue"
          class="form-input confirm-input"
          @keydown.enter="ok"
          @keydown.esc="cancel"
        />

        <div class="confirm-actions">
          <button class="btn confirm-cancel-btn" @click="cancel">Cancel</button>
          <button
            class="btn confirm-ok-btn"
            :class="{ 'confirm-ok-btn--prompt': ui.confirmDialog.isPrompt }"
            @click="ok"
          >{{ ui.confirmDialog.isPrompt ? 'OK' : 'Confirm' }}</button>
        </div>
      </div>
    </div>

  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  isOpen:     { type: Boolean, default: false },
  entityType: { type: String,  default: '' },
  entityName: { type: String,  default: '' },
  onConfirm:  { type: Function, default: null },
  onCancel:   { type: Function, default: null },
})

const ui = useUiStore()

const cancelBtnEl     = ref(null)
const deleteOverlayEl = ref(null)
const inputEl         = ref(null)

// Autofocus Cancel when delete dialog opens
watch(() => props.isOpen, async (val) => {
  if (val) {
    await nextTick()
    deleteOverlayEl.value?.focus()
    cancelBtnEl.value?.focus()
  }
})

// Autofocus prompt input when store dialog opens
watch(() => ui.confirmDialog, async (val) => {
  if (val?.isPrompt) {
    await nextTick()
    inputEl.value?.focus()
    inputEl.value?.select()
  }
})

// Store-based handlers
function ok() {
  if (ui.confirmDialog?.isPrompt) {
    ui.resolveConfirm(ui.confirmDialog.inputValue || null)
  } else {
    ui.resolveConfirm(true)
  }
}

function cancel() {
  ui.resolveConfirm(ui.confirmDialog?.isPrompt ? null : false)
}
</script>

<style scoped>
/* ── Shared overlay ──────────────────────────────────────────────────────── */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay-heavy);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: confirm-fade-in var(--duration-fast) var(--ease-out);
}

/* ── Dialog box ──────────────────────────────────────────────────────────── */
.confirm-box {
  position: relative;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-active);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-8);
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px var(--color-bg-overlay-heavy);
  text-align: center;
  animation: confirm-slide-up var(--duration-fast) var(--ease-out);
}

/* Corner bracket decoration — matches .modal pattern in components.css */
.confirm-box::before,
.confirm-box::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--color-border-bracket);
  border-style: solid;
  opacity: 0.6;
}
.confirm-box::before { top: 5px;    left: 5px;  border-width: 1px 0 0 1px; }
.confirm-box::after  { bottom: 5px; right: 5px; border-width: 0 1px 1px 0; }

/* ── Delete dialog ───────────────────────────────────────────────────────── */
.confirm-heading {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}

.confirm-body {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
  margin-bottom: var(--space-6);
}

.confirm-entity-name {
  color: var(--color-text-primary);
}

/* ── Generic dialog (store-based) ────────────────────────────────────────── */
.confirm-icon {
  font-size: 28px;
  margin-bottom: var(--space-4);
  color: var(--accent);
  font-family: var(--font-sans);
}

.confirm-message {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-5);
}

.confirm-input {
  margin-bottom: var(--space-5);
  text-align: left;
}

/* ── Shared action row ───────────────────────────────────────────────────── */
.confirm-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}

.confirm-cancel-btn {
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  background: var(--color-bg-card);
  border-color: var(--color-border-default);
  color: var(--color-text-secondary);
}
.confirm-cancel-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}

/* Delete button */
.confirm-delete-btn {
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  background: transparent;
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  transition: background var(--duration-fast) var(--ease-default);
}
.confirm-delete-btn:hover {
  background: var(--color-danger-bg-hover);
}

/* Generic confirm button */
.confirm-ok-btn {
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  letter-spacing: 0.06em;
  background: transparent;
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  transition: background var(--duration-fast) var(--ease-default);
}
.confirm-ok-btn:hover { background: var(--color-danger-bg-hover); }

.confirm-ok-btn--prompt {
  border-color: var(--color-border-active);
  color: var(--accent2);
}
.confirm-ok-btn--prompt:hover { background: var(--accent-dim); }

/* ── Animations ──────────────────────────────────────────────────────────── */
@keyframes confirm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes confirm-slide-up {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
</style>
