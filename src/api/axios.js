import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  // 基础 URL，使用环境变量 VITE_API_URL 或默认为 /api
  // 开发环境中 /api 会被 vite.config.js 代理转发到后端
  baseURL: import.meta.env.VITE_API_URL || '/api', 
  timeout: 5000 // 请求超时时间 5秒
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    // 例如：如果存在 token，则添加到请求头中
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers['Authorization'] = 'Bearer ' + token
    // }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 假设后端返回的标准结构为 { code: 200, data: ..., msg: ... }
    // 如果 code 不是 200，则视为业务逻辑错误
    if (res.code && res.code !== 200) {
      ElMessage.error(res.msg || 'Error')
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      // 兼容直接返回数据或标准结构的情况
      return res.data || res
    }
  },
  (error) => {
    // 处理 HTTP 错误或网络错误
    console.log('err' + error)
    ElMessage.error(error.message)
    return Promise.reject(error)
  }
)

export default service
