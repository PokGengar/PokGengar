import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import { pool } from '../db.js'

const router = express.Router()

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
    res.json(modules)
  } catch (error) {
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
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (sort && order) {
      sql += ` ORDER BY ${sort} ${order}`
    }

    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [devices] = await pool.query(sql, params)
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()')

    res.json({
      items: devices,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 批量导入设备
const upload = multer({ storage: multer.memoryStorage() })
router.post('/devices/import', upload.single('file'), async (req, res) => {
  const moduleId = req.headers['x-module-id']
  
  try {
    const workbook = xlsx.read(req.file.buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const devices = xlsx.utils.sheet_to_json(sheet)
    
    // 使用事务进行批量插入
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      for (const device of devices) {
        await connection.query(
          `INSERT INTO network_devices (module_id, hostname, ip_address, region)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           ip_address = VALUES(ip_address),
           region = VALUES(region)`,
          [moduleId, device.hostname, device.ip_address, device.region]
        )
      }
      
      await connection.commit()
      res.json({ success: true, count: devices.length })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// 导出设备列表
router.get('/devices/export', async (req, res) => {
  const { moduleId } = req.query
  
  try {
    const [devices] = await pool.query(
      'SELECT hostname, ip_address, status, region, last_online FROM network_devices WHERE module_id = ?',
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

export default router
