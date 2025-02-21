<template>
  <div class="login-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>登录管理</span>
        </div>
      </template>
      
      <el-table :data="loginRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="lastLoginTime" label="最后登录时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface LoginRecord {
  username: string
  role: string
  lastLoginTime: string
}

const loading = ref(false)
const loginRecords = ref<LoginRecord[]>([])

const fetchLoginRecords = () => {
  loading.value = true
  try {
    // 从localStorage获取所有用户的登录记录
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      loginRecords.value = [{
        username: user.username,
        role: '管理员',
        lastLoginTime: new Date(user.loginTime).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/\//g, '-')
      }]
    }
  } catch (error) {
    console.error('获取登录记录失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLoginRecords()
})
</script>

<style scoped>
.login-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 
