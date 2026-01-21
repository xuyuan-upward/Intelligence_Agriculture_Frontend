<template>
  <div class="analysis-page">
    <!-- 头部区域: 标题与日期筛选 -->
    <div class="analysis-header">
      <div class="analysis-title">
        <el-icon class="title-icon"><DataLine /></el-icon>
        <span>工况数据分析</span>
      </div>
      <div class="analysis-actions">
        <!-- 日期范围选择器 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="—"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          class="date-picker"
          @change="refreshAll"
        />
      </div>
    </div>

    <!-- 图表展示区域 -->
    <el-card shadow="never" class="panel-card">
      <div v-loading="loading" element-loading-text="数据加载中...">
        <div class="main-chart" ref="mainChartEl"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { DataLine } from '@element-plus/icons-vue'

// 响应式状态
const dateRange = ref([])
const loading = ref(false)
const mainChartEl = ref(null)
let mainChart = null

/**
 * 确保日期范围有默认值
 * 默认为最近14天
 */
const ensureDefaultDateRange = () => {
  if (dateRange.value?.length === 2) return
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 14)
  dateRange.value = [start, end]
}

/**
 * 生成时间轴标签
 * @param {number} points 数据点数量
 * @returns {string[]} 时间字符串数组
 */
const generateTimeLabels = (points = 13) => {
  const labels = []
  const now = new Date()
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 30 * 60 * 1000)
    labels.push(`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`)
  }
  return labels
}

/**
 * 生成模拟数据序列 (正弦波 + 随机噪声)
 * 用于演示图表效果
 * @param {number} points 数据点数
 * @param {number} base 基准值
 * @param {number} amplitude 振幅
 * @param {number} noise 噪声系数
 * @returns {number[]} 模拟数据数组
 */
const genSeriesData = (points, base, amplitude, noise = 0.25) => {
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin((i / (points - 1)) * Math.PI) * amplitude
    const n = (Math.random() - 0.5) * amplitude * noise
    return +(base + wave + n).toFixed(1)
  })
}

/**
 * 获取主图表配置项
 * @returns {Object} ECharts配置对象
 */
const getMainOption = () => {
  const labels = generateTimeLabels(13)
  const points = labels.length

  // 定义各传感器数据的展示配置
  const seriesMeta = [
    { key: 'airTemp', name: '空气温度', unit: '°C', yAxisIndex: 0, color: '#57B36A', data: genSeriesData(points, 22, 4) },
    { key: 'airHumidity', name: '空气湿度', unit: '%', yAxisIndex: 0, color: '#3C7BE6', data: genSeriesData(points, 62, 10) },
    { key: 'soilTemp', name: '土壤温度', unit: '°C', yAxisIndex: 0, color: '#E6A23C', data: genSeriesData(points, 20, 3) },
    { key: 'soilHumidity', name: '土壤湿度', unit: '%', yAxisIndex: 0, color: '#F0C55B', data: genSeriesData(points, 36, 8) },
    { key: 'lightIntensity', name: '光照强度', unit: 'Lux', yAxisIndex: 1, color: '#27AE60', data: genSeriesData(points, 2800, 1200).map(v => Math.max(0, Math.round(v))) },
    { key: 'co2', name: 'CO₂ 浓度', unit: 'ppm', yAxisIndex: 1, color: '#909399', data: genSeriesData(points, 620, 90).map(v => Math.max(0, Math.round(v))) },
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
      top: 10,
      left: 10,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#4a4a4a' },
      data: seriesMeta.map(s => s.name),
    },
    grid: { left: 40, right: 30, top: 52, bottom: 30 },
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
        name: '温湿度/温度',
        nameTextStyle: { color: '#888' },
        axisLabel: { color: '#666' },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
      },
      {
        type: 'value',
        name: '光照/CO₂',
        nameTextStyle: { color: '#888' },
        axisLabel: { color: '#666' },
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
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { width: 3, color: s.color },
      itemStyle: { color: s.color },
      emphasis: { focus: 'series' },
    })),
  }
}

/**
 * 渲染主图表
 */
const renderMain = () => {
  if (!mainChart) return
  mainChart.setOption(getMainOption(), true)
}

/**
 * 刷新所有数据
 * 模拟异步加载过程
 */
const refreshAll = async () => {
  ensureDefaultDateRange()
  loading.value = true
  await new Promise((r) => setTimeout(r, 350))
  loading.value = false
  await nextTick()
  renderMain()
}

/**
 * 处理窗口大小调整
 */
const onResize = () => {
  mainChart?.resize()
}

// 组件挂载时初始化
onMounted(async () => {
  ensureDefaultDateRange()
  await nextTick()
  if (mainChartEl.value) mainChart = echarts.init(mainChartEl.value)
  renderMain()
  window.addEventListener('resize', onResize)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  mainChart?.dispose()
})
</script>

<style scoped>
.analysis-page {
  padding: 12px;
  background-color: transparent;
}

.analysis-header {
  height: 54px;
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

.analysis-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #287c42;
}

.title-icon {
  font-size: 20px;
  color: #2e8b57;
}

.analysis-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-picker {
  width: 270px;
}

.panel-card {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
  overflow: hidden;
}

.main-chart {
  height: 360px;
  width: 100%;
}
</style>