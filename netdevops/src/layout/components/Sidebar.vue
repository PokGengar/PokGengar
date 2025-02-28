<template>
  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical"
    :collapse="isCollapse"
    @select="handleSelect"
    background-color="#1e2c3c"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
  >
    <template v-for="item in menuItems" :key="item.title">
      <!-- 没有子菜单的项目 -->
      <el-menu-item v-if="!item.children" :index="item.path || ''">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>

      <!-- 有子菜单的项目 -->
      <el-sub-menu v-else :index="item.title">
        <template #title>
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </template>

        <template v-for="subItem in item.children" :key="subItem.title">
          <!-- 二级菜单项 -->
          <el-menu-item 
            v-if="!('children' in subItem)" 
            :index="subItem.path"
          >
            {{ subItem.title }}
          </el-menu-item>

          <!-- 三级菜单 -->
          <el-sub-menu 
            v-else 
            :index="subItem.title"
          >
            <template #title>{{ subItem.title }}</template>
            <el-menu-item 
              v-for="thirdItem in subItem.children"
              :key="thirdItem.title"
              :index="thirdItem.path"
            >
              {{ thirdItem.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { markRaw } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'

interface BaseMenuItem {
  title: string
  path: string
}

interface ParentMenuItem {
  title: string
  icon?: Component
  path?: string
  children: (ParentMenuItem | BaseMenuItem)[]
}

interface RootMenuItem {
  title: string
  icon: Component
  path?: string
  children?: (ParentMenuItem | BaseMenuItem)[]
}

type MenuItem = RootMenuItem

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)

// 使用 markRaw 包装图标
const icons = Object.fromEntries(
  Object.entries(ElementPlusIcons).map(([key, component]) => [
    key,
    markRaw(component)
  ])
)

const menuItems = ref<MenuItem[]>([
  {
    title: '首页',
    icon: icons.HomeFilled,
    path: '/index'
  },
  {
    title: '资产管理',
    icon: icons.Platform,
    children: [
      {
        title: '网络设备管理',
        path: '/index/asset/network',
        icon: icons.Connection
      },
      {
        title: '服务器管理',
        path: '/index/asset/server',
        icon: icons.Monitor
      },
      {
        title: '平台管理',
        path: '/index/asset/platform',
        icon: icons.Platform
      },
      {
        title: '专线管理',
        path: '/index/asset/line',
        icon: icons.Link
      }
    ]
  },
  {
    title: 'DeepSeek',
    icon: icons.ChatRound,
    path: '/index/deepseek'
  },
  {
    title: '基础服务管理',
    icon: icons.Setting,
    children: [
      {
        title: '日志管理',
        children: [
          {
            title: 'AAA日志',
            path: '/index/service/log/aaa',
            icon: icons.Lock
          },
          {
            title: 'NTP日志',
            path: '/index/service/log/ntp',
            icon: icons.Timer
          }
        ]
      },
      {
        title: '状态管理',
        children: [
          {
            title: 'AAA状态',
            path: '/index/service/status/aaa',
            icon: icons.Lock
          },
          {
            title: 'NTP状态',
            path: '/index/service/status/ntp',
            icon: icons.Timer
          }
        ]
      }
    ]
  },
  {
    title: '用户管理',
    icon: icons.User,
    children: [
      {
        title: '登录管理',
        path: '/index/user',
        icon: icons.Key
      },
      {
        title: '权限管理',
        path: '/index/user/permission',
        icon: icons.Lock
      }
    ]
  },
  {
    title: '变更中心',
    icon: icons.SetUp,
    children: [
      {
        title: '自动化配置',
        path: '/index/change/automation',
        icon: icons.SetUp
      },
      {
        title: '巡检',
        path: '/index/change/inspection',
        icon: icons.Search
      },
      {
        title: '标准化配置模板',
        path: '/index/change/template',
        icon: icons.Document
      }
    ]
  }
])

const activeMenu = computed(() => route.path)

const handleSelect = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 200px;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu .el-menu-item) {
  min-width: 210px;
  background-color: #1b2838;
}

:deep(.el-menu-item.is-active) {
  background-color: #2d3e50 !important;
  border-right: 3px solid #409EFF;
}

:deep(.el-menu-item:hover) {
  background-color: #2d3e50 !important;
  color: #fff !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #2d3e50 !important;
  color: #fff !important;
}

:deep(.el-menu-item) {
  position: relative;
  transition: all 0.3s ease;
}

:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background-color: #409EFF;
}

:deep(.el-menu-item.is-active),
:deep(.el-menu-item.is-active:hover) {
  color: #fff !important;
  font-weight: bold;
}
</style> 
