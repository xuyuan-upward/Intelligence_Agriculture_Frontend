<template>
  <div class="control-page">
    <div class="control-topbar">
      <div class="control-title-pill">
        <el-icon class="pill-icon"><SwitchButton /></el-icon>
        <span>控制中心</span>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card class="mode-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><SwitchButton /></el-icon>
                <span>控制模式</span>
              </div>
              <div class="mode-switch">
                <span class="mode-label">{{ isAutoMode ? '自动模式' : '手动模式' }}</span>
                <el-switch
                  v-model="isAutoMode"
                  @change="handleModeChange"
                  style="--el-switch-on-color: #27ae60; --el-switch-off-color: #c0c4cc"
                />
              </div>
            </div>
          </template>
          
          <div class="control-panel">
            <div v-if="isAutoMode" class="auto-hint">
              系统将根据阈值配置自动调节设备，手动开关已锁定。
            </div>

            <div class="device-list">
              <div v-for="(status, device) in store.deviceStatus" :key="device" class="device-row">
                <div class="device-left">
                  <div class="device-icon" :class="{ active: status }">
                    <el-icon><component :is="getDeviceIcon(device)" /></el-icon>
                  </div>
                  <div class="device-meta">
                    <div class="device-name">{{ getDeviceName(device) }}</div>
                    <div class="device-status">{{ status ? '运行中' : '已停止' }}</div>
                  </div>
                </div>
                <el-switch
                  v-model="store.deviceStatus[device]"
                  :disabled="isAutoMode"
                  @change="(val) => handleDeviceControl(device, val)"
                  style="--el-switch-on-color: #27ae60; --el-switch-off-color: #c0c4cc"
                />
              </div>
            </div>

            <el-collapse v-model="logCollapse" class="log-collapse">
              <el-collapse-item name="logs">
                <template #title>
                  <div class="collapse-title">
                    <el-icon><Tickets /></el-icon>
                    <span>系统控制日志</span>
                  </div>
                </template>
                <el-scrollbar height="220px">
                  <div v-if="store.systemLogs.length === 0" class="empty-log">暂无操作记录</div>
                  <div v-else v-for="(log, index) in store.systemLogs" :key="index" class="log-item">
                    <div class="log-left">
                      <el-tag size="small" :type="log.type === 'auto' ? 'success' : (log.type === 'ai' ? 'warning' : 'primary')" class="log-tag">
                        {{ log.source }}
                      </el-tag>
                      <span class="log-message">{{ log.message }}</span>
                    </div>
                    <div class="log-time">{{ log.time }}</div>
                  </div>
                </el-scrollbar>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="14">
        <el-card class="threshold-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><Setting /></el-icon>
                <span>阈值配置 (自动模式生效)</span>
              </div>
              <div class="header-actions">
                <el-button v-if="!isEditing" type="success" size="small" @click="startEditing">修改阈值</el-button>
                <template v-else>
                  <el-button size="small" @click="cancelEditing">取消</el-button>
                  <el-button type="success" size="small" @click="saveThresholds">保存配置</el-button>
                </template>
              </div>
            </div>
          </template>
          
          <el-form :model="localThresholds" label-width="120px" class="threshold-form">
            <el-scrollbar height="500px">
              <div class="threshold-grid">
                <div v-for="(range, key) in localThresholds" :key="key" class="threshold-item-container">
                  <div class="threshold-header">
                    <el-icon class="threshold-icon"><component :is="getParamIcon(key)" /></el-icon>
                    <span>{{ getLabel(key) }}</span>
                  </div>
                  <div class="threshold-inputs">
                    <el-form-item label="下限阈值" class="threshold-form-item">
                      <el-input-number v-model="range.min" :step="1" size="small" :disabled="!isEditing" />
                      <span class="unit">{{ getUnit(key) }}</span>
                    </el-form-item>
                    <el-form-item label="上限阈值" class="threshold-form-item last">
                      <el-input-number v-model="range.max" :step="1" size="small" :disabled="!isEditing" />
                      <span class="unit">{{ getUnit(key) }}</span>
                    </el-form-item>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAppStore } from '@/store'
import { ElMessage, ElNotification } from 'element-plus'
import { 
  SwitchButton, Setting, Tickets, 
  Sunny, Pouring, Timer, Odometer, 
  VideoPlay, WindPower, Cloudy
} from '@element-plus/icons-vue'

const store = useAppStore()
const isAutoMode = ref(false)
// const autoLogs = ref([]) // Removed in favor of store.systemLogs
const isEditing = ref(false)
const logCollapse = ref(['logs'])

// Deep copy thresholds for editing
const localThresholds = reactive(JSON.parse(JSON.stringify(store.thresholds)))

const startEditing = () => {
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  // Reset local thresholds to store values
  Object.assign(localThresholds, JSON.parse(JSON.stringify(store.thresholds)))
  ElMessage.info('已取消修改')
}

const getDeviceName = (key) => {
  const map = {
    pump: '水泵',
    fan: '通风风扇',
    light: '补光灯',
    heater: '加热器',
    humidifier: '加湿器'
  }
  return map[key] || key
}

const getDeviceIcon = (key) => {
  const map = {
    pump: Pouring,
    fan: WindPower,
    light: Sunny,
    heater: Sunny, // Or specific heater icon
    humidifier: Cloudy
  }
  return map[key] || SwitchButton
}

const getLabel = (key) => {
  const map = {
    airTemp: '空气温度',
    airHumidity: '空气湿度',
    lightIntensity: '光照强度',
    soilHumidity: '土壤湿度',
    soilTemp: '土壤温度',
    co2: 'CO2 浓度'
  }
  return map[key] || key
}

const getParamIcon = (key) => {
  if (key.includes('Temp')) return Timer
  if (key.includes('Humidity')) return Pouring
  if (key.includes('light')) return Sunny
  if (key.includes('co2')) return Odometer
  return Setting
}

const getUnit = (key) => {
  const map = {
    airTemp: '°C',
    airHumidity: '%',
    lightIntensity: 'Lux',
    soilHumidity: '%',
    soilTemp: '°C',
    co2: 'ppm'
  }
  return map[key] || ''
}

const handleModeChange = (val) => {
  if (val) {
    ElMessage.success('已切换至自动模式')
    startAutoControlSimulation()
  } else {
    ElMessage.info('已切换至手动模式')
    stopAutoControlSimulation()
  }
}

const handleDeviceControl = (device, status) => {
  const action = status ? '开启' : '关闭'
  const deviceName = getDeviceName(device)
  ElMessage.success(`${deviceName} 已${action}`)
  store.addLog('manual', `用户手动${action}了${deviceName}`, '控制中心')
}

const saveThresholds = () => {
  Object.keys(localThresholds).forEach(key => {
    store.updateThreshold(key, localThresholds[key].min, localThresholds[key].max)
  })
  isEditing.value = false
  ElMessage.success('阈值配置已保存')
}

// Simulation of Auto Control Logic
let autoInterval = null

const startAutoControlSimulation = () => {
  autoInterval = setInterval(() => {
    if (Math.random() > 0.7) {
      triggerAutoAction()
    }
  }, 3000)
}

const stopAutoControlSimulation = () => {
  if (autoInterval) clearInterval(autoInterval)
}

const triggerAutoAction = () => {
  const scenarios = [
    { condition: '当前湿度阈值过低', device: 'pump', deviceName: '水泵', action: '开启' },
    { condition: '当前光照过低', device: 'light', deviceName: '补光灯', action: '开启' },
    { condition: '当前温度过高', device: 'fan', deviceName: '通风风扇', action: '开启' },
    { condition: '当前湿度过低', device: 'humidifier', deviceName: '加湿器', action: '开启' }
  ]
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  
  // Update state
  store.deviceStatus[scenario.device] = true
  
  const msg = `${scenario.condition}，已经自动${scenario.action}${scenario.deviceName}`
  store.addLog('auto', msg, '自动控制')
  
  ElNotification({
    title: '自动控制触发',
    message: msg,
    type: 'success',
    duration: 5000
  })
}

</script>

<style scoped>
.control-page {
  padding: 12px;
}

.control-topbar {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(238, 232, 232, 0.42);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.control-title-pill  {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
   color: #287c42;
}


.pill-icon {
  font-size: 16px;
}

.mode-card,
.threshold-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 900;
  color: #2a2a2a;
}

.header-icon {
  font-size: 20px;
  color: #2e8b57;
}

.mode-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-label {
  font-size: 13px;
  color: #606266;
  font-weight: 800;
}

.control-panel {
  min-height: 500px;
}

.auto-hint {
  padding: 10px 12px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: rgba(39, 174, 96, 0.08);
  border: 1px solid rgba(39, 174, 96, 0.18);
  color: #2e8b57;
  font-weight: 700;
  font-size: 13px;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.92);
  transition: box-shadow 0.2s, transform 0.2s;
}

.device-row:hover {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.device-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background-color: rgba(46, 139, 87, 0.12);
  color: #2e8b57;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s;
}

.device-icon.active {
  background-color: rgba(39, 174, 96, 0.18);
  color: #27ae60;
}

.device-meta {
  display: flex;
  flex-direction: column;
}

.device-name {
  font-weight: 900;
  font-size: 14px;
  color: #2a2a2a;
}

.device-status {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.log-collapse {
  margin-top: 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.collapse-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 900;
  color: #2a2a2a;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.log-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.log-tag {
  border-radius: 10px;
}

.log-message {
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}

.log-time {
  color: #909399;
  font-size: 12px;
}

.empty-log {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.threshold-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.threshold-item-container {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.threshold-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-weight: 900;
  color: #2a2a2a;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}

.threshold-icon {
  color: #2e8b57;
}

.threshold-form-item {
  margin-bottom: 10px;
}

.threshold-form-item.last {
  margin-bottom: 0;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

:deep(.el-collapse-item__header) {
  padding: 0 12px;
  height: 46px;
  background: rgba(255, 255, 255, 0.92);
}

:deep(.el-collapse-item__wrap) {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.el-collapse) {
  border-top: none;
  border-bottom: none;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 700;
}
</style>
