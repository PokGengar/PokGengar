<template>
  <div class="modules-container">
    <div class="header">
      <h2>网络设备管理</h2>
      <el-button type="primary" @click="showAddDialog">新增分区</el-button>
    </div>
    <div class="modules-grid">
      <el-card 
        v-for="module in modules" 
        :key="module.id" 
        class="module-card"
        :class="{ 'is-loading': loading }"
        @click="handleModuleClick(module)"
      >
        <template #header>
          <div class="card-header">
            <span>{{ module.name }}</span>
            <el-button 
              type="danger" 
              link
              @click.stop="handleDelete(module)"
            >
              删除
            </el-button>
          </div>
        </template>
        <div class="card-content">
          <div class="stats">
            <div class="stat-item online">
              <span class="label">在线设备</span>
              <span class="value">{{ module.onlineCount || 0 }}</span>
            </div>
            <div class="stat-item offline">
              <span class="label">离线设备</span>
              <span class="value">{{ module.offlineCount || 0 }}</span>
            </div>
          </div>
          <div class="description" v-if="module.description">
            {{ module.description }}
          </div>
        </div>
      </el-card>
    </div>

    <!-- 新增分区对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增分区"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分区名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分区名称" />
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface ModuleStats {
  id: number
  name: string
  description: string | null
  status: number
  created_at: string
  onlineCount: number
  offlineCount: number
}

const router = useRouter()
const loading = ref(false)
const modules = ref<ModuleStats[]>([])
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const form = ref({
  name: ''
})

const rules = {
  name: [
    { required: true, message: '请输入分区名称', trigger: 'blur' },
    { max: 50, message: '分区名称不能超过50个字符', trigger: 'blur' }
  ]
}

// 获取模块统计信息
const fetchModuleStats = async () => {
  loading.value = true
  try {
    const response = await request.get('/network/modules/stats')
    if (response && response.data) {
      modules.value = response.data
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取分区统计信息失败')
  } finally {
    loading.value = false
  }
}

// 处理模块点击
const handleModuleClick = (module: ModuleStats) => {
  router.push(`/index/asset/network/devices/${module.id}`)
}

// 显示新增对话框
const showAddDialog = () => {
  form.value = {
    name: ''
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    const response = await request.post('/network/modules', { name: form.value.name })
    console.log('后端响应数据:', response)
    
    if (response && typeof response === 'object') {
      await fetchModuleStats()
      ElMessage.success('新增分区成功')
      dialogVisible.value = false
      form.value.name = ''
    } else {
      throw new Error('服务器响应数据格式错误')
    }
  } catch (error: any) {
    console.error('新增分区错误:', error)
    // 处理特定的错误消息
    if (error.response?.status === 400) {
      ElMessage.error(error.response.data?.error || '分区名称已存在')
    } else {
      ElMessage.error(error.message || '新增分区失败')
    }
  }
}

// 处理删除
const handleDelete = async (module: ModuleStats) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分区"${module.name}"吗？删除后该分区下的所有设备信息将被清除。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.delete(`/network/modules/${module.id}`)
    modules.value = modules.value.filter(m => m.id !== module.id)
    ElMessage.success('删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchModuleStats()
})
</script>

<style scoped>
.modules-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.module-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.module-card:hover {
  transform: translateY(-5px);
}

.module-card.is-loading {
  pointer-events: none;
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  padding: 10px 0;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
}

.stat-item .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
}

.stat-item.online {
  background-color: #f0f9eb;
}

.stat-item.online .value {
  color: #67c23a;
}

.stat-item.offline {
  background-color: #fef0f0;
}

.stat-item.offline .value {
  color: #f56c6c;
}

.description {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  padding: 0 10px;
}
</style>
