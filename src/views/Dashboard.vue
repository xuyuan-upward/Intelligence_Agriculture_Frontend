<template>
  <div class="dashboard-container">
    <!-- 顶部行: 实时监控与告警 -->
    <el-row :gutter="20">
      <!-- 左侧列: 实时环境监测数据 -->
      <el-col :span="16">
        <el-card class="section-card">
          <template #header>
            <div class="card-header-flex">
              <span class="header-title">
                <el-icon><Odometer /></el-icon> 实时环境监测数据
              </span>
              <el-tag type="success" effect="dark" size="small">实时更新中</el-tag>
            </div>
          </template>
          <!-- 传感器数据网格展示 -->
          <div class="sensor-grid-main">
            <div v-for="(value, key) in sensorData" :key="key" class="sensor-card-item">
              <div class="sensor-icon-large" :class="getSensorClass(key)">
                <el-icon><component :is="getIcon(key)" /></el-icon>
              </div>
              <div class="sensor-info-large">
                <div class="sensor-label-large">{{ getLabel(key) }}</div>
                <div class="sensor-value-large">
                  <!-- 如果在线显示数值，否则显示0 -->
                  {{ isOnline(key) ? value.value : 0 }} <span class="unit-large">{{ getUnit(key) }}</span>
                </div>
                <div class="sensor-status-large">
                  <span class="status-dot active" :class="getStatusClass(key, value)"></span>
                  {{ getStatusText(key, value) }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧列: 系统告警通知 -->
      <el-col :span="8">
        <el-card class="section-card alarm-card">
          <template #header>
            <div class="card-header-flex">
              <span class="header-title">
                <el-icon><Bell /></el-icon> 实时告警通知
              </span>
            </div>
          </template>
          <div class="alarm-list-container">
            <!-- 无告警时显示 -->
            <div v-if="alarms.length === 0" class="empty-alarm">
              <el-icon :size="48" color="#e1f3d8"><CircleCheckFilled /></el-icon>
              <p>当前系统运行平稳，无异常告警</p>
            </div>
            <!-- 告警列表 -->
            <div v-else class="alarm-scroll-list">
              <div v-for="(alarm, index) in alarms" :key="index" class="alarm-item-box" :class="'type-' + alarm.type">
                <div class="alarm-item-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <el-icon><WarningFilled /></el-icon>
                    <span class="alarm-time">{{ alarm.time }}</span>
                  </div>
                  <!-- 告警处理开关 -->
                  <el-switch
                    v-model="alarm.status"
                    active-value="processed"
                    inactive-value="pending"
                    active-text="已处理"
                    inactive-text="未处理"
                    inline-prompt
                    size="small"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                  />
                </div>
                <div class="alarm-message" :style="{ textDecoration: alarm.status === 'processed' ? 'line-through' : 'none', opacity: alarm.status === 'processed' ? 0.6 : 1 }">
                  {{ alarm.message }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部行: 近一小时历史趋势图 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="section-card">
          <template #header>
            <div class="card-header-flex">
              <span class="header-title">
                <el-icon><DataLine /></el-icon> 近一小时历史趋势图
              </span>
            </div>
          </template>
          <div class="chart-wrapper">
            <div id="historyChart" style="height: 400px; width: 100%;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, nextTick, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '@/store'
import axios from '@/api/axios'
import { 
  Sunny, Pouring, Timer, Odometer, Bell, WarningFilled, 
  CircleCheckFilled, DataLine, Platform
} from '@element-plus/icons-vue'

const store = useAppStore()
let historyChart = null
const chartData = ref([])

/**
 * 计算属性: 获取实时传感器数据
 * 从 store 中获取最新的环境数据，保持响应式更新
 */
const sensorData = computed(() => ({
  airTemp: store.currentSensorData.airTemp,
  airHumidity: store.currentSensorData.airHumidity,
  lightIntensity: store.currentSensorData.lightIntensity,
  soilTemp: store.currentSensorData.soilTemp,
  soilHumidity: store.currentSensorData.soilHumidity,
  co2: store.currentSensorData.co2Concentration
}))

// 告警列表数据
const alarms = ref([])

/**
 * 获取传感器中文标签
 * @param {string} key 传感器键名
 * @returns {string} 中文名称
 */
const getLabel = (key) => {
  const labels = {
    airTemp: '空气温度',
    airHumidity: '空气湿度',
    lightIntensity: '光照强度',
    soilTemp: '土壤温度',
    soilHumidity: '土壤湿度',
    co2: 'CO2 浓度'
  }
  return labels[key] || key
}

/**
 * 获取传感器单位
 * @param {string} key 传感器键名
 * @returns {string} 单位符号
 */
const getUnit = (key) => {
  const units = {
    airTemp: '°C',
    airHumidity: '%',
    lightIntensity: 'Lux',
    soilTemp: '°C',
    soilHumidity: '%',
    co2: 'ppm'
  }
  return units[key] || ''
}

/**
 * 根据传感器类型获取对应图标组件
 * @param {string} key 传感器键名
 * @returns {Component} Element Plus 图标组件
 */
const getIcon = (key) => {
  if (key.includes('Temp')) return Timer
  if (key.includes('Humidity')) return Pouring
  if (key.includes('light')) return Sunny
  if (key.includes('co2')) return Odometer
  return Platform
}

/**
 * 获取传感器图标背景样式类名
 * @param {string} key 传感器键名
 * @returns {string} CSS类名
 */
const getSensorClass = (key) => {
  if (key.includes('Temp')) return 'icon-red'
  if (key.includes('Humidity')) return 'icon-blue'
  if (key.includes('light')) return 'icon-yellow'
  return 'icon-green'
}

// 传感器键名与设备编码的映射关系
const deviceCodeMap = {
  airTemp: 'S_AIR_TEMP_001',
  airHumidity: 'S_AIR_HUM_001',
  soilTemp: 'S_SOIL_TEMP_001',
  soilHumidity: 'S_SOIL_HUM_001',
  lightIntensity: 'S_LIGHT_001',
  co2: 'S_CO2_001'
}

/**
 * 判断传感器是否在线
 * @param {string} key 传感器键名
 * @returns {boolean} 是否在线
 */
const isOnline = (key) => {
  const code = deviceCodeMap[key]
  return store.sensorOnlineStatus[code] === 1
}

/**
 * 获取状态点的样式类
 * @param {string} key 传感器键名
 * @param {Object} data 传感器数据对象
 * @returns {string} 状态样式类名
 */
const getStatusClass = (key, data) => {
  const online = isOnline(key)
  
  if (!online) return 'status-offline'
  if (data && data.ex === 1) return 'status-error'
  return 'status-ok'
}

/**
 * 获取状态显示的文本
 * @param {string} key 传感器键名
 * @param {Object} data 传感器数据对象
 * @returns {string} 状态文本
 */
const getStatusText = (key, data) => {
  const online = isOnline(key)
  
  if (!online) return '离线'
  if (data && data.ex === 1) return '数值异常'
  return '运行正常'
}

/**
 * 监听传感器数据变化，生成实时告警
 * 当传感器在线且数据异常(ex=1)时，生成告警信息
 */
watch([sensorData, () => store.sensorOnlineStatus], ([newData]) => {
  const newAlarms = []
  
  Object.keys(newData).forEach(key => {
    const data = newData[key]
    // 仅当在线且 ex === 1 (宽松相等) 时生成告警
    const online = isOnline(key)
    if (online && data && (data.ex == 1 || data.ex == '1')) {
      // 尝试查找现有告警以保留状态/时间
      const existing = alarms.value.find(a => a.key === key)
      const now = new Date().toLocaleTimeString()
      
      if (existing) {
        // 更新消息但保留状态和时间
        existing.message = `${getLabel(key)}数值异常: ${data.value} ${getUnit(key)}`
        newAlarms.push(existing)
      } else {
        newAlarms.push({
          key: key,
          message: `${getLabel(key)}数值异常: ${data.value} ${getUnit(key)}`,
          time: now,
          type: 'danger',
          status: 'pending'
        })
      }
    }
  })
  
  alarms.value = newAlarms
}, { deep: true, immediate: true })

/**
 * 获取历史数据
 * 用于图表展示
 */
const fetchHistoryData = async () => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode')
  if (!envCode) return
  try {
    const res = await axios.get('/device/query/data/history', { params: { envCode } })
    chartData.value = res || []
    updateHistoryChart()
  } catch (error) {
    console.error('获取历史数据失败:', error)
  }
}

// 监听环境变化，重新获取历史数据
watch(() => store.currentEnv, (newEnv) => {
  if (newEnv && newEnv.envCode) {
    fetchHistoryData()
  }
}, { deep: true })

/**
 * 初始化图表
 */
const initCharts = () => {
  const historyChartEl = document.getElementById('historyChart')
  if (historyChartEl) {
    historyChart = echarts.init(historyChartEl)
    updateHistoryChart()
  }
}

/**
 * 更新历史趋势图表配置
 */
const updateHistoryChart = () => {
  if (!historyChart) return

  const data = chartData.value.slice().reverse() // 倒序排列，按时间顺序
  const labels = data.map(item => {
    const date = new Date(item.createTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
  })

  // 定义系列元数据
  const seriesMeta = [
    { name: '空气温度', unit: '°C', yAxisIndex: 0, color: '#57B36A', data: data.map(i => i.airTemp) },
    { name: '空气湿度', unit: '%', yAxisIndex: 0, color: '#3C7BE6', data: data.map(i => i.airHumidity) },
    { name: '土壤温度', unit: '°C', yAxisIndex: 0, color: '#E6A23C', data: data.map(i => i.soilTemp) },
    { name: '土壤湿度', unit: '%', yAxisIndex: 0, color: '#F0C55B', data: data.map(i => i.soilHumidity) },
    { name: '光照强度', unit: 'Lux', yAxisIndex: 1, color: '#27AE60', data: data.map(i => i.lightIntensity) },
    { name: 'CO₂ 浓度', unit: 'ppm', yAxisIndex: 1, color: '#909399', data: data.map(i => i.co2Concentration) },
  ]

  // 设置 ECharts 配置项
  historyChart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: function(params) {
        const time = params?.[0]?.name ?? ''
        const byName = new Map(params.map(p => [p.seriesName, p.value]))
        const order = [
          { name: '空气温度', unit: '°C' },
          { name: '空气湿度', unit: '%' },
          { name: '土壤温度', unit: '°C' },
          { name: '土壤湿度', unit: '%' },
          { name: '光照强度', unit: 'Lux' },
          { name: 'CO₂ 浓度', unit: 'ppm' },
        ]
        const lines = [time]
        order.forEach((o) => {
          const v = byName.get(o.name)
          if (v !== undefined) lines.push(`${o.name}：${v}${o.unit}`)
        })
        return lines.join('<br/>')
      }
    },
    legend: { 
      show: true, 
      top: 10, 
      left: 'center', 
      itemGap: 20,
      textStyle: { color: '#666', fontSize: 13 } 
    },
    grid: { 
      top: 100, 
      right: 50, 
      bottom: 50, 
      left: 50, 
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      data: labels,
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#999', margin: 15 }
    },
    yAxis: [
      { 
        type: 'value', 
        name: '温度/湿度 (°C/%)', 
        nameTextStyle: { color: '#888', padding: [0, 0, 10, 0] }, 
        nameGap: 25,
        axisLabel: { color: '#999' }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } } 
      },
      { 
        type: 'value', 
        name: '光照/CO₂ (Lux/ppm)', 
        nameTextStyle: { color: '#888', padding: [0, 0, 10, 0] }, 
        nameGap: 25,
        axisLabel: { color: '#999' }, 
        splitLine: { show: false } 
      }
    ],
    series: seriesMeta.map((s) => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      yAxisIndex: s.yAxisIndex,
      showSymbol: false,
      lineStyle: { width: 3, color: s.color },
      itemStyle: { color: s.color },
      emphasis: { focus: 'series' },
    }))
  }, true)
}

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    initCharts()
    fetchHistoryData()
    // 监听窗口大小变化，重绘图表
    window.addEventListener('resize', () => {
      historyChart?.resize()
    })
  })
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', () => {})
  historyChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: transparent;
}

.section-card {
  background-color: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transition: transform 0.3s;
}

.section-card:hover {
  transform: translateY(-2px);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2c3e50;
}

/* 传感器网格样式 */
.sensor-grid-main {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.sensor-card-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.sensor-icon-large {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.icon-red { background: rgba(245, 108, 108, 0.1); color: #f56c6c; }
.icon-blue { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.icon-yellow { background: rgba(250, 173, 20, 0.1); color: #faad14; }
.icon-green { background: rgba(82, 196, 26, 0.1); color: #52c41a; }

.sensor-info-large {
  flex: 1;
}

.sensor-label-large {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.sensor-value-large {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.unit-large {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
  margin-left: 2px;
}

.sensor-status-large {
  margin-top: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
}

/* 状态点动画 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  position: relative;
}

.status-dot.active.status-ok { background: #42b983; box-shadow: 0 0 8px rgba(66, 185, 131, 0.5); }
.status-dot.active.status-error { background: #f56c6c; box-shadow: 0 0 8px rgba(245, 108, 108, 0.5); }
.status-dot.active.status-offline { 
  background: #909399; 
  box-shadow: none; 
}
.status-dot.active.status-offline::after {
  display: none;
}

.status-dot.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* 告警卡片样式 */
.alarm-list-container {
  height: 280px;
  overflow: hidden;
}

.empty-alarm {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.alarm-scroll-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 5px;
}

.alarm-item-box {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
}

.type-warning { background: rgba(253, 246, 236, 0.55); border-left-color: #e6a23c; }
.type-info { background: rgba(240, 249, 235, 0.55); border-left-color: #67c23a; }
.type-danger { background: rgba(254, 240, 240, 0.55); border-left-color: #f56c6c; }

.alarm-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-weight: 600;
  font-size: 13px;
}

.type-warning .alarm-item-header { color: #e6a23c; }
.type-info .alarm-item-header { color: #67c23a; }

.alarm-time {
  margin-left: auto;
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}

.alarm-message {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.chart-wrapper {
  padding: 20px 10px;
}

.history-table-wrapper {
  padding: 10px 0;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>
