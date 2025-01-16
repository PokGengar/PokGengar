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
    component: () => import('../views/Login.vue')
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
        name: 'User',
        component: () => import('../views/user/index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'aaa',
        component: () => import('../views/aaa/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'AAAHome',
            component: () => import('../views/aaa/home.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'server',
            name: 'AAAServer',
            component: () => import('../views/aaa/server.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'log',
            name: 'AAALog',
            component: () => import('../views/aaa/log.vue'),
            meta: { requiresAuth: true }
          }
        ]
      },
      // 新增网络设备管理路由配置
      {
        path: 'network',
        component: () => import('../views/network/index.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'NetworkHome',
            component: () => import('../views/network/modules.vue'),
            meta: { requiresAuth: true }
          },
          {
            path: 'headquarters',
            name: 'NetworkHeadquarters',
            component: () => import('../views/network/devices.vue'),
            meta: { requiresAuth: true },
            props: { moduleId: 1 }  // 总部园区模块ID
          },
          {
            path: 'overseas',
            name: 'NetworkOverseas',
            component: () => import('../views/network/devices.vue'),
            meta: { requiresAuth: true },
            props: { moduleId: 2 }  // 海外大区办公室模块ID
          },
          {
            path: 'domestic-office',
            name: 'NetworkDomesticOffice',
            component: () => import('../views/network/devices.vue'),
            meta: { requiresAuth: true },
            props: { moduleId: 3 }  // 国内大区办公室模块ID
          },
          {
            path: 'domestic-warehouse',
            name: 'NetworkDomesticWarehouse',
            component: () => import('../views/network/devices.vue'),
            meta: { requiresAuth: true },
            props: { moduleId: 4 }  // 国内仓库模块ID
          }
        ]
      },
      {
        path: '/ssh-terminal',
        name: 'SSHTerminal',
        component: () => import('../views/aaa/SSHTerminal.vue')
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
  const isAuthenticated = localStorage.getItem('token')
  
  // 检查登录状态和超时
  if (isAuthenticated && userStore.checkTokenExpired()) {
    userStore.clearToken()
    next('/login')
    return
  }

  // 如果是访问登录页面且已经登录且未超时，则重定向到首页
  if (to.path === '/login' && isAuthenticated && !userStore.checkTokenExpired()) {
    next('/index')
    return
  }
  
  // 如果需要认证且未登录，则重定向到登录页面
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }
  
  next()
})

export default router
