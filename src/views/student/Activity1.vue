<template>
  <div class="page">
    <!-- 活动说明 -->
    <div class="activity-header">
      <div class="activity-icon">📋</div>
      <div class="activity-title">活动说明</div>
    </div>
    <div class="activity-description">
      请根据以下四个场景，为每个场景选择最合适的数据获取方式：
    </div>

    <!-- 4个情景题 -->
    <div class="questions-container">
      <div v-for="(question, index) in questions" :key="question.id" class="question-card">
        <div class="question-header">
          <span class="question-number">情景{{ getQuestionNumber(index) }}：</span>
          <span class="question-title">{{ question.title }}</span>
        </div>
        
        <div class="question-content">
          <div class="question-image">
            <img :src="question.image" :alt="question.title" />
          </div>
          
          <div class="question-options">
            <label 
              v-for="option in options" 
              :key="option.id" 
              class="option-item"
              :class="{ selected: answers[question.id] === option.id }"
            >
              <input 
                type="radio" 
                :name="question.id" 
                :value="option.id" 
                v-model="answers[question.id]"
                @change="onAnswerChange"
              />
              <span class="option-label">{{ option.id }}. {{ option.label }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交区域 -->
    <div class="submit-section">
      <div class="progress-info">
        <span class="progress-text">已完成：{{ completedCount }}/4 题</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (completedCount / 4 * 100) + '%' }"></div>
        </div>
      </div>
      
      <button 
        class="submit-btn" 
        :disabled="!canSubmit || hasSubmitted" 
        :class="{ success: hasSubmitted }"
        @click="onSubmit"
      >
        {{ hasSubmitted ? '✓ 已提交' : (canSubmit ? '提交答案' : `请完成剩余 ${4 - completedCount} 题`) }}
      </button>
      
      <button class="reset-btn" @click="onReset" :disabled="hasSubmitted">
        重置全部
      </button>
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

// 学生答案状态
const answers = ref<Record<QuestionId, AnswerId | ''>>({
  q1: '',
  q2: '',
  q3: '',
  q4: ''
})

const hasSubmitted = ref(false)

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

// 计算属性
const completedCount = computed(() => {
  return Object.values(answers.value).filter(answer => answer !== '').length
})

const canSubmit = computed(() => completedCount.value === 4)

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

// 清除本地存储
const clearLocalStorage = () => {
  const key = getStorageKey()
  if (key) {
    localStorage.removeItem(key)
  }
}

// 事件处理函数
const onAnswerChange = () => {
  saveToLocalStorage()
}

const onSubmit = async () => {
  if (!canSubmit.value || hasSubmitted.value) return
  
  const g = groupNo.value
  const s = studentNo.value
  if (!g || !s) {
    ElMessage.error('用户信息不完整，无法提交')
    return
  }
  
  try {
    const payload = {
      type: 'activity1_question',
      from: { groupNo: g, studentNo: s },
      data: { answers: answers.value },
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

const onReset = async () => {
  if (hasSubmitted.value) return
  
  const g = groupNo.value
  const s = studentNo.value
  
  // 本地重置
  answers.value = { q1: '', q2: '', q3: '', q4: '' }
  
  if (!g || !s) {
    clearLocalStorage()
    ElMessage.success('重置成功！')
    return
  }
  
  try {
    const payload = {
      type: 'activity1_question',
      from: { groupNo: g, studentNo: s },
      data: { action: 'reset' },
      at: Date.now()
    }
    
    const ack = await socketService.submit(payload as any)
    if (ack.code !== 200) {
      throw new Error(ack.message || '重置失败')
    }
    
    clearLocalStorage()
    ElMessage.success('重置成功！')
  } catch (error: any) {
    ElMessage.error(error.message || '重置失败，请重试')
  }
}

// 监听answers变化，自动保存到本地存储
watch(answers, () => {
  saveToLocalStorage()
}, { deep: true })

// 组件挂载时恢复数据
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1200px;
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
  margin-bottom: 24px;
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.6;
}

/* 问题容器 */
.questions-container {
  display: grid;
  gap: 24px;
  margin-bottom: 32px;
}

/* 单个问题卡片 */
.question-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}
.question-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 问题标题 */
.question-header {
  margin-bottom: 20px;
}
.question-number {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}
.question-title {
  font-size: 15px;
  color: #1f2937;
  line-height: 1.5;
}

/* 问题内容区域 */
.question-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

/* 问题图片 */
.question-image {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
  min-height: 300px;
}
.question-image img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
}

/* 选项区域 */
.question-options {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

/* 单个选项 */
.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-width: 140px;
  justify-content: center;
}
.option-item:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}
.option-item.selected {
  border-color: #3b82f6;
  background: #dbeafe;
  box-shadow: 0 0 0 1px #3b82f6;
}

.option-item input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
}
.option-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}
.option-item.selected .option-label {
  color: #1d4ed8;
  font-weight: 600;
}

/* 提交区域 */
.submit-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 进度信息 */
.progress-info {
  flex: 1;
}
.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  display: block;
}
.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 按钮样式 */
.submit-btn {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}
.submit-btn:not(:disabled) {
  background: #3b82f6;
  color: white;
}
.submit-btn:not(:disabled):hover {
  background: #2563eb;
  transform: translateY(-1px);
}
.submit-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
.submit-btn.success {
  background: #10b981;
  color: white;
}
.submit-btn.success:hover {
  background: #059669;
}

.reset-btn {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.reset-btn:not(:disabled):hover {
  border-color: #9ca3af;
  color: #374151;
}
.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .question-image {
    min-height: 200px;
  }
  .question-image img {
    max-height: 180px;
  }
  .question-options {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .option-item {
    min-width: 200px;
  }
  .submit-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
}
</style>
