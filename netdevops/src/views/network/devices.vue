<template>
    <div class="devices-container">
      <div class="header">
        <div class="title">
          <h2>{{ currentModule?.name }} - 设备管理</h2>
          <el-tag>设备总数: {{ total }}</el-tag>
        </div>
        <div class="actions">
          <el-upload
            action="/api/network/devices/import"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            :show-file-list="false"
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
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
  
      <!-- 设备列表 -->
      <el-table
        v-loading="loading"
        :data="devices"
        border
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="hostname" label="设备主机名" sortable="custom" />
        <el-table-column prop="ip_address" label="设备IP" sortable="custom" />
        <el-table-column label="在线状态" width="100" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="地区" />
        <el-table-column prop="last_online" label="最后在线时间" sortable="custom" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleSSHLogin(row)"
              :disabled="row.status !== 'online'"
            >
              SSH登录
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="handleEdit(row)"
            >
              编辑
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
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import axios from 'axios'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  
  interface Device {
    id: number
    hostname: string
    ip_address: string
    status: 'online' | 'offline'
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
    moduleId: number
  }>()
  
  const route = useRoute()
  const loading = ref(false)
  const devices = ref<Device[]>([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const dialogVisible = ref(false)
  const currentModule = ref<Module | null>(null)
  
  // 搜索表单
  const searchForm = reactive<SearchForm>({
    hostname: '',
    ip: '',
    status: '',
    sort: '',
    order: ''
  })
  
  // 编辑表单
  const editForm = reactive<Partial<Device>>({
    id: undefined,
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
    ]
  }
  
  // 上传相关
  const uploadHeaders = {
    'X-Module-Id': props.moduleId
  }
  
  // 获取模块信息
  const fetchModuleInfo = async () => {
    try {
      const res = await axios.get(`/api/network/modules/${props.moduleId}`)
      currentModule.value = res.data
    } catch (error) {
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
        ...searchForm
      }
      const res = await axios.get('/api/network/devices', { params })
      devices.value = res.data.items
      total.value = res.data.total
    } catch (error) {
      ElMessage.error('获取设备列表失败')
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
    const encryptedData = btoa(JSON.stringify({
      username: row.username,
      password: row.password,
      region: row.region
    }))
    const url = `/index/ssh-terminal?host=${row.ip_address}&port=22&data=${encryptedData}`
    window.open(url, '_blank')
  }
  
  // 处理编辑
  const handleEdit = (row: Device) => {
    Object.assign(editForm, row)
    dialogVisible.value = true
  }
  
  // 保存设备
  const saveDevice = async () => {
    try {
      if (editForm.id) {
        await axios.put(`/api/network/devices/${editForm.id}`, editForm)
        ElMessage.success('更新成功')
      } else {
        await axios.post('/api/network/devices', { ...editForm, moduleId: props.moduleId })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      fetchDevices()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  }
  
  // 处理文件上传
  const handleUploadSuccess = () => {
    ElMessage.success('导入成功')
    fetchDevices()
  }
  
  const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel'
    if (!isExcel) {
      ElMessage.error('只能上传 Excel 文件!')
      return false
    }
    return true
  }
  
  // 导出设备列表
  const exportDevices = async () => {
    try {
      const response = await axios.get('/api/network/devices/export', {
        params: { moduleId: props.moduleId },
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'devices.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      ElMessage.error('导出失败')
    }
  }
  
  onMounted(() => {
    fetchModuleInfo()
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
  
  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
  </style>
