import { useAppStore } from '@/store'

class WebSocketService {
  constructor() {
    this.ws = null
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
    this.reconnectAttempts = 0
  }

  connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('WebSocket Connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (e) {
        console.error('WebSocket message parse error', e)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket Closed')
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket Error', error)
    }
  }

  handleMessage(data) {
    const store = useAppStore()
    // Handle different message types
    if (data.type === 'SENSOR_DATA') {
      // Update store or event bus
      // For simplicity, we might just log or update specific store fields
      // In a real app, you might want to emit an event or update a global state
    } else if (data.type === 'ALARM') {
      // Handle alarm
    }
  }

  reconnect() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts})...`)
        this.connect()
      }, 3000)
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
}

export const wsService = new WebSocketService()
