<template>
  <div class="automation-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>自动化配置</span>
          <el-button type="primary" @click="handleAdd">新建任务</el-button>
        </div>
      </template>
      
      <el-table :data="tasks" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="任务名称">
          <template #default="{ row }">
            <div class="name-column">
              <span>{{ row.name }}</span>
              <el-button 
                type="primary" 
                link
                :disabled="row.change_status === '变更中'"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="change_status" label="变更状态">
          <template #default="{ row }">
            <el-tag :type="getChangeStatusType(row.change_status)">{{ row.change_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="change_log" label="变更记录" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :disabled="!row.change_log"
              @click="showLog(row.change_log)"
            >
              查看记录
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="verify_status" label="校验状态">
          <template #default="{ row }">
            <el-tag :type="getVerifyStatusType(row.verify_status)">{{ row.verify_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verify_log" label="校验记录" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :disabled="!row.verify_log"
              @click="showLog(row.verify_log)"
            >
              查看记录
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="rollback_status" label="回退状态">
          <template #default="{ row }">
            <el-tag :type="getRollbackStatusType(row.rollback_status)">{{ row.rollback_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rollback_log" label="回退记录" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              :disabled="!row.rollback_log"
              @click="showLog(row.rollback_log)"
            >
              查看记录
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              :disabled="!canExecuteChange(row.change_status)"
              @click="handleChange(row)"
            >
              变更
            </el-button>
            <el-button 
              type="success" 
              size="small" 
              :disabled="row.change_status === '变更中'"
              @click="handleVerify(row)"
            >
              校验
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              :disabled="!canExecuteRollback(row.change_status)"
              @click="handleRollback(row)"
            >
              回退
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              :disabled="row.change_status === '变更中'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="handleCopy(row)"
            >
              复制
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑任务' : '新建任务'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input 
            v-model="form.name" 
            maxlength="30" 
            show-word-limit
            placeholder="请输入任务名称（最多30个字符）"
          />
        </el-form-item>
        <el-form-item label="网络设备管理IP" prop="deviceIps">
          <el-input 
            v-model="form.deviceIps" 
            type="textarea" 
            :rows="4"
            placeholder="请输入管理IP，多个IP以换行分隔，例如：&#10;192.168.1.1&#10;192.168.1.2"
          />
        </el-form-item>
        <el-form-item label="变更脚本" prop="changeScript">
          <el-input 
            v-model="form.changeScript" 
            type="textarea" 
            :rows="4"
            placeholder="请输入变更脚本"
          />
        </el-form-item>
        <el-form-item label="回退脚本" prop="rollbackScript">
          <el-input 
            v-model="form.rollbackScript" 
            type="textarea" 
            :rows="4"
            placeholder="请输入回退脚本"
          />
        </el-form-item>
        <el-form-item label="校验脚本" prop="verifyScript">
          <el-input 
            v-model="form.verifyScript" 
            type="textarea" 
            :rows="4"
            placeholder="请输入校验脚本"
          />
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
import request from '@/utils/request'

interface Task {
  id: number
  name: string
  deviceIps: string
  changeScript: string
  rollbackScript: string
  verifyScript: string
  change_status: '未变更' | '变更中' | '变更异常' | '变更完成'
  change_log: string
  verify_status: '未校验' | '校验中' | '校验异常' | '校验完成'
  verify_log: string
  rollback_status: '未回退' | '回退中' | '回退异常' | '回退完成'
  rollback_log: string
}

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const isEdit = ref(false)

const tasks = ref<Task[]>([])

const form = reactive({
  id: 0,
  name: '',
  deviceIps: '',
  changeScript: '',
  rollbackScript: '',
  verifyScript: ''
})

// IP地址验证正则
const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/

const validateIps = (rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('请输入管理IP'))
    return
  }
  
  const ips = value.split('\n').filter(ip => ip.trim())
  if (ips.length === 0) {
    callback(new Error('请输入至少一个管理IP'))
    return
  }
  
  // 检查IP格式和同一任务内的重复
  const uniqueIps = new Set()
  for (const ip of ips) {
    const trimmedIp = ip.trim()
    if (!ipPattern.test(trimmedIp)) {
      callback(new Error(`IP地址 ${trimmedIp} 格式不正确`))
      return
    }
    // 只检查同一任务内的IP重复
    if (uniqueIps.has(trimmedIp)) {
      callback(new Error(`同一任务中IP地址 ${trimmedIp} 重复`))
      return
    }
    uniqueIps.add(trimmedIp)
  }
  
  callback()
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { max: 30, message: '任务名称不能超过30个字符', trigger: 'blur' }
  ],
  deviceIps: [
    { required: true, message: '请输入管理IP', trigger: 'blur' },
    { validator: validateIps, trigger: 'blur' }
  ],
  changeScript: [
    { required: true, message: '请输入变更脚本', trigger: 'blur' }
  ],
  rollbackScript: [
    { required: true, message: '请输入回退脚本', trigger: 'blur' }
  ],
  verifyScript: [
    { required: true, message: '请输入校验脚本', trigger: 'blur' }
  ]
}

// 获取状态对应的类型
const getChangeStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    '未变更': 'info',
    '变更中': 'warning',
    '变更异常': 'danger',
    '变更完成': 'success'
  }
  return typeMap[status] || 'info'
}

const getVerifyStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    '未校验': 'info',
    '校验中': 'warning',
    '校验异常': 'danger',
    '校验完成': 'success'
  }
  return typeMap[status] || 'info'
}

const getRollbackStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    '未回退': 'info',
    '回退中': 'warning',
    '回退异常': 'danger',
    '回退完成': 'success'
  }
  return typeMap[status] || 'info'
}

const showLog = (log: string) => {
  // 将换行符转换为HTML的换行标签，并添加样式
  const formattedLog = log.split('\n').map(line => {
    // 为不同类型的行添加不同的样式
    if (line.startsWith('时间:')) {
      return `<div class="log-time">${line}</div>`
    } else if (line.startsWith('主机:')) {
      return `<div class="log-host">${line}</div>`
    } else if (line.startsWith('状态:')) {
      return `<div class="log-status">${line}</div>`
    } else if (line.startsWith('输出:')) {
      return `<div class="log-output">${line}</div>`
    } else if (line.startsWith('错误:')) {
      return `<div class="log-error">${line}</div>`
    } else if (line === '-------------------') {
      return '<div class="log-separator"></div>'
    } else {
      return `<div>${line}</div>`
    }
  }).join('')

  ElMessageBox.alert(formattedLog, '执行记录', {
    dangerouslyUseHTMLString: true,
    customClass: 'log-dialog'
  })
}

// 判断是否可以执行变更
const canExecuteChange = (status: string) => {
  return status === '未变更' || status === '变更异常'
}

// 判断是否可以执行回退
const canExecuteRollback = (status: string) => {
  return status === '变更完成'
}

// 处理新建任务
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0,
    name: '',
    deviceIps: '',
    changeScript: '',
    rollbackScript: '',
    verifyScript: ''
  })
  dialogVisible.value = true
}

// 处理编辑任务
const handleEdit = (task: Task) => {
  isEdit.value = true
  Object.assign(form, {
    id: task.id,
    name: task.name,
    deviceIps: task.deviceIps,
    changeScript: task.changeScript,
    rollbackScript: task.rollbackScript,
    verifyScript: task.verifyScript
  })
  dialogVisible.value = true
}

// 变更操作
const handleChange = async (task: Task) => {
  try {
    // 先更新本地状态
    task.change_status = '变更中'
    
    // 调用后端执行接口
    await request.post(`/automation/change/${task.id}`)
    
    // 开始轮询任务状态
    const pollInterval = setInterval(async () => {
      try {
        const response = await request.get(`/automation/${task.id}/status`)
        const updatedTask = response.data
        
        // 更新本地任务状态
        task.change_status = updatedTask.change_status
        task.change_log = updatedTask.change_log
        task.verify_status = updatedTask.verify_status
        task.verify_log = updatedTask.verify_log
        
        // 如果任务已经完成或失败，停止轮询
        if (['变更完成', '变更异常'].includes(updatedTask.change_status)) {
          clearInterval(pollInterval)
          if (updatedTask.change_status === '变更完成') {
            ElMessage.success('变更执行成功')
          } else {
            ElMessage.error('变更执行失败')
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
        clearInterval(pollInterval)
      }
    }, 2000) // 每2秒轮询一次
    
    // 30秒后自动停止轮询
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 30000)
    
  } catch (error) {
    // 启动任务失败
    task.change_status = '变更异常'
    ElMessage.error(error.message || '启动变更失败')
  }
}

// 校验操作
const handleVerify = async (task: Task) => {
  try {
    task.verify_status = '校验中'
    
    await request.post(`/automation/verify/${task.id}`)
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await request.get(`/automation/${task.id}/status`)
        const updatedTask = response.data
        
        task.verify_status = updatedTask.verify_status
        task.verify_log = updatedTask.verify_log
        
        if (['校验完成', '校验异常'].includes(updatedTask.verify_status)) {
          clearInterval(pollInterval)
          if (updatedTask.verify_status === '校验完成') {
            ElMessage.success('校验成功')
          } else {
            ElMessage.error('校验失败')
          }
        }
      } catch (error) {
        console.error('轮询校验状态失败:', error)
        clearInterval(pollInterval)
      }
    }, 2000)
    
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 30000)
    
  } catch (error: any) {
    task.verify_status = '校验异常'
    ElMessage.error(error.message || '启动校验失败')
  }
}

// 回退操作
const handleRollback = async (task: Task) => {
  try {
    if (task.change_status !== '变更完成') {
      ElMessage.warning('只有变更完成的任务才能执行回退')
      return
    }
    
    const confirmResult = await ElMessageBox.confirm(
      '确定要执行回退操作吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmResult) {
      // 更新本地状态
      task.rollback_status = '回退中'
      
      await request.post(`/automation/rollback/${task.id}`)
      
      // 开始轮询任务状态
      const pollInterval = setInterval(async () => {
        try {
          const response = await request.get(`/automation/${task.id}/status`)
          const updatedTask = response.data
          
          // 更新本地任务状态
          task.rollback_status = updatedTask.rollback_status
          task.rollback_log = updatedTask.rollback_log
          
          if (['回退完成', '回退异常'].includes(updatedTask.rollback_status)) {
            clearInterval(pollInterval)
            if (updatedTask.rollback_status === '回退完成') {
              ElMessage.success('回退执行成功')
            } else {
              ElMessage.error('回退执行失败')
            }
          }
        } catch (error) {
          console.error('轮询回退状态失败:', error)
          clearInterval(pollInterval)
        }
      }, 2000)
      
      // 30秒后自动停止轮询
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 30000)
    }
  } catch (error: any) {
    task.rollback_status = '回退异常'
    ElMessage.error(error.message || '回退操作失败')
  }
}

// 复制操作
const handleCopy = async (task: Task) => {
  try {
    const now = new Date()
    const timestamp = now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '')
    
    const newTask = {
      name: `${task.name}_${timestamp}`,
      deviceIps: task.deviceIps,
      changeScript: task.changeScript,
      rollbackScript: task.rollbackScript,
      verifyScript: task.verifyScript
    }
    
    const response = await request.post('/automation', newTask)
    tasks.value.unshift({
      ...response.data,
      change_status: '未变更',
      verify_status: '未校验',
      rollback_status: '未回退',
      change_log: '',
      verify_log: '',
      rollback_log: ''
    })
    
    ElMessage.success('复制成功')
  } catch (error: any) {
    ElMessage.error(error.message || '复制失败')
  }
}

// 处理删除任务
const handleDelete = (task: Task) => {
  ElMessageBox.confirm(
    `确定要删除任务"${task.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.delete(`/automation/${task.id}`)
      const index = tasks.value.findIndex(t => t.id === task.id)
      if (index > -1) {
        tasks.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await request.put(`/automation/${form.id}`, form)
          const index = tasks.value.findIndex(t => t.id === form.id)
          if (index > -1) {
            tasks.value[index] = { 
              ...form, 
              change_status: tasks.value[index].change_status, 
              verify_status: tasks.value[index].verify_status,
              change_log: tasks.value[index].change_log || '',
              verify_log: tasks.value[index].verify_log || '',
              rollback_status: tasks.value[index].rollback_status,
              rollback_log: tasks.value[index].rollback_log || ''
            }
          }
          ElMessage.success('更新成功')
        } else {
          const response = await request.post('/automation', form)
          tasks.value.unshift({
            ...response.data,
            change_status: '未变更',
            verify_status: '未校验',
            rollback_status: '未回退',
            change_log: '',
            verify_log: '',
            rollback_log: ''
          })
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? '更新失败' : '创建失败'))
      }
    }
  })
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const response = await request.get('/automation')
    tasks.value = response.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 初始化
fetchTasks()
</script>

<style scoped>
.automation-container {
  padding: 0;  /* 移除内容区域的padding */
  height: 100%;
  display: flex;
  flex-direction: column;
}

.box-card {
  margin: 0;  /* 移除卡片的外边距 */
  height: 100%;  /* 让卡片填满容器高度 */
  border-radius: 0;  /* 移除卡片的圆角 */
}

.box-card :deep(.el-card__body) {
  padding: 20px;  /* 保持卡片内容的内边距 */
  height: calc(100% - 60px);  /* 减去header的高度 */
  overflow-y: auto;  /* 内容过多时显示滚动条 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name-column {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-tag {
  width: 70px;
  text-align: center;
}

:deep(.log-dialog) {
  min-width: 1000px !important;
  max-width: 1200px !important;
}

:deep(.log-dialog .el-message-box__content) {
  padding: 20px;
  max-height: 800px;
  overflow-y: auto;
  font-family: "Courier New", Consolas, monospace;
  white-space: pre-wrap;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  line-height: 1.5;
}

:deep(.log-time) {
  color: #569cd6;
  font-weight: bold;
  margin-top: 10px;
}

:deep(.log-host) {
  color: #4ec9b0;
  margin: 2px 0;
}

:deep(.log-status) {
  color: #ce9178;
  margin: 2px 0;
}

:deep(.log-output) {
  color: #dcdcaa;
  margin: 2px 0;
  padding-left: 20px;
  font-family: "Courier New", Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.log-error) {
  color: #f44747;
  margin: 2px 0;
}

:deep(.log-separator) {
  border-bottom: 1px solid #3c3c3c;
  margin: 10px 0;
}
</style> 
