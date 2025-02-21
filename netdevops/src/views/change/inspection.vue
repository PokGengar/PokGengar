<template>
  <div class="inspection-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>巡检</span>
        </div>
      </template>
      
      <!-- 待实现巡检功能 -->
      <div class="placeholder">
        <el-empty description="巡检功能开发中..." />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 巡检组件
</script>

<style scoped>
.inspection-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.placeholder {
  padding: 40px 0;
}
</style> 
