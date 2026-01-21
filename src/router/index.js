import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue'
import Dashboard from '@/views/Dashboard.vue'
import Control from '@/views/Control.vue'
import History from '@/views/History.vue'
import Prediction from '@/views/Prediction.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import UserManagement from '@/views/UserManagement.vue'

// 创建路由实例
const router = createRouter({
  // 使用 HTML5 History 模式
  history: createWebHistory(import.meta.env.BASE_URL),
  // 路由配置
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { public: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: Register,
      meta: { public: true }
    },
    {
      path: '/',
      component: Layout, // 根布局组件
      redirect: '/dashboard', // 默认重定向到仪表盘
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
          meta: { title: '控制中心', roles: ['ADMIN'] }
        },
        {
          path: 'history',
          name: 'History',
          component: History,
          meta: { title: '历史数据', roles: ['ADMIN'] }
        },
        {
          path: 'prediction',
          name: 'Prediction',
          component: Prediction,
          meta: { title: 'AI 预测', roles: ['ADMIN'] }
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: UserManagement,
          meta: { title: '用户管理', roles: ['ADMIN'] }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const role = localStorage.getItem('auth_role')
  if (to.meta.public) {
    if (token && (to.path === '/login' || to.path === '/register')) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }
  if (!token) {
    next('/login')
    return
  }
  if (to.meta.roles && !to.meta.roles.includes(role)) {
    next('/dashboard')
    return
  }
  next()
})

export default router
