import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  username: string
  [key: string]: any
}

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const username = ref('')
  const userInfo = ref<UserInfo | null>(null)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    // 保存登录时间
    localStorage.setItem('loginTime', Date.now().toString())
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
    username.value = info.username
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  const clearToken = () => {
    token.value = ''
    username.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('loginTime')
    localStorage.removeItem('userInfo')
  }

  const checkTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime')
    if (!loginTime) return true

    const now = Date.now()
    const diff = now - parseInt(loginTime)
    // 10分钟 = 600000毫秒
    return diff > 600000
  }

  return {
    token,
    username,
    userInfo,
    setToken,
    setUserInfo,
    clearToken,
    checkTokenExpired
  }
})
