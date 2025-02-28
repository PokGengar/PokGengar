<template>
  <div class="app-wrapper">
    <div class="sidebar">
      <div class="logo">
        <span class="logo-text">IT运维平台</span>
      </div>
      <Sidebar />
    </div>
    <div class="main-container">
      <div class="header">
        <div class="right">
          <div class="user-info">
            <div class="avatar">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="avatar-image">
                <defs>
                  <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="98" fill="url(#robotGradient)" />
                <path d="M50 100 C50 60 150 60 150 100 L150 140 C150 180 50 180 50 140 Z" fill="#000" />
                <path d="M85 90 Q100 110 115 90" stroke="#40E0D0" stroke-width="6" fill="none" />
                <path d="M90 110 L110 110 L100 120 Z" fill="#40E0D0" />
              </svg>
            </div>
            <span class="username">{{ userStore.username }}</span>
            <el-button 
              type="primary" 
              link 
              @click="handleLogout" 
              class="logout-button"
            >
              退出登录
            </el-button>
          </div>
        </div>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from '@/stores/user'
import Sidebar from '@/layout/components/Sidebar.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.clearToken()
  // 先跳转到 SSO 的退出登录页面
  const ssoLogoutUrl = 'https://login.alibaba-inc.com/ssoLogout.htm'
  const appName = 'mallard'
  const returnUrl = encodeURIComponent(`http://30.118.110.15:5173/sendBucSSOToken.do?from=logout`)
  window.location.href = `${ssoLogoutUrl}?APP_NAME=${appName}&RETURN_URL=${returnUrl}&CANCEL_COOKIE=true`
}
</script>

<style scoped>
.app-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background-color: #fff;  /* 改为白色背景 */
  overflow: hidden;
}

.sidebar {
  width: 210px;
  background-color: #1e2c3c;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background-color: #1b2838;
}

.logo-text {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-menu {
  border: none;
  flex: 1;
  overflow-y: auto;
}

.main-container {
  flex: 1;
  margin-left: 0;  /* 移除左边距 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
}

.header {
  height: 50px;
  background-color: #1e2c3c;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
  z-index: 1000;
  border-bottom: 1px solid #2d3e50;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.username {
  font-size: 14px;
  color: #fff;
}

.logout-button {
  color: #fff;
  font-size: 14px;
  padding: 0;
  height: auto;
}

.logout-button:hover {
  color: #409EFF;
}

.main-content {
  flex: 1;
  position: relative;
  padding: 0;
  background-color: #fff;  /* 改为白色背景 */
  overflow: hidden;
}

/* :deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 210px;
  background-color: #1b2838;
}

:deep(.el-menu-item.is-active) {
  background-color: #1b2838 !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #1b2838 !important;
}

:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: #409EFF !important;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
}

:deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
}

:deep(.el-sub-menu__title .el-icon) {
  margin-right: 8px;
} */
</style>
