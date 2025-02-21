<template>
  <div class="permission-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>权限管理</span>
        </div>
      </template>
      
      <el-table :data="roles" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="角色" />
        <el-table-column prop="permissions" label="权限">
          <template #default="{ row }">
            <el-tag v-if="row.permissions.length === 0" type="info">暂无权限</el-tag>
            <el-tag 
              v-for="permission in row.permissions" 
              :key="permission"
              style="margin-right: 5px"
            >
              {{ permission }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Role {
  name: string
  permissions: string[]
}

const loading = ref(false)
const roles = ref<Role[]>([
  {
    name: '管理员',
    permissions: []
  },
  {
    name: '运维员',
    permissions: []
  }
])

const fetchRoles = () => {
  loading.value = true
  try {
    // 目前使用静态数据，后续可以改为从后端获取
    roles.value = [
      {
        name: '管理员',
        permissions: []
      },
      {
        name: '运维员',
        permissions: []
      }
    ]
  } catch (error) {
    console.error('获取角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>

<style scoped>
.permission-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-tag {
  margin: 2px;
}
</style> 
