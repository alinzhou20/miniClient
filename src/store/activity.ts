/**
 * 活动状态管理 - 统一管理所有活动
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Buffer } from 'buffer'

// Activity0 - 现场投票
export const useActivity0 = defineStore('activity0', () => {
  
  const voteResult = ref<{
    result: 'A' | 'B'
    countA: number
    countB: number
    timestamp: number
  } | null>(null)

  const photo = ref<Buffer | null>(null)

  return {
    voteResult,
    photo
  }
})

// Activity1 - 快速投票
export type VoteChoice = 'A' | 'B' | 'C' | 'D'

export const useActivity1 = defineStore('activity1', () => {
  const voteStarted = ref(false)
  const hasVoted = ref(false)
  const voteChoice = ref<VoteChoice | null>(null)
  const voteResults = ref({ A: 0, B: 0, C: 0, D: 0 })

  const startVote = () => {
    voteStarted.value = true
    hasVoted.value = false
    voteChoice.value = null
  }

  const submitVote = (choice: VoteChoice) => {
    voteChoice.value = choice
    hasVoted.value = true
  }

  const addVote = (choice: VoteChoice) => {
    if (choice in voteResults.value) {
      voteResults.value[choice]++
    }
  }

  const reset = () => {
    voteStarted.value = false
    hasVoted.value = false
    voteChoice.value = null
    voteResults.value = { A: 0, B: 0, C: 0, D: 0 }
  }

  return {
    voteStarted,
    hasVoted,
    voteChoice,
    voteResults,
    startVote,
    submitVote,
    addVote,
    reset
  }
})

// Activity2 - AI学习助手
export type Viewpoint = 'A' | 'B'

export interface AITip {
  id: string
  viewpoint: Viewpoint
  text: string
  timestamp: number
}

export interface WordCloudItem {
  groupNo: string
  q1: string
  q2: string
}

export const useActivity2 = defineStore('activity2', () => {
  const selectedViewpoint = ref<Viewpoint | null>(null)
  const allTips = ref<AITip[]>([])
  const wordCloudData = ref<WordCloudItem[]>([])
  const uploadEnabled = ref(false)

  const setViewpoint = (viewpoint: Viewpoint) => {
    selectedViewpoint.value = viewpoint
  }

  const addTip = (tip: AITip) => {
    allTips.value.push(tip)
  }

  const addWordCloudItem = (item: WordCloudItem) => {
    const existingIndex = wordCloudData.value.findIndex(i => i.groupNo === item.groupNo)
    if (existingIndex >= 0) {
      wordCloudData.value[existingIndex] = item
    } else {
      wordCloudData.value.push(item)
    }
  }

  const toggleUpload = (enabled: boolean) => {
    uploadEnabled.value = enabled
  }

  const reset = () => {
    selectedViewpoint.value = null
    allTips.value = []
    wordCloudData.value = []
    uploadEnabled.value = false
  }

  return {
    selectedViewpoint,
    allTips,
    wordCloudData,
    uploadEnabled,
    setViewpoint,
    addTip,
    addWordCloudItem,
    toggleUpload,
    reset
  }
})

// Activity3 - 智能问题设计
export type QuestionType = 'single' | 'multi' | 'text'

export interface QuestionSingle {
  id: string
  type: 'single'
  text: string
  options: string[]
  createdAt: number
}

export interface QuestionMulti {
  id: string
  type: 'multi'
  text: string
  options: string[]
  createdAt: number
}

export interface QuestionText {
  id: string
  type: 'text'
  text: string
  createdAt: number
}

export type Question = QuestionSingle | QuestionMulti | QuestionText

export const useActivity3 = defineStore('activity3', () => {
  const designedQuestions = ref<Question[]>([])
  const designDirection = ref('')
  const receivedDesigns = ref<Array<{
    studentNo: string
    groupNo: string
    direction: string
    question: Question
    timestamp: number
  }>>([])

  const addQuestion = (question: Question) => {
    designedQuestions.value.push(question)
  }

  const setDirection = (direction: string) => {
    designDirection.value = direction
  }

  const clearQuestions = () => {
    designedQuestions.value = []
  }

  const addReceivedDesign = (design: {
    studentNo: string
    groupNo: string
    direction: string
    question: Question
    timestamp: number
  }) => {
    receivedDesigns.value.push(design)
  }

  const reset = () => {
    designedQuestions.value = []
    designDirection.value = ''
    receivedDesigns.value = []
  }

  return {
    designedQuestions,
    designDirection,
    receivedDesigns,
    addQuestion,
    setDirection,
    clearQuestions,
    addReceivedDesign,
    reset
  }
})
