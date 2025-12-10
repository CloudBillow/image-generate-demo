<template>
  <nav class="grouped-nav">
    <div
      v-for="group in menu"
      :key="group.groupKey"
      class="nav-group"
    >
      <!-- 分组头部（可点击折叠） -->
      <button
        class="group-header"
        @click="$emit('toggle-group', group.groupKey)"
        :aria-expanded="isExpanded(group.groupKey)"
      >
        <Icon :icon="group.groupIcon" class="group-icon" />
        <span class="group-label">{{ group.groupLabel }}</span>
        <el-icon
          class="expand-icon"
          :class="{ expanded: isExpanded(group.groupKey) }"
        >
          <ArrowRight />
        </el-icon>
      </button>

      <!-- 分组内容（可折叠动画） -->
      <Transition name="expand">
        <div
          v-show="isExpanded(group.groupKey)"
          class="group-content"
        >
          <RouterLink
            v-for="item in group.children"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: currentRoute === item.name }"
          >
            <!-- 标签在前面 -->
            <Tag
              :type="item.tagType"
              :value="item.tagValue"
              :label="item.tagLabel"
              class="item-tag"
            />
            <!-- 模型名称 -->
            <span class="nav-label">{{ item.modelLabel }}</span>
            <!-- Element Plus 图标 -->
            <el-icon class="nav-icon">
              <component :is="item.icon" />
            </el-icon>
          </RouterLink>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { RouterLink } from 'vue-router'
import Tag from './Tag.vue'

defineProps({
  menu: {
    type: Array,
    required: true
  },
  currentRoute: {
    type: String,
    required: true
  },
  isExpanded: {
    type: Function,
    required: true
  }
})

defineEmits(['toggle-group'])
</script>

<style scoped>
.grouped-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 12px);
  padding: var(--space-md, 12px);
  overflow-y: auto;
}

.nav-group {
  /* 分组容器 */
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  padding: var(--space-sm, 8px) var(--space-lg, 16px);
  border: none;
  background-color: transparent;
  color: var(--c-text, #ECECEC);
  font-size: var(--font-size-sm, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-base, 200ms) var(--easing, cubic-bezier(.2,.6,.2,1));
  border-radius: var(--radius-button, 10px);
}

.group-header:hover {
  background-color: var(--c-input, #40414F);
}

.group-icon {
  width: 20px;
  height: 20px;
  margin-right: var(--space-md, 12px);
  color: var(--c-primary, #10A37F);
  flex-shrink: 0;
}

.group-label {
  flex: 1;
  text-align: left;
}

.expand-icon {
  font-size: 16px;
  transition: transform var(--motion-base, 200ms) var(--easing, cubic-bezier(.2,.6,.2,1));
  color: var(--c-text-2, #9CA3AF);
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.group-content {
  padding-left: var(--space-md, 12px);
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm, 8px);
  padding: var(--space-sm, 8px) var(--space-lg, 16px);
  margin-bottom: 4px;
  border-radius: var(--radius-button, 10px);
  text-decoration: none;
  color: var(--c-text-2, #9CA3AF);
  font-size: var(--font-size-sm, 14px);
  transition: all var(--motion-base, 200ms) var(--easing, cubic-bezier(.2,.6,.2,1));
  cursor: pointer;
}

.nav-item:hover {
  background-color: var(--c-input, #40414F);
  color: var(--c-text, #ECECEC);
  padding-left: calc(var(--space-lg, 16px) + 4px);
}

.nav-item.active {
  background: var(--g-primary, linear-gradient(90deg, #19C37D 0%, #10A37F 100%));
  color: #ffffff;
  font-weight: 500;
}

.item-tag {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

/* 折叠展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all var(--motion-base, 200ms) var(--easing, cubic-bezier(.2,.6,.2,1));
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .nav-label {
    font-size: 13px;
  }

  .item-tag {
    font-size: 11px;
  }
}
</style>
