<template>
  <div v-if="campaign.isGm" id="gm-fab-root">
    <!-- Flyout menu — expands upward -->
    <transition name="fab-menu">
      <div v-if="isOpen" class="fab-menu" @click.stop>
        <button
          v-for="action in actions"
          :key="action.type"
          class="fab-menu-item"
          @click="trigger(action)"
          :title="action.label"
        >
          <span class="fab-menu-icon">{{ action.icon }}</span>
          <span class="fab-menu-label">{{ action.label }}</span>
        </button>
      </div>
    </transition>

    <!-- Main FAB Toggle -->
    <button
      id="gm-fab"
      :class="{ open: isOpen }"
      @click="toggle"
      :title="isOpen ? 'Close' : 'Quick Create'"
      aria-label="Quick Create"
    >
      <span class="fab-plus">{{ isOpen ? '✕' : '+' }}</span>
    </button>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fab-backdrop" @click="isOpen = false" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const campaign = useCampaignStore()
const ui = useUiStore()
const route = useRoute()

const isOpen = ref(false)

// Close flyout on navigation
watch(() => route.path, () => { isOpen.value = false })

const actions = [
  { type: 'bulk-import', label: 'Import Entities', icon: '📥' },
  { type: 'npc',      label: 'Add NPC',      icon: '🧑' },
  { type: 'location', label: 'Add Location',  icon: '📍' },
  { type: 'quest',    label: 'Add Quest',     icon: '⚔️' },
  { type: 'job',      label: 'Add Job',       icon: '💼' },
  { type: 'faction',  label: 'Add Faction',   icon: '⚜️' },
  { type: 'handout',  label: 'Add Handout',   icon: '📜' },
  { type: 'hook',     label: 'Add Hook',      icon: '🪝' },
  { type: 'rumour',   label: 'Add Rumour',    icon: '🗣️' },
  { type: 'bestiary', label: 'Add Creature',  icon: '🐉' },
  { type: 'map',      label: 'Add Map',       icon: '🗺️' },
  { type: 'timeline', label: 'Add Timeline Event', icon: '📅' },
  { type: 'session',  label: 'New Session',   icon: '📖' },
]

function toggle() {
  isOpen.value = !isOpen.value
}

function trigger(action) {
  if (action.type === 'bulk-import') {
    ui.openBulkImport()
  } else {
    ui.openGmEdit(action.type, null, {})
  }
  isOpen.value = false
}
</script>

<style scoped>
#gm-fab-root {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 250;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

#gm-fab {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent-dim, rgba(0,120,255,0.15));
  border: 1px solid var(--accent, #1a78ff);
  color: var(--accent, #1a78ff);
  font-size: 24px;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,120,255,0.25), 0 0 0 0 rgba(0,120,255,0);
  transition: transform .2s cubic-bezier(0.34,1.56,0.64,1), background .2s, box-shadow .2s;
  z-index: 251;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

#gm-fab:hover {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  box-shadow: 0 6px 28px rgba(0,120,255,0.35);
  transform: scale(1.05);
}

#gm-fab.open {
  background: color-mix(in srgb, var(--accent) 25%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
  transform: scale(1.08);
}

.fab-plus {
  line-height: 1;
  display: block;
  transition: transform .25s cubic-bezier(0.34,1.56,0.64,1);
  font-size: 22px;
  color: var(--accent, #1a78ff);
}

#gm-fab.open .fab-plus {
  transform: rotate(0deg);
  font-size: 16px;
}

/* ── Flyout Menu Stack ─────────────────────────────────────────────────── */
.fab-menu {
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  padding-bottom: 12px;
  align-items: flex-end;
  position: relative;
  z-index: 252;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface, #111827);
  border: 1px solid var(--accent, #1a78ff);
  border-radius: 8px;
  padding: 8px 14px;
  color: var(--text, #e2e8f0);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-sans, 'Inter', sans-serif);
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: background .15s, transform .15s, box-shadow .15s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.fab-menu-item:hover {
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  transform: translateX(-4px);
  box-shadow: 0 4px 20px rgba(0,120,255,0.2);
  color: var(--accent, #1a78ff);
}

.fab-menu-icon {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.fab-menu-label {
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 10px;
}

/* ── Backdrop ──────────────────────────────────────────────────────────── */
.fab-backdrop {
  position: fixed;
  inset: 0;
  z-index: 249;
  background: transparent;
}

/* ── Transition ────────────────────────────────────────────────────────── */
.fab-menu-enter-active {
  transition: opacity .2s ease, transform .25s cubic-bezier(0.34,1.56,0.64,1);
}
.fab-menu-leave-active {
  transition: opacity .15s ease, transform .15s ease;
}
.fab-menu-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}
.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
