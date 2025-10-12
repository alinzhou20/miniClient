<template>
  <div class="questionnaire-container">
    <div class="questionnaire-card">
      <!-- 卡片标题 -->
      <h2 class="card-header-title">问卷预览</h2>
      
      <!-- 问卷标题 -->
      <div class="survey-title-section">
        <span class="section-label">问卷标题：</span>
        <span class="survey-title editable-style">{{ questionnaire.title }}</span>
      </div>
      
      <!-- 问卷说明 -->
      <div class="survey-intro-section">
        <span class="section-label">问卷说明：</span>
        <span class="intro-text editable-style">{{ questionnaire.description }}</span>
      </div>
      
      <!-- 内容区域 -->
      <div class="content-area-section">
        <span class="section-label">问卷题目：</span>
        <div class="content-area-wrapper">
          <!-- 学生选择题目区域 -->
          <div class="student-questions-area" @click="handleAreaClick">
            <!-- 已选择的题目 -->
            <transition-group name="question-fade" tag="div">
              <div v-for="(question, qIndex) in studentQuestions" :key="`q-${question.id}`" class="question-wrapper">
                <div class="question-item">
                  <div class="question-title">
                    <span class="q-number">{{ qIndex + 1 }}.</span>
                    <span class="q-text">{{ question.title }}</span>
                    <button 
                      class="delete-question-btn"
                      @click="deleteQuestion(question)"
                      title="删除此题目"
                    >
                      删除
                    </button>
                  </div>
                </div>
                
                <div v-if="question.options && question.options.length > 0" class="question-options">
                  <div 
                    v-for="(option, index) in question.options" 
                    :key="index"
                    class="option-item"
                  >
                    <span :class="question.type === 'multiple' ? 'checkbox-square' : 'radio-circle'"></span>
                    <span class="option-text">{{ option }}</span>
                  </div>
                </div>
              </div>
            </transition-group>
            
            <!-- 选择题目按钮 -->
            <div class="add-question-item" @click="scrollToBank">
              <span class="add-text">从左侧选择调查问题</span>
            </div>
          </div>
          
          <!-- 提交按钮 -->
          <div class="submit-area">
            <el-button 
              type="primary"
              size="large"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="handleSubmit"
              class="submit-btn"
            >
              问卷提交
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useActivity } from '@/store/activity'

// 定义 props
interface Props {
  isSubmitting?: boolean
}

const { isSubmitting = false } = defineProps<Props>()

// 定义 emit
const emit = defineEmits<{
  (e: 'submit'): void
}>()

const activity = useActivity()

// 从 store 读取响应式问卷数据
const questionnaire = computed(() => activity.questionnaire)

// 学生选择的题目（id=3, 4：使用时长、设备类型）
const studentQuestions = computed(() => {
  const questions = questionnaire.value.questions
  return questions.filter(q => q.id === 3 || q.id === 4)
})

// 检查是否可以提交
const canSubmit = computed(() => {
  return studentQuestions.value.length > 0
})

// 处理提交
const handleSubmit = () => {
  emit('submit')
}

// 滚动到题库区域
const scrollToBank = () => {
  const bankElement = document.querySelector('.design-panel')
  if (bankElement) {
    bankElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    
    // 添加高亮提示动画
    const bankCard = document.querySelector('.question-bank-card')
    if (bankCard) {
      bankCard.classList.add('highlight-pulse')
      setTimeout(() => {
        bankCard?.classList.remove('highlight-pulse')
      }, 2000)
    }
  }
}

// 处理区域点击
const handleAreaClick = (e: MouseEvent) => {
  // 检查是否点击了按钮或其他交互元素
  const target = e.target as HTMLElement
  
  // 如果点击的是按钮或其他交互元素，不触发高亮效果
  if (
    target.tagName === 'BUTTON' || 
    target.closest('button') ||
    target.closest('.el-button')
  ) {
    return
  }
  
  // 触发高亮效果
  scrollToBank()
}

// 删除题目
const deleteQuestion = (question: any) => {
  const index = activity.questionnaire.questions.findIndex(q => q.id === question.id)
  if (index === -1) return
  
  // 删除题目
  activity.questionnaire.questions.splice(index, 1)
  
  // 同步清除 ac2_stuResult 中的选择状态
  if (activity.ac2_stuResult) {
    if (question.id === 3) {
      activity.ac2_stuResult.selectedDurationQuestion = null
    } else if (question.id === 4) {
      activity.ac2_stuResult.selectedImpactQuestion = null
    }
  }
}
</script>

<style scoped>
.questionnaire-container {
  max-width: 100%;
  margin: 0 auto;
}

.questionnaire-card {
  background: white;
  border-radius: 8px;
  padding: 20px 40px;
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

/* 章节标签样式 */
.section-label {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  flex-shrink: 0;
}

/* 问卷标题区域 */
.survey-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

/* 问卷标题 */
.survey-title {
  font-size: 24px;
  font-weight: 600;
  color: #0ea5e9;
  line-height: 1.4;
  flex: 1;
}

/* 问卷说明区域 */
.survey-intro-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.intro-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  flex: 1;
  margin: 0;
}

/* 可编辑视觉效果样式 */
.editable-style {
  padding: 12px 16px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
  display: block;
  min-height: 46px;
}

.survey-title.editable-style {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.intro-text.editable-style {
  min-height: auto;
  padding: 10px 14px;
  text-indent: 2em;
}

.editable-style:hover {
  background: #f3f4f6;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* 题目标题 */
.question-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
}

.q-number {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  min-width: 28px;
}

.q-text {
  flex: 1;
  font-size: 16px;
  color: #1f2937;
  line-height: 1.6;
}

/* 题目类型标签 */
.type-badge {
  font-size: 14px;
  color: #6b7280;
  margin-left: 4px;
}

/* 选项区域 */
.question-options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding-left: 28px;
  position: relative;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  flex-shrink: 0;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.add-text {
  font-size: 16px;
  color: #1f2937;
  font-weight: 700;
  opacity: 0.5;
}

/* 单选圆圈 */
.radio-circle {
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  flex-shrink: 0;
  background: white;
}

/* 多选方框 */
.checkbox-square {
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 3px;
  flex-shrink: 0;
  background: white;
}

.option-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
  white-space: nowrap;
}

/* 内容区域部分 */
.content-area-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.content-area-section .section-label {
  padding-top: 24px;
}

.content-area-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 学生选择题目区域 */
.student-questions-area {
  padding: 24px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #fafafa;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.student-questions-area:hover {
  background: #f3f4f6;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.student-questions-area:active {
  background: #e5e7eb;
}

.question-item {
  position: relative;
  padding: 12px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.question-item:last-child {
  border-bottom: none;
}

/* 添加题目按钮 */
.add-question-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

/* 提交区域 */
.submit-area {
  display: flex;
  justify-content: center;
  padding: 20px 0 0 0;
  z-index: 1;
  position: relative;
}

.submit-btn {
  font-size: 18px;
  padding: 16px 48px;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}


.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 删除题目按钮 */
.delete-question-btn {
  margin-left: auto;
  width: auto;
  height: 24px;
  padding: 0 8px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 1;
}

.question-item:hover .delete-question-btn {
  opacity: 1;
  pointer-events: auto;
}

.delete-question-btn:hover {
  background: #fecaca;
  border-color: #f87171;
  color: #b91c1c;
}

.delete-question-btn:active {
  background: #fca5a5;
}

/* 题目淡入动画 */
.question-fade-enter-active {
  transition: all 0.5s ease;
  transition-delay: 0.5s;
}

.question-fade-leave-active {
  transition: all 0.3s ease;
}

.question-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.question-fade-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.question-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 题目包装器 */
.question-wrapper {
  position: relative;
}

/* 新增题目的脉冲高亮效果 */
@keyframes questionPulse {
  0% {
    background: transparent;
  }
  50% {
    background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.1), transparent);
  }
  100% {
    background: transparent;
  }
}

.question-fade-enter-active .question-item {
  animation: questionPulse 1s ease-out;
}
</style>
