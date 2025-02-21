<template>
  <div class="ntp-container">
    <el-menu
      :default-active="activeMenu"
      class="ntp-menu"
      mode="horizontal"
      router
      @select="handleSelect"
    >
      <el-menu-item index="/basic-service/ntp/server">服务器管理</el-menu-item>
      <el-menu-item index="/basic-service/ntp/log">日志管理</el-menu-item>
      <el-menu-item index="/basic-service/ntp/status">状态管理</el-menu-item>
    </el-menu>
    <div class="ntp-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)

const handleSelect = (key: string) => {
  console.log('选中菜单:', key)
}
</script>

<style scoped>
.ntp-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ntp-menu {
  border-bottom: solid 1px #e6e6e6;
}

.ntp-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style> 
