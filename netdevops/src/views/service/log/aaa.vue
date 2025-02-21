<template>
  <div class="aaa-log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AAA 日志</span>
          <div class="header-buttons">
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
            <el-button type="success" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      
      <div class="search-container">
        <el-form :inline="true" class="search-form">
          <el-form-item label="用户名">
            <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="仓出口IP">
            <el-input
              v-model="searchForm.source_ip"
              placeholder="请输入仓出口IP"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="执行命令">
            <el-input
              v-model="searchForm.details"
              placeholder="请输入执行命令"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="table-container">
        <div class="table-wrapper">
          <el-table 
            ref="tableRef"
            :data="logs" 
            v-loading="loading"
            height="calc(100vh - 420px)"
            border
            style="width: 100%"
            @header-dragend="handleHeaderDragend"
          >
            <el-table-column 
              prop="timestamp" 
              label="时间" 
              :width="columnWidths.timestamp"
              fixed="left"
              show-overflow-tooltip
              resizable
            />
            <el-table-column 
              prop="username" 
              label="用户名" 
              :width="columnWidths.username"
              show-overflow-tooltip
              resizable
            />
            <el-table-column 
              prop="source_ip" 
              label="仓出口IP" 
              :width="columnWidths.source_ip"
              show-overflow-tooltip
              resizable
            />
            <el-table-column 
              prop="details" 
              label="执行命令" 
              :min-width="columnWidths.details.min"
              :max-width="columnWidths.details.max"
              show-overflow-tooltip
              resizable
            />
          </el-table>
        </div>
      </div>

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
  username: string
  source_ip: string
  details: string
}

interface RawLog {
  id?: number
  timestamp: string
  username: string
  server_ip: string  // 这里的 server_ip 实际包含了仓库名称和IP
  action: string
}

interface ColumnWidths {
  timestamp: number
  username: number
  source_ip: number
  details: {
    min: number
    max: number
  }
}

type ColumnKey = keyof ColumnWidths

const loading = ref(false)
const logs = ref<Log[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 添加搜索表单数据
const searchForm = ref({
  username: '',
  source_ip: '',
  details: ''
})

// 添加命令列宽度计算
const commandColumnWidth = ref('auto')

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    // 添加时间戳参数，避免缓存
    const timestamp = new Date().getTime()
    const response = await request.get('/service/log/aaa', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        username: searchForm.value.username.trim(),
        source_ip: searchForm.value.source_ip.trim(),  // 搜索时仍然可以用IP或仓库名搜索
        details: searchForm.value.details.trim(),
        _t: timestamp
      }
    })
    if (response) {
      const data = response as unknown as {
        items: RawLog[];
        total: number;
        page: number;
        size: number;
      }

      logs.value = data.items.map((log: RawLog) => ({
        id: log.id || Date.now(),
        timestamp: log.timestamp,
        username: log.username,
        source_ip: log.server_ip,  // 直接使用完整的仓库信息
        details: log.action
      }));
      
      total.value = data.total;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取日志失败')
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  // 重置到第一页
  currentPage.value = 1
  // 保持当前的搜索条件和每页显示数量
  fetchLogs()
  ElMessage.success('刷新成功')
}

// 导出
const handleExport = async () => {
  try {
    const response = await request.get('/service/log/aaa/export', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `aaa_logs_${new Date().toISOString().split('T')[0]}.json`)
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

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

// 处理重置
const handleReset = () => {
  searchForm.value = {
    username: '',
    source_ip: '',
    details: ''
  }
  currentPage.value = 1
  fetchLogs()
}

const tableRef = ref()
const columnWidths = ref<ColumnWidths>({
  timestamp: 180,
  username: 120,
  source_ip: 200,
  details: {
    min: 200,
    max: 800
  }
})

// 处理列宽拖动结束事件
const handleHeaderDragend = (newWidth: number, oldWidth: number, column: { property: ColumnKey }, event: Event) => {
  // 获取当前拖动的列
  const prop = column.property
  const widthDelta = newWidth - oldWidth
  
  // 计算表格容器宽度
  const tableWidth = tableRef.value.$el.offsetWidth
  
  // 计算所有固定宽度列的总宽
  const fixedColumnsWidth = columnWidths.value.timestamp + 
                          columnWidths.value.username + 
                          columnWidths.value.source_ip
  
  if (prop === 'details') {
    // 对于执行命令列，限制在合理范围内
    const maxWidth = tableWidth - fixedColumnsWidth - 2
    columnWidths.value.details.min = Math.min(Math.max(newWidth, 200), maxWidth)
    columnWidths.value.details.max = maxWidth
  } else {
    // 对于其他列，调整当前列宽的同时，相应调整执行命令列的宽度
    const oldDetailsWidth = columnWidths.value.details.min
    const newDetailsWidth = oldDetailsWidth - widthDelta
    
    // 确保其他列不小于最小宽度
    const minColumnWidth = 100
    if (newWidth >= minColumnWidth) {
      columnWidths.value[prop] = newWidth
      // 确保执行命令列宽度在合理范围内
      columnWidths.value.details.min = Math.max(200, newDetailsWidth)
      columnWidths.value.details.max = tableWidth - (fixedColumnsWidth + widthDelta) - 2
    }
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.aaa-log-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 1400px;
  margin: 0 auto;
}

.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  padding-bottom: 16px;  /* 增加底部内边距 */
}

.table-container {
  flex: 1;
  min-height: 0;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 16px;  /* 增加底部间距 */
}

.table-wrapper {
  width: 100%;
  overflow: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background-color: #fff;
  flex: 1;  /* 让表格容器占满剩余空间 */
}

.search-container {
  margin-bottom: 12px;  /* 减少底部间距 */
  width: 100%;
  padding: 12px 16px;  /* 减少内边距 */
  background-color: #f5f7fa;
  border-radius: 4px;
}

.search-form {
  width: 100%;
  display: flex;
  align-items: center;  /* 垂直居中对齐 */
  flex-wrap: nowrap;  /* 不换行 */
  gap: 16px;
}

:deep(.el-form--inline) {
  width: 100%;
  display: flex;
  align-items: center;  /* 垂直居中对齐 */
  flex-wrap: nowrap;  /* 不换行 */
  gap: 16px;
}

:deep(.el-form--inline .el-form-item) {
  margin: 0;
  width: 220px;  /* 固定搜索框宽度 */
  flex: none;
}

:deep(.el-form--inline .el-form-item:last-child) {
  width: auto;
  margin-left: 16px;  /* 与其他元素保持一致的间距 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;  /* 减少底部间距 */
  padding: 0;  /* 移除内边距 */
  border-bottom: none;  /* 移除底部边框 */
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 0;  /* 移除顶部边距 */
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: transparent;
  box-shadow: none;
  position: relative;
  z-index: 1;
  height: 64px;  /* 设置固定高度 */
}

:deep(.el-pagination) {
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 32px;  /* 确保分页组件有固定高度 */
}

:deep(.el-pagination .el-pagination__total) {
  margin-right: 16px;
}

:deep(.el-pagination .el-pagination__sizes) {
  margin-right: 16px;
}

:deep(.el-pagination .el-select .el-input) {
  width: 110px;
}

:deep(.el-pagination .el-pagination__jump) {
  margin-left: 16px;
}

:deep(.el-pagination .el-pagination__sizes .el-input__inner) {
  height: 28px;
  line-height: 28px;
}

:deep(.el-pagination button) {
  height: 28px;
  min-width: 28px;
}

/* 表格样式优化 */
:deep(.el-table) {
  height: calc(100vh - 420px) !important;  /* 调整表格高度 */
  width: 100%;
  min-width: 800px;
}

:deep(.el-table__body),
:deep(.el-table__header) {
  min-width: 100%;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

:deep(.el-table--border) {
  border: 1px solid #EBEEF5;
}

:deep(.el-table__fixed-right) {
  height: 100% !important;
  box-shadow: -2px 0 8px rgba(0,0,0,.1);
}
</style> 
