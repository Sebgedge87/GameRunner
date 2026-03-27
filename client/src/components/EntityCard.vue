<template>
  <div
    class="card entity-card"
    :class="{ hidden: entity.hidden, expanded }"
  >
    <!-- Header: always visible, click to toggle -->
    <div class="ec-header" @click="$emit('toggle')">
      <div class="ec-title-row">
        <span v-if="icon" class="ec-icon">{{ icon }}</span>
        <span class="ec-title">{{ title }}</span>
        <button
          v-if="campaign.isGm"
          class="btn btn-xs ec-edit-btn"
          title="Edit"
          @click.stop="ui.openGmEdit(type, entity.id, entity)"
        >✏️</button>
      </div>
      <div v-if="$slots.badges" class="ec-badge-row">
        <slot name="badges" />
      </div>
    </div>

    <!-- Expanded body -->
    <template v-if="expanded">

      <!-- Image banner (shown when expanded) -->
      <img v-if="image" :src="image" class="ec-image" alt="" />

      <!-- Body slot: description, metadata, special sections -->
      <div v-if="$slots.body" class="ec-body">
        <slot name="body" />
      </div>

      <!-- Action bar -->
      <div class="ec-actions">
        <button class="btn btn-sm" @click.stop="data.addPin(type, entity.id, title)">📌 Pin</button>
        <slot name="actions" />
        <template v-if="campaign.isGm">
          <button
            class="btn btn-sm"
            :title="entity.hidden ? 'Reveal' : 'Hide'"
            @click.stop="doToggleHidden"
          >{{ entity.hidden ? '👁 Reveal' : '🙈 Hide' }}</button>
          <button
            v-if="showShare"
            class="btn btn-sm"
            title="Share"
            @click.stop="ui.openShare(type, entity.id, title)"
          >🔗 Share</button>
          <button class="btn btn-sm" title="Edit" @click.stop="ui.openGmEdit(type, entity.id, entity)">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" title="Delete" @click.stop="doDelete">🗑 Delete</button>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useSlots } from 'vue'
import { useDataStore } from '@/stores/data'
import { useCampaignStore } from '@/stores/campaign'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  entity:    { type: Object,   required: true },
  type:      { type: String,   required: true },
  title:     { type: String,   required: true },
  icon:      { type: String,   default: '' },
  image:     { type: String,   default: null },
  expanded:  { type: Boolean,  default: false },
  showShare: { type: Boolean,  default: true },
  reloadFn:  { type: Function, default: () => {} },
})
defineEmits(['toggle'])

const data     = useDataStore()
const campaign = useCampaignStore()
const ui       = useUiStore()

async function doToggleHidden() {
  await data.toggleHidden(props.type, props.entity.id)
  await props.reloadFn()
}

async function doDelete() {
  const label = props.title || props.type
  if (!await ui.confirm(`Delete "${label}"?`)) return
  await data.deleteItem(props.type, props.entity.id)
  await props.reloadFn()
}
</script>

<style scoped>
.entity-card { padding: 0; overflow: hidden; cursor: pointer; }

/* ── Header ── */
.ec-header { padding: 12px 16px 10px; user-select: none; }
.ec-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ec-icon { font-size: 14px; flex-shrink: 0; }
.ec-title {
  font-family: var(--font-header, 'Cinzel', serif);
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.05em;
  text-transform: none;
  flex: 1;
  line-height: 1.3;
}
.ec-edit-btn { opacity: 0.45; padding: 2px 6px; font-size: 11px; transition: opacity 0.15s; flex-shrink: 0; }
.ec-edit-btn:hover { opacity: 1; }
.ec-badge-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── Image banner ── */
.ec-image { width: 100%; max-height: 180px; object-fit: cover; display: block; border-top: 1px solid var(--border); }

/* ── Body ── */
.ec-body {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* Override card-overview clamp inside expanded body */
.ec-body :deep(.card-overview) {
  -webkit-line-clamp: unset;
  overflow: visible;
  display: block;
}

/* ── Action bar ── */
.ec-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  padding: 8px 16px 10px;
  border-top: 1px solid var(--border);
}
.ec-actions .btn { font-size: 11px; padding: 3px 8px; }
</style>
