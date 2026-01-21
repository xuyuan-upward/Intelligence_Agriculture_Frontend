<template>
  <div class="ai-page">
    <!-- 顶部导航栏: 标题 -->
    <div class="ai-topbar">
      <div class="ai-topbar-left">
        <div class="ai-title-pill">
          <el-icon class="pill-icon"><TrendCharts /></el-icon>
          <span>AI 预测与建议</span>
        </div>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧: 预测概览与健康指标 -->
      <el-col :span="18">
        <el-card shadow="never" class="ai-main-card">
          <template #header>
            <div class="ai-card-header">
              <div class="ai-card-title">
                <span class="ai-card-mark"></span>
                <span>健康伞</span>
              </div>
              <div class="ai-card-meta">
                <el-tag size="small" type="success" effect="light">实时评估中</el-tag>
                <!-- 时间范围选择 -->
                <el-radio-group v-model="timeRange" size="small" @change="renderOverview">
                  <el-radio-button :label="3">3小时</el-radio-button>
                  <el-radio-button :label="6">6小时</el-radio-button>
                  <el-radio-button :label="9">9小时</el-radio-button>
                  <el-radio-button :label="12">12小时</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>

          <!-- 预测概览图表 -->
          <div class="ai-overview">
            <div class="overview-chart" ref="overviewChartEl"></div>
          </div>

          <!-- 健康指标列表 -->
          <div class="health-list">
            <div v-for="item in healthItems" :key="item.key" class="health-item">
              <div class="health-left">
                <div class="health-icon" :class="`k-${item.key}`">
                  <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="health-info">
                  <div class="health-name">{{ item.name }}</div>
                  <div class="health-sub">
                    <span class="health-val">{{ item.value }}</span>
                    <span class="health-unit">{{ item.unit }}</span>
                    <el-tag size="small" :type="item.levelType" effect="light" class="health-level">{{ item.levelText }}</el-tag>
                  </div>
                </div>
              </div>
              <div class="health-right">
                <!-- 迷你趋势图 -->
                <div class="sparkline" :ref="setSparkRef(item.key)"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧: 智能建议 -->
      <el-col :span="6">
        <el-card shadow="never" class="ai-suggest-card">
          <template #header>
            <div class="ai-card-header">
              <div class="ai-card-title">
                <span class="ai-card-mark warn"></span>
                <span>智能建议</span>
              </div>
            </div>
          </template>

          <el-scrollbar height="640px">
            <div v-for="(item, index) in suggestions" :key="index" class="suggest-card">
              <div class="suggest-head">
                <div class="suggest-title">{{ item.title }}</div>
                <el-tag size="small" :type="item.type" effect="light">{{ item.time }}</el-tag>
              </div>
              <div class="suggest-desc">{{ item.content }}</div>
              <div class="suggest-actions" v-if="item.actionDevice">
                <!-- 执行建议操作按钮 -->
                <el-button
                  type="success"
                  size="small"
                  :icon="SwitchButton"
                  @click="executeAction(item)"
                  :loading="item.loading"
                  class="suggest-btn"
                >
                  立即执行
                </el-button>
                <el-button size="small" @click="openEvaluation(item)" class="suggest-btn" plain>
                  查看评估图表
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { TrendCharts, SwitchButton, Timer, Pouring, Sunny, Odometer } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/store'
import service from '@/api/axios'

const store = useAppStore()
const timeRange = ref(12)
const overviewChartEl = ref(null)
const sparkEls = reactive({})
let overviewChart = null
const sparkCharts = {}
const predictionData = ref([])

/**
 * 获取预测数据
 * 调用后端AI预测接口获取未来环境参数
 */
const fetchPrediction = async () => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode')
  if (!envCode) return

  try {
    const res = await service.get('/query/prediction', {
      params: { envCode }
    })
    // 后端返回 CommonResult<AiAnalysisResp>，假设拦截器解包了 data
    // 如果没有拦截器解包，则需要 res.data
    // 这里假设 service 已经处理了响应
    const data = typeof res === 'string' ? JSON.parse(res) : res
    
    // 检查是否为新结构 { chartData, suggestions }
    if (data && data.chartData) {
      predictionData.value = data.chartData
      suggestions.value = data.suggestions || []
      renderOverview()
    } else if (Array.isArray(data)) {
      // 兼容旧格式（如果有）
      predictionData.value = data
      renderOverview()
    }
  } catch (e) {
    console.error('Failed to fetch prediction:', e)
    // 失败时保持空数据或使用默认模拟数据逻辑
  }
}

// 智能建议列表
const suggestions = ref([])

// 监听环境变化
watch(() => store.currentEnv, (newEnv) => {
  if (newEnv && newEnv.envCode) {
    fetchPrediction()
  }
}, { deep: true })

// 健康指标项配置
const healthItems = reactive([
  { key: 'airTemp', name: '空气温度', icon: Timer, value: '25.8', unit: '°C', levelText: '良好', levelType: 'success', enabled: true },
  { key: 'airHumidity', name: '空气湿度', icon: Pouring, value: '76', unit: '%', levelText: '正常', levelType: 'info', enabled: true },
  { key: 'soilTemp', name: '土壤温度', icon: Timer, value: '21.4', unit: '°C', levelText: '正常', levelType: 'info', enabled: true },
  { key: 'soilHumidity', name: '土壤湿度', icon: Pouring, value: '33', unit: '%', levelText: '偏低', levelType: 'warning', enabled: true },
  { key: 'lightIntensity', name: '光照强度', icon: Sunny, value: '824', unit: 'Lux', levelText: '偏低', levelType: 'warning', enabled: true },
  { key: 'co2', name: 'CO₂ 浓度', icon: Odometer, value: '650', unit: 'ppm', levelText: '正常', levelType: 'info', enabled: true },
])

/**
 * 收集 Sparkline 元素的引用
 * @param {string} key 指标键名
 */
const setSparkRef = (key) => (el) => {
  if (!el) return
  sparkEls[key] = el
}

/**
 * 执行建议的操作
 * 弹出确认框，确认后调用 store 更新设备状态
 * @param {Object} item 建议项
 */
const executeAction = (item) => {
  ElMessageBox.confirm(
    `确定要立即开启${item.deviceName}吗？`,
    '智能控制确认',
    {
      confirmButtonText: '确定开启',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    item.loading = true
    setTimeout(() => {
      store.updateDeviceStatus(item.actionDevice, true)
      item.loading = false
      store.addLog('ai', `响应AI建议: ${item.title}，已开启${item.deviceName}`, 'AI预测')
      ElMessage({
        type: 'success',
        message: `${item.deviceName}已成功开启`,
      })
    }, 1000)
  }).catch(() => {})
}

/**
 * 生成时间标签
 */
const genLabels = (points = 9) => {
  const labels = []
  const now = new Date()
  for (let i = 0; i < points; i++) {
    const d = new Date(now.getTime() + i * 90 * 60 * 1000)
    labels.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`)
  }
  return labels
}

/**
 * 生成整点时间标签
 */
const genWholeHourLabels = (hours) => {
  const labels = []
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  for (let i = 0; i < hours; i++) {
    const t = new Date(start.getTime() + i * 60 * 60 * 1000)
    labels.push(`${t.getHours().toString().padStart(2, '0')}:00`)
  }
  return labels
}

/**
 * 生成模拟曲线数据
 */
const genLine = (points, base, amp) =>
  Array.from({ length: points }, (_, i) => +(base + Math.sin((i / (points - 1)) * Math.PI) * amp + (Math.random() - 0.5) * amp * 0.25).toFixed(1))

/**
 * 获取概览图表配置
 */
const getOverviewOption = () => {
  let labels = []
  let seriesData = {
    '空气温度': [], '空气湿度': [], '土壤温度': [], '土壤湿度': [], '光照强度': [], 'CO₂ 浓度': []
  }

  // 如果有真实预测数据则使用，否则使用模拟数据
  if (predictionData.value.length > 0) {
    const range = Math.min(predictionData.value.length, timeRange.value)
    const slice = predictionData.value.slice(0, range)
    labels = slice.map(item => item.time)
    slice.forEach(item => {
      seriesData['空气温度'].push(item.airTemp)
      seriesData['空气湿度'].push(item.airHumidity)
      seriesData['土壤温度'].push(item.soilTemp)
      seriesData['土壤湿度'].push(item.soilHumidity)
      seriesData['光照强度'].push(item.lightIntensity)
      seriesData['CO₂ 浓度'].push(item.co2Concentration || item.co2 || 0)
    })
  } else {
    labels = genWholeHourLabels(timeRange.value)
    const points = labels.length
    seriesData['空气温度'] = genLine(points, 24, 4)
    seriesData['空气湿度'] = genLine(points, 66, 10)
    seriesData['土壤温度'] = genLine(points, 20, 3)
    seriesData['土壤湿度'] = genLine(points, 36, 8)
    seriesData['光照强度'] = genLine(points, 720, 260).map(v => Math.max(0, Math.round(v)))
    seriesData['CO₂ 浓度'] = genLine(points, 620, 80).map(v => Math.max(0, Math.round(v)))
  }

  const seriesMeta = [
    { name: '空气温度', unit: '°C', yAxisIndex: 0, color: '#57B36A', data: seriesData['空气温度'] },
    { name: '空气湿度', unit: '%', yAxisIndex: 0, color: '#3C7BE6', data: seriesData['空气湿度'] },
    { name: '土壤温度', unit: '°C', yAxisIndex: 0, color: '#E6A23C', data: seriesData['土壤温度'] },
    { name: '土壤湿度', unit: '%', yAxisIndex: 0, color: '#F0C55B', data: seriesData['土壤湿度'] },
    { name: '光照强度', unit: 'Lux', yAxisIndex: 1, color: '#27AE60', data: seriesData['光照强度'] },
    { name: 'CO₂ 浓度', unit: 'ppm', yAxisIndex: 1, color: '#909399', data: seriesData['CO₂ 浓度'] },
  ]

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        const time = params?.[0]?.axisValue ?? ''
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
      },
    },
    legend: {
      top: 8,
      left: 10,
      textStyle: { color: '#4a4a4a' },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      data: seriesMeta.map(s => s.name),
    },
    grid: { left: 0, right: 0, top: 48, bottom: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { color: '#666' },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#666' },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      },
      {
        type: 'value',
        name: '光照/CO₂',
        nameTextStyle: { color: '#888' },
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
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
    })),
  }
}

/**
 * 获取迷你图表配置
 */
const getSparkOption = (key) => {
  const labels = genLabels(12)
  const points = labels.length

  const cfg = {
    airTemp: { base: 24, amp: 3, color: '#57B36A' },
    airHumidity: { base: 66, amp: 10, color: '#3C7BE6' },
    soilTemp: { base: 20, amp: 3, color: '#E6A23C' },
    soilHumidity: { base: 36, amp: 8, color: '#F0C55B' },
    lightIntensity: { base: 760, amp: 240, color: '#57B36A' },
    co2: { base: 620, amp: 80, color: '#3C7BE6' },
  }[key] || { base: 10, amp: 3, color: '#57B36A' }

  return {
    backgroundColor: 'transparent',
    grid: { left: 4, right: 4, top: 6, bottom: 6 },
    xAxis: { type: 'category', data: labels, show: false },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'line',
        smooth: true,
        data: genLine(points, cfg.base, cfg.amp),
        showSymbol: false,
        lineStyle: { width: 2, color: cfg.color },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${cfg.color}55` }, { offset: 1, color: `${cfg.color}00` }]) },
      },
    ],
  }
}

/**
 * 打开评估详情
 */
const openEvaluation = (item) => {
  ElMessage.info(`已打开「${item.title}」评估图表`)
}

/**
 * 渲染概览图表
 */
const renderOverview = () => {
  overviewChart?.setOption(getOverviewOption(), true)
}

/**
 * 初始化所有图表
 */
const initCharts = async () => {
  await nextTick()
  if (overviewChartEl.value) {
    overviewChart?.dispose()
    overviewChart = echarts.init(overviewChartEl.value)
    renderOverview()
  }

  healthItems.forEach((it) => {
    const el = sparkEls[it.key]
    if (!el) return
    sparkCharts[it.key]?.dispose?.()
    sparkCharts[it.key] = echarts.init(el)
    sparkCharts[it.key].setOption(getSparkOption(it.key), true)
  })
}

/**
 * 调整图表大小
 */
const resizeCharts = () => {
  overviewChart?.resize()
  Object.values(sparkCharts).forEach((c) => c?.resize())
}

// 组件挂载时初始化
onMounted(async () => {
  await initCharts()
  fetchPrediction()
  window.addEventListener('resize', resizeCharts)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  overviewChart?.dispose()
  Object.values(sparkCharts).forEach((c) => c?.dispose())
})
</script>

<style scoped>
.ai-page {
  padding: 12px;
  background-color: transparent;
}

.ai-topbar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.ai-title-pill{
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

.gh-select {
  width: 210px;
}

.ai-main-card,
.ai-suggest-card {
  background-color: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.ai-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: #2a2a2a;
}

.ai-card-mark {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2e8b57;
  box-shadow: 0 0 12px rgba(46, 139, 87, 0.5);
}

.ai-card-mark.warn {
  background: #e6a23c;
  box-shadow: 0 0 12px rgba(230, 162, 60, 0.45);
}

.ai-card-meta {
  display: flex;
  gap: 8px;
}

.ai-overview {
  margin: 0 -20px;
}

.overview-chart {
  height: 280px;
  width: 100%;
}

.health-list {
  padding: 10px 0 0;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 12px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.health-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.health-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(46, 139, 87, 0.12);
  color: #2e8b57;
}

.health-icon.k-airHumidity,
.health-icon.k-co2 {
  background: rgba(60, 123, 230, 0.12);
  color: #3c7be6;
}

.health-icon.k-soilTemp {
  background: rgba(230, 162, 60, 0.14);
  color: #e6a23c;
}

.health-icon.k-soilHumidity {
  background: rgba(240, 197, 91, 0.16);
  color: #c79a25;
}

.health-info {
  min-width: 0;
}

.health-name {
  font-weight: 900;
  color: #2a2a2a;
  line-height: 1.1;
}

.health-sub {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.health-val {
  font-weight: 900;
  color: #2a2a2a;
}

.health-unit {
  opacity: 0.8;
}

.health-level {
  margin-left: 4px;
}

.health-right {
  width: 160px;
  flex: 0 0 160px;
}

.sparkline {
  height: 44px;
  width: 160px;
}

.suggest-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 12px;
  padding: 12px;
  margin: 12px;
}

.suggest-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.suggest-title {
  font-weight: 900;
  color: #2a2a2a;
}

.suggest-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.55;
  margin-bottom: 10px;
}

.suggest-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.suggest-btn {
  border-radius: 10px;
}
</style>