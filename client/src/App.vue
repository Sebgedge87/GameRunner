<template>
  <div id="chronicle-root" :class="bodyClasses">
    <div class="scanline-overlay"></div>
    <LoginView v-if="!isAuthenticated" />
    <AppLayout v-else />
    <ToastContainer />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCampaignStore } from '@/stores/campaign'
import LoginView from '@/views/LoginView.vue'
import AppLayout from '@/components/AppLayout.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const auth = useAuthStore()
const campaign = useCampaignStore()

const isAuthenticated = computed(() => auth.isAuthenticated)

const bodyClasses = computed(() => {
  const a11y = JSON.parse(localStorage.getItem('chronicle_a11y') || '{}')
  return {
    'high-contrast': !!a11y.contrast,
    'reduce-motion': !!a11y.motion,
    'no-effects': !!a11y.effects,
  }
})

onMounted(async () => {
  // Apply a11y and font size on boot
  const a11y = JSON.parse(localStorage.getItem('chronicle_a11y') || '{}')
  if (a11y.contrast) document.body.classList.add('high-contrast')
  if (a11y.motion) document.body.classList.add('reduce-motion')
  if (a11y.effects) document.body.classList.add('no-effects')
  const sz = localStorage.getItem('chronicle_font_size') || 'medium'
  document.body.setAttribute('data-font-size', sz)
  // Restore session
  await auth.restoreSession()
})
</script>

<style>
/* Root container replaces body/html for Vue */
#chronicle-root {
  height: 100vh;
  overflow: hidden;
}
</style>
