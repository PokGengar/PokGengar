<template>
  <div class="ntp-log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 日志管理</span>
          <el-button type="primary" @click="refreshLogs">刷新日志</el-button>
        </div>
      </template>
      
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="timestamp" label="时间" sortable />
        <el-table-column prop="server" label="服务器" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="offset" label="时间偏移">
          <template #default="{ row }">
            <span :class="{ 'warning-text': Math.abs(row.offset) > 1000 }">
              {{ row.offset }}ms
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="详细信息" show-overflow-tooltip />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

interface Log {
  id: number
  timestamp: string
  server: string
  type: '同步' | '配置' | '告警'
  offset: number
  status: '成功' | '失败'
  message: string
}

const loading = ref(false)
const logs = ref<Log[]>([
  {
    id: 1,
    timestamp: '2024-01-20 10:00:00',
    server: 'NTP-Server-1',
    type: '同步',
    offset: 0.5,
    status: '成功',
    message: '时间同步成功'
  },
  {
    id: 2,
    timestamp: '2024-01-20 10:01:00',
    server: 'NTP-Server-2',
    type: '告警',
    offset: 1200,
    status: '失败',
    message: '时间偏移超过阈值'
  }
])

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

const getTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    '同步': 'success',
    '配置': 'info',
    '告警': 'warning'
  }
  return typeMap[type] || 'info'
}

const refreshLogs = () => {
  loading.value = true
  // 这里添加获取日志的逻辑
  setTimeout(() => {
    loading.value = false
    ElMessage.success('日志刷新成功')
  }, 1000)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  refreshLogs()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  refreshLogs()
}
</script>

<style scoped>
.ntp-log-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-tag {
  min-width: 70px;
  text-align: center;
}

.warning-text {
  color: #E6A23C;
}
</style> 
