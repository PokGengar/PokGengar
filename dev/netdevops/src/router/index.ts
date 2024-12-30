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
            path: '',  // 空路径匹配 /index/aaa
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