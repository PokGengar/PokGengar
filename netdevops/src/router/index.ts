import { createRouter, createWebHistory } from 'vue-router'
import { createAsyncComponent } from '@/utils/asyncComponent'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

// 使用异步组件加载
const AsyncLogin = createAsyncComponent(() => import('@/views/Login.vue'))
const AsyncSSOCallback = createAsyncComponent(() => import('@/views/SSOCallback.vue'))
const AsyncHome = createAsyncComponent(() => import('@/views/Home.vue'))
const AsyncLayout = createAsyncComponent(() => import('@/views/Layout.vue'))
const AsyncDeepseek = createAsyncComponent(() => import('@/views/deepseek/index.vue'))

// 用户管理相关组件
const AsyncUserIndex = createAsyncComponent(() => import('@/views/user/index.vue'))
const AsyncUserLogin = createAsyncComponent(() => import('@/views/user/login.vue'))
const AsyncUserPermission = createAsyncComponent(() => import('@/views/user/permission.vue'))

// 资产管理相关组件
const AsyncAssetIndex = createAsyncComponent(() => import('@/views/asset/index.vue'))
const AsyncAssetNetwork = createAsyncComponent(() => import('@/views/asset/network/index.vue'))
const AsyncAssetNetworkModules = createAsyncComponent(() => import('@/views/asset/network/modules.vue'))
const AsyncAssetNetworkDevices = createAsyncComponent(() => import('@/views/asset/network/devices.vue'))
const AsyncAssetServer = createAsyncComponent(() => import('@/views/asset/server/index.vue'))
const AsyncAssetServerModules = createAsyncComponent(() => import('@/views/asset/server/modules.vue'))
const AsyncAssetServerSSH = createAsyncComponent(() => import('@/views/asset/server/SSHTerminal.vue'))
const AsyncAssetPlatform = createAsyncComponent(() => import('@/views/asset/platform.vue'))
const AsyncAssetLine = createAsyncComponent(() => import('@/views/asset/line.vue'))

// 变更中心相关组件
const AsyncChangeIndex = createAsyncComponent(() => import('@/views/change/index.vue'))
const AsyncChangeAutomation = createAsyncComponent(() => import('@/views/change/automation.vue'))
const AsyncChangeInspection = createAsyncComponent(() => import('@/views/change/inspection.vue'))
const AsyncChangeTemplate = createAsyncComponent(() => import('@/views/change/template.vue'))

// 资源管理相关组件
const AsyncResourceIndex = createAsyncComponent(() => import('@/views/resource/index.vue'))
const AsyncResourceServer = createAsyncComponent(() => import('@/views/resource/server.vue'))

// 服务管理相关组件
const AsyncServiceIndex = createAsyncComponent(() => import('@/views/service/index.vue'))
const AsyncServiceLog = createAsyncComponent(() => import('@/views/service/log/index.vue'))
const AsyncServiceNTP = createAsyncComponent(() => import('@/views/service/log/ntp.vue'))
const AsyncServiceAAA = createAsyncComponent(() => import('@/views/service/log/aaa.vue'))
const AsyncServiceStatus = createAsyncComponent(() => import('@/views/service/status/index.vue'))
const AsyncServiceStatusAAA = createAsyncComponent(() => import('@/views/service/status/aaa.vue'))

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: AsyncLogin,
    beforeEnter: (to, from, next) => {
      const ssoLoginUrl = 'https://login.alibaba-inc.com/ssoLogin.htm'
      const appName = 'mallard'
      const backUrl = encodeURIComponent(`http://30.118.110.15:5173/sendBucSSOToken.do`)
      window.location.href = `${ssoLoginUrl}?APP_NAME=${appName}&BACK_URL=${backUrl}`
    }
  },
  {
    path: '/sendBucSSOToken.do',
    name: 'SSOCallback',
    component: AsyncSSOCallback,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    component: AsyncLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: AsyncHome,
        meta: { requiresAuth: true }
      },
      {
        path: 'user',
        component: AsyncUserIndex,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'UserLogin',
            component: AsyncUserLogin,
            meta: { requiresAuth: true }
          },
          {
            path: 'permission',
            name: 'UserPermission',
            component: AsyncUserPermission,
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加资产管理路由
      {
        path: 'asset',
        component: AsyncAssetIndex,
        meta: { requiresAuth: true },
        children: [
          {
            path: 'network',
            component: AsyncAssetNetwork,
            meta: { requiresAuth: true },
            children: [
              {
                path: '',
                name: 'NetworkHome',
                component: AsyncAssetNetworkModules,
                meta: { requiresAuth: true }
              },
              {
                path: 'devices/:moduleId',
                name: 'NetworkDevices',
                component: AsyncAssetNetworkDevices,
                meta: { requiresAuth: true },
                props: true
              }
            ]
          },
          {
            path: 'server',
            name: 'ServerManagement',
            component: AsyncAssetServer,
            meta: { requiresAuth: true },
            children: [
              {
                path: '',
                name: 'ServerHome',
                component: AsyncAssetServerModules,
                meta: { requiresAuth: true }
              },
              {
                path: 'ssh-terminal',
                name: 'SSHTerminal',
                component: AsyncAssetServerSSH,
                meta: { requiresAuth: true }
              }
            ]
          },
          {
            path: 'platform',
            name: 'PlatformManagement',
            component: AsyncAssetPlatform,
            meta: { requiresAuth: true }
          },
          {
            path: 'line',
            name: 'LineManagement',
            component: AsyncAssetLine,
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加变更中心路由
      {
        path: 'change',
        component: AsyncChangeIndex,
        meta: { requiresAuth: true },
        children: [
          {
            path: 'automation',
            name: 'ChangeAutomation',
            component: AsyncChangeAutomation,
            meta: { requiresAuth: true }
          },
          {
            path: 'inspection',
            name: 'ChangeInspection',
            component: AsyncChangeInspection,
            meta: { requiresAuth: true }
          },
          {
            path: 'template',
            name: 'ChangeTemplate',
            component: AsyncChangeTemplate,
            meta: { requiresAuth: true }
          }
        ]
      },
      {
        path: 'resource',
        component: AsyncResourceIndex,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'ResourceHome',
            component: AsyncResourceServer,
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加 DeepSeek 路由
      {
        path: 'deepseek',
        name: 'DeepSeek',
        component: AsyncDeepseek,
        meta: { requiresAuth: true }
      },
      // 添加基础服务管理路由
      {
        path: 'service',
        component: AsyncServiceIndex,
        meta: { requiresAuth: true },
        children: [
          {
            path: 'log',
            component: AsyncServiceLog,
            meta: { requiresAuth: true },
            children: [
              {
                path: 'aaa',
                name: 'AAALog',
                component: AsyncServiceAAA,
                meta: { requiresAuth: true }
              },
              {
                path: 'ntp',
                name: 'NTPLog',
                component: AsyncServiceNTP,
                meta: { requiresAuth: true }
              }
            ]
          },
          {
            path: 'status',
            component: AsyncServiceStatus,
            meta: { requiresAuth: true },
            children: [
              {
                path: 'aaa',
                name: 'AAAStatus',
                component: AsyncServiceStatusAAA,
                meta: { requiresAuth: true }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/index'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.token || localStorage.getItem('token')
  
  // 如果是SSO回调页面，直接通过
  if (to.path.endsWith('sendBucSSOToken.do')) {
    next()
    return
  }

  // 如果已登录且访问登录页，重定向到首页
  if (to.path === '/login' && isAuthenticated) {
    next('/index')
    return
  }
  
  // 如果需要认证且未登录，直接重定向到SSO登录
  if ((to.meta.requiresAuth || to.path === '/login') && !isAuthenticated) {
    const ssoLoginUrl = 'https://login.alibaba-inc.com/ssoLogin.htm'
    const appName = 'mallard'
    const backUrl = encodeURIComponent(`http://30.118.110.15:5173/sendBucSSOToken.do`)
    window.location.href = `${ssoLoginUrl}?APP_NAME=${appName}&BACK_URL=${backUrl}`
    return
  }
  
  next()
})

export default router
