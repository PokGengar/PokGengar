import { defineAsyncComponent } from 'vue'
import type { AsyncComponentLoader } from 'vue'
import { ElLoading } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'

// 创建加载组件
const LoadingComponent = {
  components: { Loading },
  template: `
    <div class="async-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  `,
  style: `
    .async-loading {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
  `
}

// 创建错误组件
const ErrorComponent = {
  components: { Warning },
  template: `
    <div class="async-error">
      <el-icon><Warning /></el-icon>
      <span>组件加载失败</span>
      <el-button type="primary" link @click="$emit('retry')">重试</el-button>
    </div>
  `,
  style: `
    .async-error {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      color: #f56c6c;
    }
  `
}

export const createAsyncComponent = (loader: AsyncComponentLoader) => {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: 200, // 延迟显示加载组件的时间
    timeout: 30000, // 超时时间：30秒
    suspensible: false, // 禁用 suspense 模式
    onError: (error, retry, fail, attempts) => {
      if (attempts <= 3) {
        // 重试3次
        console.warn(`组件加载失败，正在进行第 ${attempts} 次重试...`)
        retry()
      } else {
        console.error('组件加载失败:', error)
        fail()
      }
    }
  })
} 
