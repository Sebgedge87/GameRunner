<template>
  <div id="toast-container">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast">
        <div class="toast-icon">{{ t.icon }}</div>
        <div class="toast-content">
          <div class="toast-title">{{ t.title }}</div>
          <div class="toast-body">{{ t.body }}</div>
        </div>
        <button class="toast-close" @click="ui.dismissToast(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.toast-enter-active { animation: toast-in 0.3s ease; }
.toast-leave-active { animation: toast-out 0.3s ease forwards; }
</style>
