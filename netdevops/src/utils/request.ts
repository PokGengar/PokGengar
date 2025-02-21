import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

// 添加消息去重机制
const showMessage = (() => {
  const messageQueue = new Set()
  
  return (message: string, type: 'success' | 'warning' | 'error' = 'error') => {
    if (messageQueue.has(message)) {
      return
    }
    messageQueue.add(message)
    ElMessage({
      message,
      type,
      onClose: () => {
        messageQueue.delete(message)
      }
    })
  }
})()

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 创建一个不带baseURL的实例，用于SSO请求
export const ssoService = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    // 为执行任务接口设置更长的超时时间
    if (config.url?.includes('/automation/execute/')) {
      config.timeout = 120000  // 执行任务接口设置2分钟超时
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// SSO请求拦截器
ssoService.interceptors.request.use(
  config => {
    // 添加时间戳防止缓存
    if (config.url) {
      const timestamp = new Date().getTime()
      config.url += (config.url.includes('?') ? '&' : '?') + `_t=${timestamp}`
    }
    return config
  },
  error => {
    console.error('SSO请求错误:', error)
    return Promise.reject(error)
  }
)

// SSO响应拦截器
ssoService.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error('SSO响应错误:', error)
    showMessage('SSO验证失败，请重试')
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 处理二进制数据（如文件下载）
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 处理包含 code 的标准格式响应
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        return res.data
      }
      // 处理业务错误
      showMessage(res.message || '操作失败')
      return Promise.reject(new Error(res.message || '操作失败'))
    }
    
    // 处理不包含 code 的数组或对象响应（如 modules/stats 接口）
    return res
  },
  error => {
    console.error('响应错误:', error)
    // 处理 HTTP 错误
    if (error.response) {
      const status = error.response.status
      const errorMessage = error.response.data?.error || error.message

      switch (status) {
        case 401:
          showMessage('未登录或登录已过期')
          // 可以在这里处理登录过期逻辑
          const router = useRouter()
          router.push('/login')
          break
        case 403:
          showMessage('没有权限')
          break
        case 400:
        case 404:
        case 500:
          // 直接显示后端返回的错误信息
          if (error.response.data?.error) {
            showMessage(error.response.data.error)
          } else if (error.response.data?.message) {
            showMessage(error.response.data.message)
          } else if (error.response.data) {
            // 如果错误信息在 data 本身
            showMessage(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
          } else {
            showMessage(errorMessage || '请求失败')
          }
          break
        default:
          showMessage(errorMessage || '请求失败')
      }
    } else if (error.request) {
      showMessage('网络错误，请检查网络连接')
    } else {
      showMessage(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default service
