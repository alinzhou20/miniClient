import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/LoginForm.vue'
import StudentView from '@/views/StudentView.vue'
import TeacherView from '@/views/TeacherView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { requiresGuest: true }
  },
  {
    path: '/student',
    name: 'Student',
    component: StudentView,
    meta: { requiresAuth: true, role: 'student' }
  },
  {
    path: '/teacher',
    name: 'Teacher',
    component: TeacherView,
    meta: { requiresAuth: true, role: 'teacher' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()
  
  // 检查认证状态变化 - 如果从已认证变为未认证，立即跳转到登录页
  if (from.meta.requiresAuth && !authStore.isAuthenticated && to.path !== '/login') {
    next('/login')
    return
  }
  
  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    
    // 检查角色权限
    if (to.meta.role && authStore.userRole !== to.meta.role) {
      // 重定向到对应角色的页面
      const targetRoute = authStore.isStudent ? '/student' : '/teacher'
      next(targetRoute)
      return
    }
  }
  
  // 访客页面（如登录页）
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 已登录用户重定向到对应页面
    const targetRoute = authStore.isStudent ? '/student' : '/teacher'
    next(targetRoute)
    return
  }
  
  next()
})

export default router
