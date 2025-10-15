/**
 * 活动状态管理 - 统一管理所有活动
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

// 评价
export interface Rating {
  index: number
  criteria: string
  score: number
}

// 问卷题目
export interface QuestionOption {
  id: number
  title: string
  options?: string[]
  type: 'fill' | 'single' | 'multiple'
  questionType: 'duration' | 'type' | 'design' | 'grade' | 'gender'
  answer?: any
  visibility?: 'teacher' | 'student' | 'both' // 可见性：仅教师、仅学生、都可见
  limit?: number // 限制：多选题-最大可选项数量（正数限制，-1不限制）；填空题-输入类型（-2仅数字，-1不限制）
}

// 调查问卷
export interface Questionnaire {
  title: string
  description: string
  questions: QuestionOption[]
}

// ==================== Activity 0 - 现场投票 ====================
export interface VoteResult {
  countA: number
  countB: number
  timestamp: number
}

// ==================== Activity 1 - 观点获取 ====================
export interface Activity1Result {
  viewpoint: 'A' | 'B' | null
  point: Record<number, string>
  rating: Rating[]
  submittedAt: number
}

// ==================== Activity 2 - 题目选择 ====================
export interface Activity2Result {
  selectedDurationQuestion: number | null  // 使用时长题目ID
  selectedImpactQuestion: number | null    // 使用影响题目ID
  durationReason: string  // 使用时长选择理由
  impactReason: string    // 使用影响选择理由
  rating: Rating[]
  submittedAt: number
}

// ==================== Activity 3 - 题目设计 ====================
export interface Activity3Result {
  designQuestion: QuestionOption | null  // 单个题目，不是数组
  rating: Rating[]
  great: number
  submittedAt: number
  challengeLevel?: 'one' | 'two' | 'three' | null  // 挑战级别
  likedByGroups?: string[]  // 点赞的小组列表
}

// ==================== Activity 4 - 问卷填写 ====================
// 问卷答案（学生提交的完整问卷）
export interface QuestionnaireAnswer {
  groupNo: string
  studentNo: string
  studentRole: string
  questions: QuestionOption[]  // 包含答案的完整问卷题目
  submittedAt: number
}

// Activity 4 - 学生问卷提交结果（包含评价）
export interface Activity4Result {
  rating: Rating[]
  submittedAt: number
}

// ==================== 问卷数据常量 ====================
// 问卷初始数据
const questionnaireInitialData: Questionnaire = {
  title: '学生数字设备使用情况调查问卷',
  description: '为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建议，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。',
  questions: []
}

// 导出供教师端使用
export const questionnaireSecondData: Questionnaire = questionnaireInitialData

// ==================== 统一活动状态管理 ====================
export const useActivity = defineStore('activity', () => {

  // 问卷数据（响应式）- 教师端编辑用
  const questionnaire = ref<Questionnaire>(JSON.parse(JSON.stringify(questionnaireInitialData)))
  
  // 实际问卷数据（响应式）- 学生端接收教师发送的问卷
  const real_questionnaire = ref<Questionnaire>({
    title: '学生数字设备使用情况调查问卷',
    description: '为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建议，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。',
    questions: []
  })

  // Activity 0 - 教师现场投票结果
  const ac0_voteResult = ref<VoteResult | null>(null)
  // Activity 0 - base64照片数据
  const ac0_photo = ref<string>('')  
  
  // Activity 1 - 学生提交
  const ac1_stuResult = ref<Activity1Result | null>({
    viewpoint: null,
    point: {
      1: ''
    },
    rating: [{
      index: 1,
      criteria: "1. 通过同桌协作，能写出理由并上传。",
      score: 0,
    }],
    submittedAt: 0
  })
  
  // Activity 1 - 提炼后的观点集合
  const ac1_allReason = ref<{
    A: string[]
    B: string[]
  }>({
    A: [],
    B: []
  })

  const ac1_allResult = ref<Record<string, Activity1Result>>({})
  
  // Activity 2 - 教师接收所有学生的选择结果
  const ac2_allResult = ref<Record<string, Activity2Result>>({})
  
  // Activity 3 - 教师接收所有学生的设计结果（已在提交时去重，只包含不重复的题目）
  const ac3_allResult = ref<Record<string, Activity3Result>>({})
  
  // Activity 4 - 教师接收学生的问卷答案
  const ac4_allQuestionnaireAnswer = ref<Record<string, QuestionnaireAnswer>>({})

  // Activity 2 - 学生题目选择
  const ac2_stuResult = ref<Activity2Result | null>({
    selectedDurationQuestion: null,
    selectedImpactQuestion: null,
    durationReason: '',
    impactReason: '',
    rating: [
      {
        index: 1,
        criteria: '1.能够为"使用时长"选择合适的调查问题，并讨论了理由。',
        score: 0,
      },
      {
        index: 2,
        criteria: '2.能够为"设备类型"选择合适的调查问题，并讨论了理由。',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  // Activity 3 - 学生题目设计
  const ac3_stuResult = ref<Activity3Result | null>({
    designQuestion: null,  // 单个题目（最终提交的题目）
    rating: [
      {
        index: 1,
        criteria: '1.能够独立设计题目，并完成上传。（2星）',
        score: 0,
      },
      {
        index: 2,
        criteria: '2.能够借助智能体完成题目设计。（1星）',
        score: 0,
      },
    ],
    great: 0,
    submittedAt: 0,
    likedByGroups: []
  })

  // Activity 3 - 点赞开放状态
  const ac3_likeEnabled = ref<boolean>(false)
  
  // Activity 3 - 剩余点赞数（每个学生/小组最多2次）
  const ac3_remainingLikes = ref<number>(2)

  // 挑战任务独立数据源（three-star）
  const threeStarDraft = ref<QuestionOption | null>(null)
  
  // 基础任务独立数据源（two-star）
  const twoStarDraft = ref<QuestionOption | null>(null)

  // Activity 4 - 学生问卷提交结果
  const ac4_stuResult = ref<Activity4Result | null>({
    rating: [
      {
        index: 1,
        criteria: '1.能够独立完成调查问卷并提交。',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  const reset = () => {
    // 重置问卷
    questionnaire.value = JSON.parse(JSON.stringify(questionnaireInitialData))
    
    // 重置实际问卷（学生端）- 保持默认标题和说明
    real_questionnaire.value = {
      title: '学生数字设备使用情况调查问卷',
      description: '为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建议，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。',
      questions: []
    }
    
    ac0_voteResult.value = null
    ac0_photo.value = ''
    ac1_stuResult.value = {
      viewpoint: null,
      point: {
        1: ''
      },
      rating: [{
        index: 1,
        criteria: "1. 通过同桌协作，能写出理由并上传。",
        score: 0,
      }],
      submittedAt: 0
    }
    ac1_allResult.value = {}
    ac2_allResult.value = {}
    ac3_allResult.value = {}
    ac4_allQuestionnaireAnswer.value = {}
    ac2_stuResult.value = {
      selectedDurationQuestion: null,
      selectedImpactQuestion: null,
      durationReason: '',
      impactReason: '',
      rating: [
        {
          index: 1,
          criteria: '1.能够为"使用时长"选择合适的调查问题，并讨论了理由。',
          score: 0,
        },
        {
          index: 2,
          criteria: '2.能够为"设备类型"选择合适的调查问题，并讨论了理由。',
          score: 0,
        }
      ],
      submittedAt: 0
    }
    ac3_stuResult.value = {
      designQuestion: null,  // 单个题目
      rating: [
        {
          index: 1,
          criteria: '1.能够独立设计题目，并完成上传。（2星）',
          score: 0,
        },
        {
          index: 2,
          criteria: '2.能够借助智能体完成题目设计。（1星）',
          score: 0,
        },
      ],
      great: 0,
      submittedAt: 0,
      likedByGroups: []
    }
    threeStarDraft.value = null
    twoStarDraft.value = null
    ac3_likeEnabled.value = false
    ac3_remainingLikes.value = 2
    ac4_stuResult.value = {
      rating: [
        {
          index: 1,
          criteria: '1.能够独立完成调查问卷并提交。',
          score: 0,
        }
      ],
      submittedAt: 0
    }
  }
  
  return {
    // 问卷
    questionnaire,
    real_questionnaire,
    
    // Activity 0
    ac0_voteResult,
    ac0_photo,
    
    // Activity 1
    ac1_stuResult,
    ac1_allResult,
    ac1_allReason,

    // Activity 2
    ac2_stuResult,
    ac2_allResult,
    
    // Activity 3
    ac3_stuResult,
    ac3_allResult,
    ac3_likeEnabled,
    ac3_remainingLikes,
    threeStarDraft,
    twoStarDraft,
    
    // Activity 4
    ac4_stuResult,
    ac4_allQuestionnaireAnswer,

    reset
  }
}, {
  persist: true
})
