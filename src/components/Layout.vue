<template>
  <el-container class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header height="80px" class="main-header">
      <div class="header-inner">
        <!-- 标题区域 -->
        <div class="header-center">
          <el-icon :size="48" class="logo-icon"><Platform /></el-icon>
          <h1 class="system-title">基于 Spring Boot 与 AI 预测的智能农业监控系统</h1>
            <el-icon :size="48" class="logo-icon"><Platform /></el-icon>
        </div>
        <!-- 右侧环境选择区域 -->
        <div class="header-right">
          <el-select
            v-model="selectedEnvCode"
            size="small"
            placeholder="选择环境"
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
          <!-- 实时监控菜单 -->
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>实时监控与告警</span>
          </el-menu-item>
          <!-- 设备控制菜单 -->
          <el-menu-item index="/control">
            <el-icon><SwitchButton /></el-icon>
            <span>设备控制中心</span>
          </el-menu-item>
          <!-- 历史数据菜单 -->
          <el-menu-item index="/history">
            <el-icon><DataLine /></el-icon>
            <span>历史数据分析</span>
          </el-menu-item>
          <!-- AI 预测菜单 -->
          <el-menu-item index="/prediction">
            <el-icon><TrendCharts /></el-icon>
            <span>AI 预测与建议</span>
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
import { useRoute } from 'vue-router'
import { Monitor, SwitchButton, DataLine, TrendCharts, Platform } from '@element-plus/icons-vue'
import axios from '@/api/axios'
import { useAppStore } from '@/store'

// 引入 Store 和 路由
const store = useAppStore()
const route = useRoute()

// 当前激活的菜单项，根据路由路径自动高亮
const activeMenu = computed(() => route.path)

// 当前选中的环境代码
const selectedEnvCode = ref('')

/**
 * 加载环境列表
 * 从后端获取环境列表，并初始化当前选中的环境
 */
const loadEnv = async () => {
  // 获取环境列表
  const list = await axios.get('/query/env/list')
  store.setEnvList(list)

  // 尝试从本地存储获取上次选中的环境
  const savedEnvCode = localStorage.getItem('currentEnvCode')
  // 获取当前环境详情 (如果有保存的 code 则用，否则后端可能返回默认)
  const current = await axios.get('/query/env/current', { params: { envCode: savedEnvCode || '' } })
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
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 200px; /* Fixed width to help centering */
  justify-content: flex-end;
}

.header-center {
  padding-left: 120px;
  flex: 1;
  display: flex;
  justify-content: center;
}

.logo-icon {
  font-size: 48px;
  color: white;
}

.system-title {
  margin-top: 5px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 6px rgba(123, 119, 119, 0.25);
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 200px; /* Fixed width to help centering */
  justify-content: flex-end;
}

.env-select {
  width: 180px;
}

.date-time {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.username {
  font-size: 16px;
  font-weight: 500;
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
