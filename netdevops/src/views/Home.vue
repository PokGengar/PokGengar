<template>
  <div class="home-container">
    <img src="../assets/earth.jpg" alt="Earth" class="earth-image">
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;  /* 改为白色背景 */
}

.earth-image {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
}
</style>