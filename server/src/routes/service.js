import express from 'express'
import { exec } from 'child_process'
import util from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execPromise = util.promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 获取 AAA 日志
router.get('/log/aaa', async (req, res) => {
  try {
    console.log('开始获取 AAA 日志...')
    const scriptPath = path.join(__dirname, '../../scripts/aaa_logs.py')
    console.log('执行脚本:', scriptPath)

    // 强制重新执行脚本获取最新日志
    const { stdout, stderr } = await execPromise(`python3 ${scriptPath} --force-refresh`)
    
    if (stderr) {
      console.error('Python 脚本错误:', stderr)
      throw new Error(stderr)
    }

    console.log('获取到最新日志数据')
    let logs = JSON.parse(stdout)
    
    // 处理搜索条件
    const { username, source_ip, details } = req.query
    if (username || source_ip || details) {
      logs = logs.filter(log => {
        const matchUsername = !username || log.username === username.trim();
        const matchSourceIp = !source_ip || log.server_ip.includes(source_ip.trim());
        const matchDetails = !details || log.action.toLowerCase().includes(details.trim().toLowerCase());
        return matchUsername && matchSourceIp && matchDetails;
      });
    }

    // 获取总数
    const total = logs.length;
    
    // 处理分页
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 10
    const start = (page - 1) * size
    const end = start + size
    
    const items = logs.slice(start, end)

    res.json({
      items,
      total,
      page,
      size
    })
  } catch (error) {
    console.error('获取 AAA 日志错误:', error)
    res.status(500).json({ 
      error: '获取 AAA 日志失败',
      details: error.message 
    })
  }
})

// 导出 AAA 日志
router.get('/log/aaa/export', async (req, res) => {
  try {
    console.log('开始导出 AAA 日志...')
    const scriptPath = path.join(__dirname, '../../scripts/aaa_logs.py')
    const { stdout, stderr } = await execPromise(`python3 ${scriptPath}`)
    
    if (stderr) {
      throw new Error(stderr)
    }

    const logs = JSON.parse(stdout)
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=aaa_logs_${new Date().toISOString().split('T')[0]}.json`)
    
    res.json(logs)
  } catch (error) {
    console.error('导出 AAA 日志错误:', error)
    res.status(500).json({ 
      error: '导出 AAA 日志失败',
      details: error.message 
    })
  }
})

export default router 
