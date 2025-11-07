<template>
  <div class="mode-switcher">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="['mode-button', { active: modelValue === mode.value }]"
      @click="$emit('update:modelValue', mode.value)"
      :aria-pressed="modelValue === mode.value"
    >
      {{ mode.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])

const modes = [
  { value: 'text-to-image', label: '文生图' },
  { value: 'text-to-images', label: '文生组图' },
  { value: 'image-to-image', label: '图生图' },
  { value: 'multi-image-fusion', label: '多图生图' },
  { value: 'images-to-images', label: '多图生组图' }
]
</script>

<style scoped>
.mode-switcher {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-xs);
  background-color: var(--c-surface);
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-low);
}

.mode-button {
  flex: 1;
  padding: var(--space-md) var(--space-xl);
  border: none;
  background-color: transparent;
  color: var(--c-text-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: var(--radius-button);
  transition: all var(--motion-base) var(--easing);
}

.mode-button:hover {
  background-color: var(--c-input);
  color: var(--c-text);
}

.mode-button:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
</style>
