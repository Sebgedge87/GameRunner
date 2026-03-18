<template>
  <Teleport to="body">
    <div v-if="ui.confirmDialog" class="confirm-overlay" @click.self="cancel" @keydown.esc="cancel">
      <div class="confirm-box">
        <div class="confirm-icon">⚠</div>
        <div class="confirm-message">{{ ui.confirmDialog.message }}</div>

        <!-- Prompt input -->
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

const ui = useUiStore()
const inputEl = ref(null)

watch(() => ui.confirmDialog, async (val) => {
  if (val?.isPrompt) {
    await nextTick()
    inputEl.value?.focus()
    inputEl.value?.select()
  }
})

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
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: confirm-fade-in 0.15s ease;
}

.confirm-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 8px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  animation: confirm-slide-up 0.15s ease;
  text-align: center;
}

.confirm-icon {
  font-size: 28px;
  margin-bottom: 14px;
  color: var(--accent);
  font-family: 'Cinzel', serif;
}

.confirm-message {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 20px;
}

.confirm-input {
  margin-bottom: 20px;
  text-align: left;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.confirm-cancel-btn {
  padding: 8px 22px;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 1px;
  background: var(--bg3);
  border-color: var(--border2);
  color: var(--text2);
}

.confirm-ok-btn {
  padding: 8px 22px;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: 1px;
  background: none;
  border: 1px solid #601a1a;
  color: #c94c4c;
  transition: background 0.15s;
}
.confirm-ok-btn:hover { background: #1a0f0f; }

.confirm-ok-btn--prompt {
  border-color: var(--accent);
  color: var(--accent2);
}
.confirm-ok-btn--prompt:hover { background: var(--accent-dim); }

@keyframes confirm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes confirm-slide-up {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
</style>
