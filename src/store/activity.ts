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

// ==================== Activity 2 - 问卷设计 ====================
// 题目
export interface QuestionOption {
  id: number
  title: string
  options?: string[]
  type: 'fill' | 'single' | 'multiple'
  questionType: 'duration' | 'impact' | 'grade' | 'gender' | 'design' 
  answer?: string
}

// 完整调查问卷
export interface Questionnaire {
  title: string
  description: string
  questions: QuestionOption[]
}

// 题库数据
export interface QuestionBank {
  durationQuestions: QuestionOption[]
  impactQuestions: QuestionOption[]
  usageQuestions: QuestionOption[]
}

// Activity 2.1 - 学生选择的题目
export interface Activity2_1_selectResult {
  selectedDurationQuestion: number | null  // 使用时长题目ID
  selectedImpactQuestion: number | null    // 使用影响题目ID
  durationReason: string  // 使用时长选择理由
  impactReason: string    // 使用影响选择理由
  rating: Rating[]
  submittedAt: number
}

// Activity 2.2 - 学生设计的题目
export interface Activity2_2_designResult {
  designQuestion: QuestionOption | null  // 单个题目，不是数组
  rating: Rating[]
  submittedAt: number
}

// ==================== Activity 4 - 数据获取方式 ====================
export type BoxId = 'A' | 'B' | 'C' | 'D'
export type ElementId =
  | 'check_vision'
  | 'register_vision'
  | 'bad_habits'
  | 'usage_duration'
  | 'common_devices'
  | 'survey_all_devices'

export interface Activity4Result {
  selections: Record<ElementId, BoxId | ''>
  hasSubmittedAll: boolean
  rating: Rating[]
  submittedAt: number
}

// ==================== Activity 2 数据常量 ====================
// 问卷初始数据
const questionnaireInitialData: Questionnaire = {
  title: '学生数字设备使用情况调查问卷',
  description: '为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建议，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。',
  questions: [{
    id: 1,
    title: '就读年级',
    options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
    type: 'single',
    questionType: 'grade',
    answer: ''
  },{
    id: 2,
    title: '你的性别',
    options: ['男', '女'],
    type: 'single',
    questionType: 'gender',
    answer: ''
  }]
}

// 题库数据
export const bank: QuestionBank = {
  durationQuestions: [
    {
      id: 1,
      title: '今天你使用平板电脑的大概时间是_______。',
      type: 'fill',
      questionType: 'duration',
      answer: ''
    },
    {
      id: 2,
      title: '周末你使用平板电脑的大概时间是_______。若没有，则填0（单位：分钟）',
      type: 'fill',
      questionType: 'duration',
      answer: ''
    }
  ],
  impactQuestions: [
    {
      id: 1,
      title: '你认为使用数字设备对你的学习和生活最主要的影响是什么？',
      options: [
        '快速获取学习资料',
        '便捷分享生活动态（如照片、视频）',
        '提供多样化娱乐选择（游戏、短视频等）'
      ],
      type: 'single',
      questionType: 'impact',
      answer: ''
    },
    {
      id: 2,
      title: '你认为使用数字设备对你的学习和生活最主要的影响是什么？',
      options: [
        '作业时更依赖即时搜索而非独立思考',
        '减少面对面交流时间',
        '影响夜间睡眠质量'
      ],
      type: 'single',
      questionType: 'impact',
      answer: ''
    },
    {
      id: 3,
      title: '你认为使用数字设备对你的学习和生活最主要的影响是什么？',
      options: [
        '快速获取学习资料',
        '便捷分享生活动态（如照片、视频）',
        '提供多样化娱乐选择（游戏、短视频等）',
        '作业时更依赖即时搜索而非独立思考',
        '减少面对面交流时间',
        '影响夜间睡眠质量'
      ],
      type: 'multiple',
      questionType: 'impact',
      answer: ''
    },
    {
      id: 4,
      title: '我认为以上题目都不合适。',
      type: 'fill',
      questionType: 'impact',
      answer: ''
    }
  ],
  usageQuestions: [
    {
      id: 1,
      title: '你使用数字设备主要用于哪些场景？（可多选）',
      type: 'multiple',
      questionType: 'design',
      answer: '',
      options: [
        '学习',
        '运动',
        '交流',
        '旅游'
      ]
    },
    {
      id: 2,
      title: '你使用数字设备主要用于哪些场景？（可多选）',
      type: 'multiple',
      questionType: 'design',
      answer: '',
      options: [
        '学习',
        '娱乐',
        '交流',
        '旅游'
      ]
    },
    {
      id: 3,
      title: '你使用数字设备主要用于哪些场景？（可多选）',
      type: 'multiple',
      questionType: 'design',
      answer: '',
      options: [
        '学习',
        '运动',
        '娱乐',
        '交流',
        '旅游',
        '其他_______'
      ]
    }
  ]
}

// ==================== 统一活动状态管理 ====================
export const useActivity = defineStore('activity', () => {

  // 问卷数据（响应式）
  const questionnaire = ref<Questionnaire>(JSON.parse(JSON.stringify(questionnaireInitialData)))

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

  // Activity 2.1 - 学生题目选择
  const ac2_1_stuSelectResult = ref<Activity2_1_selectResult | null>({
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
        criteria: '2.能够为"使用影响"选择合适的调查问题，并讨论了理由。',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  // Activity 2.2 - 学生题目设计
  const ac2_2_stuDesignResult = ref<Activity2_2_designResult | null>({
    designQuestion: null,  // 单个题目
    rating: [
      {
        index: 1,
        criteria: '1.能够独立设计题目，并完成上传。（3星）',
        score: 0,
      },
      {
        index: 2,
        criteria: '2.能够通过与智能体对话完成题目设计。（2星）',
        score: 0,
      },
      {
        index: 3,
        criteria: '3.能够在智能体推送的题目中选择合适的题目（1星）',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  // Activity 4 - 数据获取方式
  const ac4_stuResult = ref<Activity4Result>({
    selections: {
      check_vision: '',
      register_vision: '',
      bad_habits: '',
      usage_duration: '',
      common_devices: '',
      survey_all_devices: ''
    },
    hasSubmittedAll: false,
    rating: [
      {
        index: 1,
        criteria: '1.能够正确分类至少4个场景。',
        score: 0,
      },
      {
        index: 2,
        criteria: '2.能够正确分类所有6个场景。',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  const reset = () => {
    // 重置问卷
    questionnaire.value = JSON.parse(JSON.stringify(questionnaireInitialData))
    
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
    ac2_1_stuSelectResult.value = {
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
          criteria: '2.能够为"使用影响"选择合适的调查问题，并讨论了理由。',
          score: 0,
        }
      ],
      submittedAt: 0
    }
    ac2_2_stuDesignResult.value = {
      designQuestion: null,  // 单个题目
      rating: [
        {
          index: 1,
          criteria: '1.能够独立设计题目，并完成上传。（3星）',
          score: 0,
        },
        {
          index: 2,
          criteria: '2.能够通过与智能体对话完成题目设计。（2星）',
          score: 0,
        },
        {
          index: 3,
          criteria: '3.能够在智能体推送的题目中选择合适的题目（1星）',
          score: 0,
        }
      ],
      submittedAt: 0
    }
    ac4_stuResult.value = {
      selections: {
        check_vision: '',
        register_vision: '',
        bad_habits: '',
        usage_duration: '',
        common_devices: '',
        survey_all_devices: ''
      },
      hasSubmittedAll: false,
      rating: [
        {
          index: 1,
          criteria: '1.能够正确分类至少4个场景。',
          score: 0,
        },
        {
          index: 2,
          criteria: '2.能够正确分类所有6个场景。',
          score: 0,
        }
      ],
      submittedAt: 0
    }
  }
  
  return {
    // 问卷
    questionnaire,
    
    // Activity 0
    ac0_voteResult,
    ac0_photo,
    
    // Activity 1
    ac1_stuResult,
    ac1_allResult,

    // Activity 2
    ac2_1_stuSelectResult,
    ac2_2_stuDesignResult,

    // Activity 4
    ac4_stuResult,

    reset
  }
}, {
  persist: true
})
