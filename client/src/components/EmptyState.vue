<!--
  EmptyState — zero-content placeholder for list pages.
  Always centred in its container. Never positioned bottom-right.

  Usage (no entities):
    <EmptyState
      icon="⚔️"
      heading="No factions yet"
      description="Define the guilds, cults and powers that shape your world."
      :cta-label="campaign.isGm ? '+ Add faction' : null"
      :on-cta="campaign.isGm ? () => ui.openGmEdit('faction', null, {}) : null"
    />

  "No matches" state (search/filter returns zero on a non-empty list):
    <p class="no-matches-msg">No matches — try a different search or filter.</p>
    (.no-matches-msg is defined in this file's global style block.)

  .btn-add is also exported globally here — use it for page-header add buttons.
-->
<template>
  <div class="empty-state-component" role="status" aria-live="polite">
    <span class="esc-icon" aria-hidden="true">{{ icon }}</span>
    <p class="esc-heading">{{ heading }}</p>
    <p class="esc-description">{{ description }}</p>
    <button
      v-if="onCta && ctaLabel"
      class="btn-add"
      type="button"
      @click="onCta"
    >{{ ctaLabel }}</button>
  </div>
</template>

<script setup>
defineProps({
  icon:        { type: String,   required: true },
  heading:     { type: String,   required: true },
  description: { type: String,   required: true },
  ctaLabel:    { type: String,   default: null },
  onCta:       { type: Function, default: null },
})
</script>

<!-- Global — .btn-add and .no-matches-msg usable on any page that imports EmptyState -->
<style>
/* ── Add button: outline accent ─────────────────────────────────────────── */
/* Used in EmptyState CTA and page-header "+ Add [entity]" buttons */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 6px var(--space-4);
  border: 1px solid var(--color-text-accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-accent);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-fast) var(--ease-default),
              border-color var(--duration-fast) var(--ease-default);
}
.btn-add:hover {
  background: var(--color-bg-hover-surface);
  border-color: var(--color-border-active);
}

/* ── No-matches message: inline, no CTA ──────────────────────────────────── */
/* Shown when search / filter produces zero results on a non-empty list */
.no-matches-msg {
  text-align: center;
  padding: var(--space-8) var(--space-6);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  margin: 0;
}
</style>

<style scoped>
/* ── Container ────────────────────────────────────────────────────────────── */
.empty-state-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-8);
  gap: var(--space-3);
  width: 100%;
  min-height: 300px;
}

/* ── Icon ────────────────────────────────────────────────────────────────── */
.esc-icon {
  font-size: 32px;
  line-height: 1;
  color: var(--color-text-secondary);
  opacity: 0.5;
  display: block;
}

/* ── Heading ─────────────────────────────────────────────────────────────── */
.esc-heading {
  font-size: var(--text-lg);
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  text-transform: none;
  margin: 0;
}

/* ── Description ─────────────────────────────────────────────────────────── */
.esc-description {
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  color: var(--color-text-secondary);
  text-transform: none;
  line-height: var(--leading-normal);
  max-width: 320px;
  margin: 0;
}
</style>
