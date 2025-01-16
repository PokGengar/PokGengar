<template>
  <div class="app-wrapper">
    <div class="sidebar">
      <div class="logo">
        <span class="logo-text">IT运维平台</span>
      </div>
      <el-menu
        :default-active="route.path"
        class="sidebar-menu"
        background-color="#1e2c3c"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :router="true"
      >
        <el-menu-item index="/index">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/index/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-sub-menu index="/index/aaa">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>AAA管理</span>
          </template>
          <el-menu-item index="/index/aaa/server">AAA服务器</el-menu-item>
          <el-menu-item index="/index/aaa/log">AAA日志</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/index/network">
          <el-icon><Monitor /></el-icon>
          <template #title>网络设备管理</template>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="main-container">
      <div class="header">
        <div class="right">
          <div class="user-info">
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
import { 
  User, 
  Setting, 
  ArrowDown,
  HomeFilled,
  Monitor 
} from "@element-plus/icons-vue"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const handleLogout = () => {
  userStore.clearToken()
  router.push('/login')
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
  margin-left: 210px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;  /* 改为白色背景 */
}

.header {
  height: 50px;
  background-color: #fff;  /* 改为白色背景 */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 15px;
  z-index: 1000;
  border-bottom: 1px solid #e6e6e6;  /* 改为浅灰色边框 */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;  /* 改为深色文字 */
}

.username {
  font-size: 14px;
  color: #333;  /* 改为深色文字 */
}

.logout-button {
  color: #409EFF;
  font-size: 14px;
  padding: 0;
  height: auto;
}

.logout-button:hover {
  color: #66b1ff;
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
