<template>
  <el-container class="layout-container">
    <!-- Top Banner Header -->
    <el-header height="80px" class="main-header">
      <div class="header-inner">
        <div class="logo-area">
          <el-icon :size="32" class="logo-icon"><Platform /></el-icon>
        </div>
        <div class="header-center">
          <h1 class="system-title">基于 Spring Boot 与 AI 预测的智能农业监控系统</h1>
        </div>
        <div class="header-right" />
      </div>
    </el-header>
    <el-container class="content-container">
      <!-- Optional Sidebar for Navigation if needed, or we can use Tabs in Dashboard -->
      <!-- Keeping Sidebar for navigation between views if user wants to switch context -->
      <el-aside width="220px" class="main-aside">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          router
          :collapse="false"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>实时监控与告警</span>
          </el-menu-item>
          <el-menu-item index="/control">
            <el-icon><SwitchButton /></el-icon>
            <span>设备控制中心</span>
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon><DataLine /></el-icon>
            <span>历史数据分析</span>
          </el-menu-item>
          <el-menu-item index="/prediction">
            <el-icon><TrendCharts /></el-icon>
            <span>AI 预测与建议</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Monitor, SwitchButton, DataLine, TrendCharts, Platform } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
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

.main-header {
  background: linear-gradient(90deg, rgba(39, 174, 96, 0.78) 0%, rgba(46, 204, 113, 0.78) 100%);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2);
  z-index: 100;
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
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.logo-icon {
  font-size: 32px;
  color: white;
}

.system-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 200px; /* Fixed width to help centering */
  justify-content: flex-end;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
