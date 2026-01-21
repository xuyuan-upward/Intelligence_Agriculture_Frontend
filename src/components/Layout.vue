<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header height="80px" class="main-header">
      <div class="header-inner">
        <!-- 左侧环境选择区域 -->
        <div class="header-left">
          <!-- 农业主题监测图标 -->
          <img src="@/assets/agri-monitor-icon.svg" class="agri-monitor-icon" alt="Agri Monitor">
          <el-select
            v-model="selectedEnvCode"
            size="default"
            placeholder="选择环境实例"
            class="env-select"
            filterable
            @change="handleEnvChange"
          >
            <el-option
              v-for="env in store.envList"
              :key="env.envCode"
              :label="env.envName || env.envCode"
              :value="env.envCode"
            />
          </el-select>
        </div>

        <!-- 中间标题区域 -->
        <div class="header-center">
          <el-icon :size="40" class="logo-icon"><Platform /></el-icon>
          <h1 class="system-title">基于 Spring Boot 与 AI 预测的智能农业监控系统</h1>
          <el-icon :size="40" class="logo-icon"><Platform /></el-icon>
        </div>

        <!-- 右侧用户信息 -->
        <div class="header-right">
          <el-button v-if="!store.token" type="primary" @click="$router.push('/login')">登录</el-button>
          <el-dropdown v-else trigger="click">
            <div class="user-info-display">
              <el-avatar :size="32" class="user-avatar"><User /></el-avatar>
              <span class="username">{{ store.username || store.role || '用户' }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
                <el-dropdown-item @click="handleEditProfile">
                  <el-icon><Edit /></el-icon>个人信息修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleChangePassword">
                  <el-icon><Lock /></el-icon>密码修改
                </el-dropdown-item>
                <el-dropdown-item @click="handleUserInfo">
                  <el-icon><User /></el-icon>用户信息展示
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>
    <el-container class="content-container">
      <!-- 侧边导航栏 -->
      <el-aside width="220px" class="main-aside">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          :collapse="false"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区域 -->
      <el-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
/**
 * Layout.vue
 * 全局布局组件
 * 
 * 包含：
 * 1. 顶部标题栏 (Header)
 * 2. 左侧导航菜单 (Sidebar)
 * 3. 环境切换功能 (Environment Selector)
 * 4. 主内容路由视图 (Router View)
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, SwitchButton, DataLine, TrendCharts, Platform, User, Edit, Lock, ArrowDown } from '@element-plus/icons-vue'
import axios from '@/api/axios'
import { useAppStore } from '@/store'

// 引入 Store 和 路由
const store = useAppStore()
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

// 当前选中的环境代码
const selectedEnvCode = ref('')
const role = computed(() => store.role || localStorage.getItem('auth_role') || '')
const menuItems = computed(() => {
  const items = [
    { path: '/dashboard', label: '实时监控与告警', icon: Monitor },
    { path: '/control', label: '设备控制中心', icon: SwitchButton },
    { path: '/history', label: '历史数据分析', icon: DataLine },
    { path: '/prediction', label: 'AI 预测与建议', icon: TrendCharts },
    { path: '/users', label: '用户管理', icon: User }
  ]
  if (role.value === 'ADMIN') {
    return items
  }
  return items.filter((item) => item.path === '/dashboard')
})

/**
 * 加载环境列表
 * 从后端获取环境列表，并初始化当前选中的环境
 */
const loadEnv = async () => {
  // 获取环境列表
  const list = await axios.get('/device/query/env/list')
  store.setEnvList(list)

  // 尝试从本地存储获取上次选中的环境
  const savedEnvCode = localStorage.getItem('currentEnvCode')
  // 获取当前环境详情 (如果有保存的 code 则用，否则后端可能返回默认)
  const current = await axios.get('/device/query/env/current', { params: { envCode: savedEnvCode || '' } })
  store.setCurrentEnv(current)
  selectedEnvCode.value = current?.envCode || ''
}

/**
 * 处理环境切换
 * @param {string} envCode - 选中的环境代码
 */
const handleEnvChange = (envCode) => {
  const env = store.envList.find((e) => e.envCode === envCode) || null
  store.setCurrentEnv(env)
  localStorage.setItem('currentEnvCode', envCode || '')
}
const handleLogout = () => {
  store.clearAuth()
  router.push('/login')
}

const handleEditProfile = () => {
  ElMessage.info('个人信息修改功能开发中...')
}

const handleChangePassword = () => {
  ElMessage.info('密码修改功能开发中...')
}

const handleUserInfo = () => {
  ElMessage.info('用户信息展示功能开发中...')
}

// 组件挂载时加载环境数据
onMounted(() => {
  loadEnv()
})
</script>

<style scoped>
/* 布局容器样式 */
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: var(--app-bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* 顶部 Header 样式 */
.main-header {

  color: rgb(62, 60, 60);
  padding: 0;
 
  
  position: relative;
}

.header-inner {
  max-width: 100%;
  margin: 0;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  width: 212px; /* 调整宽度与侧边栏对齐 */
  justify-content: flex-start;
  padding-left: 0px; /* 增加左侧间距 */
}

.agri-monitor-icon {
  width: 32px;
  height: 32px;
  margin-right: 8px; /* 稍微缩小图标与选择器的间距 */
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
  cursor: pointer;
}

.agri-monitor-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(39, 174, 96, 0.3));
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.logo-icon {
  font-size: 40px;
  color: #27ae60;
}

.system-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #2c3e50;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;  
  justify-content: flex-end;
  gap: 20px;
}

.user-info-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(39, 174, 96, 0.2);
}

.user-info-display:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: #27ae60;
}

.user-avatar {
  background: #27ae60;
  color: white;
}

.username {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.env-select {
  flex: 1; /* 让选择器填充剩余空间 */
  margin-right: 10px; /* 确保右侧与菜单项左侧对齐 */
}

.env-select :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 1px rgba(39, 174, 96, 0.2) inset;
}

.env-select :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px #27ae60 inset;
}

.content-container {
  flex: 1;
  overflow: hidden;
  width: 100%;
}

/* 侧边栏样式 */
.main-aside {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  padding-top: 20px;
}

.el-menu-vertical {
  border-right: none;
  background: transparent !important;
}

:deep(.el-menu) {
  background-color: transparent !important;
  border-right: none;
}

:deep(.el-menu-item) {
  font-size: 15px;
  margin: 4px 10px;
  border-radius: 6px;
  height: 50px;
  color: var(--agri-text-primary);
  background-color: rgba(255, 255, 255, 0.22) !important;
  border-left: 3px solid rgba(39, 174, 96, 0);
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(39, 174, 96, 0.16) !important;
  color: #27ae60;
  font-weight: 600;
  border-left-color: #27ae60;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.32) !important;
}

.el-main {
  background-color: transparent;
  padding: 20px;
  overflow-y: auto;
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
