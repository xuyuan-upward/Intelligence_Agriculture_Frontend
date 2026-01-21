import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 环境列表
  const envList = ref([])
  // 当前选中的环境
  const currentEnv = ref(null)

  // 1. 设备工作状态 (ON/OFF) - 主要用于执行器控制 (1: 开启, 0: 关闭)
  const deviceWorkStatus = ref({})
  // 存储完整的设备列表信息，不仅仅是状态
  const controlDevices = ref([])

  // 2. 控制设备在线状态 (Online/Offline) - 由 WebSocket 推送
  // const controlOnlineStatus = ref({}) - 已移除 (根据业务逻辑不再需要)

  // 3. 采集设备在线状态 (Online/Offline) - 由 WebSocket 推送
  const sensorOnlineStatus = ref({})

  // 4. 最新传感器数据 - 由 IotDataService 推送
  // 包含 value (数值) 和 ex (状态/异常码)
  const currentSensorData = ref({
    airTemp: { value: 0, ex: 0 },
    airHumidity: { value: 0, ex: 0 },
    soilTemp: { value: 0, ex: 0 },
    soilHumidity: { value: 0, ex: 0 },
    lightIntensity: { value: 0, ex: 0 },
    co2Concentration: { value: 0, ex: 0 }
  })

  // 5. 阈值配置 (用于判断环境参数是否正常)
  const thresholds = ref({
    airTemp: { min: 15, max: 30 },
    airHumidity: { min: 40, max: 70 },
    soilTemp: { min: 15, max: 25 },
    soilHumidity: { min: 30, max: 80 },
    lightIntensity: { min: 1000, max: 5000 },
    co2: { min: 400, max: 1000 }
  })

  // 系统日志列表
  const systemLogs = ref([])

  /**
   * 添加系统日志
   * @param {string} type - 日志类型 'info', 'warning', 'success', 'error'
   * @param {string} message - 日志内容
   * @param {string} source - 日志来源
   */
  const addLog = (type, message, source = '系统') => {
    systemLogs.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type, 
      message,
      source
    })
    // 仅保留最近 50 条日志
    if (systemLogs.value.length > 50) {
      systemLogs.value.pop()
    }
  }

  // 更新采集设备在线状态
  const updateSensorOnlineStatus = (statusMap) => {
    sensorOnlineStatus.value = statusMap
  }

  // 更新传感器数据
  const updateSensorData = (data) => {
    currentSensorData.value = data
  }

  // 更新单个设备的控制状态 (开关状态)
  const updateDeviceWorkStatus = (deviceId, status) => {
    deviceWorkStatus.value[deviceId] = status
  }

  // 更新阈值配置
  const updateThreshold = (type, min, max) => {
    if (thresholds.value[type]) {
      thresholds.value[type] = { min, max }
    }
  }

  // 设置环境列表
  const setEnvList = (list) => {
    envList.value = Array.isArray(list) ? list : []
  }

  // 设置控制设备列表并初始化状态
  const setControlDevices = (list) => {
    controlDevices.value = list
    // 初始化状态 (虽然状态可能随后由 WebSocket 更新)
    const statusMap = {}
    list.forEach(device => {
        statusMap[device.deviceCode] = device.status || 0
    })
    deviceWorkStatus.value = { ...deviceWorkStatus.value, ...statusMap }
  }

  // 设置当前环境并重置传感器数据
  const setCurrentEnv = (env) => {
    currentEnv.value = env || null
    // 切换环境时重置传感器数据
    currentSensorData.value = {
      airTemp: { value: 0, ex: 0 },
      airHumidity: { value: 0, ex: 0 },
      soilTemp: { value: 0, ex: 0 },
      soilHumidity: { value: 0, ex: 0 },
      lightIntensity: { value: 0, ex: 0 },
      co2Concentration: { value: 0, ex: 0 }
    }
  }

  return {
    envList,
    currentEnv,
    deviceWorkStatus,
    controlDevices,
    // controlOnlineStatus,
    sensorOnlineStatus,
    currentSensorData,
    thresholds,
    systemLogs,
    addLog,
    setControlDevices,
    // updateControlOnlineStatus,
    updateSensorOnlineStatus,
    updateSensorData,
    updateDeviceWorkStatus,
    updateThreshold,
    setEnvList,
    setCurrentEnv
  }
})
