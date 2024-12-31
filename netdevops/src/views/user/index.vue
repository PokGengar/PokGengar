<template>
    <div class="user-container">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>用户管理</span>
            <el-button type="primary" @click="handleAdd">添加用户</el-button>
          </div>
        </template>
        
        <el-table :data="userList" style="width: 100%" v-loading="loading">
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="role" label="角色" />
          <el-table-column prop="lastLogin" label="最后登录时间" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
  
      <!-- 添加/编辑用户对话框 -->
      <el-dialog
        :title="dialogTitle"
        v-model="dialogVisible"
        width="500px"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="80px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="form.role" placeholder="请选择角色">
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
            </el-select>
          </el-form-item>
          <el-form-item label="密码" prop="password" v-if="isAdd">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  interface UserForm {
    id?: string
    username: string
    role: string
    password?: string
    lastLogin?: string
  }
  
  const loading = ref(false)
  const dialogVisible = ref(false)
  const isAdd = ref(true)
  const formRef = ref<FormInstance>()
  
  const form = ref<UserForm>({
    username: '',
    role: '',
    password: ''
  })
  
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
  }
  
  const userList = ref([
    {
      id: '1',
      username: 'admin',
      role: '管理员',
      lastLogin: '2024-01-01 12:00:00'
    },
    {
      id: '2',
      username: 'user1',
      role: '普通用户',
      lastLogin: '2024-01-01 10:00:00'
    }
  ])
  
  const dialogTitle = computed(() => isAdd.value ? '添加用户' : '编辑用户')
  
  const handleAdd = () => {
    isAdd.value = true
    form.value = {
      username: '',
      role: '',
      password: ''
    }
    dialogVisible.value = true
  }
  
  const handleEdit = (row: UserForm) => {
    isAdd.value = false
    form.value = {
      ...row,
      password: undefined
    }
    dialogVisible.value = true
  }
  
  const handleDelete = (row: UserForm) => {
    ElMessageBox.confirm(
      `确定要删除用户 ${row.username} 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      // 这里应该调用删除用户的 API
      const index = userList.value.findIndex(item => item.id === row.id)
      if (index > -1) {
        userList.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    }).catch(() => {
      // 取消删除
    })
  }
  
  const handleSubmit = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate((valid) => {
      if (valid) {
        // 这里应该调用添加/编辑用户的 API
        if (isAdd.value) {
          userList.value.push({
            id: String(userList.value.length + 1),
            username: form.value.username,
            role: form.value.role === 'admin' ? '管理员' : '普通用户',
            lastLogin: '-'
          })
          ElMessage.success('添加成功')
        } else {
          const index = userList.value.findIndex(item => item.id === form.value.id)
          if (index > -1) {
            userList.value[index] = {
              ...userList.value[index],
              username: form.value.username,
              role: form.value.role === 'admin' ? '管理员' : '普通用户'
            }
            ElMessage.success('编辑成功')
          }
        }
        dialogVisible.value = false
      }
    })
  }
  </script>
  
  <style scoped>
  .user-container {
    padding: 20px;
    background-color: #fff;  /* 改为白色背景 */
    color: #333;  /* 改为深色文字 */
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  </style>