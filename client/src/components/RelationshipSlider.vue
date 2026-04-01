<template>
  <div class="rel-slider">
    <input
      type="range"
      class="rel-track"
      :value="modelValue"
      :style="{ '--thumb-color': thumbColor }"
      min="-10"
      max="10"
      step="1"
      @input="$emit('update:modelValue', +$event.target.value)"
    />
    <div class="rel-labels">
      <span class="rel-label" :class="{ 'rel-label--active': modelValue <= -4 }">Hostile</span>
      <span class="rel-label" :class="{ 'rel-label--active': modelValue > -4 && modelValue < 4 }">Neutral</span>
      <span class="rel-label" :class="{ 'rel-label--active': modelValue >= 4 }">Allied</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },  // -10 (hostile) → 0 (neutral) → +10 (allied)
})

defineEmits(['update:modelValue'])

const thumbColor = computed(() => {
  if (props.modelValue <= -4) return 'var(--color-hostile)'
  if (props.modelValue >= 4)  return 'var(--color-allied)'
  return 'var(--color-neutral)'
})
</script>

<style scoped>
.rel-slider {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

/* Track */
.rel-track {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-pill);
  background: linear-gradient(
    to right,
    var(--color-hostile)  0%,
    var(--color-neutral)  50%,
    var(--color-allied)   100%
  );
  outline: none;
  cursor: pointer;
  border: none;
  padding: 0;
}

/* Thumb — WebKit */
.rel-track::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--thumb-color, var(--color-neutral));
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  cursor: grab;
  transition: background var(--duration-fast) var(--ease-default),
              transform var(--duration-fast) var(--ease-default);
}
.rel-track::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(1.15);
}

/* Thumb — Firefox */
.rel-track::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--thumb-color, var(--color-neutral));
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  cursor: grab;
  transition: background var(--duration-fast) var(--ease-default);
}
.rel-track::-moz-range-track {
  background: linear-gradient(
    to right,
    var(--color-hostile)  0%,
    var(--color-neutral)  50%,
    var(--color-allied)   100%
  );
  height: 6px;
  border-radius: var(--radius-pill);
}

/* Labels row */
.rel-labels {
  display: flex;
  justify-content: space-between;
}

.rel-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-secondary);
  transition: color var(--duration-fast) var(--ease-default);
}

.rel-label:nth-child(2) {
  text-align: center;
}

.rel-label:last-child {
  text-align: right;
}

.rel-label--active {
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
}
</style>
