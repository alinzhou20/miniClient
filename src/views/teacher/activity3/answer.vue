<template>
  <!-- 学生设计题目列表 - 粘性卡片 -->
  <div class="design-list-container">
    <div class="design-list-header">
      <h3 class="design-list-title">📝 学生设计的题目</h3>
      <span class="design-count">{{ studentDesignCount }}个</span>
    </div>
    
    <div v-if="studentDesignCount > 0" class="design-items">
      <div 
        v-for="design in sortedDesignResults" 
        :key="design.groupNo"
        class="design-item-card"
        :class="{ 
          'no-question': !design.designQuestion,
          'selected': selectedDesignGroupNo === design.groupNo
        }"
        @click="design.designQuestion && handleDesignClick(design)"
      >
        <div class="design-item-header">
          <span class="like-info">👍 {{ design.great || 0 }}</span>
          <span v-if="design.designQuestion" class="question-type" :class="design.taskType">
            {{ design.taskType === 'challenge' ? '2星' : design.taskType === 'basic' ? '1星' : '' }} · {{ getQuestionTypeText(design.designQuestion.type) }}
          </span>
          <span class="design-time">{{ formatTime(design.submittedAt) }}</span>
        </div>
        
        <div v-if="design.designQuestion" class="question-content">
          <div class="question-title-row">
            <span class="question-label">题目：</span>
            <span class="question-title-text">{{ design.designQuestion.title }}</span>
          </div>
          
          <div v-if="design.designQuestion.options && design.designQuestion.options.length > 0" class="question-options-list">
            <div 
              v-for="(option, idx) in design.designQuestion.options" 
              :key="idx"
              class="option-text-item"
            >
              {{ String.fromCharCode(65 + idx) }}. {{ option }}
            </div>
          </div>
        </div>
        
        <div v-else class="no-design">
          <span>暂未设计题目</span>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-design">
      <div class="empty-icon">📭</div>
      <p>暂无学生设计的题目</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useActivity } from '@/store/activity'

// 定义 emits
const emit = defineEmits<{
  (e: 'add-question', question: any): void
}>()

const activity = useActivity()

// 当前选中的设计
const selectedDesignGroupNo = ref<string | null>(null)

// 学生设计题目数量
const studentDesignCount = computed(() => {
  return sortedDesignResults.value.length
})

// 排序后的设计结果（按提交时间排序，已在提交时去重）
const sortedDesignResults = computed(() => {
  const allDesigns: any[] = []
  
  // 收集所有有效的设计
  Object.entries(activity.ac3_allResult).forEach(([groupNo, result]: [string, any]) => {
    if (result?.designQuestion && result.submittedAt > 0) {
      // 根据rating或challengeLevel判断任务类型
      let taskType = ''
      
      // 优先使用challengeLevel判断
      if (result.challengeLevel) {
        if (result.challengeLevel === 'two') {
          taskType = 'challenge' // 2星难度
        } else if (result.challengeLevel === 'one') {
          taskType = 'basic' // 1星难度
        }
      } 
      // 如果没有challengeLevel，使用rating判断
      else if (result.rating) {
        const challengeItem = result.rating.find((r: any) => r.index === 1 && r.score === 2)
        const basicItem = result.rating.find((r: any) => r.index === 2 && r.score === 1)
        
        if (challengeItem) {
          taskType = 'challenge' // 挑战任务
        } else if (basicItem) {
          taskType = 'basic' // 基础任务
        }
      }
      
      allDesigns.push({
        groupNo,
        ...result,
        taskType
      })
    }
  })
  
  // 智能排序：优先点赞数，其次难度，最后时间
  allDesigns.sort((a, b) => {
    // 1. 优先按点赞数降序（多的在前）
    const likesDiff = (b.great || 0) - (a.great || 0)
    if (likesDiff !== 0) return likesDiff
    
    // 2. 点赞数相同，按难度排序（2星在前，1星在后）
    const aIs2Star = a.taskType === 'challenge' ? 1 : 0
    const bIs2Star = b.taskType === 'challenge' ? 1 : 0
    const starDiff = bIs2Star - aIs2Star
    if (starDiff !== 0) return starDiff
    
    // 3. 都相同时，按提交时间排序（早提交的在前）
    return (a.submittedAt || 0) - (b.submittedAt || 0)
  })
  
  return allDesigns
})

// 格式化时间
function formatTime(timestamp: number): string {
  if (!timestamp) return '未知'
  
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 获取题目类型文本
function getQuestionTypeText(type: 'fill' | 'single' | 'multiple'): string {
  const typeMap = {
    'fill': '填空题',
    'single': '单选题',
    'multiple': '多选题'
  }
  return typeMap[type] || '未知'
}

// 处理设计卡片点击
function handleDesignClick(design: any) {
  if (!design.designQuestion) return
  
  // 设置选中状态
  selectedDesignGroupNo.value = design.groupNo
  
  // 触发事件，让父组件添加题目到问卷
  emit('add-question', design.designQuestion)
}
</script>

<style scoped>
/* 学生设计题目列表 - 粘性卡片 */
.design-list-container {
  position: sticky;
  top: 20px;
  height: 640px;  /* 固定高度，与学生端保持一致 */
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

/* 滚动条样式 */
.design-list-container::-webkit-scrollbar {
  width: 6px;
}

.design-list-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.design-list-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.design-list-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.design-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 3px solid #f3f4f6;
}

.design-list-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.design-count {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 12px;
}

.design-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.design-item-card {
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.design-item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  background: #f7faff;
}

.design-item-card.no-question {
  cursor: default;
  opacity: 0.6;
}

.design-item-card.no-question:hover {
  border-color: #e5e7eb;
  box-shadow: none;
  background: #fafafa;
}

.design-item-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.design-item-card.selected:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.design-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: space-between;
}

.like-info {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  color: #92400e;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.question-type {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}

.question-type.challenge {
  background: #fef3c7;
  color: #92400e;
}

.question-type.basic {
  background: #dbeafe;
  color: #1e40af;
}

.design-time {
  font-size: 11px;
  color: #6b7280;
  flex-shrink: 0;
  margin-left: auto;
}

.question-content {
  margin-bottom: 12px;
}

.question-title-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.question-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.question-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
}

.question-options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.option-text-item {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.no-design {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.empty-design {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-design p {
  margin: 0;
  font-size: 14px;
  font-style: italic;
}
</style>

