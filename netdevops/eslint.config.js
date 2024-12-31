// 导入 Vue ESLint 插件，用于检查 Vue 相关代码规范
import pluginVue from 'eslint-plugin-vue'
// 导入 Vue TypeScript ESLint 配置，用于检查 Vue + TypeScript 代码
import vueTsEslintConfig from '@vue/eslint-config-typescript'
// 导入 Vitest ESLint 插件，用于检查测试文件
import pluginVitest from '@vitest/eslint-plugin'
// 导入 Oxlint ESLint 插件，提供额外的代码检查规则
import oxlint from 'eslint-plugin-oxlint'
// 导入 Prettier 跳过格式化配置，避免 ESLint 和 Prettier 的规则冲突
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint', // 配置需要进行 lint 检查的文件
    files: ['**/*.{ts,mts,tsx,vue}'], // 匹配所有的 TypeScript 和 Vue 文件
  },

  {
    name: 'app/files-to-ignore', // 配置需要忽略的文件
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'], // 忽略构建输出目录和测试覆盖率报告目录
  },

  ...pluginVue.configs['flat/essential'], // 展开 Vue ESLint 基础规则配置
  ...vueTsEslintConfig(), // 展开 Vue TypeScript ESLint 配置
  
  {
    ...pluginVitest.configs.recommended, // 展开 Vitest 推荐配置
    files: ['src/**/__tests__/*'], // 仅对测试文件目录应用 Vitest 规则
  },
  oxlint.configs['flat/recommended'], // 使用 Oxlint 推荐的规则配置
  skipFormatting, // 应用跳过 Prettier 格式化的配置
]
