import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

async function encryptPasswords() {
  const pool = await mysql.createPool({
    host: '30.118.110.15',
    user: 'root',
    password: 'root',
    database: 'netdevops',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })

  try {
    // 先备份数据
    console.log('创建备份表...')
    await pool.query('CREATE TABLE IF NOT EXISTS aaa_servers_backup AS SELECT * FROM aaa_servers')
    
    // 获取所有记录
    console.log('获取所有记录...')
    const [rows] = await pool.query('SELECT id, password FROM aaa_servers')
    
    // 更新每条记录的密码
    console.log('开始更新密码...')
    for (const row of rows) {
      const hashedPassword = await bcrypt.hash(row.password, SALT_ROUNDS)
      await pool.query('UPDATE aaa_servers SET password = ? WHERE id = ?', [hashedPassword, row.id])
      console.log(`已更新 ID ${row.id} 的密码`)
    }
    
    console.log('所有密码已加密完成')
  } catch (error) {
    console.error('更新密码时出错:', error)
  } finally {
    await pool.end()
  }
}

encryptPasswords()
