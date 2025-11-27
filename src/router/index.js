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
      path: '/volcengine-image',
      name: 'volcengine-image',
      component: ImageGeneration,
      meta: { title: '火山引擎生图' }
    },
    {
      path: '/video-generation',
      name: 'video-generation',
      component: VideoGeneration,
      meta: { title: 'API易生视频' }
    }
  ]
})

export default router
