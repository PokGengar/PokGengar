<template>
  <div class="log-container">
    <div class="header">
      <h2>AAA日志</h2>
      <div class="header-right">
        <span class="last-update" v-if="lastUpdateTime">
          最后更新: {{ formatUpdateTime(lastUpdateTime) }}
        </span>
        <el-button type="primary" @click="handleRefresh" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <el-table 
      :data="displayLogs" 
      v-loading="loading"
      stripe
      border
      style="width: 100%; margin-top: 20px;"
      height="calc(100vh - 250px)"
    >
      <el-table-column prop="timestamp" label="时间" min-width="180" />
      <el-table-column prop="server_ip" label="设备公网IP" min-width="150" />
      <el-table-column prop="username" label="运维账号" min-width="120" />
      <el-table-column prop="action" label="执行命令" min-width="300" show-overflow-tooltip />
    </el-table>

    <!-- 分页器 -->
    <div class="pagination">
      <el-pagination
        background
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalLogs"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const API_BASE_URL = 'http://30.118.110.15:3000/api'

interface LogEntry {
  timestamp: string
  server_ip: string
  username: string
  action: string
}

const logs = ref<LogEntry[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const lastUpdateTime = ref<Date | null>(null)
const previousLogsLength = ref(0)
let pollingInterval: NodeJS.Timer | null = null

// 计算总日志数
const totalLogs = computed(() => logs.value.length)

// 计算当前页显示的日志
const displayLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return logs.value.slice(start, end)
})

// 格式化更新时间
const formatUpdateTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取日志
const fetchLogs = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${API_BASE_URL}/aaa-logs`)
    
    if (response.data && Array.isArray(response.data)) {
      // 记录之前的日志数量
      previousLogsLength.value = logs.value.length
      
      // 更新日志数据
      logs.value = response.data.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      })
      
      // 更新最后更新时间
      lastUpdateTime.value = new Date()
      
      // 检查是否有新日志
      if (logs.value.length > previousLogsLength.value) {
        const newLogsCount = logs.value.length - previousLogsLength.value
        ElMessage.success(`发现 ${newLogsCount} 条新日志`)
      }
    } else {
      logs.value = []
      ElMessage.warning('没有日志数据')
    }
  } catch (error) {
    console.error('获取日志错误:', error)
    const errorMessage = error.response?.data?.details || error.message
    ElMessage.error(`获取日志失败: ${errorMessage}`)
    logs.value = []
  } finally {
    loading.value = false
  }
}

// 手动刷新
const handleRefresh = async () => {
  await fetchLogs()
}

// 处理每页显示数量变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 开始轮询
const startPolling = () => {
  stopPolling() // 先清除可能存在的定时器
  pollingInterval = setInterval(fetchLogs, 30000)
}

// 停止轮询
const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// 组件挂载时
onMounted(() => {
  fetchLogs()
  startPolling()
})

// 组件卸载时
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.log-container {
  padding: 20px;
  background-color: #fff;
  color: #333;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.last-update {
  color: #666;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  padding: 10px 0;
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
}

:deep(.el-table) {
  flex: 1;
  margin-top: 20px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #333;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafafa;
}

:deep(.el-pagination) {
  padding: 0;
  margin: 0;
}

:deep(.el-table__body tr:hover td.el-table__cell) {
  background-color: #f5f7fa;
}

:deep(.el-table__cell) {
  word-break: break-all;
}
</style>
