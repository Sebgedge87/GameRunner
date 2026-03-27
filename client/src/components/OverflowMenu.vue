<!--
  OverflowMenu — ⋯ trigger button + positioned action popover.

  Usage:
    <OverflowMenu
      :actions="[
        { label: 'Pin',   icon: '📌', onClick: () => pin(id) },
        { label: 'Share', icon: '👁', onClick: () => share(id) },
        { label: 'Edit',  icon: '✏️', onClick: () => edit(id) },
        { type: 'divider' },
        { label: 'Delete', icon: '🗑', variant: 'danger', onClick: () => {} },
      ]"
      @delete="showDelete = true"
    />

  Delete pattern:
    When an action has variant:'danger' and label:'Delete', OverflowMenu closes
    the popover and emits 'delete' WITHOUT calling onClick. The parent is
    responsible for opening ConfirmDialog on @delete:

      <OverflowMenu @delete="showDelete = true" :actions="actions" />
      <ConfirmDialog
        :is-open="showDelete"
        entity-type="Quest"
        :entity-name="quest.title"
        :on-confirm="doDelete"
        :on-cancel="() => showDelete = false"
      />

  Parent card hover:
    Add class="overlay-card" to the wrapping card element — a global CSS rule
    makes the trigger visible on card hover. The trigger is always visible when
    the menu is open (aria-expanded="true") or when the trigger has focus.
-->
<template>
  <div class="overflow-menu">
    <button
      ref="triggerEl"
      class="overflow-menu-trigger"
      :aria-expanded="String(isOpen)"
      aria-haspopup="true"
      aria-label="More actions"
      type="button"
      @click.stop="toggle"
      @keydown.esc.stop.prevent="close"
      @keydown.down.prevent="openAndFocusFirst"
    >⋯</button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="popoverEl"
        class="overflow-menu-popover"
        :style="popoverStyle"
        role="menu"
        @keydown.esc.stop.prevent="close"
        @keydown.down.prevent="moveFocus(1)"
        @keydown.up.prevent="moveFocus(-1)"
        @keydown.home.prevent="focusFirst"
        @keydown.end.prevent="focusLast"
      >
        <template v-for="(action, idx) in actions" :key="idx">
          <div
            v-if="action.type === 'divider'"
            class="overflow-menu-divider"
            role="separator"
          />
          <button
            v-else
            :ref="el => setItemRef(el, idx)"
            class="overflow-menu-item"
            :class="{
              'overflow-menu-item--danger':   action.variant === 'danger',
              'overflow-menu-item--disabled': action.disabled,
            }"
            role="menuitem"
            type="button"
            :disabled="action.disabled || false"
            :tabindex="focusedIndex === idx ? 0 : -1"
            @click.stop="handleAction(action)"
            @mouseenter="focusedIndex = idx"
          >
            <span class="overflow-menu-icon" aria-hidden="true">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'

// ── Props & emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  actions:   { type: Array,  required: true },
  placement: { type: String, default: 'bottom-end' },
})

const emit = defineEmits(['delete'])

// ── Module-level singleton — only one OverflowMenu open at a time ─────────────
// Each instance registers its close fn when it opens; opening a second
// instance automatically calls the previous one's close.
const _registry = (() => {
  // Hoisted outside setup so it's shared across all instances
  let closeFn = null
  return {
    register(fn)   { if (closeFn && closeFn !== fn) closeFn(); closeFn = fn },
    deregister(fn) { if (closeFn === fn) closeFn = null },
  }
})()

// ── State ──────────────────────────────────────────────────────────────────────
const isOpen       = ref(false)
const triggerEl    = ref(null)
const popoverEl    = ref(null)
const popoverStyle = ref({ top: '0px', left: '0px', visibility: 'hidden' })
const focusedIndex = ref(-1)
const itemRefs     = ref([])

function setItemRef(el, idx) {
  if (el) itemRefs.value[idx] = el
  else    itemRefs.value[idx] = null
}

// ── Open / close ───────────────────────────────────────────────────────────────
async function open() {
  _registry.register(close)
  isOpen.value      = true
  focusedIndex.value = -1
  await nextTick()
  calcPosition()
  document.addEventListener('click',   onDocClick,   { capture: true })
  document.addEventListener('keydown', onDocKeydown)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  _registry.deregister(close)
  document.removeEventListener('click',   onDocClick,   { capture: true })
  document.removeEventListener('keydown', onDocKeydown)
  triggerEl.value?.focus()
}

function toggle() {
  isOpen.value ? close() : open()
}

// ── Outside-click and global Escape ───────────────────────────────────────────
function onDocClick(e) {
  if (
    popoverEl.value  && !popoverEl.value.contains(e.target) &&
    triggerEl.value  && !triggerEl.value.contains(e.target)
  ) {
    close()
  }
}

function onDocKeydown(e) {
  if (e.key === 'Escape') close()
}

// ── Viewport-aware positioning ─────────────────────────────────────────────────
function calcPosition() {
  if (!triggerEl.value || !popoverEl.value) return

  const r    = triggerEl.value.getBoundingClientRect()
  const popW = popoverEl.value.offsetWidth  || 160
  const popH = popoverEl.value.offsetHeight || 120
  const winH = window.innerHeight
  const winW = window.innerWidth

  // Vertical: flip to top-end if not enough room below
  const flipped = (winH - r.bottom) < (popH + 8)
  const top     = flipped ? r.top - popH - 4 : r.bottom + 4

  // Horizontal: align right edge (bottom-end) or left edge (bottom-start)
  const left = props.placement === 'bottom-start'
    ? Math.min(r.left, winW - popW - 8)
    : Math.max(8, r.right - popW)

  popoverStyle.value = {
    top:        `${Math.round(top)}px`,
    left:       `${Math.round(left)}px`,
    visibility: 'visible',
  }
}

// ── Keyboard navigation ────────────────────────────────────────────────────────
function enabledItems() {
  return props.actions
    .map((action, idx) => ({ action, idx }))
    .filter(({ action }) => action.type !== 'divider' && !action.disabled)
}

function moveFocus(dir) {
  const items = enabledItems()
  if (!items.length) return
  const curr = items.findIndex(({ idx }) => idx === focusedIndex.value)
  const next = (curr + dir + items.length) % items.length
  focusedIndex.value = items[next].idx
  itemRefs.value[focusedIndex.value]?.focus()
}

function focusFirst() {
  const items = enabledItems()
  if (!items.length) return
  focusedIndex.value = items[0].idx
  itemRefs.value[focusedIndex.value]?.focus()
}

function focusLast() {
  const items = enabledItems()
  if (!items.length) return
  focusedIndex.value = items[items.length - 1].idx
  itemRefs.value[focusedIndex.value]?.focus()
}

async function openAndFocusFirst() {
  if (!isOpen.value) await open()
  focusFirst()
}

// ── Action handler ─────────────────────────────────────────────────────────────
function handleAction(action) {
  if (action.disabled) return

  // Delete: close popover, emit event — do NOT call onClick.
  // Parent is responsible for opening ConfirmDialog.
  if (action.variant === 'danger' && action.label === 'Delete') {
    close()
    emit('delete', action)
    return
  }

  close()
  action.onClick?.()
}

// ── Cleanup ────────────────────────────────────────────────────────────────────
onBeforeUnmount(() => {
  if (isOpen.value) {
    document.removeEventListener('click',   onDocClick,   { capture: true })
    document.removeEventListener('keydown', onDocKeydown)
  }
  _registry.deregister(close)
})
</script>

<!-- Global rule: show trigger when parent card is hovered or focused-within -->
<style>
.overlay-card:hover .overflow-menu-trigger,
.overlay-card:focus-within .overflow-menu-trigger {
  opacity: 1;
}
</style>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────────────────────── */
.overflow-menu {
  display: inline-flex;
  position: relative;
}

/* ── Trigger ─────────────────────────────────────────────────────────────────── */
.overflow-menu-trigger {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default),
              background var(--duration-fast) var(--ease-default),
              color var(--duration-fast) var(--ease-default);
  /* Shown via global .overlay-card:hover rule and aria-expanded below */
}

.overflow-menu-trigger[aria-expanded="true"],
.overflow-menu-trigger:focus-visible {
  opacity: 1;
}

.overflow-menu-trigger:hover {
  background: var(--color-bg-hover-surface);
  color: var(--color-text-primary);
}

/* ── Popover (rendered via Teleport, position:fixed set in CSS) ─────────────── */
</style>

<!-- Popover is teleported to <body> so these rules must not be scoped -->
<style>
.overflow-menu-popover {
  position: fixed;
  z-index: var(--z-dropdown);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 4px 16px var(--color-shadow-menu);
}

/* ── Items ───────────────────────────────────────────────────────────────────── */
.overflow-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  width: 100%;
  text-align: left;
  transition: background var(--duration-fast) var(--ease-default);
}

.overflow-menu-item:hover,
.overflow-menu-item:focus-visible {
  background: var(--color-bg-hover-surface);
  outline: none;
}

.overflow-menu-item--danger {
  color: var(--color-text-danger);
}

.overflow-menu-item--danger:hover,
.overflow-menu-item--danger:focus-visible {
  background: var(--color-danger-bg-hover);
}

.overflow-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.overflow-menu-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

/* ── Divider ─────────────────────────────────────────────────────────────────── */
.overflow-menu-divider {
  height: 1px;
  background: var(--color-border-default);
  margin: 4px 0;
}
</style>
