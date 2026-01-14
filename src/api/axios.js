import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Proxy target in vite.config.js
  timeout: 5000
})

// Request interceptor
service.interceptors.request.use(
  (config) => {
    // Add token if exists
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers['Authorization'] = 'Bearer ' + token
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data
    // Assuming standard response structure { code: 200, data: ..., msg: ... }
    if (res.code && res.code !== 200) {
      ElMessage.error(res.msg || 'Error')
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res.data || res
    }
  },
  (error) => {
    console.log('err' + error)
    ElMessage.error(error.message)
    return Promise.reject(error)
  }
)

export default service
