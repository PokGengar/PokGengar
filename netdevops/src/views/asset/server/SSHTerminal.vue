<template>
  <div class="terminal-container">
    <div class="terminal-wrapper">
      <div class="terminal-header">
        <span>SSH终端 - {{ host }}{{ locationInfo }}</span>
        <el-button type="primary" size="small" @click="handleClose">关闭</el-button>
      </div>
      <div ref="terminalElement" class="terminal-content"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import axios from 'axios'

// 解密函数
const decrypt = (encoded: string) => {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch (e) {
    console.error('解密失败:', e)
    return null
  }
}

const route = useRoute()
const host = route.query.host as string
const port = Number(route.query.port) || 22

// 解密数据
const encryptedData = route.query.data as string
const decryptedData = decrypt(encryptedData)
const username = decryptedData?.username || ''
const password = decryptedData?.password || ''
const region = decryptedData?.region || ''

// 用于调试
console.log('SSH连接参数:', {
  host,
  port,
  username: '***', // 隐藏敏感信息
  password: '***', // 隐藏敏感信息
  region
})

// 添加地区显示相关的状态
const locationInfo = ref('')
const terminalElement = ref<HTMLElement | null>(null)
let terminal: Terminal | null = null
let socket: WebSocket | null = null

// 使用相对路径，让 Vite 代理处理
const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ssh`

console.log('WebSocket URL:', wsUrl)

// 获取IP地址对应的地区信息
const getIPLocation = async (ip: string) => {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`)
    if (response.data.status === 'success') {
      locationInfo.value = `（${response.data.country}${response.data.regionName}）`
    }
  } catch (error) {
    console.error('获取IP地址位置信息失败:', error)
  }
}

const initTerminal = () => {
  if (!terminalElement.value) return

  terminal = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff'
    },
    fontSize: 14,
    lineHeight: 1.2,
    scrollback: 1000,
    convertEol: true,
    scrollOnUserInput: true,
    cols: 250,
    rows: 35,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace'
  })

  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.loadAddon(new WebLinksAddon())

  terminal.open(terminalElement.value)
  fitAddon.fit()

  // 监听窗口大小变化时自动调整终端大小
  const resizeScreen = () => {
    fitAddon.fit()
    const dims = fitAddon.proposeDimensions()
    if (dims && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'resize',
        cols: Math.max(dims.cols, 250),
        rows: dims.rows
      }))
    }
  }

  window.addEventListener('resize', resizeScreen)

  // 添加鼠标滚轮事件监听
  terminalElement.value.addEventListener('wheel', (event) => {
    const deltaY = event.deltaY
    const scrollLines = Math.ceil(Math.abs(deltaY) / 25)
    
    if (deltaY > 0) {
      terminal?.scrollLines(scrollLines)
    } else {
      terminal?.scrollLines(-scrollLines)
    }
    event.preventDefault()
  })

  // 监听终端输入
  terminal.onData((data) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'data',
        data: data
      }))
    }
  })

  // 连接WebSocket
  try {
    terminal.write('正在连接到 SSH 服务器...\r\n')
    
    socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      terminal?.write('WebSocket 连接已建立，正在连接 SSH...\r\n')
      const dims = fitAddon.proposeDimensions()
      // 发送连接信息
      const connectionInfo = {
        type: 'connect',
        host,
        port,
        username,
        password,
        cols: dims ? dims.cols : 120,
        rows: dims ? dims.rows : 30
      }
      console.log('发送连接信息:', { ...connectionInfo, password: '***' })
      socket?.send(JSON.stringify(connectionInfo))
    }

    socket.onmessage = (event) => {
      try {
        console.log('收到WebSocket消息:', event.data)
        terminal?.write(event.data)
      } catch (error: any) {
        console.error('Terminal write error:', error)
        terminal?.write('\r\n写入终端错误: ' + error.message + '\r\n')
      }
    }

    socket.onerror = (event) => {
      console.error('WebSocket错误:', event)
      terminal?.write('\r\n*** WebSocket 连接错误，请检查网络或服务器状态 ***\r\n')
    }

    socket.onclose = (event) => {
      console.log('WebSocket连接关闭:', event)
      terminal?.write('\r\n*** 连接已关闭 ***\r\n')
      if (event.code !== 1000) {
        terminal?.write(`\r\n*** 连接异常关闭，代码: ${event.code}, 原因: ${event.reason || '未知'} ***\r\n`)
      }
    }
  } catch (error: any) {
    console.error('创建WebSocket连接失败:', error)
    terminal?.write('\r\n*** 创建 WebSocket 连接失败: ' + error.message + ' ***\r\n')
  }
}

const handleClose = () => {
  if (socket) {
    socket.close()
  }
  if (terminal) {
    terminal.dispose()
  }
  // 关闭当前窗口
  window.close()
}

onMounted(() => {
  getIPLocation(host)
  initTerminal()
})

onUnmounted(() => {
  handleClose()
})
</script>

<style scoped>
.terminal-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
}

.terminal-wrapper {
  width: 98%;
  max-width: 1800px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  max-height: 98vh;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
  color: #333;
  flex-shrink: 0;
}

.terminal-content {
  flex: 1;
  min-height: 0;
  padding: 10px;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

/* 确保终端内容在容器内正确显示 */
.terminal-content :deep(.xterm-screen) {
  width: 100% !important;
  height: auto !important;
  max-width: none !important;
}

.terminal-content :deep(.xterm-rows) {
  width: 100% !important;
}

/* 优化滚动条样式 */
.terminal-content :deep(.xterm-viewport) {
  overflow-x: auto !important;
  overflow-y: scroll !important;
  scrollbar-width: thin;
  scrollbar-color: #909399 #f5f7fa;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: #f5f7fa;
  border-radius: 4px;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background-color: #909399;
  border-radius: 4px;
}

.terminal-content :deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background-color: #606266;
}

/* 确保终端内容可以响应鼠标事件 */
.terminal-content :deep(.xterm) {
  height: 100%;
  width: 100%;
  pointer-events: auto;
}
</style> 
