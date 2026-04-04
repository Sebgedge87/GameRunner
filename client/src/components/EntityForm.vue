<template>
  <div class="entity-form">

    <!-- Modal-style header — same class as global .modal-title for consistent styling -->
    <h2 class="modal-title ef-title">{{ entityType }}</h2>

    <!-- Name / title row — always full width, always first -->
    <div class="ef-name-row">
      <slot name="name-field" />
    </div>

    <!-- Banner image row (Map variant only) — full width above sidebar+main split -->
    <div v-if="slots['banner-image']" class="ef-banner-row">
      <slot name="banner-image" />
    </div>

    <!-- Layout: sidebar (240 px fixed) + main (flex 1), or full-width if no sidebar -->
    <div class="ef-layout" :class="{ 'ef-layout--no-sidebar': !hasSidebar }">

      <!-- Sidebar -->
      <aside v-if="hasSidebar" class="ef-sidebar">

        <!-- Portrait / icon Dropzone -->
        <div v-if="slots['sidebar-image']" class="ef-sidebar-image">
          <slot name="sidebar-image" />
          <span v-if="sidebarImageLabel" class="ef-sidebar-label">{{ sidebarImageLabel }}</span>
        </div>

        <!-- Metadata details card -->
        <div v-if="slots['sidebar-details']" class="ef-details-card">
          <div class="ef-details-title">Details</div>
          <slot name="sidebar-details" />
        </div>

      </aside>

      <!-- Main content column -->
      <div class="ef-main">
        <slot name="main-content" />

        <!-- GM Only section — always last in the main column -->
        <div v-if="slots['gm-section']" class="ef-gm-section">
          <div class="ef-gm-header">
            <span class="ef-gm-badge">GM Only</span>
            <span class="ef-gm-label">Private notes</span>
          </div>
          <slot name="gm-section" />
          <!-- GM action buttons injected from parent when editing existing entity -->
          <div v-if="slots['gm-actions']" class="ef-gm-actions">
            <slot name="gm-actions" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSlots, computed } from 'vue'

defineProps({
  entityType:        { type: String, required: true },
  /** Label shown below the sidebar portrait Dropzone, e.g. "Upload portrait" */
  sidebarImageLabel: { type: String, default: '' },
})

const slots = useSlots()

const hasSidebar = computed(() =>
  !!(slots['sidebar-image'] || slots['sidebar-details'])
)
</script>

<style scoped>
.entity-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Title — picks up global .modal-title, spacing only ─────────────────── */
.ef-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #3d9bff;
  margin-bottom: 4px;
  font-family: var(--font-header, 'Cinzel', serif);
}

/* Entity type sub-label, e.g. "Create NPC" */
.ef-type-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.3);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 20px;
}

/* ── Name row ─────────────────────────────────────────────────────────── */
.ef-name-row {
  margin-bottom: 20px;
}
.ef-name-row :deep(.form-group) {
  margin-bottom: 0;
}
/* Name input is slightly larger to give it hero weight */
.ef-name-row :deep(.form-input) {
  font-size: 15px;
  padding: 12px 16px;
  letter-spacing: 0.02em;
}

/* ── Banner image row (Map) ───────────────────────────────────────────── */
.ef-banner-row {
  margin-bottom: 20px;
  border-radius: 6px;
  overflow: hidden;
}

/* ── Two-column layout ────────────────────────────────────────────────── */
.ef-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: flex-start;
}
.ef-layout--no-sidebar {
  grid-template-columns: 1fr;
}

/* ── Sidebar column ───────────────────────────────────────────────────── */
.ef-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 0;
}

/* Portrait/image upload zone */
.ef-sidebar-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.12);
  border-radius: 6px;
  padding: 16px 12px;
}
.ef-sidebar-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Details metadata card */
.ef-details-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ef-details-title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.ef-details-card :deep(.form-group) {
  margin-bottom: 0;
}

/* ── Main content column ──────────────────────────────────────────────── */
.ef-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.ef-main :deep(.form-group) {
  margin-bottom: 0;
}

/* ── GM-Only section ──────────────────────────────────────────────────── */
.ef-gm-section {
  background: rgba(180, 40, 40, 0.06);
  border: 1px solid rgba(180, 40, 40, 0.22);
  border-radius: 6px;
  padding: 16px;
  margin-top: 4px;
}
.ef-gm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.ef-gm-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  color: #e05050;
  background: rgba(180, 40, 40, 0.18);
  border: 1px solid rgba(180, 40, 40, 0.4);
  border-radius: 3px;
  padding: 2px 7px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ef-gm-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.06em;
}

/* GM action buttons (Pin / Hide / Delete) inside the GM section */
.ef-gm-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(180,40,40,0.18);
}
.ef-gm-actions :deep(.gm-action-btn) {
  padding: 6px 14px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: rgba(255,255,255,0.55);
  transition: border-color 0.15s, color 0.15s;
}
.ef-gm-actions :deep(.gm-action-btn:hover) {
  border-color: rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.85);
}
.ef-gm-actions :deep(.gm-action-btn--danger) {
  border-color: rgba(220,60,60,0.3);
  color: #e05050;
}
.ef-gm-actions :deep(.gm-action-btn--danger:hover) {
  border-color: rgba(220,60,60,0.6);
  background: rgba(220,60,60,0.08);
}

/* ── Mobile: stack sidebar above main ────────────────────────────────── */
@media (max-width: 640px) {
  .ef-layout {
    grid-template-columns: 1fr;
  }
  .ef-sidebar {
    position: static;
  }
}
</style>
