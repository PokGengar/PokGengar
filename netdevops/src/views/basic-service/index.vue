<template>
  <div class="basic-service-container">
    <el-menu
      :default-active="activeMenu"
      class="basic-service-menu"
      mode="horizontal"
      router
      @select="handleSelect"
    >
      <el-menu-item index="/basic-service/aaa/server">AAA管理</el-menu-item>
      <el-menu-item index="/basic-service/ntp/server">NTP管理</el-menu-item>
    </el-menu>
    <div class="basic-service-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/basic-service/aaa')) {
    return '/basic-service/aaa/server'
  } else if (path.startsWith('/basic-service/ntp')) {
    return '/basic-service/ntp/server'
  }
  return ''
})

const handleSelect = (key: string) => {
  console.log('选中菜单:', key)
}
</script>

<style scoped>
.basic-service-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.basic-service-menu {
  border-bottom: solid 1px #e6e6e6;
}

.basic-service-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style> 
