import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import VueDevTools from 'vite-plugin-vue-devtools'
import type { OutputAsset } from 'rollup'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://30.118.110.15:3000',
        changeOrigin: true
      },
      '/*.do': {
        target: 'http://30.118.110.15:3000',
        changeOrigin: true
      },
      '/ssh': {
        target: 'ws://30.118.110.15:3000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 禁用生产环境的 source map
    sourcemap: false,
    // 配置 rollup 选项
    rollupOptions: {
      output: {
        // 分包策略
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus', '@element-plus/icons-vue'],
          'utils': ['axios', 'crypto-js'],
        },
        // 块文件名格式
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // 入口文件名格式
        entryFileNames: 'assets/js/[name]-[hash].js',
        // 资源文件名格式
        assetFileNames: (assetInfo: { name?: string }) => {
          if (!assetInfo.name) return 'assets/[ext]/[name]-[hash][extname]'
          const extType = assetInfo.name.split('.')[1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[ext]/[name]-[hash][extname]'
        }
      }
    },
    // 设置块大小警告的限制（1000kb）
    chunkSizeWarningLimit: 1000,
    // 生产环境移除 console 和 debugger
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    // 预构建依赖项
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      '@element-plus/icons-vue',
      'axios'
    ],
  },
})


