<template>
  <div class="dashboard-container">
    <!-- Top Row: Real-time Monitoring & Alarms -->
    <el-row :gutter="20">
      <!-- Left Column: Real-time Environmental Monitoring -->
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
          <div class="sensor-grid-main">
            <div v-for="(value, key) in sensorData" :key="key" class="sensor-card-item">
              <div class="sensor-icon-large" :class="getSensorClass(key)">
                <el-icon><component :is="getIcon(key)" /></el-icon>
              </div>
              <div class="sensor-info-large">
                <div class="sensor-label-large">{{ getLabel(key) }}</div>
                <div class="sensor-value-large">
                  {{ value }} <span class="unit-large">{{ getUnit(key) }}</span>
                </div>
                <div class="sensor-status-large">
                  <span class="status-dot active" :class="isAlarm(key, value) ? 'status-error' : 'status-ok'"></span>
                  {{ isAlarm(key, value) ? '数值异常' : '运行正常' }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Right Column: System Alarms -->
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
            <div v-if="alarms.length === 0" class="empty-alarm">
              <el-icon :size="48" color="#e1f3d8"><CircleCheckFilled /></el-icon>
              <p>当前系统运行平稳，无异常告警</p>
            </div>
            <div v-else class="alarm-scroll-list">
              <div v-for="(alarm, index) in alarms" :key="index" class="alarm-item-box" :class="'type-' + alarm.type">
                <div class="alarm-item-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 5px;">
                    <el-icon><WarningFilled /></el-icon>
                    <span class="alarm-time">{{ alarm.time }}</span>
                  </div>
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

    <!-- Bottom Row: Last Hour History Records -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- Left Column: History Chart -->
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
import { ref, onMounted, onUnmounted, reactive, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { 
  Sunny, Pouring, Timer, Odometer, Bell, WarningFilled, 
  CircleCheckFilled, DataLine, Platform
} from '@element-plus/icons-vue'

let historyChart = null

// Mock Data for Sensors
const sensorData = reactive({
  airTemp: 29.5,
  airHumidity: 85,
  lightIntensity: 12000,
  soilTemp: 23.8,
  soilHumidity: 34.0,
  co2: 680
})

// Mock Alarms
const alarms = ref([
  { message: '警告: 空气湿度过高 (85%)，请注意通风', time: '14:23:45', type: 'warning' },
  { message: '提示: 土壤湿度较低 (34%)，建议开启喷淋', time: '14:15:20', type: 'info' },
  { message: '警告: 光照强度超过阈值', time: '13:55:10', type: 'warning' }
])

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

const getIcon = (key) => {
  if (key.includes('Temp')) return Timer
  if (key.includes('Humidity')) return Pouring
  if (key.includes('light')) return Sunny
  if (key.includes('co2')) return Odometer
  return Platform
}

const getSensorClass = (key) => {
  if (key.includes('Temp')) return 'icon-red'
  if (key.includes('Humidity')) return 'icon-blue'
  if (key.includes('light')) return 'icon-yellow'
  return 'icon-green'
}

const isAlarm = (key, value) => {
  if (key === 'airTemp' && value > 30) return true
  if (key === 'soilHumidity' && value < 40) return true
  if (key === 'airHumidity' && value > 80) return true
  return false
}

// Chart Initialization
const initCharts = () => {
  const historyChartEl = document.getElementById('historyChart')
  if (historyChartEl) {
    historyChart = echarts.init(historyChartEl)
    updateHistoryChart()
  }
}

const updateHistoryChart = () => {
  if (!historyChart) return

  // Generate last 60 minutes labels (every 5 mins)
  const labels = []
  const now = new Date()
  for (let i = 12; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60000)
    labels.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`)
  }

  const seriesMeta = [
    { name: '空气温度', unit: '°C', yAxisIndex: 0, color: '#57B36A', data: [28.2, 28.5, 28.8, 29.1, 29.4, 29.5, 29.6, 29.5, 29.4, 29.3, 29.4, 29.5, 29.5] },
    { name: '空气湿度', unit: '%', yAxisIndex: 0, color: '#3C7BE6', data: [75, 76, 78, 80, 82, 84, 85, 85, 84, 83, 84, 85, 85] },
    { name: '土壤温度', unit: '°C', yAxisIndex: 0, color: '#E6A23C', data: [22.1, 22.3, 22.5, 22.8, 23.1, 23.4, 23.8, 23.7, 23.5, 23.4, 23.5, 23.7, 23.8] },
    { name: '土壤湿度', unit: '%', yAxisIndex: 0, color: '#F0C55B', data: [38, 37.5, 37, 36.5, 36, 35.5, 35, 34.5, 34, 34, 34, 34, 34] },
    { name: '光照强度', unit: 'Lux', yAxisIndex: 1, color: '#27AE60', data: [11000, 11500, 11800, 12000, 12200, 12500, 12000, 11800, 11500, 11200, 11500, 11800, 12000] },
    { name: 'CO₂ 浓度', unit: 'ppm', yAxisIndex: 1, color: '#909399', data: [650, 660, 670, 675, 680, 680, 675, 670, 665, 670, 675, 680, 680] },
  ]

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
    legend: { show: true, top: 0, left: 10, textStyle: { color: '#666' } },
    grid: { top: 52, right: 0, bottom: 34, left: 0, containLabel: true },
    xAxis: { 
      type: 'category', 
      data: labels,
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#999' }
    },
    yAxis: [
      { type: 'value', name: '温湿度/温度', nameTextStyle: { color: '#888' }, axisLabel: { color: '#999' }, splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } } },
      { type: 'value', name: '光照/CO₂', nameTextStyle: { color: '#888' }, axisLabel: { color: '#999' }, splitLine: { show: false } }
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

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', () => {
      historyChart?.resize()
    })
  })
})

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

/* Sensor Grid Styles */
.sensor-grid-main {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 10px 0;
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  position: relative;
}

.status-dot.active.status-ok { background: #42b983; box-shadow: 0 0 8px rgba(66, 185, 131, 0.5); }
.status-dot.active.status-error { background: #f56c6c; box-shadow: 0 0 8px rgba(245, 108, 108, 0.5); }

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

/* Alarm Card Styles */
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
  padding: 10px 0;
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
