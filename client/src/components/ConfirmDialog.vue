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

    <!-- ── Store-based generic confirm / prompt dialog ──────────────────── -->
    <div
      v-else-if="ui.confirmDialog"
      class="confirm-overlay"
      @click.self="cancel"
      @keydown.esc.prevent="cancel"
      tabindex="-1"
    >
      <div class="confirm-box gcd-box" role="dialog" aria-modal="true">

        <!-- Icon -->
        <div class="gcd-icon-wrap">
          <svg class="gcd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        <div class="gcd-message">{{ ui.confirmDialog.message }}</div>

        <input
          v-if="ui.confirmDialog?.isPrompt"
          ref="inputEl"
          v-model="ui.confirmDialog.inputValue"
          class="gcd-input"
          @keydown.enter="ok"
          @keydown.esc="cancel"
        />

        <div class="gcd-actions">
          <button class="gcd-btn gcd-btn-cancel" @click="cancel">Cancel</button>
          <button
            class="gcd-btn"
            :class="ui.confirmDialog.isPrompt ? 'gcd-btn-ok' : 'gcd-btn-danger'"
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

/* ── Animations ──────────────────────────────────────────────────── */
@keyframes confirm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes confirm-slide-up {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ── Generic confirm (gcd-*) ──────────────────────────────────────────── */
.gcd-box {
  background: #0a0c12;
  border: 1px solid rgba(26,120,255,0.3);
  border-radius: 8px;
  padding: 32px 36px 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(26,120,255,0.06);
  text-align: center;
  max-width: 420px;
  width: 90vw;
}

.gcd-icon-wrap {
  width: 48px;
  height: 48px;
  margin: 0 auto 18px;
  background: rgba(220,160,40,0.1);
  border: 1px solid rgba(220,160,40,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gcd-icon {
  width: 24px;
  height: 24px;
  color: #d4a017;
}

.gcd-message {
  font-family: 'Cinzel', serif;
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.03em;
  line-height: 1.4;
  margin-bottom: 24px;
}

.gcd-input {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  color: #fff;
  padding: 8px 12px;
  font-size: 13px;
  margin-bottom: 20px;
  outline: none;
}
.gcd-input:focus { border-color: rgba(26,120,255,0.55); }

.gcd-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.gcd-btn {
  padding: 8px 22px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.gcd-btn-cancel {
  background: transparent;
  border-color: rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.5);
}
.gcd-btn-cancel:hover {
  border-color: rgba(255,255,255,0.28);
  color: rgba(255,255,255,0.85);
}
.gcd-btn-danger {
  background: rgba(220,60,60,0.1);
  border-color: rgba(220,60,60,0.45);
  color: #e05050;
}
.gcd-btn-danger:hover {
  background: rgba(220,60,60,0.2);
  border-color: rgba(220,60,60,0.7);
}
.gcd-btn-ok {
  background: rgba(26,120,255,0.12);
  border-color: rgba(26,120,255,0.5);
  color: #3d9bff;
}
.gcd-btn-ok:hover {
  background: rgba(26,120,255,0.22);
}
</style>
