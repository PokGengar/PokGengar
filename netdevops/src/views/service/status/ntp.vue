<template>
  <div class="ntp-status-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 服务状态</span>
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
                  <span class="label">当前时间</span>
                  <span class="value">{{ currentTime }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">同步状态</span>
                  <el-tag size="small" :type="syncStatus === 'synced' ? 'success' : 'warning'">
                    {{ syncStatus === 'synced' ? '已同步' : '未同步' }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>
                <div class="overview-header">
                  <span>同步统计</span>
                </div>
              </template>
              <div class="overview-content">
                <div class="stat-item">
                  <span class="label">同步次数</span>
                  <span class="value">{{ stats.syncCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">成功次数</span>
                  <span class="value success">{{ stats.successCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">失败次数</span>
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
                  <span class="label">同步间隔</span>
                  <span class="value">{{ config.syncInterval }}秒</span>
                </div>
                <div class="stat-item">
                  <span class="label">时区</span>
                  <span class="value">{{ config.timezone }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="server-list">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <div class="overview-header">
                  <span>NTP服务器列表</span>
                </div>
              </template>
              <el-table :data="servers" style="width: 100%">
                <el-table-column prop="server" label="服务器地址" />
                <el-table-column prop="stratum" label="层级" width="100" />
                <el-table-column prop="offset" label="时间偏移" width="120" />
                <el-table-column prop="delay" label="延迟" width="120" />
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                      {{ row.status === 'active' ? '活跃' : '备用' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
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
  syncCount: number
  successCount: number
  failureCount: number
}

interface Config {
  primaryServer: string
  syncInterval: number
  timezone: string
}

interface Server {
  server: string
  stratum: number
  offset: string
  delay: string
  status: 'active' | 'backup'
}

const loading = ref(false)
const serviceStatus = ref('running')
const uptime = ref('0天0小时0分')
const currentTime = ref('')
const syncStatus = ref('synced')
const stats = ref<Stats>({
  syncCount: 0,
  successCount: 0,
  failureCount: 0
})
const config = ref<Config>({
  primaryServer: '',
  syncInterval: 0,
  timezone: ''
})
const servers = ref<Server[]>([])

// 获取状态信息
const fetchStatus = async () => {
  loading.value = true
  try {
    const response = await request.get('/service/status/ntp')
    if (response && response.data) {
      const data = response.data
      serviceStatus.value = data.serviceStatus
      uptime.value = data.uptime
      currentTime.value = data.currentTime
      syncStatus.value = data.syncStatus
      stats.value = data.stats
      config.value = data.config
      servers.value = data.servers
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
.ntp-status-container {
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

.server-list {
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
