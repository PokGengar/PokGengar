<template>
  <div class="ntp-log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 日志</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column prop="server" label="NTP服务器" width="160" />
        <el-table-column prop="offset" label="时间偏移" width="120" />
        <el-table-column prop="delay" label="延迟" width="120" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'synced' ? 'success' : 'danger'">
              {{ row.status === 'synced' ? '已同步' : '未同步' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="details" label="详细信息" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

interface Log {
  id: number
  timestamp: string
  server: string
  offset: string
  delay: string
  status: 'synced' | 'unsynced'
  details: string
}

const loading = ref(false)
const logs = ref<Log[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const response = await request.get('/service/log/ntp', {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    })
    if (response && response.data) {
      logs.value = response.data.items
      total.value = response.data.total
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取日志失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  fetchLogs()
}

// 导出
const handleExport = async () => {
  try {
    const response = await request.get('/service/log/ntp/export', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ntp_logs_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
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

onMounted(() => {
  fetchLogs()
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
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-tag {
  min-width: 60px;
  text-align: center;
}
</style> 
