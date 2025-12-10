import { createRouter, createWebHistory } from 'vue-router'
import ImageGeneration from '../views/ImageGeneration.vue'
import VideoGeneration from '../views/VideoGeneration.vue'
import BananaProImageGeneration from '../views/BananaProImageGeneration.vue'
import PlatoImageGeneration from '../views/PlatoImageGeneration.vue'
import PlatoSora2VideoGeneration from '../views/PlatoSora2VideoGeneration.vue'
import TongyiWanxiangVideoGeneration from '../views/TongyiWanxiangVideoGeneration.vue'
import SeedanceProVideoGeneration from '../views/SeedanceProVideoGeneration.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/app/volcengine-seedream4-image'
    },
    {
      path: '/app/volcengine-seedream4-image',
      name: 'volcengine-seedream4-image',
      component: ImageGeneration,
      meta: { title: '火山Seedream4生图' }
    },
    {
      path: '/app/yi-bananapro-image',
      name: 'yi-bananapro-image',
      component: BananaProImageGeneration,
      meta: { title: 'API易BananaPro生图' }
    },
    {
      path: '/app/plato-bananapro-image',
      name: 'plato-bananapro-image',
      component: PlatoImageGeneration,
      meta: { title: '柏拉图BananaPro生图' }
    },
    {
      path: '/app/yi-sora2-video',
      name: 'yi-sora2-video',
      component: VideoGeneration,
      meta: { title: 'API易Sora2生视频' }
    },
    {
      path: '/app/plato-sora2-video',
      name: 'plato-sora2-video',
      component: PlatoSora2VideoGeneration,
      meta: { title: '柏拉图Sora2生视频' }
    },
    {
      path: '/app/tongyi-wanxiang-video',
      name: 'tongyi-wanxiang-video',
      component: TongyiWanxiangVideoGeneration,
      meta: { title: '通义万相2.5生视频' }
    },
    {
      path: '/app/volcengine-seedance-pro-video',
      name: 'volcengine-seedance-pro-video',
      component: SeedanceProVideoGeneration,
      meta: { title: '火山Seedance1.0Pro生视频' }
    }
  ]
})

export default router
