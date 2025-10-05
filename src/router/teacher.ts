/**
 * 教师路由配置
 */

import type { RouteRecordRaw } from 'vue-router'
import TeacherHome from '@/views/teacher/index.vue'
import Activity0 from '@/views/teacher/activity0.vue'
import Activity1 from '@/views/teacher/activity1.vue'
import Activity2 from '@/views/teacher/activity2.vue'
import Activity3 from '@/views/teacher/activity3.vue'
import Activity4 from '@/views/teacher/activity4.vue'
import Watch from '@/views/teacher/watch.vue'

export const teacherRoutes: RouteRecordRaw[] = [
  {
    path: '/teacher',
    name: 'Teacher',
    component: TeacherHome,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'TeacherHome',
        redirect: '/teacher/activity0'
      },
      {
        path: 'activity0',
        name: 'TeacherActivity0',
        component: Activity0,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity1',
        name: 'TeacherActivity1',
        component: Activity1,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity2',
        name: 'TeacherActivity2',
        component: Activity2,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity3',
        name: 'TeacherActivity3',
        component: Activity3,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity4',
        name: 'TeacherActivity4',
        component: Activity4,
        meta: { requiresAuth: true }
      },
      {
        path: 'watch',
        name: 'TeacherWatch',
        component: Watch,
        meta: { requiresAuth: true }
      }
    ]
  }
]
