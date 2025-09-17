import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/LoginForm.vue'
import TeacherLoginForm from '@/components/TeacherLoginForm.vue'

// 学生端组件（布局 + 子页面）
import StudentHome from '@/views/student/StudentHome.vue'
import StudentQuestion1 from '@/views/student/Question1.vue'
import StudentActivity1 from '@/views/student/Activity1.vue'
import StudentChat from '@/views/student/ChatView.vue'
import StudentSurvey from '@/views/student/SurveyDesigner.vue'

// 教师端组件（布局 + 子页面）
import TeacherHome from '@/views/teacher/TeacherHome.vue'
import TeacherQuestion1 from '@/views/teacher/Question1.vue'
import TeacherActivity1 from '@/views/teacher/Activity1.vue'
import TeacherSurvey from '@/views/teacher/SurveyMonitor.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login/:classNo?',
    name: 'Login',
    component: LoginForm,
    meta: { requiresAuth: false }
  },
  {
    path: '/login/teacher',
    name: 'TeacherLogin',
    component: TeacherLoginForm,
    meta: { requiresAuth: false }
  },
  // 学生端路由（嵌套路由：固定头部 + 可切换内容）
  {
    path: '/student',
    name: 'Student',
    component: StudentHome,
    meta: { requiresAuth: true, role: 'student' },
    children: [
      { path: '', redirect: { name: 'StudentQuestion1' } },
      { path: 'question1', name: 'StudentQuestion1', component: StudentQuestion1, meta: { requiresAuth: true, role: 'student' } },
      { path: 'activity1', name: 'StudentActivity1', component: StudentActivity1, meta: { requiresAuth: true, role: 'student' } },
      { path: 'chat', name: 'StudentChat', component: StudentChat, meta: { requiresAuth: true, role: 'student' } },
      { path: 'survey', name: 'StudentSurvey', component: StudentSurvey, meta: { requiresAuth: true, role: 'student' } },
    ]
  },
  // 教师端路由（嵌套路由：固定主页框架 + 可切换内容）
  {
    path: '/teacher',
    name: 'Teacher',
    component: TeacherHome,
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      { path: '', redirect: { name: 'TeacherQuestion1' } },
      { path: 'question1', name: 'TeacherQuestion1', component: TeacherQuestion1, meta: { requiresAuth: true, role: 'teacher' } },
      { path: 'activity1', name: 'TeacherActivity1', component: TeacherActivity1, meta: { requiresAuth: true, role: 'teacher' } },
      { path: 'survey', name: 'TeacherSurvey', component: TeacherSurvey, meta: { requiresAuth: true, role: 'teacher' } },
    ]
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫（支持刷新后自动登录）
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const authStore = useAuthStore()

  // 刷新后若还未认证，尝试自动登录（从 localStorage 恢复并重连 Socket）
  if (!authStore.isAuthenticated) {
    try { await authStore.autoLogin() } catch { /* ignore */ }
  }

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
