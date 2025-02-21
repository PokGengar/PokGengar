<template>
  <div class="aaa-log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AAA 日志管理</span>
          <el-button type="primary" @click="refreshLogs">刷新日志</el-button>
        </div>
      </template>
      
      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="timestamp" label="时间" sortable />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="source_ip" label="来源IP" />
        <el-table-column prop="server" label="认证服务器" />
        <el-table-column prop="type" label="认证类型">
          <template #default="{ row }">
            <el-tag :type="row.type === 'Login' ? 'success' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'Success' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
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
  username: string
  source_ip: string
  server: string
  type: 'Login' | 'Command'
  status: 'Success' | 'Failure'
}

const loading = ref(false)
const logs = ref<Log[]>([
  {
    id: 1,
    timestamp: '2024-01-20 10:00:00',
    username: 'admin',
    source_ip: '192.168.1.100',
    server: 'AAA-Server-1',
    type: 'Login',
    status: 'Success'
  },
  {
    id: 2,
    timestamp: '2024-01-20 10:01:00',
    username: 'operator',
    source_ip: '192.168.1.101',
    server: 'AAA-Server-2',
    type: 'Command',
    status: 'Failure'
  }
])

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

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
.aaa-log-container {
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
  width: 70px;
  text-align: center;
}
</style> 
