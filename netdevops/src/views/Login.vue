<template>
    <div class="login-container">
      <div class="login-box">
        <h1 class="title">IT运维平台</h1>
        <p class="subtitle">NetDevOps</p>
        <el-form 
          :model="loginForm" 
          :rules="rules" 
          ref="loginFormRef" 
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="账户密码登录" 
              :prefix-icon="User"
              class="dark-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="密码" 
              :prefix-icon="Lock"
              @keyup.enter="handleLogin" 
              class="dark-input"
              show-password
            />
          </el-form-item>
          <el-button 
            type="primary" 
            class="login-button" 
            :loading="loading" 
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive } from "vue"
  import { useRouter } from "vue-router"
  import { ElMessage } from "element-plus"
  import { User, Lock } from "@element-plus/icons-vue"
  import type { FormInstance, FormRules } from "element-plus"
  import { useUserStore } from '@/stores/user'
  
  const router = useRouter()
  const loading = ref(false)
  const loginFormRef = ref<FormInstance>()
  
  const loginForm = reactive({
    username: "",
    password: ""
  })
  
  const rules = {
    username: [{
      required: true,
      message: "请输入用户名",
      trigger: "blur"
    }],
    password: [{
      required: true,
      message: "请输入密码",
      trigger: "blur"
    }]
  }
  
  const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      if (loginForm.username === "admin" && loginForm.password === "admin123") {
        const token = "mock-token-" + Date.now()
        const userStore = useUserStore()
        userStore.setToken(token)
        ElMessage.success("登录成功")
        router.push('/index')  // 修改为跳转到 /index
      } else {
        ElMessage.error("用户名或密码错误")
      }
      loading.value = false
    }
  })
}
  </script>
  
  <style scoped>
  .login-container {
    min-height: 100vh;
    min-width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000;
    background-image: radial-gradient(circle at 50% 50%, rgba(33,33,33,0.5) 0%, rgba(0,0,0,0.5) 100%);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  .login-container::before {
    content: "";
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 30px 30px;
    animation: rotate 60s linear infinite;
    opacity: 0.3;
  }
  
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .login-box {
    position: relative;
    z-index: 1;
    width: 400px;
    text-align: center;
    padding: 0 20px;
    box-sizing: border-box;
  }
  
  .title {
    color: #fff;
    font-size: 32px;
    margin: 0 0 10px 0;
  }
  
  .subtitle {
    color: rgba(255,255,255,0.6);
    margin: 0 0 40px 0;
  }
  
  .login-form {
    margin-top: 30px;
  }
  
  :deep(.dark-input) {
    background: transparent;
  }
  
  :deep(.dark-input .el-input__wrapper) {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: none;
  }
  
  :deep(.dark-input .el-input__inner) {
    color: #fff;
  }
  
  :deep(.dark-input .el-input__prefix-inner) {
    color: rgba(255,255,255,0.7);
  }
  
  .login-button {
    width: 100%;
    height: 40px;
    background: #409EFF;
    border: none;
    margin-top: 20px;
  }
  
  @media screen and (max-width: 480px) {
    .login-box {
      width: 90%;
      max-width: 400px;
    }
  }
  </style>