<template>
  <div class="aaa-status-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AAA 服务状态</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <div class="status-overview" v-loading="loading">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="overview-header">
                  <span>服务状态</span>
                  <el-tag :type="serviceStatus === 'running' ? 'success' : 'danger'">
                    {{ serviceStatus === 'running' ? '运行中' : '已停止' }}
                  </el-tag>
                </div>
              </template>
              <div class="overview-content">
                <div class="stat-item">
                  <span class="label">运行时间</span>
                  <span class="value">{{ uptime }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">CPU使用率</span>
                  <span class="value">{{ cpuUsage }}%</span>
                </div>
                <div class="stat-item">
                  <span class="label">内存使用率</span>
                  <span class="value">{{ memoryUsage }}%</span>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="overview-header">
                  <span>认证统计</span>
                </div>
              </template>
              <div class="overview-content">
                <div class="stat-item">
                  <span class="label">总请求数</span>
                  <span class="value">{{ stats.totalRequests }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">成功数</span>
                  <span class="value success">{{ stats.successCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">失败数</span>
                  <span class="value error">{{ stats.failureCount }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="overview-header">
                  <span>服务器配置</span>
                </div>
              </template>
              <div class="overview-content">
                <div class="stat-item">
                  <span class="label">主服务器</span>
                  <span class="value">{{ config.primaryServer }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">备用服务器</span>
                  <span class="value">{{ config.backupServer }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">认证方式</span>
                  <span class="value">{{ config.authMethod }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface Stats {
  totalRequests: number
  successCount: number
  failureCount: number
}

interface Config {
  primaryServer: string
  backupServer: string
  authMethod: string
}

const loading = ref(false)
const serviceStatus = ref('running')
const uptime = ref('0天0小时0分')
const cpuUsage = ref(0)
const memoryUsage = ref(0)
const stats = ref<Stats>({
  totalRequests: 0,
  successCount: 0,
  failureCount: 0
})
const config = ref<Config>({
  primaryServer: '',
  backupServer: '',
  authMethod: ''
})

// 获取状态信息
const fetchStatus = async () => {
  loading.value = true
  try {
    const response = await request.get('/service/status/aaa')
    if (response && response.data) {
      const data = response.data
      serviceStatus.value = data.serviceStatus
      uptime.value = data.uptime
      cpuUsage.value = data.cpuUsage
      memoryUsage.value = data.memoryUsage
      stats.value = data.stats
      config.value = data.config
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取状态信息失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  fetchStatus()
}

onMounted(() => {
  fetchStatus()
})
</script>

<style scoped>
.aaa-status-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.status-overview {
  margin-top: 20px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-content {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  font-size: 14px;
}

.value {
  font-size: 16px;
  font-weight: 500;
}

.value.success {
  color: #67c23a;
}

.value.error {
  color: #f56c6c;
}

.el-tag {
  min-width: 60px;
  text-align: center;
}
</style> 
