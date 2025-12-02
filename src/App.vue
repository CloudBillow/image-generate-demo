<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const menuItems = [
  {
    path: '/volcengine-seedream4-image',
    name: 'volcengine-seedream4-image',
    label: '火山Seedream4.0生图',
    icon: 'Picture'
  },
  {
    path: '/yi-bananapro-image',
    name: 'yi-bananapro-image',
    label: 'API易BananaPro生图',
    icon: 'Picture'
  },
  {
    path: '/plato-bananapro-image',
    name: 'plato-bananapro-image',
    label: '柏拉图BananaPro生图',
    icon: 'Picture'
  },
  {
    path: '/yi-sora2-video',
    name: 'yi-sora2-video',
    label: 'API易Sora2生视频',
    icon: 'VideoCamera'
  },
  {
    path: '/plato-sora2-video',
    name: 'plato-sora2-video',
    label: '柏拉图Sora2生视频',
    icon: 'VideoCamera'
  }
]

const currentRoute = computed(() => route.name)
</script>

<template>
  <div class="app-container">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">生成工具平台</h1>
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: currentRoute === item.name }"
        >
          <el-icon class="nav-icon">
            <component :is="item.icon" />
          </el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
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

.sidebar-nav {
  flex: 1;
  padding: var(--space-lg) var(--space-md);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  margin-bottom: 6px;
  border-radius: var(--radius-button);
  text-decoration: none;
  color: var(--c-text-2);
  transition: all var(--motion-base) var(--easing);
  cursor: pointer;
}

.nav-item:hover {
  background-color: var(--c-input);
  color: var(--c-text);
}

.nav-item.active {
  background: var(--g-primary);
  color: #ffffff;
  font-weight: 500;
}

.nav-icon {
  font-size: 20px;
  margin-right: var(--space-md);
  flex-shrink: 0;
}

.nav-label {
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
