import express from 'express'
import { pool } from '../db.js'
import { pingHost, encryptPassword, decryptPassword, DEFAULT_ADMIN_PASSWORD } from '../utils.js'
import schedule from 'node-schedule'

const router = express.Router()

// 更新所有服务器状态的函数
const updateAllServerStatus = async () => {
  try {
    console.log('开始定时更新服务器状态...')
    const [servers] = await pool.query('SELECT id, ip FROM servers')
    for (const server of servers) {
      const isOnline = await pingHost(server.ip)
      console.log(`服务器 ${server.ip} 状态检查结果:`, isOnline)
      await pool.query(
        'UPDATE servers SET status = ?, last_online = NOW() WHERE id = ?',
        [isOnline ? 'online' : 'offline', server.id]
      )
    }
    console.log('服务器状态更新完成')
  } catch (error) {
    console.error('更新服务器状态失败:', error)
  }
}

// 设置定时任务，每小时执行一次
const job = schedule.scheduleJob('0 * * * *', updateAllServerStatus)

// 获取服务器列表
router.get('/server', async (req, res) => {
  try {
    console.log('开始获取服务器列表')
    const [rows] = await pool.query('SELECT * FROM servers')
    res.json({ data: rows })
  } catch (error) {
    console.error('获取服务器列表失败:', error)
    res.status(500).json({ error: '获取服务器列表失败' })
  }
})

// 手动触发状态更新（可选，用于调试）
router.post('/server/check-status', async (req, res) => {
  try {
    await updateAllServerStatus()
    res.json({ message: '状态更新完成' })
  } catch (error) {
    console.error('手动更新状态失败:', error)
    res.status(500).json({ error: '更新状态失败' })
  }
})

// 验证管理员密码
router.post('/server/verify-admin', (req, res) => {
  try {
    const { password } = req.body
    console.log('验证管理员密码:', password)
    if (password === DEFAULT_ADMIN_PASSWORD) {
      console.log('验证成功')
      res.json({ success: true })
    } else {
      console.log('验证失败')
      res.status(401).json({ success: false, error: '管理员密码验证失败' })
    }
  } catch (error) {
    console.error('验证管理员密码出错:', error)
    res.status(500).json({ success: false, error: '验证过程发生错误' })
  }
})

// 获取SSH Web终端URL
router.get('/server/:id/ssh-url', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT ip, username FROM servers WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ error: '服务器不存在' })
    }
    const server = rows[0]
    const sshUrl = `/ssh-terminal?ip=${server.ip}&username=${server.username}`
    res.json({ url: sshUrl })
  } catch (error) {
    console.error('获取SSH URL失败:', error)
    res.status(500).json({ error: '获取SSH URL失败' })
  }
})

// 测试SSH连接
router.post('/server/test-ssh', async (req, res) => {
  const { ip, username, password } = req.body
  try {
    const isConnected = await pingHost(ip, username, password)
    res.json({ success: isConnected })
  } catch (error) {
    console.error('SSH连接测试失败:', error)
    res.status(500).json({ error: 'SSH连接测试失败' })
  }
})

// 添加服务器
router.post('/server', async (req, res) => {
  try {
    const { ip, region, username, password } = req.body
    console.log('收到的数据:', { ip, region, username })
    
    const isOnline = await pingHost(ip)
    const encryptedPassword = encryptPassword(password)

    const [result] = await pool.query(
      'INSERT INTO servers (ip, region, username, password, status, last_online) VALUES (?, ?, ?, ?, ?, ?)',
      [ip, region, username, encryptedPassword, isOnline ? 'online' : 'offline', isOnline ? new Date() : null]
    )
    res.json({ 
      id: result.insertId,
      ip: ip,
      region,
      username,
      password,
      status: isOnline ? 'online' : 'offline',
      last_online: isOnline ? new Date() : null
    })
  } catch (error) {
    console.error('添加服务器错误:', error)
    res.status(500).json({ 
      error: '添加服务器失败',
      details: error.message
    })
  }
})

// 更新服务器
router.put('/server/:id', async (req, res) => {
  try {
    const { ip, region, username, password } = req.body
    const isOnline = await pingHost(ip)
    const encryptedPassword = encryptPassword(password)

    await pool.query(
      'UPDATE servers SET ip = ?, region = ?, username = ?, password = ?, status = ?, last_online = ? WHERE id = ?',
      [ip, region, username, encryptedPassword, isOnline ? 'online' : 'offline', isOnline ? new Date() : null, req.params.id]
    )
    res.json({
      id: req.params.id,
      ip: ip,
      region,
      username,
      password,
      status: isOnline ? 'online' : 'offline',
      last_online: isOnline ? new Date() : null
    })
  } catch (error) {
    console.error('更新服务器错误:', error)
    res.status(500).json({ 
      error: '更新服务器失败',
      details: error.message
    })
  }
})

// 删除服务器
router.delete('/server/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM servers WHERE id = ?', [req.params.id])
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除服务器错误:', error)
    res.status(500).json({ 
      error: '删除服务器失败',
      details: error.message
    })
  }
})

// 解密密码
router.post('/server/decrypt-password', async (req, res) => {
  try {
    const { encryptedPassword } = req.body
    const decryptedPassword = decryptPassword(encryptedPassword)
    res.json({ password: decryptedPassword })
  } catch (error) {
    console.error('解密密码失败:', error)
    res.status(500).json({ error: '解密密码失败' })
  }
})

export default router 
