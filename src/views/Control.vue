<template>
  <div class="control-page">
    <!-- 顶部标题栏 -->
    <div class="control-topbar">
      <div class="control-title-pill">
        <el-icon class="pill-icon"><SwitchButton /></el-icon>
        <span>控制中心</span>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：控制模式与设备列表 -->
      <el-col :span="10">
        <el-card class="mode-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><SwitchButton /></el-icon>
                <span>控制模式</span>
              </div>
              <!-- 模式切换开关 -->
              <div class="mode-switch">
                <el-switch
                  v-model="isAutoMode"
                  active-text="自动"
                  inactive-text="手动"
                  @change="handleModeChange"
                  style="--el-switch-on-color: #27ae60; --el-switch-off-color: #c0c4cc"
                />
              </div>
            </div>
          </template>
          
          <div class="control-panel">
            <!-- 自动模式提示 -->
            <div v-if="isAutoMode" class="auto-hint">
              系统将根据阈值配置自动调节设备，手动开关已锁定。
            </div>

            <!-- 设备列表 -->
            <div class="device-list">
              <div v-for="device in store.controlDevices" :key="device.deviceCode" class="device-row">
                <div class="device-left">
                  <!-- 设备图标与状态颜色 -->
                  <div class="device-icon" :class="{ active: store.deviceWorkStatus[device.deviceCode] === 1 }">
                    <el-icon><component :is="getDeviceIcon(device.deviceCode)" /></el-icon>
                  </div>
                  <div class="device-meta">
                    <div class="device-name">{{ device.deviceName }}</div>
                    <div class="device-status" :class="{ 'is-off': store.deviceWorkStatus[device.deviceCode] !== 1, 'is-on': store.deviceWorkStatus[device.deviceCode] === 1 }">
                      {{ store.deviceWorkStatus[device.deviceCode] === 1 ? '运行中' : '已停止' }}
                    </div>
                  </div>
                </div>
                <!-- 设备开关 (自动模式下禁用) -->
                <el-switch
                  :model-value="store.deviceWorkStatus[device.deviceCode] === 1"
                  :disabled="isAutoMode"
                  @change="(val) => handleDeviceControl(device.deviceCode, val)"
                  style="--el-switch-on-color: #27ae60; --el-switch-off-color: #c0c4cc"
                />
              </div>
            </div>

            <!-- 系统操作日志 -->
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
      
      <!-- 右侧：阈值配置 -->
      <el-col :span="14">
        <el-card class="threshold-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon class="header-icon"><Setting /></el-icon>
                <span>阈值配置 (自动模式生效)</span>
              </div>
              <!-- 阈值编辑操作 -->
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
/**
 * Control.vue
 * 设备控制中心
 * 
 * 功能：
 * 1. 自动/手动模式切换
 * 2. 设备手动控制 (手动模式下)
 * 3. 阈值配置管理 (自动模式依赖)
 * 4. 系统控制日志展示
 */
import { ref, reactive, onMounted, watch } from 'vue'
import { useAppStore } from '@/store'
import axios from '@/api/axios'
import { ElMessage, ElNotification } from 'element-plus'
import { 
  SwitchButton, Setting, Tickets, 
  Sunny, Pouring, Timer, Odometer, 
  WindPower, Cloudy
} from '@element-plus/icons-vue'

const store = useAppStore()
const isAutoMode = ref(false) // 是否为自动模式
const isEditing = ref(false) // 是否处于阈值编辑状态
const logCollapse = ref(['logs']) // 日志折叠面板状态

// 本地阈值副本，用于编辑时暂存数据
const localThresholds = reactive(JSON.parse(JSON.stringify(store.thresholds)))

/**
 * 获取控制设备列表
 * @param {string} envCode 环境代码
 */
const fetchControlDevices = async (envCode) => {
  try {
    const res = await axios.get('/device/query/device/list', { params: { envCode } })
    store.setControlDevices(res)
    if (Array.isArray(res) && res.length > 0) {
      isAutoMode.value = res.some((device) => device.controlMode === 1)
    } else {
      isAutoMode.value = false
    }
  } catch (e) {
    console.error('获取控制设备列表失败', e)
  }
}

// 监听环境切换，重新加载设备列表
watch(() => store.currentEnv, (newEnv) => {
  if (newEnv && newEnv.envCode) {
    fetchControlDevices(newEnv.envCode)
  }
}, { deep: true })

onMounted(async () => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode')
  if (envCode) {
    await fetchControlDevices(envCode)
  }
})

/**
 * 处理设备控制开关
 * @param {string} deviceCode 设备代码
 * @param {boolean} val 开关状态
 */
const handleDeviceControl = async (deviceCode, val) => {
  const targetStatus = val ? 1 : 0
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode') || ''
  if (!envCode) {
    ElMessage.warning('请先选择环境')
    return
  }
  try {
    await axios.post('/device/update/device/control', {
      envCode,
      deviceCode,
      status: targetStatus
    })
    
    // 更新 Store 中的设备状态
    store.updateDeviceWorkStatus(deviceCode, targetStatus)
    if (val) {
      ElMessage.success(`${getDeviceName(deviceCode)} 已开启`)
    } else {
      ElMessage({
        message: `${getDeviceName(deviceCode)} 已关闭`,
        type: 'info',
        customClass: 'device-off-message'
      })
    }
    // 添加操作日志
    store.addLog('success', `手动控制: ${getDeviceName(deviceCode)} -> ${val ? 'ON' : 'OFF'}`, '控制中心')
  } catch (e) {
    console.error('设备控制错误:', e)
    ElMessage.error('网络请求失败，请检查后端服务')
  }
}

/**
 * 处理模式切换 (自动/手动)
 * @param {boolean} val 是否为自动模式
 */
const handleModeChange = async (val) => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode') || ''
  if (!envCode) {
      ElMessage.warning('请先选择环境')
      isAutoMode.value = !val // 恢复开关状态
      return
  }

  try {
    await axios.post('/device/update/devices/mode', {
      envCode: envCode,
      mode: val ? 1 : 0
    })

    if (val) {
      ElMessage.success('已切换至自动模式')
    } else {
      ElMessage.info('已切换至手动模式')
    }
  } catch (e) {
    console.error('模式切换失败:', e)
    ElMessage.error('模式切换失败，请检查网络')
    isAutoMode.value = !val // 恢复开关状态
  }
}

// 开始编辑阈值
const startEditing = () => {
  isEditing.value = true
}

// 取消编辑阈值，恢复原始数据
const cancelEditing = () => {
  isEditing.value = false
  // Reset local thresholds to store values
  Object.assign(localThresholds, JSON.parse(JSON.stringify(store.thresholds)))
  ElMessage.info('已取消修改')
}

/**
 * 保存阈值配置到后端
 */
const saveThresholds = () => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode') || ''
  if (!envCode) {
    ElMessage.warning('请先选择环境')
    return
  }

  // 环境参数类型映射
  const typeMap = {
    airTemp: 1,
    airHumidity: 2,
    soilTemp: 3,
    soilHumidity: 4,
    co2: 5,
    lightIntensity: 6
  }

  // 构建请求参数列表
  const thresholdList = Object.keys(localThresholds).map((key) => ({
    envCode,
    envParameterType: typeMap[key],
    min: localThresholds[key].min,
    max: localThresholds[key].max
  }))

  const payload = {
    envCode,
    envThresholdList: thresholdList
  }

   axios.post('/device/update/env/envthreshold', payload)
    .then(() => {
      // 更新 Store 中的阈值
      Object.keys(localThresholds).forEach((key) => {
        store.updateThreshold(key, localThresholds[key].min, localThresholds[key].max)
      })
      isEditing.value = false
      ElMessage.success('阈值配置已保存并生效')
    })
    .catch((e) => {
      console.error('保存阈值失败:', e)
      ElMessage.error('保存失败，请检查后端服务')
    })
}

// 获取设备名称
const getDeviceName = (key) => {
  const device = store.controlDevices.find(d => d.deviceCode === key)
  if (device) return device.deviceName
  return key
}

// 根据设备类型获取对应图标
const getDeviceIcon = (key) => {
  if (!key) return SwitchButton
  const k = key.toUpperCase()
  if (k.includes('FAN')) return WindPower
  if (k.includes('PUMP') || k.includes('WATER')) return Pouring
  if (k.includes('LIGHT') || k.includes('HEATER')) return Sunny
  if (k.includes('HUMIDIFIER')) return Cloudy
  if (k.includes('CO2')) return Odometer
  return SwitchButton
}

// 获取参数中文标签
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

// 获取参数图标
const getParamIcon = (key) => {
  if (key.includes('Temp')) return Timer
  if (key.includes('Humidity')) return Pouring
  if (key.includes('light')) return Sunny
  if (key.includes('co2')) return Odometer
  return Setting
}

// 获取参数单位
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

.device-status.is-on {
  color: #27ae60;
}

.device-status.is-off {
  color: #b5b7bd;
}

:deep(.el-message.device-off-message) {
  background-color: #f4f4f5;
  border-color: #e4e7ed;
}

:deep(.el-message.device-off-message .el-message__content) {
  color: #909399;
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
