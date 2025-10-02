/**
 * 活动状态管理 - 统一管理所有活动
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== Activity 0 - 现场投票 ====================
export interface VoteResult {
  countA: number
  countB: number
  timestamp: number
}

// ==================== Activity 1 - 观点交锋方法初探 ====================
export interface Activity1Submission {
  viewpoint: 'A' | 'B' | null
  photo: string  // base64照片数据
  ratings: number[]  // 3个评分，0-3星
  recognitionResult?: any  // 手写识别结果
  submittedAt: number
}

// ==================== 统一活动状态管理 ====================
export const useActivity = defineStore('activity', () => {

  // Activity 0 - 教师现场投票结果
  const ac0_voteResult = ref<VoteResult | null>(null)
  // Activity 0 - base64照片数据
  const ac0_photo = ref<string>('')  
  
  // Activity 1 - 学生提交
  const ac1_stuResult = ref<Activity1Submission | null>(null)
  // Activity 1 - 教师接收提交结果
  const ac1_allResult = ref<Record<string, Activity1Submission> | null>(null)

  const reset = () => {
    ac0_voteResult.value = null
    ac0_photo.value = ''
    ac1_stuResult.value = null
    ac1_allResult.value = null
  }
  
  return {
    // Activity 0
    ac0_voteResult,
    ac0_photo,
    
    // Activity 1
    ac1_stuResult,
    ac1_allResult,

    reset
  }
}, {
  persist: true
})
