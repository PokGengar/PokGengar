<template>
  <div class="aaa-server-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>AAA 服务器管理</span>
          <el-button type="primary" @click="handleAdd">新增服务器</el-button>
        </div>
      </template>
      
      <el-table :data="servers" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="服务器名称" />
        <el-table-column prop="ip" label="服务器IP" />
        <el-table-column prop="port" label="端口" />
        <el-table-column prop="protocol" label="协议">
          <template #default="{ row }">
            <el-tag :type="row.protocol === 'TACACS+' ? 'success' : 'primary'">
              {{ row.protocol }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'danger'">
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
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="form.protocol" placeholder="请选择协议">
            <el-option label="RADIUS" value="RADIUS" />
            <el-option label="TACACS+" value="TACACS+" />
          </el-select>
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
  port: number
  protocol: 'RADIUS' | 'TACACS+'
  status: '在线' | '离线'
}

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const servers = ref<Server[]>([
  {
    id: 1,
    name: 'AAA-Server-1',
    ip: '192.168.1.100',
    port: 1812,
    protocol: 'RADIUS',
    status: '在线'
  },
  {
    id: 2,
    name: 'AAA-Server-2',
    ip: '192.168.1.101',
    port: 49,
    protocol: 'TACACS+',
    status: '离线'
  }
])

const form = reactive({
  id: 0,
  name: '',
  ip: '',
  port: 1812,
  protocol: 'RADIUS'
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
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' }
  ],
  protocol: [
    { required: true, message: '请选择协议', trigger: 'change' }
  ]
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    name: '',
    ip: '',
    port: 1812,
    protocol: 'RADIUS'
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
            ...form,
            protocol: form.protocol as 'RADIUS' | 'TACACS+',
            status: servers.value[index].status
          }
          ElMessage.success('更新成功')
        }
      } else {
        servers.value.unshift({
          ...form,
          protocol: form.protocol as 'RADIUS' | 'TACACS+',
          id: servers.value.length + 1,
          status: '离线'
        })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
    }
  })
}
</script>

<style scoped>
.aaa-server-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-tag {
  width: 70px;
  text-align: center;
}
</style> 
