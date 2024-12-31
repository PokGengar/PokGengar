import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref('admin')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    // 保存登录时间
    localStorage.setItem('loginTime', Date.now().toString())
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('loginTime')
  }

  function checkTokenExpired(): boolean {
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
    setToken,
    clearToken,
    checkTokenExpired
  }
})