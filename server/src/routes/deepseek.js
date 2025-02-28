import express from 'express'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../db.js'

const execPromise = util.promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 获取历史记录
router.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM deepseek_history ORDER BY created_at DESC LIMIT 20'
    )
    res.json({ data: rows })
  } catch (error) {
    console.error('获取历史记录失败:', error)
    res.status(500).json({ 
      error: '获取历史记录失败',
      details: error.message 
    })
  }
})

// DeepSeek API 路由
router.post('/chat', async (req, res) => {
  try {
    const { systemRole, userInput, username } = req.body
    console.log('调用 DeepSeek API:', { systemRole, userInput, username })

    const scriptPath = path.join(__dirname, '../../scripts/deepseek_chat.py')
    
    // 将输入参数编码为 Base64 以避免特殊字符问题
    const encodedSystemRole = Buffer.from(systemRole).toString('base64')
    const encodedUserInput = Buffer.from(userInput).toString('base64')
    
    const command = `python3 ${scriptPath} "${encodedSystemRole}" "${encodedUserInput}"`
    
    const { stdout, stderr } = await execPromise(command)
    
    if (stderr) {
      console.error('DeepSeek API 错误:', stderr)
      throw new Error(stderr)
    }

    const response = stdout.trim()

    // 保存到历史记录
    await pool.query(
      'INSERT INTO deepseek_history (username, system_role, user_input, response) VALUES (?, ?, ?, ?)',
      [username, systemRole, userInput, response]
    )

    res.json({ data: response })
  } catch (error) {
    console.error('调用 DeepSeek API 失败:', error)
    res.status(500).json({ 
      error: '调用 DeepSeek API 失败',
      details: error.message 
    })
  }
})

export default router 
