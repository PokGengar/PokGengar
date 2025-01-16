<template>
  <div class="modules-container">
    <h2>网络设备管理</h2>
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
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

interface ModuleStats {
  id: number
  name: string
  onlineCount: number
  offlineCount: number
}

const router = useRouter()
const loading = ref(false)
const modules = ref<ModuleStats[]>([])

// 获取模块统计信息
const fetchModuleStats = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/network/modules/stats')
    modules.value = res.data
  } catch (error) {
    ElMessage.error('获取模块统计信息失败')
  } finally {
    loading.value = false
  }
}

// 处理模块点击
const handleModuleClick = (module: ModuleStats) => {
  router.push(`/index/network/devices/${module.id}`)
}

onMounted(() => {
  fetchModuleStats()
})
</script>

<style scoped>
.modules-container {
  padding: 20px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
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
</style>
