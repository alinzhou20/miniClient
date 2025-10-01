/**
 * 全局状态管理 - 用户状态和活动状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { EntityMode } from '@/types'

// 用户状态管理
export interface UserStatus {
  type: 'student' | 'teacher'
  mode?: EntityMode
  groupNo?: string
  studentNo?: string
  studentRole?: string
}

// 活动状态管理
export interface Activity {
  id: number,
  title: string,
  isActive: boolean
}
export interface ActivityStatus {
  now: number,
  all: Activity[]
}

export const useStatus = defineStore('status', () => {

  // 用户状态
  const userStatus = ref<UserStatus | null>(null)

  const mode = EntityMode.GROUP

  // 活动状态
  const activityStatus = ref<ActivityStatus>(
    {
      now: 0,
      all: [
        { id: 0, title: '投票', isActive: true },
        { id: 1, title: '活动一', isActive: false },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
      ]
    }
  )

  const reset = () => {
    userStatus.value = null
    activityStatus.value = {
      now: 0,
      all: [
        { id: 0, title: '投票', isActive: true },
        { id: 1, title: '活动一', isActive: false },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
      ]
    }
  }

  return {
    userStatus,
    activityStatus,
    mode,
    reset
  }
}, {
  persist: true
})
