<template>
  <div class="sso-callback">
    <el-card v-if="error">
      <h2>登录失败</h2>
      <p>{{ error }}</p>
      <el-button type="primary" @click="retryLogin">重试</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ssoService } from '@/utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const error = ref('')

const validateSSOToken = async (ssoToken: string) => {
  try {
    console.log('开始验证SSO Token')
    
    // 使用本地后端验证接口
    const response = await ssoService.post('/api/sso/validate', {
      SSO_TOKEN: ssoToken,
      APP_NAME: 'mallard'
    })

    console.log('SSO验证响应:', response)

    if (response.data && response.data.success) {
      // 立即保存用户信息和登录态
      const userInfo = {
        username: response.data.username,
        token: ssoToken,
        loginTime: Date.now()
      }
      
      // 同步保存登录信息
      localStorage.setItem('token', ssoToken)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      userStore.setUserInfo(userInfo)
      userStore.setToken(ssoToken)
      
      // 直接跳转到首页
      router.push('/index')
    } else {
      throw new Error('验证失败：' + (response.data?.message || '响应数据无效'))
    }
  } catch (err) {
    console.error('SSO Token 验证失败:', err)
    error.value = '登录验证失败，请重试'
    ElMessage.error('登录验证失败，请重试')
    // 验证失败后立即重定向到登录页
    setTimeout(() => router.push('/login'), 2000)
  }
}

const retryLogin = () => {
  router.push('/login')
}

onMounted(async () => {
  console.log('SSO回调页面加载')
  console.log('当前URL:', window.location.href)
  console.log('路由参数:', route.query)
  
  // 检查是否从退出登录页面返回
  const fromLogout = route.query.from === 'logout'
  const ssoToken = route.query.SSO_TOKEN as string
  
  if (fromLogout || !ssoToken) {
    console.log('从退出登录页面返回或未收到SSO Token')
    // 清除本地存储和cookie
    localStorage.clear()
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    
    // 重定向到SSO登录页面
    const ssoLoginUrl = 'https://login.alibaba-inc.com/ssoLogin.htm'
    const appName = 'mallard'
    const backUrl = encodeURIComponent(`http://30.118.110.15:5173/sendBucSSOToken.do`)
    window.location.href = `${ssoLoginUrl}?APP_NAME=${appName}&BACK_URL=${backUrl}&RETURN_USER=true`
    return
  }

  console.log('获取到 SSO Token，准备验证')
  try {
    // 验证 Token 并获取用户信息
    const response = await ssoService.post('/api/sso/validate', {
      SSO_TOKEN: ssoToken
    })

    console.log('SSO验证响应:', response)

    if (response.data && response.data.success) {
      // 解析用户信息
      const userContent = JSON.parse(response.data.content)
      console.log('解析到的用户信息:', userContent)

      // 立即保存用户信息和登录态
      const userInfo = {
        username: userContent.nickNameCn || userContent.loginName || `user_${ssoToken.substring(0, 8)}`,
        token: ssoToken,
        loginTime: Date.now(),
        ...userContent  // 保存完整的用户信息
      }
      
      // 同步保存登录信息
      localStorage.setItem('token', ssoToken)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      userStore.setUserInfo(userInfo)
      userStore.setToken(ssoToken)
      
      // 直接跳转到首页
      router.push('/index')
    } else {
      throw new Error('验证失败：' + (response.data?.message || '响应数据无效'))
    }
  } catch (err) {
    console.error('处理SSO回调失败:', err)
    error.value = '登录处理失败，请重试'
    ElMessage.error('登录处理失败，请重试')
    // 清除所有存储和cookie
    localStorage.clear()
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    
    setTimeout(() => {
      const ssoLoginUrl = 'https://login.alibaba-inc.com/ssoLogin.htm'
      const appName = 'mallard'
      const backUrl = encodeURIComponent(`http://30.118.110.15:5173/sendBucSSOToken.do`)
      window.location.href = `${ssoLoginUrl}?APP_NAME=${appName}&BACK_URL=${backUrl}&RETURN_USER=true`
    }, 2000)
  }
})
</script>

<style scoped>
.sso-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.el-card {
  width: 400px;
  text-align: center;
}

h2 {
  color: #f56c6c;
  margin-bottom: 20px;
}

.el-button {
  margin-top: 20px;
}
</style> 

