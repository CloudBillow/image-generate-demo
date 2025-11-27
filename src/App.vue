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
    path: '/yi-sora2-video',
    name: 'yi-sora2-video',
    label: 'API易Sora2生视频',
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
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 6px;
  border-radius: 8px;
  text-decoration: none;
  color: #6b7280;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.nav-icon {
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
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
    padding: 20px 16px;
  }

  .app-title {
    font-size: 16px;
  }

  .nav-label {
    font-size: 13px;
  }
}
</style>
