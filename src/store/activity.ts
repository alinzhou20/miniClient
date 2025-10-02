/**
 * 活动状态管理 - 统一管理所有活动
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== 公共类型 ====================
export interface Rating {
  index: number
  criteria: string
  score: number
}

// ==================== Activity 0 - 现场投票 ====================
export interface VoteResult {
  countA: number
  countB: number
  timestamp: number
}

// ==================== Activity 1 - 观点交锋方法初探 ====================
export interface Activity1Result {
  viewpoint: 'A' | 'B' | null
  point: Record<number, string>
  rating: Rating[]
  submittedAt: number
}

// ==================== 统一活动状态管理 ====================
export const useActivity = defineStore('activity', () => {

  // Activity 0 - 教师现场投票结果
  const ac0_voteResult = ref<VoteResult | null>(null)
  // Activity 0 - base64照片数据
  const ac0_photo = ref<string>('')  
  
  // Activity 1 - 学生提交
  const ac1_stuResult = ref<Activity1Result | null>({
    viewpoint: null,
    point: {
      1: '',
      2: ''
    },
    rating: [{
      index: 1,
      criteria: "1. 通过小组讨论，我们能够写出两条理由。",
      score: 0,
    }],
    submittedAt: 0
  })
  
  // Activity 1 - 教师接收提交结果
  const ac1_allResult = ref<Record<string, Activity1Result> | null>(null)

  const reset = () => {
    ac0_voteResult.value = null
    ac0_photo.value = ''
    ac1_stuResult.value = {
      viewpoint: null,
      point: {
        1: '',
        2: ''
      },
      rating: [{
        index: 1,
        criteria: "1. 通过小组讨论，我们能够写出两条理由。",
        score: 0,
      }],
      submittedAt: 0
    }
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
