import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
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
    component: () => import('../views/SSOCallback.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'user',
        component: () => import('../views/user/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'UserLogin',
            component: () => import('../views/user/login.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'permission',
            name: 'UserPermission',
            component: () => import('../views/user/permission.vue'),
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加资产管理路由
      {
        path: 'asset',
        component: () => import('../views/asset/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'network',
            component: () => import('../views/asset/network/index.vue'),
            meta: { requiresAuth: true },
            children: [
              {
                path: '',
                name: 'NetworkHome',
                component: () => import('../views/asset/network/modules.vue'),
                meta: { requiresAuth: true }
              },
              {
                path: 'devices/:moduleId',
                name: 'NetworkDevices',
                component: () => import('../views/asset/network/devices.vue'),
                meta: { requiresAuth: true },
                props: true
              }
            ]
          },
          {
            path: 'server',
            name: 'ServerManagement',
            component: () => import('../views/asset/server/index.vue'),
            meta: { requiresAuth: true },
            children: [
              {
                path: '',
                name: 'ServerHome',
                component: () => import('../views/asset/server/modules.vue'),
                meta: { requiresAuth: true }
              },
              {
                path: 'ssh-terminal',
                name: 'SSHTerminal',
                component: () => import('../views/asset/server/SSHTerminal.vue'),
                meta: { requiresAuth: true }
              }
            ]
          },
          {
            path: 'platform',
            name: 'PlatformManagement',
            component: () => import('../views/asset/platform.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'line',
            name: 'LineManagement',
            component: () => import('../views/asset/line.vue'),
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加变更中心路由
      {
        path: 'change',
        component: () => import('../views/change/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'automation',
            name: 'ChangeAutomation',
            component: () => import('../views/change/automation.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'inspection',
            name: 'ChangeInspection',
            component: () => import('../views/change/inspection.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'template',
            name: 'ChangeTemplate',
            component: () => import('../views/change/template.vue'),
            meta: { requiresAuth: true }
          }
        ]
      },
      {
        path: 'resource',
        component: () => import('../views/resource/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'ResourceHome',
            component: () => import('../views/resource/server.vue'),
            meta: { requiresAuth: true }
          }
        ]
      },
      // 添加基础服务管理路由
      {
        path: 'service',
        component: () => import('../views/service/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'log',
            component: () => import('../views/service/log/index.vue'),
            meta: { requiresAuth: true },
            children: [
              {
                path: 'aaa',
                name: 'AAALog',
                component: () => import('../views/service/log/aaa.vue'),
                meta: { requiresAuth: true }
              },
              {
                path: 'ntp',
                name: 'NTPLog',
                component: () => import('../views/service/log/ntp.vue'),
                meta: { requiresAuth: true }
              }
            ]
          },
          {
            path: 'status',
            component: () => import('../views/service/status/index.vue'),
            meta: { requiresAuth: true },
            children: [
              {
                path: 'aaa',
                name: 'AAAStatus',
                component: () => import('../views/service/status/aaa.vue'),
                meta: { requiresAuth: true }
              },
              {
                path: 'ntp',
                name: 'NTPStatus',
                component: () => import('../views/service/status/ntp.vue'),
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
