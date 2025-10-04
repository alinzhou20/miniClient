/**
 * 学生路由配置
 */

import type { RouteRecordRaw } from 'vue-router'
import StudentHome from '@/views/student/index.vue'
import Activity1 from '@/views/student/activity1.vue'
import Activity2 from '@/views/student/activity2.vue'
import Activity3 from '@/views/student/activity3.vue'
import Activity4 from '@/views/student/activity4.vue'

export const studentRoutes: RouteRecordRaw[] = [
  {
    path: '/student',
    name: 'Student',
    component: StudentHome,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/student/activity1'
      },
      {
        path: 'activity1',
        name: 'StudentActivity1',
        component: Activity1,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity2',
        name: 'StudentActivity2',
        component: Activity2,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity3',
        name: 'StudentActivity3',
        component: Activity3,
        meta: { requiresAuth: true }
      },
      {
        path: 'activity4',
        name: 'StudentActivity4',
        component: Activity4,
        meta: { requiresAuth: true }
      }
    ]
  }
]
