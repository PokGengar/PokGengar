<template>
  <div class="ntp-log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 日志</span>
          <div class="header-buttons">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :default-time="[
                new Date(2000, 1, 1, 0, 0, 0),
                new Date(2000, 1, 1, 23, 59, 59),
              ]"
            />
            <el-button type="primary" @click="handleRefresh" :loading="loading">刷新</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.date_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="160" />
        <el-table-column label="偏移量(秒)" width="180">
          <template #default="{ row }">
            {{ formatOffset(row.offset) }}
          </template>
        </el-table-column>
        <el-table-column label="根延迟(ms)" width="120">
          <template #default="{ row }">
            {{ formatRootDelay(row.root_delay) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import * as XLSX from 'xlsx'

interface NtpLog {
  id: number
  date_time: string
  ip_address: string
  offset: string
  root_delay: string
  created_at: string
}

interface NtpLogResponse {
  items: NtpLog[]
  total: number
  page: number
  size: number
}

const loading = ref(false)
const logs = ref<NtpLog[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)
let refreshInterval: number | null = null

// 格式化日期时间（UTC转UTC+8）
const formatDateTime = (dateTime: string) => {
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Shanghai'  // 使用上海时区
    }).replace(/\//g, '-')
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateTime
  }
}

// 格式化偏移量（9位小数）
const formatOffset = (offset: string | number) => {
  try {
    return Number(offset).toFixed(3)
  } catch (error) {
    console.error('偏移量格式化错误:', error)
    return offset
  }
}

// 格式化根延迟（转换为毫秒，3位小数）
const formatRootDelay = (delay: string | number) => {
  try {
    return (Number(delay) * 1000).toFixed(3)
  } catch (error) {
    console.error('根延迟格式化错误:', error)
    return delay
  }
}

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value,
      _t: Date.now()
    }
    
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    console.log('Fetching NTP logs with params:', params)
    const { data: response } = await request.get<NtpLogResponse>('/ntp-logs', { params })
    console.log('Raw response:', response)
    
    // 检查响应结构
    if (response) {
      console.log('Response data structure:', {
        hasData: !!response,
        hasItems: response?.items ? 'yes' : 'no',
        itemsLength: response?.items?.length,
        totalValue: response?.total
      })
      
      if (response?.items) {
        logs.value = response.items
        total.value = response.total
        console.log('Successfully updated logs:', {
          logsLength: logs.value.length,
          firstItem: logs.value[0],
          totalValue: total.value
        })
      } else {
        console.warn('No items in response')
        logs.value = []
        total.value = 0
      }
    } else {
      console.warn('Empty response')
      logs.value = []
      total.value = 0
    }
  } catch (error: any) {
    console.error('Error fetching logs:', error)
    ElMessage.error(error.message || '获取日志失败')
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  fetchLogs()
}

// 导出
const handleExport = () => {
  try {
    const exportData = logs.value.map(log => ({
      '时间': formatDateTime(log.date_time),
      'IP地址': log.ip_address,
      '偏移量': formatOffset(log.offset),
      '根延迟(ms)': formatRootDelay(log.root_delay)
    }))
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NTP日志')
    
    // 导出文件
    XLSX.writeFile(workbook, `ntp_logs_${new Date().toISOString().split('T')[0]}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchLogs()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchLogs()
}

// 启动自动刷新
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(fetchLogs, 60000) // 每分钟刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval) {
    window.clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(() => {
  fetchLogs()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.ntp-log-container {
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
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 
