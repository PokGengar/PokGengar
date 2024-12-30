<template>
  <div class="server-container">
    <div class="header">
      <h2>AAA服务器配置</h2>
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
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

interface ServerInfo {
  ip: string
  region: string
  username: string
  password: string
  status: string
  showPassword: boolean
}

const serverList = ref<ServerInfo[]>([
  {
    ip: '192.168.1.100',
    region: '北京',
    username: 'admin',
    password: 'Admin@123',
    status: '运行中',
    showPassword: false
  },
  {
    ip: '192.168.1.101',
    region: '上海',
    username: 'admin',
    password: 'Admin@456',
    status: '已停止',
    showPassword: false
  }
])

const passwordDialogVisible = ref(false)
const adminPassword = ref('')
const currentServer = ref<ServerInfo | null>(null)

const handleViewPassword = (row: ServerInfo) => {
  if (row.showPassword) {
    row.showPassword = false
    return
  }
  currentServer.value = row
  passwordDialogVisible.value = true
}

const confirmViewPassword = () => {
  if (adminPassword.value === 'admin123') {
    if (currentServer.value) {
      currentServer.value.showPassword = true
    }
    passwordDialogVisible.value = false
    adminPassword.value = ''
  } else {
    ElMessage.error('管理员密码错误')
  }
}

const handleAdd = () => {
  ElMessage.info('添加功能待实现')
}

const handleEdit = (row: ServerInfo) => {
  ElMessage.info('编辑功能待实现')
}

const handleDelete = (row: ServerInfo) => {
  ElMessage.info('删除功能待实现')
}
</script>

<style scoped>
.server-container {
  padding: 20px;
  background-color: #fff;  /* 改为白色背景 */
  min-height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  color: #333;  /* 改为深色文字 */
  margin: 0;
}

:deep(.el-table) {
  background-color: #fff;  /* 改为白色背景 */
  color: #333;  /* 改为深色文字 */
}

:deep(.el-table tr) {
  background-color: #fff;  /* 改为白色背景 */
}

:deep(.el-table th) {
  background-color: #f5f7fa;  /* 使用浅灰色背景 */
  color: #333;  /* 改为深色文字 */
  border-bottom: 1px solid #e6e6e6;
}

:deep(.el-table td) {
  border-bottom: 1px solid #e6e6e6;
}

:deep(.el-table--border) {
  border: 1px solid #e6e6e6;
}

:deep(.el-table--border th),
:deep(.el-table--border td) {
  border-right: 1px solid #e6e6e6;
}

:deep(.el-dialog) {
  background-color: #fff;  /* 改为白色背景 */
}

:deep(.el-dialog__title) {
  color: #333;  /* 改为深色文字 */
}

:deep(.el-dialog__body) {
  color: #333;  /* 改为深色文字 */
}

:deep(.el-input__inner) {
  background-color: #fff;  /* 改为白色背景 */
  border-color: #dcdfe6;
  color: #333;  /* 改为深色文字 */
}

:deep(.el-input__inner:focus) {
  border-color: #409EFF;
}
</style>