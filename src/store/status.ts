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

// 小组活动得分
export interface GroupActivityScores {
  activity1: number      // 活动一得分 (最高1分)
  activity2_1: number    // 活动二-选择 (最高2分)
  activity2_2: number    // 活动二-设计 (最高2分)
  activity3: number      // 活动三-问卷 (最高1分，提交即得分)
  activity4: number      // 活动四得分 (最高1分)
}

// 小组状态（教师端使用）
export interface GroupStatus {
  groupNo: string         // 小组编号 (1-12)
  isOnline: boolean       // 是否登录（只看操作员）
  operatorNo?: string     // 操作员学号
  loginTime?: number      // 登录时间
  scores: GroupActivityScores  // 各活动得分
  totalScore: number      // 总分（最高8分：1+2+3+1+1）
}

export const useStatus = defineStore('status', () => {

  // 用户状态
  const userStatus = ref<UserStatus | null>(null)

  const mode = EntityMode.STUDENT_GROUP_ROLE

  // 存储拍摄的照片（base64 格式，包含 data:image/jpeg;base64, 前缀）
  const takePhoto = ref<string | null>(null)

  // 存储最新一次上传的数据到云平台的
  const fileId = ref<string | null>(null)

  // 学生端小组得分状态（用于显示本小组的总体得分）
  const groupScores = ref<GroupActivityScores>({
    activity1: 0,
    activity2_1: 0,
    activity2_2: 0,
    activity3: 0,
    activity4: 0
  })

  // 活动状态（通用，学生端使用 1-4，教师端使用 0-4）
  const activityStatus = ref<ActivityStatus>(
    {
      now: 1,
      all: [
        { id: 0, title: '投票', isActive: false },
        { id: 1, title: '活动一', isActive: true },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
        { id: 4, title: '梳理', isActive: false },
      ]
    }
  )

  // 小组状态（教师端主要使用）- 12个组
  const groupStatus = ref<Record<string, GroupStatus>>({})

  
  // 初始化小组状态
  for (let i = 1; i <= 12; i++) {
    const groupNo = String(i)
    groupStatus.value[groupNo] = {
      groupNo,
      isOnline: false,
      operatorNo: undefined,
      loginTime: undefined,
      scores: {
        activity1: 0,
        activity2_1: 0,
        activity2_2: 0,
        activity3: 0,
        activity4: 0
      },
      totalScore: 0
    }
  }

  const reset = () => {
    userStatus.value = null
    activityStatus.value = {
      now: 1,
      all: [
        { id: 0, title: '投票', isActive: false },
        { id: 1, title: '活动一', isActive: true },
        { id: 2, title: '活动二', isActive: false },
        { id: 3, title: '活动三', isActive: false },
        { id: 4, title: '梳理', isActive: false },
      ]
    }
    takePhoto.value = null
    fileId.value = null
    
    // 重置学生端小组得分
    groupScores.value = {
      activity1: 0,
      activity2_1: 0,
      activity2_2: 0,
      activity3: 0,
      activity4: 0
    }
    
    // 重置小组状态
    groupStatus.value = {}
    for (let i = 1; i <= 12; i++) {
      const groupNo = String(i)
      groupStatus.value[groupNo] = {
        groupNo,
        isOnline: false,
        operatorNo: undefined,
        loginTime: undefined,
        scores: {
          activity1: 0,
          activity2_1: 0,
          activity2_2: 0,
          activity3: 0,
          activity4: 0
        },
        totalScore: 0
      }
    }
  }

  return {
    userStatus,
    activityStatus,
    groupStatus,
    groupScores,
    mode,
    takePhoto,
    fileId,
    reset
  }
}, {
  persist: true
})
