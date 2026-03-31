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
}

/* The h2 picks up global .modal-title font/colour; we only add spacing here */
.ef-title {
  margin-bottom: var(--space-3);
}

/* Name row */
.ef-name-row {
  margin-bottom: var(--space-4);
}
/* Suppress the global form-group bottom-margin inside the name row */
.ef-name-row :deep(.form-group) {
  margin-bottom: 0;
}

/* Banner image (Map) — full width above the sidebar/main split */
.ef-banner-row {
  margin-bottom: var(--space-4);
}

/* ── Layout grid ─────────────────────────────────────────────────────────── */
.ef-layout {
  display: grid;
  grid-template-columns: var(--space-sidebar-width) 1fr;
  gap: var(--space-5);
  align-items: flex-start;
}

.ef-layout--no-sidebar {
  grid-template-columns: 1fr;
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
.ef-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ef-sidebar-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.ef-sidebar-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

/* Details card */
.ef-details-card {
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ef-details-title {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border-default);
}

/* Suppress global form-group bottom-margin inside the details card;
   card uses its own flex gap instead */
.ef-details-card :deep(.form-group) {
  margin-bottom: 0;
}

/* ── Main content column ─────────────────────────────────────────────────── */
.ef-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-form-gap);
}

/* Suppress global form-group bottom-margin inside ef-main;
   ef-main uses its own flex gap instead */
.ef-main :deep(.form-group) {
  margin-bottom: 0;
}

/* ── GM Only section ─────────────────────────────────────────────────────── */
.ef-gm-section {
  background: var(--color-bg-gm);
  border: 1px solid var(--color-border-gm);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.ef-gm-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.ef-gm-badge {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-gm);
  background: var(--color-bg-gm);
  border: 1px solid var(--color-border-gm);
  border-radius: var(--radius-xs);
  padding: 2px var(--space-2);
  letter-spacing: 0.04em;
}

.ef-gm-label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-gm);
}

/* Mobile: stack sidebar above main content */
@media (max-width: 640px) {
  .ef-layout {
    grid-template-columns: 1fr;
  }
}
</style>
