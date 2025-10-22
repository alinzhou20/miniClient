/**
 * 教师路由配置
 */

import type { RouteRecordRaw } from 'vue-router'
import TeacherHome from '@/views/teacher/index.vue'
import Activity1 from '@/views/teacher/activity1/index.vue'
import Activity2 from '@/views/teacher/activity2/index.vue'
import Activity3 from '@/views/teacher/activity3/index.vue'
import Watch from '@/views/teacher/watch.vue'

export const teacherRoutes: RouteRecordRaw[] = [
  {
    path: '/teacher',
    name: 'Teacher',
    component: TeacherHome,
    meta: { auth: 'teacher' },
    children: [
      {
        path: '',
        name: 'TeacherHome',
        redirect: '/teacher/activity1'
      },
      {
        path: 'activity1',
        name: 'TeacherActivity1',
        component: Activity1,
      },
      {
        path: 'activity2',
        name: 'TeacherActivity2',
        component: Activity2,
      },
      {
        path: 'activity3',
        name: 'TeacherActivity3',
        component: Activity3,
      },
      {
        path: 'watch',
        name: 'TeacherWatch',
        component: Watch,
      }
    ]
  }
]
