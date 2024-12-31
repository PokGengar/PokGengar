import express from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import CryptoJS from 'crypto-js'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execPromise = util.promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
app.use(cors({
  origin: 'http://30.118.110.15:5173', // 替换为你的前端地址
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}))
app.use(express.json())

// 数据库连接配置
const pool = mysql.createPool({
  host: process.env.DB_HOST || '30.118.110.15',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'netdevops',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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

// 获取所有服务器
app.get('/api/aaa-servers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aaa_servers')
    // 使用对称加密，这样我们可以解密密码，并进行 ping 检测
    const decryptedRows = await Promise.all(rows.map(async row => {
      const isReachable = await pingHost(row.ip)
      return {
        ...row,
        password: decryptPassword(row.password),
        serverStatus: isReachable ? '运行中' : '不可用'
      }
    }))
    res.json(decryptedRows)
  } catch (error) {
    console.error('获取服务器列表错误:', error)
    res.status(500).json({ error: '获取服务器列表失败' })
  }
})

// 添加服务器
app.post('/api/aaa-servers', async (req, res) => {
  try {
    const { ip, region, username, password, status } = req.body
    console.log('收到的数据:', { ip, region, username, password, status }) // 添加日志
    
    // 进行 ping 检测
    const isReachable = await pingHost(ip)
    const serverStatus = isReachable ? '运行中' : '不可用'

    // 使用对称加密存储密码
    const encryptedPassword = encryptPassword(password)

    const [result] = await pool.query(
      'INSERT INTO aaa_servers (ip, region, username, password, status) VALUES (?, ?, ?, ?, ?)',
      [ip, region, username, encryptedPassword, status]
    )
    res.json({ id: result.insertId,
               ip,
               region,
               username,
               password, // 返回明文密码
               status
    })
  } catch (error) {
    console.error('添加服务器错误:', error) // 添加错误日志
    res.status(500).json({ error: '添加服务器失败' })
  }
})

// 更新服务器
app.put('/api/aaa-servers/:id', async (req, res) => {
  try {
    const { ip, region, username, password, status } = req.body

    // 进行 ping 检测
    const isReachable = await pingHost(ip)
    const serverStatus = isReachable ? '运行中' : '不可用'

    // 加密新密码
    const encryptedPassword = encryptPassword(password)

    await pool.query(
      'UPDATE aaa_servers SET ip = ?, region = ?, username = ?, password = ?, status = ? WHERE id = ?',
      [ip, region, username, encryptedPassword, status, req.params.id]
    )
    res.json({ id: req.params.id,
               ip,
               region,
               username,
               password,
               status})
  } catch (error) {
    console.error('更新服务器错误:', error)
    res.status(500).json({ error: '更新服务器失败' })
  }
})

// 删除服务器
app.delete('/api/aaa-servers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM aaa_servers WHERE id = ?', [req.params.id])
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: '删除服务器失败' })
  }
})

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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
