<template>
  <div class="question-bank-card">
    <!-- 卡片标题 -->
    <h2 class="card-header-title">题库</h2>
    
    <!-- 使用时长题库 -->
    <div class="bank-section">
      <h3 class="bank-section-title">使用时长</h3>
      <div class="bank-title">请选择1个最合适的问题，并讨论理由。</div>
      
      <div class="question-list">        
        <div 
          v-for="question in durationQuestions" 
          :key="question.id"
          class="question-item"
          :class="{ 'selected': selectedDurationId === question.id }"
          @click="selectDurationQuestion(question.id, $event)"
        >
          <div class="question-header">
            <span class="question-checkbox" :class="{ 'checked': selectedDurationId === question.id }"></span>
            <span class="question-title">{{ question.title }}</span>
          </div>
          
          <div v-if="question.options && question.options.length > 0" class="question-options">
            <div 
              v-for="(opt, idx) in question.options" 
              :key="idx" 
              class="option-text"
              :data-option-label="String.fromCharCode(65 + idx)"
            >
              {{ opt }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="section-divider"></div>

    <!-- 设备类型题库 -->
    <div class="bank-section">
      <h3 class="bank-section-title">设备类型</h3>
      <div class="bank-title">请选择1个最合适的问题，并讨论理由。</div>
      
      <div class="question-list">        
        <div 
          v-for="question in typeQuestions" 
          :key="question.id"
          class="question-item"
          :class="{ 'selected': selectedTypeId === question.id }"
          @click="selectTypeQuestion(question.id, $event)"
        >
          <div class="question-header">
            <span class="question-checkbox" :class="{ 'checked': selectedTypeId === question.id }"></span>
            <span class="question-title">{{ question.title }}</span>
          </div>
          
          <div v-if="question.options && question.options.length > 0" class="question-options">
            <div 
              v-for="(opt, idx) in question.options" 
              :key="idx" 
              class="option-text"
              :data-option-label="String.fromCharCode(65 + idx)"
            >
              {{ opt }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useActivity } from '@/store/activity'
import type { QuestionOption } from '@/store/activity'

const activity = useActivity()

// 使用时长题库数据
const durationQuestions: QuestionOption[] = [
  {
    id: 1,
    title: '你每周使用数字设备的大概时间是 _________。',
    type: 'fill',
    questionType: 'duration',
    answer: '',
    visibility: 'both',
    limit: -2  // 只能填入数字
  },
  {
    id: 2,
    title: '你每周使用数字设备的大概时间是 _________。（单位：分钟）',
    type: 'fill',
    questionType: 'duration',
    answer: '',
    visibility: 'both',
    limit: -2  // 只能填入数字
  }
]

// 设备类型题库数据
const typeQuestions: QuestionOption[] = [
  {
    id: 1,
    title: '你最常使用哪种数字设备？',
    options: ['手机', '平板'],
    type: 'single',
    questionType: 'type',
    answer: '',
    visibility: 'both',
    limit: 1
  },
  {
    id: 2,
    title: '你最常使用哪种数字设备？',
    options: ['电视', '电脑'],
    type: 'single',
    questionType: 'type',
    answer: '',
    visibility: 'both',
    limit: 1
  },
  {
    id: 3,
    title: '你最常使用哪种数字设备？（多选题，最多选3个）',
    options: ['电话手表', '手机', '平板', '电视', '电脑', '其他___'],
    type: 'multiple',
    questionType: 'type',
    answer: '',
    visibility: 'both',
    limit: 3
  },
  // {
  //   id: 4,
  //   title: '我认为以上题目都不合适。',
  //   type: 'single',
  //   questionType: 'type',
  //   answer: '',
  //   visibility: 'both'
  // }
]

// 当前选中的使用时长题目ID
const selectedDurationId = computed(() => {
  return activity.ac2_stuResult?.selectedDurationQuestion ?? null
})

// 当前选中的设备类型题目ID
const selectedTypeId = computed(() => {
  return activity.ac2_stuResult?.selectedImpactQuestion ?? null
})

// 创建飞行动画
const createFlyAnimation = (event: MouseEvent, questionTitle: string) => {
  // 获取点击元素的位置
  const sourceEl = (event.currentTarget as HTMLElement)
  const sourceRect = sourceEl.getBoundingClientRect()
  
  // 获取目标位置（右侧预览区域）
  const targetEl = document.querySelector('.student-questions-area')
  if (!targetEl) return
  const targetRect = targetEl.getBoundingClientRect()
  
  // 创建飞行元素
  const flyEl = document.createElement('div')
  flyEl.className = 'flying-question'
  flyEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 0 12px;">
      <span style="width: 18px; height: 18px; border: 2px solid #0ea5e9; background: #0ea5e9; border-radius: 4px; flex-shrink: 0; position: relative; display: inline-block;">
        <svg style="position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;" viewBox="0 0 14 14">
          <path d="M2 7L5.5 10.5L12 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span style="flex: 1; color: #1f2937; font-size: 15px;">${questionTitle}</span>
    </div>
  `
  flyEl.style.cssText = `
    position: fixed;
    left: ${sourceRect.left}px;
    top: ${sourceRect.top}px;
    width: ${sourceRect.width}px;
    padding: 12px 0;
    background: white;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    border-bottom: 1px dashed #e5e7eb;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `
  document.body.appendChild(flyEl)
  
  // 强制重排以确保初始位置生效
  flyEl.offsetHeight
  
  // 设置目标位置
  flyEl.style.left = `${targetRect.left + targetRect.width / 2 - sourceRect.width / 2}px`
  flyEl.style.top = `${targetRect.top + 50}px`
  flyEl.style.transform = 'scale(0.9)'
  flyEl.style.opacity = '0.3'
  
  // 动画结束后移除元素
  setTimeout(() => {
    flyEl.remove()
  }, 1000)
}

// 选择使用时长题目
const selectDurationQuestion = (id: number, event?: MouseEvent) => {
  if (!activity.ac2_stuResult) return
  
  const selectedQ = durationQuestions.find(q => q.id === id)
  if (!selectedQ) return
  
  // 执行飞行动画
  if (event) {
    createFlyAnimation(event, selectedQ.title.substring(0, 20) + '...')
  }
  
  // 延迟更新数据，让飞行动画先执行
  setTimeout(() => {
    activity.ac2_stuResult!.selectedDurationQuestion = id
    
    const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 3)
    const newQuestion: QuestionOption = {
      ...selectedQ,
      id: 3,
      visibility: selectedQ.visibility || 'both'
    }
    
    if (existingIndex !== -1) {
      activity.questionnaire.questions[existingIndex] = newQuestion
    } else {
      activity.questionnaire.questions.push(newQuestion)
    }
  }, 500)
}

// 选择设备类型题目
const selectTypeQuestion = (id: number, event?: MouseEvent) => {
  if (!activity.ac2_stuResult) return
  
  const selectedQ = typeQuestions.find(q => q.id === id)
  if (!selectedQ) return
  
  const isNotSuitableOption = selectedQ.title === '我认为以上题目都不合适。'
  
  // 执行飞行动画（除非是"不合适"选项）
  if (event && !isNotSuitableOption) {
    createFlyAnimation(event, selectedQ.title.substring(0, 20) + '...')
  }
  
  // 延迟更新数据
  setTimeout(() => {
    activity.ac2_stuResult!.selectedImpactQuestion = id
    
    if (isNotSuitableOption) {
      const index = activity.questionnaire.questions.findIndex(q => q.id === 4)
      if (index !== -1) {
        activity.questionnaire.questions.splice(index, 1)
      }
    } else {
      const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 4)
      const newQuestion: QuestionOption = {
        ...selectedQ,
        id: 4,
        visibility: selectedQ.visibility || 'both'
      }
      
      if (existingIndex !== -1) {
        activity.questionnaire.questions[existingIndex] = newQuestion
      } else {
        activity.questionnaire.questions.push(newQuestion)
      }
    }
  }, isNotSuitableOption ? 0 : 500)
}
</script>

<style scoped>
.question-bank-card {
  background: #fdfbf7;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

/* 卡片标题 */
.card-header-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.bank-section {
  display: flex;
  flex-direction: column;
}

/* 题库区域标题 */
.bank-section-title {
  font-size: 20px;
  font-weight: 600;
  color: #0ea5e9;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

/* 分隔线 */
.section-divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #e5e7eb 10%, #e5e7eb 90%, transparent);
  margin: 24px 0;
}

/* 卡片标题 */
.bank-title {
  font-size: 18px;
  font-weight: 800;
  color: #000000;
  margin-bottom: 10px;
  line-height: 1.4;
}

/* 题目项样式 - 参考问卷预览 */
.question-item {
  position: relative;
  padding: 12px 0;
  border-bottom: 1px dashed #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background: #f9fafb;
}

/* 题目头部 */
.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/* 方形复选框 */
.question-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #9ca3af;
  border-radius: 4px;
  flex-shrink: 0;
  background: white;
  transition: all 0.2s ease;
  position: relative;
}

/* 选中状态 */
.question-checkbox.checked {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

/* 选中后的勾选标记 */
.question-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.question-title {
  flex: 1;
  font-size: 15px;
  color: #1f2937;
  line-height: 1.5;
}

/* 选项区域 - 横向自然排列 */
.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding-left: 30px;
}

.option-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
}

.option-text::before {
  content: attr(data-option-label) ".";
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

/* 滚动条 */
.question-list::-webkit-scrollbar {
  width: 6px;
}

.question-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 高亮脉冲动画 */
.question-bank-card.highlight-pulse {
  animation: highlightPulse 2s ease;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0);
    border-color: #e5e7eb;
  }
  25% {
    box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.3);
    border-color: #0ea5e9;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
    border-color: #7dd3fc;
  }
  75% {
    box-shadow: 0 0 0 8px rgba(14, 165, 233, 0.3);
    border-color: #0ea5e9;
  }
}
</style>



