<template>
  <div class="home-container">
    <img :src="imageUrl" 
         alt="Dynamic Logo" 
         class="baidu-image"
         @error="handleImageError">
    <div>当前时间戳: {{ timestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const timestamp = ref(Date.now())
const imageUrl = ref('https://api.ixiaowai.cn/api/api.php') // 这是一个随机图片 API
let timer: NodeJS.Timer | null = null

// 定时更新时间戳和图片
const startPolling = () => {
  timer = setInterval(() => {
    timestamp.value = Date.now()
    imageUrl.value = `https://api.ixiaowai.cn/api/api.php?timestamp=${timestamp.value}`
  }, 5000) // 每5秒刷新一次
}

// 图片加载失败的处理
const handleImageError = (event: Event) => {
  console.error('图片加载失败')
  const img = event.target as HTMLImageElement
  img.src = 'https://api.ixiaowai.cn/api/api.php' // 加载失败时重试
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

.baidu-image {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
  margin-bottom: 20px;
}
</style>
