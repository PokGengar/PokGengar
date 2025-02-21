<template>
  <div class="ntp-status-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 状态管理</span>
          <el-button type="primary" @click="refreshStatus">刷新状态</el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>服务状态</span>
              </div>
            </template>
            <div class="status-content">
              <div class="status-item">
                <span class="label">总服务器数：</span>
                <span class="value">{{ stats.totalServers }}</span>
              </div>
              <div class="status-item">
                <span class="label">同步服务器：</span>
                <span class="value success">{{ stats.syncedServers }}</span>
              </div>
              <div class="status-item">
                <span class="label">未同步服务器：</span>
                <span class="value danger">{{ stats.unsyncedServers }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="status-card">
            <template #header>
              <div class="status-card-header">
                <span>同步状态</span>
              </div>
            </template>
            <div class="status-content">
              <div class="status-item">
                <span class="label">最小偏移：</span>
                <span class="value success">{{ stats.minOffset }}ms</span>
              </div>
              <div class="status-item">
                <span class="label">最大偏移：</span>
                <span class="value" :class="{ danger: stats.maxOffset > 1000 }">
                  {{ stats.maxOffset }}ms
                </span>
              </div>
              <div class="status-item">
                <span class="label">平均偏移：</span>
                <span class="value" :class="{ warning: stats.avgOffset > 500 }">
                  {{ stats.avgOffset }}ms
                </span>
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
                <span class="label">同步频率：</span>
                <span class="value">{{ stats.syncInterval }}s</span>
              </div>
              <div class="status-item">
                <span class="label">同步成功率：</span>
                <span class="value" :class="getSuccessRateClass(stats.successRate)">
                  {{ stats.successRate }}%
                </span>
              </div>
              <div class="status-item">
                <span class="label">系统时钟状态：</span>
                <span class="value" :class="{ success: stats.clockStatus === '正常' }">
                  {{ stats.clockStatus }}
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
                <span>时间偏移趋势</span>
              </div>
            </template>
            <div class="chart-container">
              <!-- 这里可以添加图表组件 -->
              <div class="chart-placeholder">
                图表区域（可以使用 ECharts 等图表库展示时间偏移趋势）
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
  syncedServers: number
  unsyncedServers: number
  minOffset: number
  maxOffset: number
  avgOffset: number
  syncInterval: number
  successRate: number
  clockStatus: string
}

const stats = ref<Stats>({
  totalServers: 5,
  syncedServers: 4,
  unsyncedServers: 1,
  minOffset: 0.2,
  maxOffset: 1200,
  avgOffset: 450,
  syncInterval: 64,
  successRate: 95,
  clockStatus: '正常'
})

const getSuccessRateClass = (rate: number) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'danger'
}

const refreshStatus = () => {
  ElMessage.success('状态刷新成功')
}
</script>

<style scoped>
.ntp-status-container {
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
