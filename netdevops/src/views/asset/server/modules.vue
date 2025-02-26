<template>
  <div class="server-modules-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>服务器列表</h2>
          <div class="header-buttons">
            <el-button type="primary" @click="handleRefreshStatus">刷新状态</el-button>
            <el-button type="primary" @click="handleAdd">新增服务器</el-button>
          </div>
        </div>
      </template>
      
      <!-- 搜索框 -->
      <div class="search-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.ip"
              placeholder="请输入服务器IP"
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="searchForm.region"
              placeholder="请输入地区"
              clearable
            />
          </el-col>
          <el-col :span="6">
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
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <el-table :data="servers" style="width: 100%" v-loading="loading">
        <el-table-column prop="ip" label="服务器IP" />
        <el-table-column prop="region" label="地区" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="密码">
          <template #default="{ row }">
            <span v-if="!row.showPassword">******</span>
            <span v-else>{{ row.decryptedPassword }}</span>
            <el-button link type="primary" @click="handleViewPassword(row)">
              {{ row.showPassword ? '隐藏' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button 
              type="success" 
              link 
              @click="handleSSH(row)"
              :disabled="row.status !== 'online'"
            >
              SSH
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑服务器对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑服务器' : '新增服务器'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="服务器IP" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入服务器IP" />
        </el-form-item>
        <el-form-item label="地区" prop="region">
          <el-input v-model="form.region" placeholder="请输入地区" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="验证管理员密码"
      width="400px"
    >
      <el-form @submit.prevent="confirmViewPassword">
        <el-form-item>
          <el-input
            v-model="adminPassword"
            type="password"
            placeholder="请输入管理员密码"
            @keyup.enter.prevent="confirmViewPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmViewPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'

interface Server {
  id: number
  ip: string
  region: string
  username: string
  password: string
  status: string
  last_online: string | null
  showPassword?: boolean
  decryptedPassword?: string
}

interface VerifyResponse {
  success: boolean
}

interface DecryptResponse {
  password: string
}

interface SearchParams {
  ip?: string
  region?: string
  status?: string
}

const loading = ref(false)
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const adminPassword = ref('')
const formRef = ref<FormInstance>()
const isEdit = ref(false)
const currentServer = ref<Server | null>(null)

const servers = ref<Server[]>([])

const form = reactive({
  id: 0,
  ip: '',
  region: '',
  username: '',
  password: '',
  status: 'offline'
})

const rules: FormRules = {
  ip: [
    { required: true, message: '请输入服务器IP', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP地址格式不正确', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请输入地区', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const searchForm = ref({
  ip: '',
  region: '',
  status: ''
})

// 添加分页相关的响应式变量
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 修改获取服务器列表函数
const fetchServers = async (params: SearchParams = {}) => {
  try {
    loading.value = true
    const response = await request.get('/asset/server')
    const serverList = response?.data || []
    
    // 在前端进行过滤
    let filteredServers = serverList
    
    if (params.ip || params.region || params.status) {
      filteredServers = serverList.filter((server: Server) => {
        const matchIp = !params.ip || server.ip.toLowerCase().includes(params.ip.toLowerCase())
        const matchRegion = !params.region || server.region.toLowerCase().includes(params.region.toLowerCase())
        const matchStatus = !params.status || server.status === params.status
        return matchIp && matchRegion && matchStatus
      })
    }
    
    // 更新总数
    total.value = filteredServers.length
    
    // 计算分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    
    // 返回当前页的数据
    servers.value = filteredServers.slice(start, end)
  } catch (error: any) {
    console.error('获取服务器列表失败:', error)
    ElMessage.error(error.message || '获取服务器列表失败')
    servers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchServers({
    ip: searchForm.value.ip,
    region: searchForm.value.region,
    status: searchForm.value.status
  })
}

// 处理每页显示数量变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
  fetchServers({
    ip: searchForm.value.ip,
    region: searchForm.value.region,
    status: searchForm.value.status
  })
}

// 修改搜索处理函数
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
  fetchServers({
    ip: searchForm.value.ip,
    region: searchForm.value.region,
    status: searchForm.value.status
  })
}

// 修改重置搜索函数
const resetSearch = () => {
  searchForm.value = {
    ip: '',
    region: '',
    status: ''
  }
  currentPage.value = 1 // 重置到第一页
  fetchServers()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    ip: '',
    region: '',
    username: '',
    password: '',
    status: 'offline'
  })
  dialogVisible.value = true
}

const handleEdit = (row: Server) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    const url = isEdit.value 
      ? `/asset/server/${form.id}`
      : '/asset/server'
    const method = isEdit.value ? 'put' : 'post'
    
    const response = await request[method]<Server>(url, form)
    if (response) {
      await fetchServers()
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
    }
  } catch (error: any) {
    console.error('保存服务器错误:', error)
    if (error.response?.status === 400) {
      ElMessage.error(error.response.data?.error || '服务器信息验证失败')
    } else {
      ElMessage.error(error.message || '保存失败')
    }
  }
}

const handleDelete = async (row: Server) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务器"${row.ip}"吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.delete(`/asset/server/${row.id}`)
    await fetchServers()
    ElMessage.success('删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 查看密码
const handleViewPassword = async (server: Server) => {
  currentServer.value = server
  if (!server.showPassword) {
    passwordDialogVisible.value = true
  } else {
    server.showPassword = false
    server.decryptedPassword = undefined // 清除已解密的密码
  }
}

// 确认查看密码
const confirmViewPassword = async () => {
  if (!currentServer.value) return
  
  try {
    // 验证管理员密码
    const verifyResult = await request.post<VerifyResponse>('/asset/server/verify-admin', {
      password: adminPassword.value
    }) as unknown as VerifyResponse
    
    // 如果验证成功，解密密码
    if (verifyResult.success) {
      const decryptResult = await request.post<DecryptResponse>('/asset/server/decrypt-password', {
        encryptedPassword: currentServer.value.password
      }) as unknown as DecryptResponse
      
      // 更新显示状态
      currentServer.value.showPassword = true
      currentServer.value.decryptedPassword = decryptResult.password
      passwordDialogVisible.value = false
      adminPassword.value = ''
      
      // 成功提示
      ElMessage.success('密码已解密')
    } else {
      ElMessage.error('管理员密码验证失败')
    }
  } catch (error: any) {
    console.error('验证管理员密码失败:', error)
    ElMessage.error(error.response?.data?.error || '管理员密码验证失败')
  }
}

// SSH连接
const handleSSH = async (server: Server) => {
  try {
    if (server.status !== 'online') {
      ElMessage.warning('服务器不在线，无法建立SSH连接')
      return
    }
    // 先解密密码
    const decryptResult = await request.post<DecryptResponse>('/asset/server/decrypt-password', {
      encryptedPassword: server.password
    }) as unknown as DecryptResponse

    // 构建 SSH 终端数据，使用 encodeURIComponent 处理特殊字符
    const sshData = {
      username: server.username,
      password: decryptResult.password,
      region: server.region
    }
    
    // 先将对象转为 JSON 字符串，然后进行 URI 编码，最后进行 base64 编码
    const data = btoa(encodeURIComponent(JSON.stringify(sshData)))

    // 打开新的终端窗口
    window.open(`/index/asset/server/ssh-terminal?host=${server.ip}&data=${data}`, '_blank')
  } catch (error: any) {
    console.error('SSH连接失败:', error)
    ElMessage.error(error.message || 'SSH连接失败')
  }
}

// 刷新状态
const handleRefreshStatus = async () => {
  try {
    loading.value = true
    await request.post('/asset/server/check-status')
    ElMessage.success('状态更新完成')
    // 重新获取服务器列表以显示最新状态
    await fetchServers()
  } catch (error: any) {
    console.error('更新状态失败:', error)
    ElMessage.error(error.message || '更新状态失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchServers()
})
</script>

<style scoped>
.server-modules-container {
  padding: 20px;
}

.box-card {
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.search-container {
  margin: 20px 0;
  padding: 0 20px;
}

.search-container .el-button {
  margin-left: 10px;
}

:deep(.el-table) {
  margin-top: 20px;
}

.el-tag {
  min-width: 70px;
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 0 20px;
}
</style>
