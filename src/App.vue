<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed, watch } from 'vue'
import GroupModeSwitcher from './components/GroupModeSwitcher.vue'
import GroupedNav from './components/GroupedNav.vue'
import { useMenuGrouping } from './composables/useMenuGrouping'

const route = useRoute()

// 使用菜单分组 composable
const {
  groupMode,
  currentMenu,
  setGroupMode,
  toggleGroup,
  isGroupExpanded,
  expandGroupByRoute
} = useMenuGrouping()

const currentRoute = computed(() => route.name)

// 监听路由变化，自动展开对应分组
watch(currentRoute, (newRoute) => {
  expandGroupByRoute(newRoute)
}, { immediate: true })
</script>

<template>
  <div class="app-container">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">生成工具平台</h1>
      </div>

      <!-- 分组模式切换器 -->
      <GroupModeSwitcher
        v-model="groupMode"
        @update:model-value="setGroupMode"
      />

      <!-- 分组导航 -->
      <GroupedNav
        :menu="currentMenu"
        :current-route="currentRoute"
        :is-expanded="isGroupExpanded"
        @toggle-group="toggleGroup"
      />
    </aside>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Global styles are defined in assets/main.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--c-bg, #f5f5f5);
}

.app-sidebar {
  width: 240px;
  background-color: var(--c-surface);
  box-shadow: var(--shadow-low);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: var(--space-2xl) var(--space-xl);
  border-bottom: 1px solid var(--c-border);
}

.app-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--c-text);
  letter-spacing: 0.5px;
}


.app-main {
  flex: 1;
  margin-left: 240px;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 200px;
  }

  .app-main {
    margin-left: 200px;
  }

  .sidebar-header {
    padding: var(--space-xl) var(--space-lg);
  }

  .app-title {
    font-size: var(--font-size-base);
  }

  .nav-label {
    font-size: 13px;
  }
}
</style>
