import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import VueDevTools from 'vite-plugin-vue-devtools'

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
  }
})


