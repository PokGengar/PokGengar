import { fileURLToPath, URL } from 'node:url' // 导入 Node.js URL 模块的工具函数，用于处理文件路径
import { defineConfig } from 'vite' // 导入 Vite 配置函数
import vue from '@vitejs/plugin-vue' // 导入 Vue 3 插件
import vueJsx from '@vitejs/plugin-vue-jsx' // 导入 Vue JSX 支持插件
import VueDevTools from 'vite-plugin-vue-devtools' // 导入 Vue 开发者工具插件

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ // Vite 插件配置
    vue(), // 启用 Vue 3 单文件组件支持
    vueJsx(), // 启用 JSX 语法支持
    VueDevTools(), // 启用 Vue 开发者工具增强功能
  ],
  resolve: {
    alias: { // 路径别名配置
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 将 @ 符号映射到 src 目录的绝对路径
    }
  },
  server: { // 开发服务器配置
    port: 5173, // 指定开发服务器端口
    host: true, // 监听所有地址，包括局域网和公网地址
    proxy: { // 代理配置
      '/api': { // 当请求路径以 /api 开头时进行代理
        target: 'http://localhost:3000', // 代理目标地址
        changeOrigin: true, // 修改请求头中的 Origin 为目标地址
        rewrite: (path) => path.replace(/^\/api/, '') // 重写请求路径，移除 /api 前缀
      }
    }
  }
})
