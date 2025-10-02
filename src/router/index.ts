/**
 * 路由配置主入口
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { studentRoutes } from './student'
import { teacherRoutes } from './teacher'
import { useStatus } from '@/store/status'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'LoginStudent',
    component: () => import('@/views/login/student.vue')
  },
  {
    path: '/login/teacher',
    name: 'LoginTeacher',
    component: () => import('@/views/login/teacher.vue')
  },
  ...studentRoutes,
  ...teacherRoutes
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫：检查登录状态
router.beforeEach((to, _, next) => {
  const status = useStatus()
  
  if (to.meta.requiresAuth && !status.userStatus) {
    next('/login')
    return
  }
  
  next()
})

export default router