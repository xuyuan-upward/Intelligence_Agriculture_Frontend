import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Dashboard from '@/views/Dashboard.vue'
import Control from '@/views/Control.vue'
import History from '@/views/History.vue'
import Prediction from '@/views/Prediction.vue'

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(import.meta.env.BASE_URL),
  // 路由配置
  routes: [
    {
      path: '/',
      component: Layout, // 根布局组件
      redirect: '/dashboard', // 默认重定向到仪表盘
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: '实时监控' } // 路由元信息，用于显示标题
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
