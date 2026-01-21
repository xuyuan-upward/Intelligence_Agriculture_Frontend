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
          type="datetimerange"
          range-separator="—"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          class="date-picker"
          :disabled-date="disabledDate"
          :disabled-hours="disabledHours"
          :disabled-minutes="disabledMinutes"
          :disabled-seconds="disabledSeconds"
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { DataLine } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from '@/api/axios'
import { useAppStore } from '@/store'

const store = useAppStore()

// 响应式状态
const dateRange = ref([])
const loading = ref(false)
const mainChartEl = ref(null)
const analysisData = ref([])
let mainChart = null

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 */
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 格式化日期时间为 MM-DD HH:mm
 */
const formatShortTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 禁用日期逻辑：
 * 只能选择最近 6 小时内的日期
 */
const disabledDate = (time) => {
  const now = new Date()
  const limit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  
  // time 必须在 [now - 6h, now] 范围内
  // 由于 disabled-date 是禁用，所以范围外的返回 true
  // 注意：el-date-picker 的 disabledDate 参数 time 通常是 00:00:00
  // 为了更精确的体验，我们主要禁用“天”级别的
  
  // 简单策略：
  // 1. 如果 time 晚于今天，禁用
  // 2. 如果 time 早于 (limit 的前一天)，禁用
  // 但为了响应用户的“只选择当前时间到最早6小时之前”，我们严格一点：
  // 如果 time < limit (减去一天的缓冲以防时区问题) 或 time > now
  
  // 更精准的：
  // time 是当前渲染的日期格子的时间（0点）
  // 如果这个格子代表的整天都早于 limit，那肯定要禁用
  // 如果这个格子代表的整天都晚于 now，那肯定要禁用
  
  // 实际上，因为时间选择器可以选时分秒，我们只能在日期面板上禁用掉完全不在范围内的天
  // 例如：limit 是今天 10:00，now 是今天 16:00
  // 那么昨天（及以前）肯定要禁用。明天（及以后）肯定要禁用。
  // 今天不能禁用，因为今天有可选时间段。
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const limitDay = new Date(limit.getFullYear(), limit.getMonth(), limit.getDate())
  
  // 如果 time（某天的0点）早于 limitDay，禁用
  if (time.getTime() < limitDay.getTime()) return true
  
  // 如果 time 晚于 today，禁用 (即未来的日子)
  if (time.getTime() > today.getTime()) return true
  
  return false
}

/**
 * 生成数字范围数组
 */
const makeRange = (start, end) => {
  const result = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
}

/**
 * 禁用小时
 */
const disabledHours = (role, comparingDate) => {
  if (!comparingDate) return []
  const now = new Date()
  const limit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  
  const d = new Date(comparingDate)
  
  // 检查是否是 limitDay
  const isLimitDay = d.getFullYear() === limit.getFullYear() && 
                     d.getMonth() === limit.getMonth() && 
                     d.getDate() === limit.getDate()
  
  // 检查是否是 today
  const isToday = d.getFullYear() === now.getFullYear() && 
                  d.getMonth() === now.getMonth() && 
                  d.getDate() === now.getDate()

  // 如果是 limitDay，禁用 limit 小时之前的小时
  if (isLimitDay) {
    return makeRange(0, limit.getHours() - 1)
  }
  
  // 如果是 today，禁用 now 小时之后的小时
  if (isToday) {
    return makeRange(now.getHours() + 1, 23)
  }
  
  return []
}

/**
 * 禁用分钟
 */
const disabledMinutes = (hour, role, comparingDate) => {
  if (!comparingDate) return []
  const now = new Date()
  const limit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  
  const d = new Date(comparingDate)
  const isLimitDay = d.getFullYear() === limit.getFullYear() && 
                     d.getMonth() === limit.getMonth() && 
                     d.getDate() === limit.getDate()
  const isToday = d.getFullYear() === now.getFullYear() && 
                  d.getMonth() === now.getMonth() && 
                  d.getDate() === now.getDate()

  if (isLimitDay && hour === limit.getHours()) {
    return makeRange(0, limit.getMinutes() - 1)
  }
  
  if (isToday && hour === now.getHours()) {
    return makeRange(now.getMinutes() + 1, 59)
  }
  
  return []
}

/**
 * 禁用秒
 */
const disabledSeconds = (hour, minute, role, comparingDate) => {
  if (!comparingDate) return []
  const now = new Date()
  const limit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  
  const d = new Date(comparingDate)
  const isLimitDay = d.getFullYear() === limit.getFullYear() && 
                     d.getMonth() === limit.getMonth() && 
                     d.getDate() === limit.getDate()
  const isToday = d.getFullYear() === now.getFullYear() && 
                  d.getMonth() === now.getMonth() && 
                  d.getDate() === now.getDate()

  if (isLimitDay && hour === limit.getHours() && minute === limit.getMinutes()) {
    return makeRange(0, limit.getSeconds() - 1)
  }
  
  if (isToday && hour === now.getHours() && minute === now.getMinutes()) {
    return makeRange(now.getSeconds() + 1, 59)
  }
  
  return []
}

/**
 * 确保日期范围有默认值
 * 默认为 最近 6 小时
 */
const ensureDefaultDateRange = () => {
  if (dateRange.value?.length === 2) return
  const now = new Date()
  const start = new Date(now.getTime() - 6 * 60 * 60 * 1000)
  dateRange.value = [start, now]
}

/**
 * 获取主图表配置项
 */
const getMainOption = () => {
  if (analysisData.value.length === 0) {
    return {
      title: {
        text: '暂无历史数据',
        left: 'center',
        top: 'middle',
        textStyle: { color: '#999', fontSize: 14 }
      }
    }
  }

  const data = analysisData.value
  const labels = data.map(item => formatShortTime(item.createTime))

  // 定义各传感器数据的展示配置
  const seriesMeta = [
    { name: '空气温度', unit: '°C', yAxisIndex: 0, color: '#57B36A', data: data.map(i => i.airTemp) },
    { name: '空气湿度', unit: '%', yAxisIndex: 0, color: '#3C7BE6', data: data.map(i => i.airHumidity) },
    { name: '土壤温度', unit: '°C', yAxisIndex: 0, color: '#E6A23C', data: data.map(i => i.soilTemp) },
    { name: '土壤湿度', unit: '%', yAxisIndex: 0, color: '#F0C55B', data: data.map(i => i.soilHumidity) },
    { name: '光照强度', unit: 'Lux', yAxisIndex: 1, color: '#27AE60', data: data.map(i => i.lightIntensity) },
    { name: 'CO₂ 浓度', unit: 'ppm', yAxisIndex: 1, color: '#909399', data: data.map(i => i.co2Concentration) },
  ]

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
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
        const lines = [`时间：${time}`]
        order.forEach((o) => {
          const v = byName.get(o.name)
          if (v !== undefined) lines.push(`${o.name}：${v}${o.unit}`)
        })
        return lines.join('<br/>')
      },
    },
    legend: {
      top: 10,
      left: 'center',
      itemGap: 20,
      textStyle: { color: '#666', fontSize: 13 },
      data: seriesMeta.map(s => s.name),
    },
    grid: { 
      top: 100, 
      right: 60, 
      bottom: 60, 
      left: 60, 
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#eee' } },
      axisLabel: { color: '#999', margin: 15, rotate: 30 }
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
 * 渲染主图表
 */
const renderMain = () => {
  if (!mainChart) return
  mainChart.setOption(getMainOption(), true)
}

/**
 * 刷新所有数据
 */
const refreshAll = async () => {
  const envCode = store.currentEnv?.envCode || localStorage.getItem('currentEnvCode')
  if (!envCode || !dateRange.value || dateRange.value.length !== 2) return

  loading.value = true
  try {
    const now = new Date()
    // 允许的查询范围：[Now - 6h, Now]
    // 限制：查询时长 <= 6h (天然满足，因为窗口本身就是 6h)
    // 限制：startTime >= Now - 6h
    
    const limit = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    const sixHoursMs = 6 * 60 * 60 * 1000
    
    let start = new Date(dateRange.value[0])
    let end = new Date(dateRange.value[1])

    let modified = false

    // 1. 校验是否选择了未来的时间
    if (end.getTime() > now.getTime()) {
      end = now
      modified = true
      // ElMessage.warning('不能查询未来的数据，已自动修正')
    }

    // 2. 校验开始时间是否早于 limit (6小时前)
    if (start.getTime() < limit.getTime()) {
      start = limit
      modified = true
      ElMessage.warning('只能查询最近 6 小时内的数据，已自动修正')
    }

    // 3. 校验查询时长是否超过 6 小时 (理论上如果1和2都满足，这个肯定满足，但为了保险)
    if (end.getTime() - start.getTime() > sixHoursMs) {
      start = new Date(end.getTime() - sixHoursMs)
      modified = true
    }

    // 4. 校验开始时间是否早于结束时间
    if (start.getTime() >= end.getTime()) {
      // 极端情况修正
      start = new Date(end.getTime() - 1000 * 60 * 60) // 默认为前1小时
      if (start.getTime() < limit.getTime()) start = limit
      modified = true
    }
    
    // 如果有变动，同步更新 UI 上的值
    if (modified) {
      dateRange.value = [start, end]
    }

    const res = await axios.post('/device/query/data/analysis', {
      envCode,
      startTime: formatDateTime(start),
      endTime: formatDateTime(end)
    })
    
    analysisData.value = res || []
    await nextTick()
    renderMain()
  } catch (error) {
    console.error('获取历史分析数据失败:', error)
    const errorMsg = error.response?.data?.message || '获取数据失败，请重试'
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}

/**
 * 处理窗口大小调整
 */
const onResize = () => {
  mainChart?.resize()
}

// 监听环境变化
watch(() => store.currentEnv, (newEnv) => {
  if (newEnv && newEnv.envCode) {
    refreshAll()
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(async () => {
  ensureDefaultDateRange()
  await nextTick()
  if (mainChartEl.value) mainChart = echarts.init(mainChartEl.value)
  refreshAll()
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
  width: 340px;
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