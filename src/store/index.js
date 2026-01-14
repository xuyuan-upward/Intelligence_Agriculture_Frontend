import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const deviceStatus = ref({
    pump: false,    // 水泵
    fan: false,     // 风扇
    light: false,   // 补光灯
    heater: false,  // 加热器
    humidifier: false // 加湿器
  })

  // Mock threshold configuration
  const thresholds = ref({
    airTemp: { min: 15, max: 30 },
    airHumidity: { min: 40, max: 70 },
    soilHumidity: { min: 30, max: 80 },
    lightIntensity: { min: 1000, max: 5000 },
    co2: { min: 400, max: 1000 }
  })

  // System Logs
  const systemLogs = ref([])

  const addLog = (type, message, source = '系统') => {
    systemLogs.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type, // 'info', 'warning', 'success', 'error'
      message,
      source
    })
    // Keep only last 50 logs
    if (systemLogs.value.length > 50) {
      systemLogs.value.pop()
    }
  }

  const updateDeviceStatus = (deviceId, status) => {
    deviceStatus.value[deviceId] = status
  }

  const updateThreshold = (type, min, max) => {
    if (thresholds.value[type]) {
      thresholds.value[type] = { min, max }
    }
  }

  return {
    deviceStatus,
    thresholds,
    systemLogs,
    addLog,
    updateDeviceStatus,
    updateThreshold
  }
})
