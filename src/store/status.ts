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

  const mode = EntityMode.STUDENT_GROUP_ROLE

  // 存储拍摄的照片（base64 格式，包含 data:image/jpeg;base64, 前缀）
  const takePhoto = ref<string | null>(null)

  // 存储最新一次上传的数据到云平台的
  const fileId = ref<string | null>(null)

  // 活动状态
  const activityStatus = ref<ActivityStatus>(
    {
      now: 1,
      all: [
        { id: 1, title: '活动一', isActive: false },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
      ]
    }
  )

  const reset = () => {
    userStatus.value = null
    activityStatus.value = {
      now: 1,
      all: [
        { id: 1, title: '活动一', isActive: false },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
      ]
    }
    takePhoto.value = null
    fileId.value = null
    
  }

  return {
    userStatus,
    activityStatus,
    mode,
    takePhoto,
    fileId,
    reset
  }
}, {
  persist: true
})
