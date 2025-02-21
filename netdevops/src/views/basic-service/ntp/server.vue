<template>
  <div class="ntp-server-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>NTP 服务器管理</span>
          <el-button type="primary" @click="handleAdd">新增服务器</el-button>
        </div>
      </template>
      
      <el-table :data="servers" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="服务器名称" />
        <el-table-column prop="ip" label="服务器IP" />
        <el-table-column prop="stratum" label="层级">
          <template #default="{ row }">
            <el-tag :type="getStratumType(row.stratum)">
              {{ row.stratum }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="offset" label="时间偏移">
          <template #default="{ row }">
            {{ row.offset }}ms
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '同步' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
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
        <el-form-item label="服务器名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务器名称" />
        </el-form-item>
        <el-form-item label="服务器IP" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入服务器IP" />
        </el-form-item>
        <el-form-item label="层级" prop="stratum">
          <el-input-number v-model="form.stratum" :min="1" :max="15" />
        </el-form-item>
        <el-form-item label="优先级" prop="prefer">
          <el-switch v-model="form.prefer" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface Server {
  id: number
  name: string
  ip: string
  stratum: number
  offset: number
  status: '同步' | '未同步'
  prefer: boolean
}

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const servers = ref<Server[]>([
  {
    id: 1,
    name: 'NTP-Server-1',
    ip: '192.168.1.100',
    stratum: 1,
    offset: 0.5,
    status: '同步',
    prefer: true
  },
  {
    id: 2,
    name: 'NTP-Server-2',
    ip: '192.168.1.101',
    stratum: 2,
    offset: 1.2,
    status: '未同步',
    prefer: false
  }
])

const form = reactive({
  id: 0,
  name: '',
  ip: '',
  stratum: 1,
  prefer: false
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入服务器名称', trigger: 'blur' },
    { max: 50, message: '服务器名称不能超过50个字符', trigger: 'blur' }
  ],
  ip: [
    { required: true, message: '请输入服务器IP', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP地址格式不正确', trigger: 'blur' }
  ],
  stratum: [
    { required: true, message: '请输入层级', trigger: 'blur' }
  ]
}

const getStratumType = (stratum: number) => {
  if (stratum === 1) return 'success'
  if (stratum === 2) return 'warning'
  return 'info'
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    name: '',
    ip: '',
    stratum: 1,
    prefer: false
  })
  dialogVisible.value = true
}

const handleEdit = (row: Server) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row: Server) => {
  ElMessageBox.confirm(
    `确定要删除服务器"${row.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = servers.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      servers.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = servers.value.findIndex(item => item.id === form.id)
        if (index > -1) {
          servers.value[index] = {
            ...servers.value[index],
            name: form.name,
            ip: form.ip,
            stratum: form.stratum,
            prefer: form.prefer
          }
          ElMessage.success('更新成功')
        }
      } else {
        servers.value.unshift({
          ...form,
          id: servers.value.length + 1,
          offset: 0,
          status: '未同步'
        })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
    }
  })
}
</script>

<style scoped>
.ntp-server-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-tag {
  min-width: 70px;
  text-align: center;
}
</style> 
