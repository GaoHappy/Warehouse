import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/editer',
  },
  {
    path: '/show',
    name: 'Warehouse3D',
    component: () => import('@/views/Warehouse3D/index.vue'),
  },
  {
    path: '/editer',
    name: 'WarehouseConfig',
    component: () => import('@/views/WarehouseConfig/index.vue'),
  },
  {
    path: '/digital-twin',
    name: 'DigitalTwin',
    component: () => import('@/views/DigitalTwin/index.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
