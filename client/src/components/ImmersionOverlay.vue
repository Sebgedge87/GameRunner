<template>
  <div v-if="overlayStyle || svgContent" class="immersion-overlay" aria-hidden="true">
    <!-- SVG overlay -->
    <div v-if="svgContent" class="immersion-svg" v-html="svgContent" />
    <!-- Image / CSS overlay -->
    <div v-else-if="overlayStyle" class="immersion-bg" :style="overlayStyle" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCampaignStore } from '@/stores/campaign'

const CONFIG_KEY = 'gamerunner_media_config'

// ── Map system → asset key ──────────────────────────────────────
const SYSTEM_ASSET_MAP = {
  achtung: 'achtung_knife',
  coc:     'coc_tome',
  dnd5e:   'dnd_dragon',
  alien:   'alien_slime',
  dune:    'dune_sand',
  scifi:   'scifi_grid',
}

const campaign = useCampaignStore()
const configVersion = ref(0) // bump to force re-read

function readConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (_) {
    return {}
  }
}

const activeAsset = computed(() => {
  void configVersion.value // reactive dependency
  const cfg = readConfig()
  const sys = campaign.activeCampaign?.system

  // System-specific first, then global_bg fallback
  const key = SYSTEM_ASSET_MAP[sys] || 'global_bg'
  const entry = cfg[key] || cfg['global_bg']
  if (!entry?.value) return null
  return entry
})

const svgContent = computed(() => {
  const a = activeAsset.value
  if (!a || a.type !== 'svg') return null
  return a.value
})

const overlayStyle = computed(() => {
  const a = activeAsset.value
  if (!a || a.type === 'svg') return null
  if (a.type === 'url')  return { backgroundImage: `url(${a.value})` }
  if (a.type === 'css')  return { background: a.value }
  return null
})

// Re-read config when storage changes (cross-tab / dev portal saves)
function onStorage(e) {
  if (e.key === CONFIG_KEY) configVersion.value++
}

onMounted(() => window.addEventListener('storage', onStorage))
onUnmounted(() => window.removeEventListener('storage', onStorage))
</script>

<style scoped>
.immersion-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.immersion-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.06;
}
.immersion-svg {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* SVG fills its container */
.immersion-svg :deep(svg) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
