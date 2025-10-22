/**
 * 学生路由配置
 */

import type { RouteRecordRaw } from 'vue-router'
import StudentHome from '@/views/student/index.vue'
import Activity1 from '@/views/student/activity1/index.vue'
import Activity2 from '@/views/student/activity2/index.vue'
import Activity3 from '@/views/student/activity3/index.vue'

export const studentRoutes: RouteRecordRaw[] = [
  {
    path: '/student',
    name: 'Student',
    component: StudentHome,
    meta: { auth: 'student' },
    children: [
      {
        path: '',
        name: 'StudentHome',
        redirect: '/student/activity1'
      },
      {
        path: 'activity1',
        name: 'StudentActivity1',
        component: Activity1,
      },
      {
        path: 'activity2',
        name: 'StudentActivity2',
        component: Activity2,
      },
      {
        path: 'activity3',
        name: 'StudentActivity3',
        component: Activity3,
      }
    ]
  },
]
