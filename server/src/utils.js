import { exec } from 'child_process'
import util from 'util'
import CryptoJS from 'crypto-js'
import { Client } from 'ssh2'

const execAsync = util.promisify(exec)

// 默认管理员密码
export const DEFAULT_ADMIN_PASSWORD = 'admin123'

// 检查主机是否可达
export const pingHost = async (ip) => {
  try {
    console.log(`开始 ping 测试 ${ip}...`)
    const { stdout, stderr } = await execAsync(`ping -c 1 -W 1 ${ip}`)
    console.log(`Ping ${ip} 输出:`, stdout)
    
    // 修改判断条件，兼容不同系统的 ping 输出格式
    const isOnline = !stderr && (
      stdout.includes('1 packets transmitted, 1 packets received') ||  // Linux 格式
      stdout.includes('1 packets transmitted, 1 received')            // macOS 格式
    )
    
    console.log(`${ip} 状态:`, isOnline ? '在线' : '离线')
    return isOnline
  } catch (error) {
    console.error(`Ping ${ip} 测试失败:`, error)
    return false
  }
}

// 默认加密密钥
const DEFAULT_ENCRYPTION_KEY = 'netdevops-default-key'

// 加密密码
export const encryptPassword = (password) => {
  const key = process.env.ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY
  try {
    return CryptoJS.AES.encrypt(password, key).toString()
  } catch (error) {
    console.error('加密密码失败:', error)
    throw new Error('加密密码失败')
  }
}

// 解密密码
export const decryptPassword = (encryptedPassword) => {
  const key = process.env.ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY
  try {
    if (!encryptedPassword) {
      return ''
    }
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('解密密码失败:', error)
    return '******' // 如果解密失败，返回星号
  }
} 
