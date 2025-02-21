<template>
  <div class="resource-container">
    <div class="header">
      <el-button type="primary" @click="showAddDialog">添加资源</el-button>
    </div>
    
    <el-table :data="resources" style="width: 100%">
      <el-table-column prop="name" label="资源名称" />
      <el-table-column prop="ip" label="IP" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="密码" align="center">
        <template #default="{ row }">
          <span v-if="!showPasswords[row.id]">******</span>
          <span v-else>{{ row.password }}</span>
          <el-button link type="primary" @click="togglePassword(row)">
            {{ showPasswords[row.id] ? '隐藏' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="登录" width="200">
        <template #default="{ row }">
          <el-button
            :type="row.loginType === 'SSH' ? 'success' : 'info'"
            :disabled="row.loginType !== 'SSH'"
            @click="handleSSHLogin(row)"
          >
            SSH登录
          </el-button>
          <el-button
            :type="row.loginType === 'WEB' ? 'success' : 'info'"
            :disabled="row.loginType !== 'WEB'"
            @click="handleWebLogin(row)"
          >
            WEB登录
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑资源对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingResource ? '编辑资源' : '添加资源'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="登录类型" prop="loginType">
          <el-select v-model="form.loginType">
            <el-option label="SSH" value="SSH" />
            <el-option label="WEB" value="WEB" />
          </el-select>
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
      <el-form>
        <el-form-item>
          <el-input
            v-model="adminPassword"
            type="password"
            placeholder="请输入管理员密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="verifyAdminPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import request from '@/utils/request'

interface Resource {
  id: number
  name: string
  ip: string
  username: string
  password: string
  loginType: 'SSH' | 'WEB'
}

const resources = ref<Resource[]>([])
const dialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const adminPassword = ref('')
const showPasswords = ref<Record<number, boolean>>({})
const currentResource = ref<Resource | null>(null)
const editingResource = ref<Resource | null>(null)

const form = reactive({
  name: '',
  ip: '',
  username: '',
  password: '',
  loginType: 'SSH' as const
})

const rules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  loginType: [{ required: true, message: '请选择登录类型', trigger: 'change' }]
}

const formRef = ref<FormInstance>()

// 获取资源列表
const fetchResources = async () => {
  try {
    const response = await request.get('/resources')
    resources.value = response.data
  } catch (error) {
    ElMessage.error('获取资源列表失败')
  }
}

// 显示添加对话框
const showAddDialog = () => {
  editingResource.value = null
  Object.assign(form, {
    name: '',
    ip: '',
    username: '',
    password: '',
    loginType: 'SSH'
  })
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = (row: Resource) => {
  editingResource.value = row
  Object.assign(form, row)
  dialogVisible.value = true
}

// 处理删除
const handleDelete = async (row: Resource) => {
  try {
    await request.delete(`/resources/${row.id}`)
    ElMessage.success('删除成功')
    fetchResources()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 处理表单提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    if (editingResource.value) {
      await request.put(`/resources/${editingResource.value.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/resources', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchResources()
  } catch (error) {
    ElMessage.error(editingResource.value ? '更新失败' : '添加失败')
  }
}

// 处理密码显示
const togglePassword = (row: Resource) => {
  currentResource.value = row
  passwordDialogVisible.value = true
}

// 验证管理员密码
const verifyAdminPassword = () => {
  if (adminPassword.value === 'admin123' && currentResource.value) {
    showPasswords.value[currentResource.value.id] = !showPasswords.value[currentResource.value.id]
    passwordDialogVisible.value = false
    adminPassword.value = ''
  } else {
    ElMessage.error('管理员密码错误')
  }
}

// 处理SSH登录
const handleSSHLogin = (row: Resource) => {
  if (row.loginType === 'SSH') {
    window.open(`/index/ssh-terminal?ip=${row.ip}&username=${row.username}`)
  }
}

// 处理WEB登录
const handleWebLogin = (row: Resource) => {
  if (row.loginType === 'WEB') {
    window.open(`http://${row.ip}`)
  }
}

// 初始化
fetchResources()
</script>

<style scoped>
.resource-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.el-button + .el-button {
  margin-left: 10px;
}
</style> 
