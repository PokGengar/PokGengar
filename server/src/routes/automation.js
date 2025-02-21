import express from 'express'
import { pool } from '../db.js'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 验证设备信息并获取凭据
const validateAndGetDeviceCredentials = async (deviceIps) => {
  const ips = deviceIps.split('\n').map(ip => ip.trim()).filter(Boolean)
  const results = []
  const errors = []

  // 查询每个IP对应的设备信息
  for (const ip of ips) {
    const [devices] = await pool.query(
      'SELECT ip_address, username, password FROM network_devices WHERE ip_address = ?',
      [ip]
    )

    if (devices.length === 0) {
      errors.push(`IP ${ip} 在网络设备管理中未找到`)
    } else {
      results.push({
        ip: devices[0].ip_address,
        username: devices[0].username,
        password: devices[0].password
      })
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'))
  }

  return results
}

// 执行Python脚本的函数
const executePythonScript = async (devices, command) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../scripts/ssh_executor.py')
    const hostsJson = JSON.stringify(devices.map(d => ({
      host: d.ip,
      username: d.username,
      password: d.password
    })))
    
    console.log('执行SSH脚本:', scriptPath)
    console.log('设备列表:', hostsJson)
    console.log('执行命令:', command)
    
    const pythonProcess = spawn('python3', [
      scriptPath,
      hostsJson,
      command
    ])

    let outputData = ''
    let errorData = ''

    pythonProcess.stdout.on('data', (data) => {
      outputData += data
    })

    pythonProcess.stderr.on('data', (data) => {
      errorData += data
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python脚本执行失败: ${errorData}`))
      } else {
        try {
          const results = JSON.parse(outputData)
          resolve(results)
        } catch (error) {
          reject(new Error(`解析Python脚本输出失败: ${error.message}`))
        }
      }
    })
  })
}

// 获取任务列表
router.get('/', async (req, res) => {
  try {
    const [tasks] = await pool.query(`
      SELECT 
        id,
        name,
        device_ips as deviceIps,
        change_script as changeScript,
        rollback_script as rollbackScript,
        verify_script as verifyScript,
        change_status,
        change_log,
        verify_status,
        verify_log,
        created_at,
        updated_at
      FROM automation_tasks 
      ORDER BY id DESC
    `)
    res.json({ data: tasks })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 创建任务
router.post('/', async (req, res) => {
  try {
    const { name, deviceIps, changeScript, rollbackScript, verifyScript } = req.body
    
    // 验证设备信息
    await validateAndGetDeviceCredentials(deviceIps)
    
    const [result] = await pool.query(
      `INSERT INTO automation_tasks 
       (name, device_ips, change_script, rollback_script, verify_script, 
        change_status, verify_status) 
       VALUES (?, ?, ?, ?, ?, '未变更', '未校验')`,
      [name, deviceIps, changeScript, rollbackScript, verifyScript]
    )
    
    res.json({
      data: {
        id: result.insertId,
        name,
        deviceIps,
        changeScript,
        rollbackScript,
        verifyScript,
        change_status: '未变更',
        verify_status: '未校验'
      }
    })
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { name, deviceIps, changeScript, rollbackScript, verifyScript } = req.body
    
    // 验证设备信息
    await validateAndGetDeviceCredentials(deviceIps)
    
    await pool.query(
      `UPDATE automation_tasks 
       SET name = ?, device_ips = ?, change_script = ?, 
           rollback_script = ?, verify_script = ?,
           change_status = '未变更', verify_status = '未校验'
       WHERE id = ?`,
      [name, deviceIps, changeScript, rollbackScript, verifyScript, req.params.id]
    )
    
    res.json({ message: '更新成功' })
  } catch (error) {
    console.error('更新任务失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM automation_tasks WHERE id = ?', [req.params.id])
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({ error: error.message })
  }
})

// 变更任务（原执行任务）
router.post('/change/:id', async (req, res) => {
  const taskId = req.params.id
  let connection;
  
  try {
    // 获取数据库连接
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 获取任务信息
    const [[task]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    // 更新任务状态为执行中
    await connection.query(
      'UPDATE automation_tasks SET change_status = ?, verify_status = ? WHERE id = ?',
      ['变更中', '未校验', taskId]
    )
    
    // 获取设备凭据
    const devices = await validateAndGetDeviceCredentials(task.device_ips)
    
    // 执行变更脚本
    const changeResults = await executePythonScript(devices, task.change_script)
    
    // 检查变更结果
    const changeSuccess = changeResults.every(result => result.success)
    const changeLog = changeResults.map(result => {
      const outputLines = result.output.split('\n')
      return `时间: ${result.timestamp}\n` +
        `主机: ${result.host}\n` +
        `状态: ${result.success ? '成功' : '失败'}\n` +
        `命令: ${task.change_script}\n` +
        `输出:\n${outputLines.map(line => `  ${line}`).join('\n')}\n` +
        `错误: ${result.error}\n` +
        '-------------------'
    }).join('\n')
    
    // 更新变更状态和日志
    await connection.query(
      'UPDATE automation_tasks SET change_status = ?, change_log = ? WHERE id = ?',
      [changeSuccess ? '变更完成' : '变更异常', changeLog, taskId]
    )
    
    // 如果变更成功，执行校验脚本
    if (changeSuccess) {
      await connection.query(
        'UPDATE automation_tasks SET verify_status = ? WHERE id = ?',
        ['校验中', taskId]
      )
      
      const verifyResults = await executePythonScript(devices, task.verify_script)
      
      const verifySuccess = verifyResults.every(result => result.success)
      const verifyLog = verifyResults.map(result => 
        `时间: ${result.timestamp}\n` +
        `主机: ${result.host}\n` +
        `状态: ${result.success ? '成功' : '失败'}\n` +
        `命令: ${task.verify_script}\n` +
        `输出:\n${result.output.split('\n').map(line => `  ${line}`).join('\n')}\n` +
        `错误: ${result.error}\n` +
        '-------------------'
      ).join('\n')
      
      // 更新校验状态和日志
      await connection.query(
        'UPDATE automation_tasks SET verify_status = ?, verify_log = ? WHERE id = ?',
        [verifySuccess ? '校验完成' : '校验异常', verifyLog, taskId]
      )
    }
    
    // 提交事务
    await connection.commit();
    
    // 获取更新后的任务信息
    const [[updatedTask]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    res.json({
      success: changeSuccess,
      data: updatedTask
    })
  } catch (error) {
    console.error('执行变更失败:', error)
    
    if (connection) {
      try {
        await connection.rollback();
        await connection.query(
          'UPDATE automation_tasks SET change_status = ?, change_log = ? WHERE id = ?',
          ['变更异常', error.message, taskId]
        )
      } catch (rollbackError) {
        console.error('回滚事务失败:', rollbackError)
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

// 校验任务
router.post('/verify/:id', async (req, res) => {
  const taskId = req.params.id
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [[task]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    await connection.query(
      'UPDATE automation_tasks SET verify_status = ? WHERE id = ?',
      ['校验中', taskId]
    )
    
    const devices = await validateAndGetDeviceCredentials(task.device_ips)
    
    // 执行校验脚本
    const verifyResults = await executePythonScript(devices, task.verify_script)
    
    const verifySuccess = verifyResults.every(result => result.success)
    const verifyLog = verifyResults.map(result => 
      `时间: ${result.timestamp}\n` +
      `主机: ${result.host}\n` +
      `状态: ${result.success ? '成功' : '失败'}\n` +
      `命令: ${task.verify_script}\n` +
      `输出:\n${result.output.split('\n').map(line => `  ${line}`).join('\n')}\n` +
      `错误: ${result.error}\n` +
      '-------------------'
    ).join('\n')
    
    await connection.query(
      'UPDATE automation_tasks SET verify_status = ?, verify_log = ? WHERE id = ?',
      [verifySuccess ? '校验完成' : '校验异常', verifyLog, taskId]
    )
    
    await connection.commit();
    
    const [[updatedTask]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    res.json({
      success: verifySuccess,
      data: updatedTask
    })
  } catch (error) {
    console.error('执行校验失败:', error)
    
    if (connection) {
      try {
        // 回滚事务
        await connection.rollback();
        await connection.query(
          'UPDATE automation_tasks SET verify_status = ?, verify_log = ? WHERE id = ?',
          ['校验异常', error.message, taskId]
        )
      } catch (rollbackError) {
        console.error('回滚事务失败:', rollbackError)
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

// 回退任务
router.post('/rollback/:id', async (req, res) => {
  const taskId = req.params.id
  let connection;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [[task]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    if (task.change_status !== '变更完成') {
      throw new Error('只有变更完成的任务才能执行回退')
    }
    
    // 更新任务状态为回退中
    await connection.query(
      'UPDATE automation_tasks SET rollback_status = ? WHERE id = ?',
      ['回退中', taskId]
    )
    
    const devices = await validateAndGetDeviceCredentials(task.device_ips)
    
    // 执行回退脚本
    const rollbackResults = await executePythonScript(devices, task.rollback_script)
    
    const rollbackSuccess = rollbackResults.every(result => result.success)
    const rollbackLog = rollbackResults.map(result => 
      `时间: ${result.timestamp}\n` +
      `主机: ${result.host}\n` +
      `状态: ${result.success ? '成功' : '失败'}\n` +
      `命令: ${task.rollback_script}\n` +
      `输出:\n${result.output.split('\n').map(line => `  ${line}`).join('\n')}\n` +
      `错误: ${result.error}\n` +
      '-------------------'
    ).join('\n')
    
    // 更新回退状态和日志
    await connection.query(
      'UPDATE automation_tasks SET rollback_status = ?, rollback_log = ?, change_status = ? WHERE id = ?',
      [rollbackSuccess ? '回退完成' : '回退异常', rollbackLog, '未变更', taskId]
    )
    
    await connection.commit();
    
    const [[updatedTask]] = await connection.query(
      'SELECT * FROM automation_tasks WHERE id = ?',
      [taskId]
    )
    
    res.json({
      success: rollbackSuccess,
      data: updatedTask
    })
  } catch (error) {
    console.error('执行回退失败:', error)
    
    if (connection) {
      try {
        await connection.rollback();
        await connection.query(
          'UPDATE automation_tasks SET rollback_status = ?, rollback_log = ? WHERE id = ?',
          ['回退异常', error.message, taskId]
        )
      } catch (rollbackError) {
        console.error('回滚事务失败:', rollbackError)
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  } finally {
    if (connection) {
      connection.release();
    }
  }
})

// 获取任务状态
router.get('/:id/status', async (req, res) => {
  try {
    const [[task]] = await pool.query(`
      SELECT 
        id,
        name,
        device_ips as deviceIps,
        change_script as changeScript,
        rollback_script as rollbackScript,
        verify_script as verifyScript,
        change_status,
        change_log,
        verify_status,
        verify_log,
        created_at,
        updated_at
      FROM automation_tasks 
      WHERE id = ?
    `, [req.params.id])
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    res.json({ data: task })
  } catch (error) {
    console.error('获取任务状态失败:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router 
