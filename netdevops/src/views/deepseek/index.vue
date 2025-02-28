<template>
  <div class="deepseek-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span class="title">DeepSeek AI</span>
          <el-button type="primary" @click="showHistory">
            历史记录
          </el-button>
        </div>
      </template>
      
      <div class="input-section">
        <!-- System Role 输入区域 -->
        <div class="system-input">
          <h3 class="input-title">System Role</h3>
          <el-input
            v-model="form.systemRole"
            type="textarea"
            :rows="4"
            placeholder="请告知DeepSeek AI助手你想要的回答的背景信息。例如：'你是一个专业的网络工程师，精通网络配置和故障排查。'"
            :disabled="loading"
          />
        </div>

        <!-- User Input 输入区域 -->
        <div class="user-input">
          <h3 class="input-title">User Question</h3>
          <el-input
            v-model="form.userInput"
            type="textarea"
            :rows="6"
            placeholder="请告知DeepSeek AI助手你想要的回答的具体问题。例如：'请帮我检查一下网络配置，网络配置如下。'"
            :disabled="loading"
          />
        </div>

        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="loading"
            :disabled="!form.userInput.trim()"
          >
            Ask DeepSeek
          </el-button>
          <el-button 
            @click="handleClear"
            :disabled="loading"
          >
            清空
          </el-button>
        </div>
      </div>

      <!-- 响应结果区域 -->
      <div v-if="response" class="response-section">
        <h3>AI Response:</h3>
        <div class="response-content" ref="responseRef">
          <pre>{{ response }}</pre>
        </div>
      </div>
    </el-card>

    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="历史记录"
      width="80%"
      destroy-on-close
    >
      <el-table :data="historyRecords" style="width: 100%" v-loading="historyLoading">
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="user_input" label="问题" show-overflow-tooltip />
        <el-table-column prop="response" label="回答" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="reloadRecord(row)">
              重新加载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const form = reactive({
  systemRole: '',
  userInput: ''
})

const loading = ref(false)
const response = ref('')
const responseRef = ref<HTMLElement | null>(null)

// 历史记录相关
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyRecords = ref([])

interface ApiResponse {
  data: string
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 显示历史记录
const showHistory = async () => {
  historyDialogVisible.value = true
  historyLoading.value = true
  try {
    const res = await request.get('/deepseek/history')
    historyRecords.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

// 重新加载历史记录
const reloadRecord = (record: any) => {
  form.systemRole = record.system_role
  form.userInput = record.user_input
  response.value = record.response
  historyDialogVisible.value = false
  
  // 滚动到响应区域
  nextTick(() => {
    if (responseRef.value) {
      responseRef.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

// 修改提交处理函数
const handleSubmit = async () => {
  if (!form.userInput.trim()) {
    ElMessage.warning('请输入您的问题')
    return
  }

  // 检查用户是否登录
  if (!userStore.username) {
    ElMessage.error('请先登录')
    return
  }

  loading.value = true
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 120000)
    })

    const fetchPromise = request.post<ApiResponse>('/deepseek/chat', {
      systemRole: form.systemRole.trim() || '请用中文回答我。',
      userInput: form.userInput.trim(),
      username: userStore.username // 确保用户名被发送
    })

    console.log('发送请求，用户名:', userStore.username) // 添加日志

    const res = await Promise.race([fetchPromise, timeoutPromise]) as ApiResponse
    
    if (!res || !res.data) {
      throw new Error('响应数据格式错误')
    }

    response.value = res.data

    await nextTick()
    if (responseRef.value) {
      responseRef.value.scrollIntoView({ behavior: 'smooth' })
    }

    ElMessage.success('请求成功')
  } catch (error: any) {
    if (error.message === '请求超时') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
  } finally {
    loading.value = false
  }
}

// 清空表单
const handleClear = () => {
  form.userInput = ''
  form.systemRole = ''
  response.value = ''
}
</script>

<style scoped>
.deepseek-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 40px); /* 设置容器高度，减去上下padding */
  overflow-y: auto; /* 添加垂直滚动条 */
}

/* 自定义容器滚动条样式 */
.deepseek-container::-webkit-scrollbar {
  width: 6px;
}

.deepseek-container::-webkit-scrollbar-thumb {
  background-color: #909399;
  border-radius: 3px;
}

.deepseek-container::-webkit-scrollbar-track {
  background-color: #f8f9fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.system-input,
.user-input {
  width: 100%;
}

h3 {
  margin-bottom: 10px;
  color: #1e2c3c;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.response-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.response-content {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid #e4e7ed;
}

pre {
  margin: 0;
  white-space: pre-wrap;
}

:deep(.el-textarea__inner) {
  font-family: monospace;
}

/* 自定义滚动条样式 */
.response-content::-webkit-scrollbar {
  width: 6px;
}

.response-content::-webkit-scrollbar-thumb {
  background-color: #909399;
  border-radius: 3px;
}

.response-content::-webkit-scrollbar-track {
  background-color: #f8f9fa;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #1e2c3c;
}

.input-title {
  margin-bottom: 10px;
  color: #1e2c3c;
  font-weight: normal;
  font-size: 16px;
}
</style> 
