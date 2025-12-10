<template>
  <span class="tag" :class="tagType">
    <span class="tag-label">{{ displayLabel }}</span>
  </span>
</template>

<script setup>
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
  justify-content: center;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  transition: all var(--motion-base) var(--easing);
  background-color: #fff;
  border: 1px solid #E5E7EB;
}

.tag-label {
  line-height: 1;
}

/* 平台标签样式 */
.tag-platform {
  background: #F3F6FB;
  color: #44546B;
  border-color: #D5DEEB;
}

/* 类型标签样式 */
.tag-type {
  background: #F3F6FB;
  color: #44546B;
  border-color: #D5DEEB;
  font-weight: 500;
}

</style>
