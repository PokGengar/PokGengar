<template>
  <div class="server-container">
    <div class="header">
      <h2>AAA服务器</h2>
      <el-button type="primary" @click="handleAdd">添加服务器</el-button>
    </div>
    
    <el-table :data="serverList" style="width: 100%" border>
      <el-table-column prop="ip" label="服务器IP" width="180" />
      <el-table-column prop="region" label="地区" width="180" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column label="密码" width="280">
        <template #default="scope">
          <span v-if="!scope.row.showPassword">******</span>
          <span v-else>{{ scope.row.password }}</span>
          <el-button 
            type="primary" 
            link 
            @click="handleViewPassword(scope.row)"
            style="margin-left: 10px"
          >
            {{ scope.row.showPassword ? '隐藏' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="运行状态">
        <template #default="scope">
          <el-tag :type="scope.row.status === '运行中' ? 'success' : 'danger'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="SSH登录" width="120">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small" 
            @click="handleSSHLogin(scope.row)"
            :disabled="scope.row.status !== '运行中'">
            SSH登录
          </el-button>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑/添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑服务器' : '添加服务器'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="服务器IP" prop="ip">
          <el-input v-model="form.ip" />
        </el-form-item>
        <el-form-item label="地区" prop="region">
          <el-input v-model="form.region" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="运行状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="运行中" value="运行中" />
            <el-option label="已停止" value="已停止" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 密码验证对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="请输入管理员密码"
      width="30%"
    >
      <el-form>
        <el-form-item>
          <el-input
            v-model="adminPassword"
            type="password"
            placeholder="请输入管理员密码"
            @keyup.enter="confirmViewPassword"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmViewPassword">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import request from '@/utils/request'

interface ServerInfo {
  id?: number
  ip: string
  region: string
  username: string
  password: string
  status: string
  showPassword?: boolean
}

const loading = ref(false)
const serverList = ref<ServerInfo[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number>()

const formRef = ref<FormInstance>()
const form = reactive({
  ip: '',
  region: '',
  username: '',
  password: '',
  status: '运行中'
})

const rules = {
  ip: [{ required: true, message: '请输入服务器IP', trigger: 'blur' }],
  region: [{ required: true, message: '请输入地区', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const passwordDialogVisible = ref(false)
const adminPassword = ref('')
const currentServer = ref<ServerInfo | null>(null)

// 获取服务器列表
const fetchServerList = async () => {
  try {
    loading.value = true
    const response = await request.get('/asset/servers/aaa')
    serverList.value = response.data.map((server: ServerInfo) => ({
      ...server,
      showPassword: false
    }))
  } catch (error) {
    ElMessage.error('获取服务器列表失败')
  } finally {
    loading.value = false
  }
}

// 添加服务器
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    ip: '',
    region: '',
    username: '',
    password: '',
    status: '运行中'
  })
  dialogVisible.value = true
}

// 编辑服务器
const handleEdit = (row: ServerInfo) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    ip: row.ip,
    region: row.region,
    username: row.username,
    password: row.password,
    status: row.status
  })
  dialogVisible.value = true
}

// 删除服务器
const handleDelete = async (row: ServerInfo) => {
  try {
    await ElMessageBox.confirm('确认删除该服务器配置吗？', '提示', {
      type: 'warning'
    })
    await request.delete(`/asset/servers/aaa/${row.id}`)
    ElMessage.success('删除成功')
    fetchServerList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await request.put(`/asset/servers/aaa/${currentId.value}`, form)
          ElMessage.success('更新成功')
        } else {
          await request.post('/asset/servers/aaa', form)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchServerList()
      } catch (error: any) {
        ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
      }
    }
  })
}

// 查看密码
const handleViewPassword = (server: ServerInfo) => {
  currentServer.value = server
  if (!server.showPassword) {
    passwordDialogVisible.value = true
  } else {
    server.showPassword = false
  }
}

// 确认查看密码
const confirmViewPassword = async () => {
  if (!currentServer.value) return
  
  try {
    await request.post('/asset/servers/aaa/verify-admin', {
      password: adminPassword.value
    })
    currentServer.value.showPassword = true
    passwordDialogVisible.value = false
    adminPassword.value = ''
  } catch (error) {
    ElMessage.error('管理员密码验证失败')
  }
}

// SSH登录
const handleSSHLogin = (server: ServerInfo) => {
  // 实现SSH登录逻辑
}

onMounted(() => {
  fetchServerList()
})
</script>

<style scoped>
.server-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 
