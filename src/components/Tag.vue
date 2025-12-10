<template>
  <span class="tag" :class="tagType">
    <Icon :icon="iconName" class="tag-icon" />
    <span class="tag-label">{{ displayLabel }}</span>
  </span>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['platform', 'type'].includes(value)
  },
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  }
})

// 平台配置
const platformConfig = {
  volcengine: {
    label: '火山引擎',
    icon: 'carbon:cloud-services'
  },
  yi: {
    label: 'API易',
    icon: 'carbon:api'
  },
  plato: {
    label: '柏拉图',
    icon: 'carbon:platform'
  },
  tongyi: {
    label: '通义万相',
    icon: 'carbon:ai-governance-tracked'
  }
}

// 类型配置
const typeConfig = {
  image: {
    label: '图像',
    icon: 'carbon:image'
  },
  video: {
    label: '视频',
    icon: 'carbon:video'
  }
}

// 获取图标名称
const iconName = computed(() => {
  if (props.type === 'platform') {
    return platformConfig[props.value]?.icon || 'carbon:application'
  } else {
    return typeConfig[props.value]?.icon || 'carbon:application'
  }
})

// 获取显示标签
const displayLabel = computed(() => {
  if (props.label) {
    return props.label
  }
  if (props.type === 'platform') {
    return platformConfig[props.value]?.label || props.value
  } else {
    return typeConfig[props.value]?.label || props.value
  }
})

// 标签类型类名
const tagType = computed(() => `tag-${props.type}`)
</script>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  transition: all var(--motion-base) var(--easing);
}

.tag-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.tag-label {
  line-height: 1;
}

/* 平台标签样式 */
.tag-platform {
  background: linear-gradient(135deg, rgba(16, 163, 127, 0.15), rgba(25, 195, 125, 0.15));
  color: var(--c-primary-300, #19C37D);
  border: 1px solid rgba(16, 163, 127, 0.2);
}

/* 类型标签样式 */
.tag-type {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.15));
  color: #60A5FA;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Hover 效果 */
.tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
