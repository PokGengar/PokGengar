import { fileURLToPath } from 'node:url' // 导入 Node.js URL 模块的工具函数，用于处理文件路径
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config' // 导入 Vitest 配置相关函数
import viteConfig from './vite.config' // 导入 Vite 的配置文件

export default mergeConfig( // 合并 Vite 配置和 Vitest 配置
  viteConfig, // 基础配置使用 Vite 的配置
  defineConfig({ // 定义 Vitest 特定的配置
    test: { // 测试配置
      environment: 'jsdom', // 使用 jsdom 作为测试环境，模拟浏览器环境
      exclude: [...configDefaults.exclude, 'e2e/**'], // 排除的文件
                                                     // 包含默认排除的文件和 e2e 测试目录
      root: fileURLToPath(new URL('./', import.meta.url)), // 设置测试根目录为当前目录
    },
  }),
)
