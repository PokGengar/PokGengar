<template>
    <div class="devices-container">
      <div class="header">
        <div class="title">
          <h2>{{ currentModule?.name }}设备管理</h2>
          <el-tag>设备总数: {{ total }}</el-tag>
        </div>
        <div class="actions">
          <el-button type="primary" @click="handleAdd">新增设备</el-button>
          <el-upload
            class="upload-demo"
            action="/api/network/devices/import"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">批量导入</el-button>
          </el-upload>
          <el-button type="success" @click="exportDevices">导出设备列表</el-button>
        </div>
      </div>
  
      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="主机名">
          <el-input v-model="searchForm.hostname" placeholder="支持模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="searchForm.ip" placeholder="支持模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 240px;">
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
  
      <!-- 工具栏 -->
      <div class="toolbar" style="margin-bottom: 20px;">
        <div class="left">
          <el-button type="warning" :disabled="!selectedDevices.length" @click="handleBatchEdit">批量编辑</el-button>
          <el-button type="danger" :disabled="!selectedDevices.length" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </div>
  
      <!-- 设备列表 -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="devices"
          border
          style="width: 100%"
          @sort-change="handleSortChange"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="hostname" label="设备主机名" sortable="custom" />
          <el-table-column prop="ip_address" label="设备IP" sortable="custom" />
          <el-table-column label="在线状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
                {{ row.status === 'online' ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="region" label="地区" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
  
      <!-- 分页 -->
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
  
      <!-- 编辑设备对话框 -->
      <el-dialog 
        v-model="dialogVisible" 
        :title="editForm.id ? '编辑设备' : '新增设备'"
        width="500px"
      >
        <el-form 
          ref="formRef"
          :model="editForm" 
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="设备主机名" prop="hostname">
            <el-input v-model="editForm.hostname" />
          </el-form-item>
          <el-form-item label="设备IP" prop="ip_address">
            <el-input v-model="editForm.ip_address" />
          </el-form-item>
          <el-form-item label="地区" prop="region">
            <el-input v-model="editForm.region" />
          </el-form-item>
          <el-form-item label="SSH用户名" prop="username">
            <el-input v-model="editForm.username" />
          </el-form-item>
          <el-form-item label="SSH密码" prop="password">
            <el-input v-model="editForm.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editForm.description" type="textarea" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDevice">保存</el-button>
        </template>
      </el-dialog>
  
      <!-- 批量编辑对话框 -->
      <el-dialog
        v-model="batchEditDialogVisible"
        title="批量编辑"
        width="500px"
      >
        <el-form
          ref="batchFormRef"
          :model="batchForm"
          label-width="100px"
        >
          <el-form-item label="地区">
            <el-input v-model="batchForm.region" placeholder="请输入地区" />
          </el-form-item>
          <el-form-item label="SSH用户名">
            <el-input v-model="batchForm.username" placeholder="请输入SSH用户名" />
          </el-form-item>
          <el-form-item label="SSH密码">
            <el-input v-model="batchForm.password" type="password" placeholder="请输入SSH密码" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="batchEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBatchEdit">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import request from '@/utils/request'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  
  interface Device {
    id?: number
    hostname: string
    ip_address: string
    status?: 'online' | 'offline'
    region: string
    username: string
    password: string
    description?: string
    last_online?: string
  }
  
  interface Module {
    id: number
    name: string
  }
  
  interface SearchForm {
    hostname: string
    ip: string
    status: string
    sort: string
    order: string
  }
  
  const props = defineProps<{
    moduleId: string
  }>()
  
  const route = useRoute()
  const loading = ref(false)
  const devices = ref<Device[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const dialogVisible = ref(false)
  const currentModule = ref<Module | null>(null)
  const formRef = ref<FormInstance>()
  
  // 搜索表单
  const searchForm = reactive<SearchForm>({
    hostname: '',
    ip: '',
    status: '',
    sort: '',
    order: ''
  })
  
  // 编辑表单
  const editForm = ref<Device>({
    hostname: '',
    ip_address: '',
    region: '',
    username: '',
    password: '',
    description: ''
  })
  
  // 表单验证规则
  const rules = {
    hostname: [
      { required: true, message: '请输入设备主机名', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    ip_address: [
      { required: true, message: '请输入设备IP', trigger: 'blur' },
      { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP地址格式不正确', trigger: 'blur' }
    ],
    username: [
      { required: true, message: '请输入SSH用户名', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入SSH密码', trigger: 'blur' }
    ],
    region: [
      { required: true, message: '请输入地区', trigger: 'blur' }
    ]
  }
  
  // 上传相关
  const uploadHeaders = {
    'X-Module-Id': props.moduleId
  }
  
  // 获取模块信息
  const fetchModuleInfo = async () => {
    try {
      const { data } = await request.get<Module>(`/network/modules/${props.moduleId}`)
      currentModule.value = data
    } catch (error) {
      console.error('获取模块信息失败:', error)
      ElMessage.error('获取模块信息失败')
    }
  }
  
  // 获取设备列表
  const fetchDevices = async () => {
    loading.value = true
    try {
      const params = {
        moduleId: props.moduleId,
        page: currentPage.value,
        pageSize: pageSize.value,
        hostname: searchForm.hostname,
        ip: searchForm.ip,
        status: searchForm.status === '在线' ? 'online' : (searchForm.status === '离线' ? 'offline' : ''),
        sort: searchForm.sort,
        order: searchForm.order
      }
      console.log('请求参数:', params)
      
      const response = await request.get('/network/devices', { params })
      console.log('原始响应数据:', response)
      
      if (!response) {
        throw new Error('响应数据为空')
      }

      if (response.data) {
        if (response.data.items) {
          devices.value = response.data.items
          total.value = response.data.total || response.data.items.length
        }
      }
    } catch (error) {
      console.error('获取设备列表失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '获取设备列表失败')
    } finally {
      loading.value = false
    }
  }
  
  // 处理搜索
  const handleSearch = () => {
    currentPage.value = 1
    fetchDevices()
  }
  
  // 重置搜索
  const resetSearch = () => {
    const keys = ['hostname', 'ip', 'status', 'sort', 'order'] as const
    keys.forEach(key => {
      searchForm[key] = ''
    })
    handleSearch()
  }
  
  // 处理排序
  const handleSortChange = (params: { prop: string; order: string }) => {
    searchForm.sort = params.prop
    searchForm.order = params.order === 'ascending' ? 'asc' : 'desc'
    fetchDevices()
  }
  
  // 处理分页
  const handleSizeChange = (val: number) => {
    pageSize.value = val
    fetchDevices()
  }
  
  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    fetchDevices()
  }
  
  // SSH登录处理
  const handleSSHLogin = (row: Device) => {
    try {
      const data = {
        username: row.username,
        password: row.password
      }
      const encryptedData = btoa(encodeURIComponent(JSON.stringify(data)))
      const url = `/ssh-terminal?host=${row.ip_address}&port=22&data=${encryptedData}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('SSH登录处理失败:', error)
      ElMessage.error('SSH登录处理失败')
    }
  }
  
  // 处理编辑
  const handleEdit = (row: Device) => {
    editForm.value = {
      id: row.id,
      hostname: row.hostname,
      ip_address: row.ip_address,
      region: row.region,
      username: row.username,
      password: row.password,
      description: row.description || ''
    }
    dialogVisible.value = true
  }
  
  // 处理新增设备
  const handleAdd = () => {
    editForm.value = {
      hostname: '',
      ip_address: '',
      region: '',
      username: '',
      password: '',
      description: ''
    }
    dialogVisible.value = true
  }
  
  // 保存设备
  const saveDevice = async () => {
    if (!formRef.value) return
    
    try {
      await formRef.value.validate()
      if (editForm.value.id) {
        await request.put(`/network/devices/${editForm.value.id}`, editForm.value)
        ElMessage({
          type: 'success',
          message: '设备信息更新成功',
          duration: 3000,
          showClose: true
        })
      } else {
        await request.post('/network/devices', { 
          ...editForm.value, 
          moduleId: props.moduleId 
        })
        ElMessage({
          type: 'success',
          message: '设备添加成功',
          duration: 3000,
          showClose: true
        })
      }
      dialogVisible.value = false
      await fetchDevices() // 确保等待设备列表刷新完成
    } catch (error: any) {
      // 不在这里处理错误消息，让响应拦截器统一处理
      console.error('保存设备失败:', error)
    }
  }
  
  // 处理文件上传
  const handleUploadSuccess = (response: any) => {
    if (response.error) {
      ElMessage({
        message: response.error,
        type: 'error',
        duration: 5000,
        showClose: true,
        dangerouslyUseHTMLString: true
      })
      return
    }
    ElMessage.success(`导入成功，共导入 ${response.count} 条记录`)
    fetchDevices()
  }
  
  const handleUploadError = (error: any) => {
    console.error('上传失败:', error)
    let errorMessage = '文件上传失败'
    
    // 获取详细的错误信息
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error.message) {
      errorMessage = error.message
    }

    // 创建一个带样式的错误消息容器
    const messageContent = `
      <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
        ${errorMessage.replace(/\n/g, '<br>')}
      </div>
    `

    ElMessage({
      dangerouslyUseHTMLString: true,
      message: messageContent,
      type: 'error',
      duration: 0,
      showClose: true,
      customClass: 'scrollable-message'
    })
  }
  
  const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel'
    if (!isExcel) {
      ElMessage.error('只能上传 Excel 文件!')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      ElMessage.error('文件大小不能超过 2MB!')
      return false
    }
    return true
  }
  
  // 导出设备列表
  const exportDevices = async () => {
    try {
      const response = await request.get('/network/devices/export', {
        params: { moduleId: props.moduleId },
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.data) {
        throw new Error('导出失败：响应数据为空')
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const fileName = `设备列表_${currentModule.value?.name || ''}_${new Date().toLocaleDateString()}.xlsx`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请稍后重试')
    }
  }
  
  // 新增的状态和引用
  const selectedDevices = ref<any[]>([])
  const batchEditDialogVisible = ref(false)
  const batchForm = ref({
    region: '',
    username: '',
    password: ''
  })
  
  // 处理选择变化
  const handleSelectionChange = (selection: any[]) => {
    selectedDevices.value = selection
  }
  
  // 处理批量编辑
  const handleBatchEdit = () => {
    batchForm.value = {
      region: '',
      username: '',
      password: ''
    }
    batchEditDialogVisible.value = true
  }
  
  // 提交批量编辑
  const submitBatchEdit = async () => {
    try {
      const deviceIds = selectedDevices.value.map(device => device.id)
      const updateData = {
        ids: deviceIds,
        ...batchForm.value
      }
      
      await request.put('/network/devices/batch', updateData)
      ElMessage.success('批量更新成功')
      batchEditDialogVisible.value = false
      fetchDevices() // 刷新设备列表
    } catch (error: any) {
      ElMessage.error(error.message || '批量更新失败')
    }
  }
  
  // 处理批量删除
  const handleBatchDelete = async () => {
    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedDevices.value.length} 个设备吗？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      const deviceIds = selectedDevices.value.map(device => device.id)
      await request.delete('/network/devices/batch', { 
        data: { deviceIds } 
      })
      ElMessage.success('批量删除成功')
      fetchDevices() // 刷新设备列表
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '批量删除失败')
      }
    }
  }
  
  // 处理导入成功
  const handleImportSuccess = () => {
    ElMessage.success('导入成功')
    fetchDevices()
  }
  
  // 处理导入错误
  const handleImportError = (error: any) => {
    ElMessage.error(error.message || '导入失败')
  }
  
  // 处理单个删除
  const handleDelete = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除设备"${row.hostname}"吗？`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await request.delete(`/network/devices/${row.id}`)
      ElMessage.success('删除成功')
      fetchDevices()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '删除失败')
      }
    }
  }
  
  onMounted(() => {
    fetchModuleInfo()
    fetchDevices()
  })
  </script>
  
  <style scoped>
  .devices-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .actions {
    display: flex;
    gap: 10px;
  }
  
  .search-form {
    margin-bottom: 20px;
  }
  
  .table-container {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
  }
  
  .pagination {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .toolbar .left {
    display: flex;
    gap: 10px;
  }
  </style>

<style>
/* 自定义错误消息框样式 */
.scrollable-message {
  min-width: 300px;
  max-width: 500px;
}

.scrollable-message .el-message__content {
  text-align: left;
}

/* 自定义滚动条样式 */
.scrollable-message ::-webkit-scrollbar {
  width: 6px;
}

.scrollable-message ::-webkit-scrollbar-thumb {
  background-color: #909399;
  border-radius: 3px;
}

.scrollable-message ::-webkit-scrollbar-track {
  background-color: #f4f4f5;
  border-radius: 3px;
}
</style>
