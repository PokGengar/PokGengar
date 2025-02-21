import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import { pool } from '../db.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import cron from 'node-cron'

const execAsync = promisify(exec)
const router = express.Router()

// IP地址格式验证函数
const validateIPAddress = (ip) => {
  const regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!regex.test(ip)) return false
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

// 定时任务：每天早上9点进行Ping探测
cron.schedule('0 9 * * *', async () => {
  try {
    const [devices] = await pool.query('SELECT id, ip_address FROM network_devices')
    
    for (const device of devices) {
      try {
        const { stdout } = await execAsync(`ping -c 3 ${device.ip_address}`)
        const isOnline = stdout.includes('1 received') || 
                        stdout.includes('2 received') || 
                        stdout.includes('3 received')
        
        await pool.query(
          'UPDATE network_devices SET status = ?, last_online = ? WHERE id = ?',
          [isOnline ? 'online' : 'offline', isOnline ? new Date() : null, device.id]
        )
      } catch (error) {
        console.error(`Ping设备失败 ${device.ip_address}:`, error)
        await pool.query(
          'UPDATE network_devices SET status = ?, last_online = NULL WHERE id = ?',
          ['offline', device.id]
        )
      }
    }
  } catch (error) {
    console.error('执行Ping探测任务失败:', error)
  }
})

// 获取模块列表及统计信息
router.get('/modules/stats', async (req, res) => {
  try {
    const [modules] = await pool.query(`
      SELECT 
        m.*,
        COUNT(CASE WHEN d.status = 'online' THEN 1 END) as onlineCount,
        COUNT(CASE WHEN d.status = 'offline' THEN 1 END) as offlineCount
      FROM network_modules m
      LEFT JOIN network_devices d ON m.id = d.module_id
      WHERE m.status = 1
      GROUP BY m.id
    `)
    console.log('Modules stats query result:', modules)
    res.json({ data: modules })
  } catch (error) {
    console.error('Error fetching modules stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// 获取单个模块信息
router.get('/modules/:id', async (req, res) => {
  try {
    const [modules] = await pool.query(
      'SELECT * FROM network_modules WHERE id = ?',
      [req.params.id]
    )
    res.json(modules[0])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取设备列表（带分页、搜索、排序）
router.get('/devices', async (req, res) => {
  const { 
    moduleId, 
    page = 1, 
    pageSize = 20,
    hostname,
    ip,
    status,
    sort,
    order
  } = req.query

  try {
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId is required' })
    }

    let sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM network_devices WHERE module_id = ?'
    const params = [moduleId]

    if (hostname) {
      sql += ' AND hostname LIKE ?'
      params.push(`%${hostname}%`)
    }
    if (ip) {
      sql += ' AND ip_address LIKE ?'
      params.push(`%${ip}%`)
    }
    if (status === 'online' || status === 'offline') {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (sort && order) {
      sql += ` ORDER BY ${sort} ${order}`
    }

    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    console.log('SQL:', sql)
    console.log('Parameters:', params)

    const [devices] = await pool.query(sql, params)
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()')

    console.log('Query result:', { devices, total })

    res.json({
      data: {
        items: devices,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching devices:', error)
    res.status(500).json({ error: error.message })
  }
})

// 新增分区
router.post('/modules', async (req, res) => {
  try {
    const { name } = req.body
    
    // 检查分区名称是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM network_modules WHERE name = ?',
      [name]
    )
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '分区名称已存在' })
    }
    
    const [result] = await pool.query(
      'INSERT INTO network_modules (name) VALUES (?)',
      [name]
    )
    
    res.json({ 
      id: result.insertId, 
      name,
      description: null,
      status: 1,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除分区
router.delete('/modules/:id', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    // 先删除该分区下的所有设备
    await connection.query(
      'DELETE FROM network_devices WHERE module_id = ?',
      [req.params.id]
    )
    
    // 再删除分区
    const [result] = await connection.query(
      'DELETE FROM network_modules WHERE id = ?',
      [req.params.id]
    )
    
    if (result.affectedRows === 0) {
      throw new Error('分区不存在')
    }
    
    await connection.commit()
    res.json({ message: '删除成功' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

// 检测设备在线状态
const checkDeviceStatus = async (device) => {
  try {
    const { stdout } = await execAsync(`ping -c 3 ${device.ip_address}`)
    const isOnline = stdout.includes('1 received') || 
                    stdout.includes('2 received') || 
                    stdout.includes('3 received')
    
    await pool.query(
      'UPDATE network_devices SET status = ?, last_online = ? WHERE id = ?',
      [isOnline ? 'online' : 'offline', isOnline ? new Date() : null, device.id]
    )
    
    return isOnline
  } catch (error) {
    console.error(`Ping设备失败 ${device.ip_address}:`, error)
    await pool.query(
      'UPDATE network_devices SET status = ?, last_online = NULL WHERE id = ?',
      ['offline', device.id]
    )
    return false
  }
}

// 新增单个设备
router.post('/devices', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { moduleId, hostname, ip_address, username, password, region, description } = req.body
    
    // 验证IP地址格式
    if (!validateIPAddress(ip_address)) {
      return res.status(400).json({ error: '设备IP格式错误' })
    }

    await connection.beginTransaction()

    // 检查主机名和IP是否已存在（跨分区检查）
    const [existing] = await connection.query(
      'SELECT id, hostname, ip_address, module_id FROM network_devices WHERE hostname = ? OR ip_address = ?',
      [hostname, ip_address]
    )
    
    if (existing.length > 0) {
      const duplicateDevice = existing[0]
      let errorMessage = ''
      
      if (duplicateDevice.hostname === hostname && duplicateDevice.ip_address === ip_address) {
        errorMessage = '主机名和IP地址都已存在'
      } else if (duplicateDevice.hostname === hostname) {
        errorMessage = '主机名已存在'
      } else {
        errorMessage = 'IP地址已存在'
      }
      
      // 获取重复设备所在的分区名称
      const [moduleResult] = await connection.query(
        'SELECT name FROM network_modules WHERE id = ?',
        [duplicateDevice.module_id]
      )
      
      const moduleName = moduleResult[0]?.name || '未知分区'
      await connection.rollback()
      return res.status(400).json({ 
        error: `${errorMessage}（在分区"${moduleName}"中）`
      })
    }

    const [result] = await connection.query(
      `INSERT INTO network_devices 
       (module_id, hostname, ip_address, username, password, region, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'offline')`,
      [moduleId, hostname, ip_address, username, password, region, description]
    )
    
    await connection.commit()
    
    // 异步执行在线状态检测
    const device = { 
      id: result.insertId,
      ip_address 
    }
    checkDeviceStatus(device).catch(error => {
      console.error(`新设备 ${ip_address} 状态检测失败:`, error)
    })
    
    res.json({ 
      id: result.insertId,
      moduleId,
      hostname,
      ip_address,
      username,
      password,
      region,
      description,
      status: 'offline',
      last_online: null
    })
  } catch (error) {
    await connection.rollback()
    console.error('添加设备失败:', error)
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

// 批量导入设备
const upload = multer({ storage: multer.memoryStorage() })
router.post('/devices/import', upload.single('file'), async (req, res) => {
  const moduleId = req.headers['x-module-id']
  const connection = await pool.getConnection()
  
  try {
    const workbook = xlsx.read(req.file.buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const devices = xlsx.utils.sheet_to_json(sheet)
    
    // 验证所有设备的IP地址格式
    const invalidIPs = devices.filter(device => !validateIPAddress(device.ip_address))
    if (invalidIPs.length > 0) {
      return res.status(400).json({ 
        error: '设备IP格式错误',
        invalidDevices: invalidIPs
      })
    }

    await connection.beginTransaction()
    
    // 检查所有设备的主机名和IP是否已存在
    const allHostnames = devices.map(d => d.hostname)
    const allIPs = devices.map(d => d.ip_address)
    
    const [existing] = await connection.query(
      'SELECT hostname, ip_address, module_id FROM network_devices WHERE hostname IN (?) OR ip_address IN (?)',
      [allHostnames, allIPs]
    )
    
    if (existing.length > 0) {
      // 获取所有涉及的模块名称
      const moduleIds = [...new Set(existing.map(d => d.module_id))]
      const [modules] = await connection.query(
        'SELECT id, name FROM network_modules WHERE id IN (?)',
        [moduleIds]
      )
      const moduleMap = Object.fromEntries(modules.map(m => [m.id, m.name]))

      // 收集所有冲突的设备信息
      const conflicts = existing.map(device => ({
        hostname: device.hostname,
        ip_address: device.ip_address,
        moduleName: moduleMap[device.module_id] || '未知分区'
      }))

      // 生成错误消息
      const errorMessages = conflicts.map(conflict => {
        const newDevice = devices.find(d => 
          d.hostname === conflict.hostname || 
          d.ip_address === conflict.ip_address
        )
        if (newDevice.hostname === conflict.hostname && newDevice.ip_address === conflict.ip_address) {
          return `设备 ${conflict.hostname}(${conflict.ip_address}) 的主机名和IP地址都已存在于分区"${conflict.moduleName}"中`
        } else if (newDevice.hostname === conflict.hostname) {
          return `主机名 ${conflict.hostname} 已存在于分区"${conflict.moduleName}"中`
        } else {
          return `IP地址 ${conflict.ip_address} 已存在于分区"${conflict.moduleName}"中`
        }
      })

      await connection.rollback()
      return res.status(400).json({ 
        error: errorMessages.join('\n')
      })
    }

    // 如果没有冲突，执行批量插入
    const newDevices = []
    for (const device of devices) {
      const [result] = await connection.query(
        `INSERT INTO network_devices 
         (module_id, hostname, ip_address, username, password, region, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'offline')`,
        [moduleId, device.hostname, device.ip_address, device.username, 
         device.password, device.region, device.description]
      )
      if (result.insertId) {
        newDevices.push({
          id: result.insertId,
          ip_address: device.ip_address
        })
      }
    }
    
    await connection.commit()
    
    // 对新增的设备进行在线状态检测
    for (const device of newDevices) {
      checkDeviceStatus(device).catch(error => {
        console.error(`新设备 ${device.ip_address} 状态检测失败:`, error)
      })
    }
    
    res.json({ success: true, count: devices.length })
  } catch (error) {
    await connection.rollback()
    console.error('批量导入设备失败:', error)
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

// 导出设备列表
router.get('/devices/export', async (req, res) => {
  const { moduleId } = req.query
  
  try {
    const [devices] = await pool.query(
      `SELECT hostname, ip_address, username, password, region, description 
       FROM network_devices WHERE module_id = ?`,
      [moduleId]
    )
    
    const worksheet = xlsx.utils.json_to_sheet(devices)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Devices')
    
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=devices.xlsx')
    res.send(buffer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 更新设备信息
router.put('/devices/:id', async (req, res) => {
  try {
    const { hostname, ip_address, region, username, password, description } = req.body
    console.log('更新设备信息:', { id: req.params.id, hostname, ip_address, region })
    
    const updateFields = []
    const params = []
    
    if (hostname) {
      updateFields.push('hostname = ?')
      params.push(hostname)
    }
    if (ip_address) {
      updateFields.push('ip_address = ?')
      params.push(ip_address)
    }
    if (region) {
      updateFields.push('region = ?')
      params.push(region)
    }
    if (username) {
      updateFields.push('username = ?')
      params.push(username)
    }
    if (password) {
      updateFields.push('password = ?')
      params.push(password)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      params.push(description)
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的字段' })
    }
    
    params.push(req.params.id)
    const sql = `UPDATE network_devices SET ${updateFields.join(', ')} WHERE id = ?`
    console.log('SQL:', sql)
    console.log('Parameters:', params)
    
    const [result] = await pool.query(sql, params)
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '设备不存在' })
    }
    
    res.json({ message: '更新成功' })
  } catch (error) {
    console.error('更新设备失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 批量删除设备
router.delete('/devices/batch', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { deviceIds } = req.body
    
    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ error: '设备ID列表不能为空' })
    }

    await connection.beginTransaction()
    
    const [result] = await connection.query(
      'DELETE FROM network_devices WHERE id IN (?)',
      [deviceIds]
    )
    
    await connection.commit()
    res.json({ 
      message: '删除成功',
      affectedRows: result.affectedRows
    })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

// 删除单个设备
router.delete('/devices/:id', async (req, res) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    
    const [result] = await connection.query(
      'DELETE FROM network_devices WHERE id = ?',
      [req.params.id]
    )
    
    if (result.affectedRows === 0) {
      throw new Error('设备不存在')
    }
    
    await connection.commit()
    res.json({ message: '删除成功' })
  } catch (error) {
    await connection.rollback()
    res.status(500).json({ error: error.message })
  } finally {
    connection.release()
  }
})

export default router
