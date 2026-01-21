import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { useAppStore } from './store'
import { wsService } from './utils/websocket'
import './style.css'

// 创建 Vue 应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 将 store 挂载到 window 对象，方便在控制台调试：输入 `window.store` 即可查看状态
window.store = useAppStore(pinia)

// 初始化 WebSocket 连接
wsService.connect()

// 全局注册 Element Plus 图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 挂载应用
app.mount('#app')
