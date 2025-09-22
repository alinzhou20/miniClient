import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/LoginForm.vue'
import TeacherLoginForm from '@/components/TeacherLoginForm.vue'

// 学生端组件（布局 + 子页面）
import StudentHome from '@/views/student/StudentHome.vue'
import StudentActivity1 from '@/views/student/Activity1.vue'
import StudentActivity2 from '@/views/student/Activity2.vue'
import StudentActivity3 from '@/views/student/Activity3.vue'

// 教师端组件（布局 + 子页面）
import TeacherHome from '@/views/teacher/TeacherHome.vue'
import TeacherActivity1 from '@/views/teacher/Activity1.vue'
import TeacherActivity2 from '@/views/teacher/Activity2.vue'
import TeacherActivity3 from '@/views/teacher/Activity3.vue'

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
      { path: '', redirect: { name: 'StudentActivity1' } },
      { path: 'activity1', name: 'StudentActivity1', component: StudentActivity1, meta: { requiresAuth: true, role: 'student' } },
      { path: 'activity2', name: 'StudentActivity2', component: StudentActivity2, meta: { requiresAuth: true, role: 'student' } },
      { path: 'activity3', name: 'StudentActivity3', component: StudentActivity3, meta: { requiresAuth: true, role: 'student' } },
    ]
  },
  // 教师端路由（嵌套路由：固定主页框架 + 可切换内容）
  {
    path: '/teacher',
    name: 'Teacher',
    component: TeacherHome,
    meta: { requiresAuth: true, role: 'teacher' },
    children: [
      { path: '', redirect: { name: 'TeacherActivity1' } },
      { path: 'activity1', name: 'TeacherActivity1', component: TeacherActivity1, meta: { requiresAuth: true, role: 'teacher' } },
      { path: 'activity2', name: 'TeacherActivity2', component: TeacherActivity2, meta: { requiresAuth: true, role: 'teacher' } },
      { path: 'activity3', name: 'TeacherActivity3', component: TeacherActivity3, meta: { requiresAuth: true, role: 'teacher' } },
    ]
  },
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
