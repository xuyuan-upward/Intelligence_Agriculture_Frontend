import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Dashboard from '@/views/Dashboard.vue'
import Control from '@/views/Control.vue'
import History from '@/views/History.vue'
import Prediction from '@/views/Prediction.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: '实时监控' }
        },
        {
          path: 'control',
          name: 'Control',
          component: Control,
          meta: { title: '控制中心' }
        },
        {
          path: 'history',
          name: 'History',
          component: History,
          meta: { title: '历史数据' }
        },
        {
          path: 'prediction',
          name: 'Prediction',
          component: Prediction,
          meta: { title: 'AI 预测' }
        }
      ]
    }
  ]
})

export default router
