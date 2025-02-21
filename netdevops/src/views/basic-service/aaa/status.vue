<template>
  <div class="aaa-status-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AAA 状态管理</span>
          <el-button type="primary" @click="refreshStatus">刷新状态</el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>认证服务状态</span>
              </div>
            </template>
            <div class="status-content">
              <div class="status-item">
                <span class="label">总服务器数：</span>
                <span class="value">{{ stats.totalServers }}</span>
              </div>
              <div class="status-item">
                <span class="label">在线服务器：</span>
                <span class="value success">{{ stats.onlineServers }}</span>
              </div>
              <div class="status-item">
                <span class="label">离线服务器：</span>
                <span class="value danger">{{ stats.offlineServers }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>认证统计</span>
              </div>
            </template>
            <div class="status-content">
              <div class="status-item">
                <span class="label">总认证次数：</span>
                <span class="value">{{ stats.totalAuth }}</span>
              </div>
              <div class="status-item">
                <span class="label">成功次数：</span>
                <span class="value success">{{ stats.successAuth }}</span>
              </div>
              <div class="status-item">
                <span class="label">失败次数：</span>
                <span class="value danger">{{ stats.failedAuth }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>性能指标</span>
              </div>
            </template>
            <div class="status-content">
              <div class="status-item">
                <span class="label">平均响应时间：</span>
                <span class="value">{{ stats.avgResponseTime }}ms</span>
              </div>
              <div class="status-item">
                <span class="label">每秒请求数：</span>
                <span class="value">{{ stats.requestsPerSecond }}</span>
              </div>
              <div class="status-item">
                <span class="label">CPU使用率：</span>
                <span class="value" :class="{ warning: stats.cpuUsage > 80 }">
                  {{ stats.cpuUsage }}%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>实时监控</span>
              </div>
            </template>
            <div class="chart-container">
              <!-- 这里可以添加图表组件 -->
              <div class="chart-placeholder">
                图表区域（可以使用 ECharts 等图表库展示实时数据）
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

interface Stats {
  totalServers: number
  onlineServers: number
  offlineServers: number
  totalAuth: number
  successAuth: number
  failedAuth: number
  avgResponseTime: number
  requestsPerSecond: number
  cpuUsage: number
}

const stats = ref<Stats>({
  totalServers: 5,
  onlineServers: 4,
  offlineServers: 1,
  totalAuth: 1000,
  successAuth: 950,
  failedAuth: 50,
  avgResponseTime: 20,
  requestsPerSecond: 100,
  cpuUsage: 45
})

const refreshStatus = () => {
  ElMessage.success('状态刷新成功')
}
</script>

<style scoped>
.aaa-status-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-card {
  height: 100%;
}

.status-card-header {
  font-weight: bold;
}

.status-content {
  padding: 10px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
}

.value {
  font-weight: bold;
  color: #303133;
}

.value.success {
  color: #67C23A;
}

.value.warning {
  color: #E6A23C;
}

.value.danger {
  color: #F56C6C;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-placeholder {
  color: #909399;
  font-size: 14px;
}
</style> 
