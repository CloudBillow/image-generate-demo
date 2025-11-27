import { createRouter, createWebHistory } from 'vue-router'
import ImageGeneration from '../views/ImageGeneration.vue'
import VideoGeneration from '../views/VideoGeneration.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/volcengine-image'
    },
    {
      path: '/volcengine-seedream4-image',
      name: 'volcengine-seedream4-image',
      component: ImageGeneration,
      meta: { title: '火山Seedream4.0生图' }
    },
    {
      path: '/yi-sora2-video',
      name: 'yi-sora2-video',
      component: VideoGeneration,
      meta: { title: 'API易Sora2生视频' }
    }
  ]
})

export default router
