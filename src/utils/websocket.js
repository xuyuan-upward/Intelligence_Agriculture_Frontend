import { useAppStore } from '@/store'

class WebSocketService {
  constructor() {
    this.ws = null
    // WebSocket 连接地址，优先使用环境变量
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/sensor_date'
    this.reconnectAttempts = 0 // 重连尝试次数
  }

  // 建立连接
  connect() {
    this.ws = new WebSocket(this.url)

    // 连接打开时的回调
    this.ws.onopen = () => {
      console.log('WebSocket Connected to ' + this.url)
      this.reconnectAttempts = 0 // 重置重连次数
    }

    // 接收到消息时的回调
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (e) {
        console.error('WebSocket message parse error', e)
      }
    }

    // 连接关闭时的回调
    this.ws.onclose = () => {
      console.log('WebSocket Closed')
      this.reconnect() // 尝试重连
    }

    // 发生错误时的回调
    this.ws.onerror = (error) => {
      console.error('WebSocket Error', error)
    }
  }

  // 处理接收到的消息
  handleMessage(message) {
    const store = useAppStore()
    const { type, env, data } = message

    // 如果消息不属于当前环境，则忽略 (多环境隔离)
    if (store.currentEnv && store.currentEnv.envCode !== env) return;

    switch (type) {
      case 'SENSOR_DATA':
        // 更新实时传感器数值
        // 数据结构: { envCode: string, iotSensorDataRespList: [ { envParameterType: number, dataValue: number, ex: number } ] }
        if (data && Array.isArray(data.iotSensorDataRespList)) {
          const newData = { ...store.currentSensorData }
          // 环境参数类型映射表
          const typeMap = {
            1: 'airTemp',
            2: 'airHumidity',
            3: 'soilTemp',
            4: 'soilHumidity',
            5: 'co2Concentration',
            6: 'lightIntensity'
          }
          data.iotSensorDataRespList.forEach(item => {
            const key = typeMap[item.envParameterType]
            if (key) {
              newData[key] = {
                value: item.dataValue,
                ex: item.ex
              }
            }
          })
          store.updateSensorData(newData)
        }
        break
      case 'CONTROL_DEVICE_STATUS':
        // 控制设备状态更新
        // 数据结构: [{ deviceCode: string, status: number }]
        if (Array.isArray(data)) {
          data.forEach(device => {
            if (device.deviceCode && device.status !== undefined) {
               store.updateDeviceWorkStatus(device.deviceCode, device.status)
            }
          })
        } 
        break
      case 'SENSOR_DEVICE_STATUS':
         // 采集设备状态更新 (在线/离线)
         // 数据结构: [{ deviceCode: string, status: number }]
         if (Array.isArray(data)) {
            const newOnlineStatus = { ...store.sensorOnlineStatus }
            data.forEach(device => {
              if (device.deviceCode && device.status !== undefined) {
                newOnlineStatus[device.deviceCode] = device.status
              }
            })
            store.updateSensorOnlineStatus(newOnlineStatus)
         }
        break
      case 'SYSTEM_LOG':
        // 系统日志推送
        // 数据结构: { type: string, source: string, message: string }
        store.addLog(data.type, data.message, data.source)
        break
      default:
        console.warn('Unknown message type:', type)
    }
  }

  // 重连机制
  reconnect() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts})...`)
        this.connect()
      }, 3000) // 3秒后重连
    }
  }

  // 发送消息 (预留功能)
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
}

// 导出单例
export const wsService = new WebSocketService()
