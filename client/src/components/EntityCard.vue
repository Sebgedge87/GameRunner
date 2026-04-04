<template>
  <div
    class="card entity-card"
    :class="{ 'ec--hidden': entity.hidden }"
    @click="ui.openDetail(type, entity)"
    :title="title"
  >
    <!-- Portrait / image (always visible) -->
    <div class="ec-portrait" :class="{ 'ec-portrait--empty': !image }">
      <img v-if="image" :src="image" class="ec-portrait-img" alt="" />
      <span v-else class="ec-portrait-placeholder">{{ icon || '📄' }}</span>

      <!-- Hover detail overlay: slides up over the image -->
      <div class="ec-hover-overlay">
        <div class="ec-hover-title">{{ title }}</div>
        <div v-if="$slots.badges" class="ec-hover-badges">
          <slot name="badges" />
        </div>
        <div v-if="$slots.preview" class="ec-hover-preview">
          <slot name="preview" />
        </div>
      </div>
    </div>

    <!-- Info bar: always-visible name + badges below portrait -->
    <div class="ec-info">
      <div class="ec-title-row">
        <span v-if="icon && !image" class="ec-icon">{{ icon }}</span>
        <span class="ec-title">{{ title }}</span>
      </div>
      <div v-if="$slots.badges" class="ec-badge-row">
        <slot name="badges" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  entity:    { type: Object,   required: true },
  type:      { type: String,   required: true },
  title:     { type: String,   required: true },
  icon:      { type: String,   default: '' },
  image:     { type: String,   default: null },
  showShare: { type: Boolean,  default: true },
  reloadFn:  { type: Function, default: () => {} },
  // Legacy props — kept for interface compat, no longer used internally
  expanded:  { type: Boolean,  default: false },
})

// Legacy emit — kept for compat so callers don't crash
defineEmits(['toggle'])

const ui = useUiStore()
</script>

<style scoped>
/* ── Base card ──────────────────────────────────────────────────────────── */
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
  box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,120,255,0.15);
  transform: translateY(-2px);
}
.ec--hidden { opacity: 0.45; filter: grayscale(0.35); }

/* ── Portrait area ──────────────────────────────────────────────────────── */
.ec-portrait {
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--bg3, #0f111a);
  flex-shrink: 0;
  position: relative;
}
.ec-portrait--empty {
  aspect-ratio: 4 / 3;
}
.ec-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.entity-card:hover .ec-portrait-img { transform: scale(1.05); }
.ec-portrait-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  opacity: 0.15;
}

/* ── Hover overlay — slides up on hover ─────────────────────────────────── */
.ec-hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(6,8,18,0.92) 0%, rgba(6,8,18,0.3) 55%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px 12px 10px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  pointer-events: none;
}
.entity-card:hover .ec-hover-overlay {
  opacity: 1;
  transform: translateY(0);
}
.ec-hover-title {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 13px;
  color: #fff;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 6px rgba(0,0,0,0.9);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ec-hover-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.ec-hover-preview {
  font-size: 10px;
  color: rgba(255,255,255,0.65);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Info bar (below portrait, always visible) ───────────────────────────── */
.ec-info {
  padding: 9px 12px 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}
.ec-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ec-icon { font-size: 13px; flex-shrink: 0; opacity: 0.7; }
.ec-title {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 12px;
  color: var(--text);
  letter-spacing: 0.05em;
  flex: 1;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ec-badge-row { display: flex; flex-wrap: wrap; gap: 4px; }
</style>
