import express from 'express'
import { pool } from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { start_date, end_date, page = 1, size = 10 } = req.query
  
  try {
    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM ntp_log' + 
      (start_date && end_date ? ' WHERE date_time BETWEEN ? AND ?' : ''),
      start_date && end_date ? [start_date, end_date] : []
    )
    const total = countResult[0].total

    // 获取分页数据
    let query = 'SELECT * FROM ntp_log'
    const params = []
    
    if (start_date && end_date) {
      query += ' WHERE date_time BETWEEN ? AND ?'
      params.push(start_date, end_date)
    }
    
    query += ' ORDER BY date_time DESC'
    
    const offset = (parseInt(page) - 1) * parseInt(size)
    query += ' LIMIT ? OFFSET ?'
    params.push(parseInt(size), offset)
    
    const [rows] = await pool.query(query, params)
    
    res.json({
      data: {
        items: rows,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    })
  } catch (error) {
    console.error('获取 NTP 日志失败:', error)
    res.status(500).json({ error: '获取 NTP 日志失败' })
  }
})

export default router 
