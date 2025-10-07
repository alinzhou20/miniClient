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
  answer?: any
  visibility?: 'teacher' | 'student' | 'both' // 可见性：仅教师、仅学生、都可见
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
  great: number
  submittedAt: number
}

// ==================== Activity 3 - 问卷填写 ====================
// 问卷答案（学生提交的完整问卷）
export interface QuestionnaireAnswer {
  groupNo: string
  studentNo: string
  studentRole: string
  questions: QuestionOption[]  // 包含答案的完整问卷题目
  submittedAt: number
}

// Activity 3 - 学生问卷提交结果（包含评价）
export interface Activity3Result {
  rating: Rating[]
  submittedAt: number
}

// ==================== Activity 4 - 数据获取方式 ====================
export type BoxId = 'A' | 'B' | 'C' | 'D'
export type ElementId =
  | 'get_viewpoints'      // 获取正反方观点
  | 'ai_organize'         // 借助智能体梳理理由
  | 'get_group_reasons'   // 获取各小组理由
  | 'survey_devices'      // 获取学生数字设备使用情况

export interface Activity4Result {
  selections: Record<ElementId, BoxId[]>  // 每个场景可以有多个分类
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
    answer: '',
    visibility: 'teacher'
  },{
    id: 2,
    title: '你的性别',
    options: ['男', '女'],
    type: 'single',
    questionType: 'gender',
    answer: '',
    visibility: 'teacher'
  }]
}

export const questionnaireSecondData: Questionnaire = {
  title: '学生数字设备使用情况调查问卷',
  description: '为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建议，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。',
  questions: [{
    id: 1,
    title: '就读年级',
    options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
    type: 'single',
    questionType: 'grade',
    answer: '',
    visibility: 'teacher'
  },{
    id: 2,
    title: '你的性别',
    options: ['男', '女'],
    type: 'single',
    questionType: 'gender',
    answer: '',
    visibility: 'teacher'
  },{
    id: 3,
    title: '你每周使用数字设备的大概时间是_____。若没有，则填0（单位：分钟）',
    type: 'fill',
    questionType: 'duration',
    answer: '',
    visibility: 'both'
  }, {
    id: 4,
    title: '在你的学习、生活中，数字设备带来的最主要的三个影响是什么？',
    options: [
      '提升学习效率',
      '方便线上沟通',
      '方便获取更多信息',
      '游戏成瘾',
      '作业依赖“搜题”',
      '作息不规律',
      '影响视力',   
      '其他___',
  ],
    type: 'multiple',
    questionType: 'impact',
    answer: '',
    visibility: 'both'
  },]
}


// 题库数据
export const bank: QuestionBank = {
  durationQuestions: [
    {
      id: 1,
      title: '你每周使用数字设备的大概时间是_____。',
      type: 'fill',
      questionType: 'duration',
      answer: '',
      visibility: 'both'
    },
    {
      id: 2,
      title: '你每周使用数字设备的大概时间是_____。若没有，则填0（单位：分钟）',
      type: 'fill',
      questionType: 'duration',
      answer: '',
      visibility: 'both'
    }
  ],
  impactQuestions: [
    {
      id: 1,
      title: '在你的学习、生活中，数字设备带来的最主要的三个影响是什么？',
      options: [
        '快速获取学习资料',
        '便捷分享生活动态（如照片、视频）',
        '提供多样化娱乐选择（游戏、短视频等）'
      ],
      type: 'multiple',
      questionType: 'impact',
      answer: '',
      visibility: 'both'
    },
    {
      id: 2,
      title: '在你的学习、生活中，数字设备带来的最主要的三个影响是什么？',
      options: [
        '作业时更依赖即时搜索而非独立思考',
        '减少面对面交流时间',
        '影响夜间睡眠质量'
      ],
      type: 'multiple',
      questionType: 'impact',
      answer: '',
      visibility: 'both'
    },
    {
      id: 3,
      title: '在你的学习、生活中，数字设备带来的最主要的三个影响是什么？',
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
      answer: '',
      visibility: 'both'
    },
    {
      id: 4,
      title: '我认为以上题目都不合适。',
      type: 'fill',
      questionType: 'impact',
      answer: '',
      visibility: 'both'
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
      ],
      visibility: 'both'
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
      ],
      visibility: 'both'
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
      ],
      visibility: 'both'
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
  
  // Activity 1 - 提炼后的观点集合
  const ac1_allReason = ref<{
    A: string[]
    B: string[]
  }>({
    A: [],
    B: []
  })
  
  // Activity 1 - 教师接收提交结果（包含测试数据：12组，正方7组，反方5组）
  const ac1_allResult_test = ref<Record<string, Activity1Result>>({
    // 正方第1组
    '1': {
      viewpoint: 'A',
      point: {
        1: '数字设备可以快速获取学习资料，提高学习效率',
        2: '在线教育平台提供了丰富的学习资源和互动工具'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 660000
    },
    // 反方第1组
    '2': {
      viewpoint: 'B',
      point: {
        1: '长时间使用数字设备会影响视力健康',
        2: '容易沉迷于游戏和短视频，影响学习专注力'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 640000
    },
    // 正方第2组
    '3': {
      viewpoint: 'A',
      point: {
        1: '数字设备便于与老师和同学进行远程沟通交流',
        2: '可以使用各种学习APP进行自主学习和练习'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 620000
    },
    // 反方第2组
    '4': {
      viewpoint: 'B',
      point: {
        1: '过度依赖数字设备会削弱独立思考能力',
        2: '减少了户外活动和面对面交流的时间'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 600000
    },
    // 正方第3组
    '5': {
      viewpoint: 'A',
      point: {
        1: '数字设备支持多媒体学习，更容易理解抽象概念',
        2: '可以记录学习笔记，方便复习和分享'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 580000
    },
    // 反方第3组
    '6': {
      viewpoint: 'B',
      point: {
        1: '夜间使用电子屏幕会影响睡眠质量',
        2: '网络信息良莠不齐，容易接触不良内容'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 560000
    },
    // 正方第4组
    '7': {
      viewpoint: 'A',
      point: {
        1: '数字设备提供了个性化的学习方案和智能辅导',
        2: '可以随时随地学习，突破时间和空间限制'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 540000
    },
    // 反方第4组
    '8': {
      viewpoint: 'B',
      point: {
        1: '容易形成拖延习惯，总想着先玩一会儿再学习',
        2: '长时间低头看屏幕会导致颈椎和腰椎问题'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 520000
    },
    // 正方第5组
    '9': {
      viewpoint: 'A',
      point: {
        1: '数字设备让学习变得更有趣，提高学习积极性',
        2: '可以通过在线课程学习课外知识，拓展视野'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 500000
    },
    // 反方第5组
    '10': {
      viewpoint: 'B',
      point: {
        1: '过多使用数字设备会影响书写能力和记忆力',
        2: '容易产生网络依赖，离开设备就感到焦虑'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 480000
    },
    // 正方第6组
    '11': {
      viewpoint: 'A',
      point: {
        1: '数字设备可以帮助记录学习进度，进行数据分析',
        2: '通过在线协作工具，可以更好地进行小组合作'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 460000
    },  
    // 正方第7组
    '12': {
      viewpoint: 'A',
      point: {
        1: '数字设备提供即时反馈，帮助我们及时纠正错误',
        2: '可以培养信息素养和数字化时代的必备技能'
      },
      rating: [{ index: 1, criteria: "1. 通过小组讨论，我们能够写出两条理由。", score: 1 }],
      submittedAt: Date.now() - 440000
    }
  })

  const ac1_allResult = ref<Record<string, Activity1Result>>({})
  
  // Activity 2.1 - 教师接收所有学生的选择结果
  const ac2_1_allSelectResult = ref<Record<string, Activity2_1_selectResult>>({})
  
  // Activity 2.2 - 教师接收所有学生的设计结果
  const ac2_2_allDesignResult = ref<Record<string, Activity2_2_designResult>>({})
  
  // Activity 3 - 教师接收学生的问卷答案
  const ac3_allQuestionnaireAnswer = ref<Record<string, QuestionnaireAnswer>>({})
    
  // Activity 4 - 教师接收所有分类结果
  const ac4_allResult = ref<Record<string, Activity4Result>>({})

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
        criteria: '1.能够独立设计题目，并完成上传。（2星）',
        score: 0,
      },
      {
        index: 2,
        criteria: '2.能够通过与智能体对话完成题目设计。（1星）',
        score: 0,
      },
    ],
    great: 0,
    submittedAt: 0
  })

  // Activity 3 - 学生问卷提交结果
  const ac3_stuResult = ref<Activity3Result | null>({
    rating: [
      {
        index: 1,
        criteria: '1.能够独立完成调查问卷并提交。',
        score: 0,
      }
    ],
    submittedAt: 0
  })

  // Activity 4 - 数据获取方式
  const ac4_stuResult = ref<Activity4Result>({
    selections: {
      get_viewpoints: [],
      ai_organize: [],
      get_group_reasons: [],
      survey_devices: []
    },
    hasSubmittedAll: false,
    rating: [
      {
        index: 1,
        criteria: '1.能够了解获取数据的常用方法。',
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
    ac1_allResult.value = {}
    ac2_1_allSelectResult.value = {}
    ac2_2_allDesignResult.value = {}
    ac3_allQuestionnaireAnswer.value = {}
    ac4_allResult.value = {}
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
          criteria: '1.能够独立设计题目，并完成上传。（2星）',
          score: 0,
        },
        {
          index: 2,
          criteria: '2.能够通过与智能体对话完成题目设计。（1星）',
          score: 0,
        },
      ],
      great: 0,
      submittedAt: 0
    }
    ac3_stuResult.value = {
      rating: [
        {
          index: 1,
          criteria: '1.能够独立完成调查问卷并提交。',
          score: 0,
        }
      ],
      submittedAt: 0
    }
    ac4_stuResult.value = {
      selections: {
        get_viewpoints: [],
        ai_organize: [],
        get_group_reasons: [],
        survey_devices: []
      },
      hasSubmittedAll: false,
      rating: [
        {
          index: 1,
          criteria: '1.能够了解获取数据的常用方法。',
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
    ac1_allReason,

    // Activity 2
    ac2_1_stuSelectResult,
    ac2_2_stuDesignResult,
    ac2_1_allSelectResult,
    ac2_2_allDesignResult,
    
    // Activity 3
    ac3_stuResult,
    ac3_allQuestionnaireAnswer,
    
    // Activity 4
    ac4_stuResult,
    ac4_allResult,

    reset
  }
}, {
  persist: true
})
