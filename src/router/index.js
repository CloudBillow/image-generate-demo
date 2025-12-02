import { createRouter, createWebHistory } from 'vue-router'
import ImageGeneration from '../views/ImageGeneration.vue'
import VideoGeneration from '../views/VideoGeneration.vue'
import BananaProImageGeneration from '../views/BananaProImageGeneration.vue'
import PlatoImageGeneration from '../views/PlatoImageGeneration.vue'
import PlatoSora2VideoGeneration from '../views/PlatoSora2VideoGeneration.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/volcengine-seedream4-image'
    },
    {
      path: '/volcengine-seedream4-image',
      name: 'volcengine-seedream4-image',
      component: ImageGeneration,
      meta: { title: '火山Seedream4.0生图' }
    },
    {
      path: '/yi-bananapro-image',
      name: 'yi-bananapro-image',
      component: BananaProImageGeneration,
      meta: { title: 'API易BananaPro生图' }
    },
    {
      path: '/plato-bananapro-image',
      name: 'plato-bananapro-image',
      component: PlatoImageGeneration,
      meta: { title: '柏拉图BananaPro生图' }
    },
    {
      path: '/yi-sora2-video',
      name: 'yi-sora2-video',
      component: VideoGeneration,
      meta: { title: 'API易Sora2生视频' }
    },
    {
      path: '/plato-sora2-video',
      name: 'plato-sora2-video',
      component: PlatoSora2VideoGeneration,
      meta: { title: '柏拉图Sora2生视频' }
    }
  ]
})

export default router
