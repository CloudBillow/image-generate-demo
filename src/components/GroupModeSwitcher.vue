<template>
  <div class="group-mode-switcher">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="['mode-button', { active: modelValue === mode.value }]"
      @click="$emit('update:modelValue', mode.value)"
      :aria-pressed="modelValue === mode.value"
      :aria-label="`按${mode.label}分组`"
    >
      <Icon :icon="mode.icon" class="mode-icon" />
      <span>{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])

const modes = [
  {
    value: 'platform',
    label: '平台',
    icon: 'carbon:cloud-services'
  },
  {
    value: 'type',
    label: '类型',
    icon: 'carbon:category'
  }
]
</script>

<style scoped>
.group-mode-switcher {
  display: flex;
  gap: var(--space-xs, 4px);
  padding: var(--space-xs, 4px);
  margin: var(--space-md, 12px);
  background-color: var(--c-surface, #2A2B32);
  border-radius: var(--radius-button, 10px);
  box-shadow: var(--shadow-low, 0 1px 4px rgba(0,0,0,.16));
}

.mode-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs, 4px);
  padding: var(--space-sm, 8px) var(--space-md, 12px);
  border: none;
  background-color: transparent;
  color: var(--c-text-2, #9CA3AF);
  font-size: var(--font-size-xs, 12px);
  font-weight: 500;
  border-radius: var(--radius-button, 10px);
  transition: all var(--motion-base, 200ms) var(--easing, cubic-bezier(.2,.6,.2,1));
  cursor: pointer;
}

.mode-button:hover {
  background-color: var(--c-input, #40414F);
  color: var(--c-text, #ECECEC);
}

.mode-button.active {
  background: var(--g-primary, linear-gradient(90deg, #19C37D 0%, #10A37F 100%));
  color: white;
  box-shadow: var(--shadow-low, 0 1px 4px rgba(0,0,0,.16));
}

.mode-button:focus-visible {
  outline: 2px solid var(--c-primary, #10A37F);
  outline-offset: 2px;
}

.mode-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
