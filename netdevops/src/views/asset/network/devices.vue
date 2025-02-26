<template>
  <div class="devices-container">
    <div class="header">
      <h2>网络设备列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">新增设备</el-button>
        <el-button type="success" @click="handleBatchImport">批量导入</el-button>
        <el-button type="warning" @click="showBatchEditDialog" :disabled="!selectedDevices.length">
          批量编辑
        </el-button>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-container">
      <el-row :gutter="20">
        <el-col :span="5">
          <el-input
            v-model="searchForm.hostname"
            placeholder="请输入设备主机名"
            clearable
          />
        </el-col>
        <el-col :span="5">
          <el-input
            v-model="searchForm.ip"
            placeholder="请输入设备IP"
            clearable
          />
        </el-col>
        <el-col :span="5">
          <el-input
            v-model="searchForm.description"
            placeholder="请输入描述"
            clearable
          />
        </el-col>
        <el-col :span="5">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态" 
            clearable 
            style="width: 100%"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 设备列表表格 -->
    <el-table
      v-loading="loading"
      :data="devices"
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="hostname" label="设备主机名" min-width="180" />
      <el-table-column prop="ip_address" label="设备IP" min-width="150" />
      <el-table-column prop="region" label="地区" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
            {{ row.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            link
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <!-- 新增/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '新增设备'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="主机名" prop="hostname">
          <el-input v-model="form.hostname" placeholder="请输入主机名" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip_address">
          <el-input v-model="form.ip_address" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="地区" prop="region">
          <el-input v-model="form.region" placeholder="请输入地区" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入设备"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        drag
        action="/api/network/devices/import"
        :headers="{ 'X-ModuleId': moduleId }"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 xlsx/xls 文件
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 批量编辑对话框 -->
    <el-dialog
      v-model="batchEditDialogVisible"
      title="批量编辑设备"
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
        <el-form-item label="描述">
          <el-input
            v-model="batchForm.description"
            type="textarea"
            placeholder="请输入描述信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface Device {
  id: number
  hostname: string
  ip_address: string
  username: string
  password: string
  region: string
  description: string
  status: string
}

const route = useRoute()
const moduleId = route.params.moduleId as string

const loading = ref(false)
const devices = ref<Device[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const searchForm = ref({
  hostname: '',
  ip: '',
  description: '',
  status: ''
})

const form = ref<{
  id: number
  hostname: string
  ip_address: string
  username: string
  password: string
  region: string
  description: string
}>({
  id: 0,
  hostname: '',
  ip_address: '',
  username: '',
  password: '',
  region: '',
  description: ''
})

const rules = {
  hostname: [
    { required: true, message: '请输入主机名', trigger: 'blur' },
    { max: 50, message: '主机名不能超过50个字符', trigger: 'blur' }
  ],
  ip_address: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入正确的IP地址格式', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请输入地区', trigger: 'blur' }
  ]
}

// 添加新的响应式变量
const selectedDevices = ref<Device[]>([])
const batchEditDialogVisible = ref(false)
const batchForm = ref({
  region: '',
  description: ''
})

// 获取设备列表
const fetchDevices = async (params = {}) => {
  try {
    loading.value = true
    const { data } = await request.get('/network/devices', {
      params: {
        moduleId: moduleId,
        page: currentPage.value,
        size: pageSize.value,
        ...searchForm.value,
        description: searchForm.value.description, // 确保描述字段被包含在请求参数中
        ...params
      }
    })
    devices.value = data.items
    total.value = data.total
  } catch (error: any) {
    console.error('获取设备列表失败:', error)
    ElMessage.error(error.message || '获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
const showAddDialog = () => {
  isEdit.value = false
  form.value = {
    id: 0,
    hostname: '',
    ip_address: '',
    username: '',
    password: '',
    region: '',
    description: ''
  }
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = (row: Device) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    const url = isEdit.value 
      ? `/network/devices/${form.value.id}`
      : '/network/devices'
    
    const method = isEdit.value ? 'put' : 'post'
    const params = {
      ...form.value,
      module_id: moduleId
    }
    
    await request[method](url, params)
    ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
    dialogVisible.value = false
    fetchDevices()
  } catch (error: any) {
    ElMessage.error(error.message || (isEdit.value ? '更新失败' : '添加失败'))
  }
}

// 处理删除
const handleDelete = async (row: Device) => {
  try {
    await ElMessageBox.confirm('确定要删除该设备吗？', '提示', {
      type: 'warning'
    })
    await request.delete(`/network/devices/${row.id}`)
    ElMessage.success('删除成功')
    fetchDevices()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 处理批量导入
const handleBatchImport = () => {
  importDialogVisible.value = true
}

// 处理上传成功
const handleUploadSuccess = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
  fetchDevices()
}

// 处理上传失败
const handleUploadError = (error: any) => {
  ElMessage.error(error.message || '导入失败')
}

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchDevices()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchDevices()
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchDevices()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    hostname: '',
    ip: '',
    description: '',
    status: ''
  }
  currentPage.value = 1
  fetchDevices()
}

// 处理选择变化
const handleSelectionChange = (selection: Device[]) => {
  selectedDevices.value = selection
}

// 显示批量编辑对话框
const showBatchEditDialog = () => {
  if (selectedDevices.value.length === 0) {
    ElMessage.warning('请至少选择一个设备')
    return
  }
  batchForm.value = {
    region: '',
    description: ''
  }
  batchEditDialogVisible.value = true
}

// 处理批量编辑提交
const handleBatchSubmit = async () => {
  try {
    const deviceIds = selectedDevices.value.map(device => device.id)
    const params = {
      deviceIds,
      region: batchForm.value.region || undefined,
      description: batchForm.value.description === '' ? '' : batchForm.value.description
    }
    
    await request.put('/network/devices/batch', params)
    ElMessage.success('批量更新成功')
    batchEditDialogVisible.value = false
    fetchDevices() // 刷新设备列表
  } catch (error: any) {
    ElMessage.error(error.message || '批量更新失败')
  }
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.devices-container {
  padding: 20px;
  height: calc(100vh - 120px);  /* 减去头部和其他边距的高度 */
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;  /* 防止头部被压缩 */
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 表格容器 */
.el-table {
  flex: 1;
  overflow-y: auto;  /* 添加垂直滚动条 */
}

/* 分页容器 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
  flex-shrink: 0;  /* 防止分页被压缩 */
  background-color: #fff;  /* 确保底部背景色 */
}

.upload-demo {
  text-align: center;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 400px;
}
</style> 
