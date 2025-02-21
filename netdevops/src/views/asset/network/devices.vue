<template>
  <div class="devices-container">
    <div class="header">
      <h2>设备列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">新增设备</el-button>
        <el-button type="success" @click="handleBatchImport">批量导入</el-button>
      </div>
    </div>

    <!-- 设备列表表格 -->
    <el-table
      v-loading="loading"
      :data="devices"
      style="width: 100%"
      border
    >
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
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
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
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

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

// 获取设备列表
const fetchDevices = async (params = {}) => {
  try {
    loading.value = true
    const { data } = await request.get('/network/devices', {
      params: {
        moduleId: moduleId,
        page: currentPage.value,
        size: pageSize.value,
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
  fetchDevices()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchDevices()
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.devices-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-demo {
  text-align: center;
}
</style> 
