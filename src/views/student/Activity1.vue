<template>
  <div class="page">
    <!-- 活动说明 -->
    <div class="activity-description">
      <strong>拖拽匹配活动</strong><br>
      请将上方的情境卡片拖拽到下方对应的数据获取方式框中
    </div>

    <!-- 主要内容区域：上方情境，下方选项 -->
    <div class="main-content">
      <!-- 上方：可拖拽的情境卡片 -->
      <div class="scenarios-container">
        <h3 class="section-title">📋 情境卡片</h3>
        <div class="scenarios-grid">
          <div 
            v-for="(question, index) in questions" 
            :key="question.id"
            class="scenario-card"
            :class="{ 
              'is-dragging': draggingItem === question.id,
              'is-placed': isQuestionAnswered(question.id)
            }"
            draggable="true"
            @dragstart="onDragStart($event, question.id)"
            @dragend="onDragEnd"
          >
            <div class="scenario-number">情景{{ getQuestionNumber(index) }}</div>
            <div class="scenario-image">
              <img :src="question.image" :alt="question.title" />
            </div>
            <div class="scenario-title">{{ question.title }}</div>
          </div>
        </div>
      </div>

      <!-- 下方：拖放目标选项框 -->
      <div class="options-container">
        <h3 class="section-title">🎯 数据获取方式</h3>
        <div class="options-grid">
          <div 
            v-for="option in options" 
            :key="option.id"
            class="option-dropzone"
            :class="{ 
              'drag-over': dragOverTarget === option.id,
              'has-answer': getQuestionsForOption(option.id).length > 0
            }"
            @dragover.prevent="onDragOver($event, option.id)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, option.id)"
          >
            <div class="option-header">
              <span class="option-label">{{ option.label }}</span>
            </div>
            
            <!-- 显示所有放置的情境 -->
            <div v-if="getQuestionsForOption(option.id).length > 0" class="placed-scenarios">
              <div 
                v-for="questionId in getQuestionsForOption(option.id)" 
                :key="questionId"
                class="placed-scenario"
              >
                <div class="placed-scenario-number">
                  情景{{ getQuestionNumber(questions.findIndex(q => q.id === questionId)) }}
                </div>
                <div class="placed-scenario-title">
                  {{ questions.find(q => q.id === questionId)?.title }}
                </div>
                <button 
                  class="remove-btn" 
                  @click="removeAnswer(option.id, questionId)"
                  :disabled="hasSubmitted"
                  title="移除"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <!-- 空状态提示 -->
            <div v-else class="drop-hint">
              拖拽情境至此
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { socketService } from '@/services/socket'
import { ElMessage } from 'element-plus'

// 选项定义
type AnswerId = 'A' | 'B' | 'C' | 'D'
type QuestionId = 'q1' | 'q2' | 'q3' | 'q4'

const options = [
  { id: 'A' as AnswerId, label: '现场记录' },
  { id: 'B' as AnswerId, label: '问卷调查' },
  { id: 'C' as AnswerId, label: '网络获取' },
  { id: 'D' as AnswerId, label: '设备采集' }
]

// 4个情景题定义
const questions = [
  {
    id: 'q1' as QuestionId,
    title: '在学校组织的体检中，医生应如何准确获取学生的肺活量数据？',
    image: '/src/public/activity1_q1.png'
  },
  {
    id: 'q2' as QuestionId,
    title: '小明希望了解未来几天的天气状况，他应如何快速有效获取相关的天气数据？',
    image: '/src/public/activity1_q2.png'
  },
  {
    id: 'q3' as QuestionId,
    title: '科学课上，每个小组需要记录蚕宝宝的生长情况，如何获取相关数据？',
    image: '/src/public/activity1_q3.png'
  },
  {
    id: 'q4' as QuestionId,
    title: '为改进学校午餐的口味，校方应如何快速全面获取全校师生对饭菜喜爱程度的数据？',
    image: '/src/public/activity1_q4.png'
  }
]

// 学生答案状态 - 新数据结构：每个选项包含多个问题ID
const answers = ref<Record<AnswerId, QuestionId[]>>({
  A: [],
  B: [],
  C: [],
  D: []
})

const hasSubmitted = ref(false)

// 拖拽状态
const draggingItem = ref<QuestionId | null>(null)
const dragOverTarget = ref<AnswerId | null>(null)

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

// 计算属性
const completedCount = computed(() => {
  // 计算已放置的问题总数
  return Object.values(answers.value).reduce((total, questionIds) => total + questionIds.length, 0)
})

// canSubmit 已不再需要，因为改为自动提交

// 辅助函数：检查问题是否已回答
const isQuestionAnswered = (questionId: QuestionId) => {
  return Object.values(answers.value).some(questionIds => questionIds.includes(questionId))
}

// 辅助函数：根据选项获取对应的问题ID数组
const getQuestionsForOption = (optionId: AnswerId) => {
  return answers.value[optionId] || []
}

const getQuestionNumber = (index: number) => {
  const numbers = ['一', '二', '三', '四']
  return numbers[index] || (index + 1)
}

// 本地存储相关
const getStorageKey = () => {
  const g = groupNo.value
  const s = studentNo.value
  return g && s ? `activity1_questions_${g}_${s}` : null
}

// 保存到本地存储
const saveToLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  const data = {
    answers: answers.value,
    hasSubmitted: hasSubmitted.value,
    timestamp: Date.now()
  }
  localStorage.setItem(key, JSON.stringify(data))
}

// 从本地存储恢复
const loadFromLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      answers.value = { ...answers.value, ...data.answers }
      hasSubmitted.value = data.hasSubmitted || false
      console.log('Activity1 问答数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity1本地数据失败:', error)
  }
}

// clearLocalStorage 函数已移除，因为不再需要重置功能

// 拖拽事件处理函数
const onDragStart = (event: DragEvent, questionId: QuestionId) => {
  if (hasSubmitted.value) return
  draggingItem.value = questionId
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('text/plain', questionId)
}

const onDragEnd = () => {
  draggingItem.value = null
  dragOverTarget.value = null
}

const onDragOver = (_event: DragEvent, optionId: AnswerId) => {
  if (hasSubmitted.value) return
  dragOverTarget.value = optionId
}

const onDragLeave = () => {
  dragOverTarget.value = null
}

const onDrop = (event: DragEvent, optionId: AnswerId) => {
  if (hasSubmitted.value) return
  
  event.preventDefault()
  const questionId = event.dataTransfer!.getData('text/plain') as QuestionId
  
  if (!questionId || !draggingItem.value) return
  
  // 先从所有选项中移除该问题（如果存在）
  Object.keys(answers.value).forEach(key => {
    const optKey = key as AnswerId
    const index = answers.value[optKey].indexOf(questionId)
    if (index > -1) {
      answers.value[optKey].splice(index, 1)
    }
  })
  
  // 添加到新选项中
  if (!answers.value[optionId].includes(questionId)) {
    answers.value[optionId].push(questionId)
  }
  
  // 重置拖拽状态
  draggingItem.value = null
  dragOverTarget.value = null
  
  saveToLocalStorage()
}

// 移除答案
const removeAnswer = (optionId: AnswerId, questionId: QuestionId) => {
  if (hasSubmitted.value) return
  
  const index = answers.value[optionId].indexOf(questionId)
  if (index > -1) {
    answers.value[optionId].splice(index, 1)
    saveToLocalStorage()
  }
}

// 注：原有的onAnswerChange已被拖拽逻辑替代

const onSubmit = async () => {
  if (hasSubmitted.value || completedCount.value !== 4) return
  
  const g = groupNo.value
  const s = studentNo.value
  if (!g || !s) {
    ElMessage.error('用户信息不完整，无法提交')
    return
  }
  
  try {
    // 将新的数据结构转换为提交格式
    const submitAnswers: Record<QuestionId, AnswerId | ''> = { q1: '', q2: '', q3: '', q4: '' }
    Object.entries(answers.value).forEach(([optionId, questionIds]) => {
      questionIds.forEach((questionId: QuestionId) => {
        submitAnswers[questionId] = optionId as AnswerId
      })
    })
    
    const payload = {
      type: 'activity1_question',
      from: { groupNo: g, studentNo: s },
      data: { answers: submitAnswers },
      at: Date.now()
    }
    
    const ack = await socketService.submit(payload as any)
    if (ack.code !== 200) {
      throw new Error(ack.message || '提交失败')
    }
    
    hasSubmitted.value = true
    saveToLocalStorage()
    ElMessage.success('答案提交成功！')
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败，请重试')
  }
}

// onReset 函数已移除，因为不再需要重置按钮

// 监听answers变化，自动保存到本地存储
watch(answers, () => {
  saveToLocalStorage()
}, { deep: true })

// 监听完成度变化，自动提交
watch(completedCount, (newCount) => {
  if (newCount === 4 && !hasSubmitted.value) {
    // 延时一点点以确保用户看到最后一次拖拽的视觉反馈
    setTimeout(() => {
      onSubmit()
    }, 500)
  }
})

// 组件挂载时恢复数据
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 活动说明区域 */
.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.activity-icon {
  font-size: 24px;
}
.activity-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}
.activity-description {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.6;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 20px;
}

/* 情境容器 */
.scenarios-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 情境卡片样式 */
.scenario-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.scenario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.scenario-card.is-dragging {
  opacity: 0.6;
  transform: rotate(5deg);
  cursor: grabbing;
}

.scenario-card.is-placed {
  opacity: 0.7;
  background: #f3f4f6;
  border-color: #10b981;
}

.scenario-number {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 8px;
}

.scenario-image {
  width: 100%;
  height: 120px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.scenario-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.scenario-title {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drag-hint {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  font-style: italic;
}

/* 选项容器 */
.options-container {
  background: #fef7ed;
  border: 1px solid #fed7aa;
  border-radius: 16px;
  padding: 24px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 拖放目标区域 */
.option-dropzone {
  background: white;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 16px;
  min-height: 160px;
  transition: all 0.2s ease;
  position: relative;
}

.option-dropzone.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
}

.option-dropzone.has-answer {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

.option-header {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: block;
}

/* 已放置的情境容器 */
.placed-scenarios {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 已放置的情境显示 */
.placed-scenario {
  position: relative;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
}

.placed-scenario-number {
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  margin-bottom: 4px;
}

.placed-scenario-title {
  font-size: 11px;
  color: #374151;
  line-height: 1.3;
  padding-right: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.remove-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* 空状态提示 */
.drop-hint {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  font-size: 14px;
  padding: 40px 20px;
}


/* 响应式设计 */
@media (max-width: 1024px) {
  .scenarios-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .main-content {
    gap: 24px;
  }
  
  .scenarios-grid {
    grid-template-columns: 1fr;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .scenario-image {
    height: 100px;
  }
  
  .option-dropzone {
    min-height: 120px;
  }
}
</style>
