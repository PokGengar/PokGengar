import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import CryptoJS from 'crypto-js'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { Client } from 'ssh2'
import networkRoutes from './routes/network.js'
import automationRoutes from './routes/automation.js'
import assetRoutes from './routes/asset.js'
import serviceRoutes from './routes/service.js'
import deepseekRouter from './routes/deepseek.js'
import ntpLogsRouter from './routes/ntp-logs.js'
import { pool } from './db.js'

const execPromise = util.promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

// 首先添加 body 解析中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: ['http://30.118.110.15:5173', 'https://login.alibaba-inc.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Module-Id'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}))

// 然后添加请求日志中间件
app.use((req, res, next) => {
  console.log('\n===== 收到新请求 =====')
  console.log('请求方法:', req.method)
  console.log('请求路径:', req.path)
  console.log('请求参数:', JSON.stringify(req.query, null, 2))
  console.log('请求体:', JSON.stringify(req.body, null, 2))
  console.log('请求头:', JSON.stringify(req.headers, null, 2))
  console.log('=====================\n')
  next()
})

// 注册路由
app.use('/api/network', networkRoutes)
app.use('/api/automation', automationRoutes)
app.use('/api/asset', assetRoutes)
app.use('/api/service', serviceRoutes)
app.use('/api/deepseek', deepseekRouter)
app.use('/api/ntp-logs', ntpLogsRouter)

// 创建 HTTP 服务器
const server = createServer(app)

// 设置 WebSocket 服务器
const wss = new WebSocketServer({
  server,
  verifyClient: (info) => {
    // 允许所有连接
    return true;
  }
})

// WebSocket SSH 处理
wss.on('connection', (ws, req) => {
  console.log('New SSH client connected from:', req.socket.remoteAddress)
  let sshClient = null

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received message type:', data.type)

      if (data.type === 'connect') {
        console.log('Attempting to connect to SSH server:', {
          host: data.host,
          port: data.port || 22,
          username: data.username
        })
        sshClient = new Client()
        
        sshClient.on('ready', () => {
          console.log('SSH connection established successfully')
          sshClient.shell({
            term: 'xterm-256color',
            cols: 500,
            rows: 35
          }, (err, stream) => {
            if (err) {
              console.error('Shell error:', err)
              ws.send('\r\n*** SSH Shell 错误: ' + err.message + '\r\n')
              return
            }
            console.log('Shell session created')

            // 处理终端大小调整
            ws.on('message', (message) => {
              try {
                const data = JSON.parse(message.toString())
                if (data.type === 'resize') {
                  stream.setWindow(data.rows, Math.max(data.cols, 500))
                } else if (data.type === 'data') {
                  stream.write(data.data)
                }
              } catch (e) {
                console.error('Error handling terminal input:', e)
              }
            })

            stream.on('data', (data) => {
              try {
                ws.send(data.toString('utf-8'))
              } catch (e) {
                console.error('Error sending data to WebSocket:', e)
              }
            })

            stream.on('close', () => {
              console.log('SSH Stream closed')
              ws.close()
            })

            stream.on('error', (err) => {
              console.error('SSH stream error:', err)
              ws.send('\r\n*** SSH Stream 错误:' + err.message + '\r\n')
            })
          })
        })

        sshClient.on('error', (err) => {
          console.error('SSH connection error:', err)
          ws.send('\r\n*** SSH 连接错误: ' + err.message + '\r\n')
        })

        sshClient.on('end', () => {
          console.log('SSH connection ended')
        })

        sshClient.on('close', () => {
          console.log('SSH connection closed')
        })
        try {
          sshClient.connect({
            host: data.host,
            port: data.port || 22,
            username: data.username,
            password: data.password,
            readyTimeout: 20000,
            keepaliveInterval: 10000,
            debug: (msg) => console.log('SSH Debug:', msg)
          })
        } catch (error) {
          console.error('Error connecting to SSH server:', error)
          ws.send('\r\n*** SSH 连接错误: ' + error.message + '\r\n')
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
      ws.send('\r\n*** 错误: ' + error.message + '\r\n')
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  ws.on('close', () => {
    console.log('WebSocket connection closed')
    if (sshClient) {
      sshClient.end()
    }
  })
})

// 加密密钥，应该存储在环境变量中
const ENCRYPTION_KEY = 'your-secret-key'

// 加密函数
const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString()
}

// 解密函数
const decryptPassword = (encryptedPassword) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// 设置加密轮数
const SALT_ROUNDS = 10

// Ping 检测函数
async function pingHost(ip) {
  try {
    const { stdout, stderr } = await execPromise(`ping -c 1 -W 1 ${ip}`)
    return !stderr && stdout.includes('1 received')
  } catch (error) {
    return false
  }
}

// 获取 AAA 日志
app.get('/api/aaa-logs', async (req, res) => {
  try {
    console.log('开始获取 AAA 日志...')
    const scriptPath = path.join(__dirname, '../scripts/aaa_logs.py')
    console.log('执行脚本:', scriptPath)

    const { stdout, stderr } = await execPromise(`python3 ${scriptPath}`)
    
    if (stderr) {
      console.error('Python 脚本错误:', stderr)
      throw new Error(stderr)
    }

    console.log('Python 脚本输出:', stdout)
    const logs = JSON.parse(stdout)
    res.json(logs)
  } catch (error) {
    console.error('获取 AAA 日志错误:', error)
    res.status(500).json({ 
      error: '获取 AAA 日志失败',
      details: error.message 
    })
  }
})

// SSO 验证接口
app.post('/api/sso/validate', async (req, res) => {
  try {
    console.log('收到 SSO 验证请求 - body:', req.body)
    console.log('收到 SSO 验证请求 - headers:', req.headers)
    
    const { SSO_TOKEN } = req.body
    
    if (!SSO_TOKEN) {
      console.log('缺少参数 - SSO_TOKEN:', SSO_TOKEN)
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      })
    }

    // 调用 BUC 验证接口
    const formData = new URLSearchParams()
    formData.append('SSO_TOKEN', SSO_TOKEN)
    formData.append('APP_CODE', 'mallard')  // 替换为实际的 APP_CODE
    formData.append('RETURN_USER', 'true')

    console.log('准备调用 BUC 验证接口')
    console.log('请求参数:', formData.toString())

    const response = await fetch('https://login.alibaba-inc.com/rpc/sso/communicate.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    const bucResponse = await response.json()
    console.log('BUC 验证响应:', bucResponse)

    if (!bucResponse.hasError && bucResponse.content) {
      try {
        // 解析用户信息
        const userContent = JSON.parse(bucResponse.content)
        console.log('解析后的用户信息:', userContent)

        res.json({
          success: true,
          content: bucResponse.content,
          message: '验证成功'
        })
      } catch (e) {
        console.error('解析用户信息失败:', e)
        throw new Error('解析用户信息失败')
      }
    } else {
      throw new Error(bucResponse.message || 'BUC验证失败')
    }
  } catch (error) {
    console.error('SSO 验证错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '验证服务异常'
    })
  }
})

// 处理 SSO 回调
app.get(['/sendBucSSOToken.do', '/api/sendBucSSOToken.do'], (req, res) => {
  console.log('\n========== SSO 回调开始 ==========')
  console.log('完整的请求参数:', JSON.stringify(req.query, null, 2))
  console.log('----------------------------------------')
  
  try {
    const { SSO_TOKEN, BACK_URL } = req.query
    
    // 打印 SSO_TOKEN 和 BACK_URL
    console.log('SSO_TOKEN:', SSO_TOKEN)
    console.log('BACK_URL:', decodeURIComponent(BACK_URL || ''))
    console.log('----------------------------------------')

    if (!SSO_TOKEN || !BACK_URL) {
      throw new Error('缺少必要参数')
    }

    // 获取用户信息（这里模拟从BUC获取的用户信息）
    const userInfo = {
      nickNameCn: "张三",  // 使用一个测试用的中文名
      loginName: "zhangsan",
      email: "zhangsan@test.com",
      mobile: "13800138000",
      loginTime: new Date().toISOString()
    }

    console.log('用户信息:', userInfo)

    // 构建重定向URL，确保content参数正确编码
    const contentStr = JSON.stringify(userInfo)
    console.log('编码前的content:', contentStr)
    
    const encodedContent = encodeURIComponent(contentStr)
    console.log('编码后的content:', encodedContent)
    
    const redirectUrl = `${decodeURIComponent(BACK_URL)}?SSO_TOKEN=${SSO_TOKEN}&content=${encodedContent}`
    console.log('重定向到:', redirectUrl)
    console.log('========== SSO 回调结束 ==========\n')

    // 重定向到原始的BACK_URL，并带上SSO_TOKEN和用户信息
    res.redirect(redirectUrl)
  } catch (error) {
    console.error('处理 SSO 回调失败:', error.message)
    res.status(500).json({
      content: '{}',
      hasError: true,
      message: error.message
    })
  }
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  if (!res.headersSent) {
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 处理客户端错误
server.on('clientError', (err, socket) => {
  console.error('客户端连接错误:', err)
  if (!socket.destroyed) {
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
    }
    socket.destroy()
  }
})

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
})

// 启动服务器
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
