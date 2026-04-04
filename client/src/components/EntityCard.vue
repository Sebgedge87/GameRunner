<template>
  <div
    class="card entity-card"
    :class="{ hidden: entity.hidden }"
    @click="ui.openDetail(type, entity)"
    :title="title"
  >
    <!-- Image thumbnail (always visible if present) -->
    <div v-if="image" class="ec-image-wrap">
      <img :src="image" class="ec-image" alt="" />
      <div class="ec-image-overlay">
        <span class="ec-image-name">{{ title }}</span>
      </div>
    </div>

    <!-- Header: icon + title + badges -->
    <div class="ec-header">
      <div class="ec-title-row">
        <span v-if="icon" class="ec-icon">{{ icon }}</span>
        <span class="ec-title">{{ title }}</span>
      </div>
      <div v-if="$slots.badges" class="ec-badge-row">
        <slot name="badges" />
      </div>
      <!-- Body preview slot (short description etc.) -->
      <div v-if="$slots.preview" class="ec-preview">
        <slot name="preview" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'
import { useCampaignStore } from '@/stores/campaign'

const props = defineProps({
  entity:    { type: Object,   required: true },
  type:      { type: String,   required: true },
  title:     { type: String,   required: true },
  icon:      { type: String,   default: '' },
  image:     { type: String,   default: null },
  showShare: { type: Boolean,  default: true },
  reloadFn:  { type: Function, default: () => {} },
  // Legacy prop — kept for interface compat, no longer used internally
  expanded:  { type: Boolean,  default: false },
})

// Legacy emit — kept for compat so callers don't crash
defineEmits(['toggle'])

const ui       = useUiStore()
const campaign = useCampaignStore()
</script>

<style scoped>
.entity-card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  position: relative;
}
.entity-card:hover {
  border-color: var(--accent, #1a78ff);
  box-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(26,120,255,0.12);
  transform: translateY(-2px);
}
.entity-card.hidden { opacity: 0.45; filter: grayscale(0.35); }

/* ── Image thumbnail ─────────────────────────────────────────────────────── */
.ec-image-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--bg3);
  flex-shrink: 0;
  /* Portrait ratio for NPCs/Factions/Bestiary — overridden per-view if needed */
  aspect-ratio: 4 / 3;
}
.ec-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}
.entity-card:hover .ec-image { transform: scale(1.04); }

/* Name overlay that fades in on hover */
.ec-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
  display: flex;
  align-items: flex-end;
  padding: 8px 10px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.entity-card:hover .ec-image-overlay { opacity: 1; }
.ec-image-name {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 11px;
  color: #fff;
  letter-spacing: 0.06em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.9);
}

/* ── Header (text area below image) ─────────────────────────────────────── */
.ec-header {
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ec-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.ec-icon { font-size: 14px; flex-shrink: 0; }
.ec-title {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.05em;
  flex: 1;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ec-badge-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.ec-preview {
  font-size: 11px;
  color: var(--text3);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
