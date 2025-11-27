<template>
  <div class="video-generation">
    <div class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
          <rect x="2" y="6" width="14" height="12" rx="2"></rect>
        </svg>
      </div>
      <h2>API易生视频</h2>
      <p class="empty-description">功能开发中,敬请期待...</p>
    </div>
  </div>
</template>

<script setup>
// 空白页面,暂无功能实现
</script>

<style scoped>
.video-generation {
  min-height: 100vh;
  background-color: var(--c-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto var(--space-xl);
  background: var(--c-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-low);
}

.empty-icon svg {
  width: 60px;
  height: 60px;
  color: var(--c-primary);
  opacity: 0.6;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--c-text);
  margin-bottom: var(--space-md);
}

.empty-description {
  font-size: 16px;
  color: var(--c-text-muted);
  line-height: 1.6;
}
</style>
