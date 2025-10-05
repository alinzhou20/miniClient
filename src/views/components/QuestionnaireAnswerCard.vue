<template>
  <div class="questionnaire-container">
    <div class="questionnaire-card">
      <!-- 问卷标题 -->
      <div class="survey-title">{{ questionnaire.title }}</div>
      
      <!-- 问卷说明 -->
      <div class="survey-intro">
        <p class="intro-text">{{ questionnaire.description }}</p>
      </div>
      
      <!-- 分隔线 -->
      <div class="divider"></div>
      
      <!-- 统计信息 -->
      <div class="stats-banner">
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <span class="stat-text">已提交：<strong>{{ totalSubmitted }}</strong> / 24人</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📊</span>
          <span class="stat-text">完成率：<strong>{{ Math.round((totalSubmitted / 24) * 100) }}%</strong></span>
        </div>
      </div>
      
      <!-- 题目统计区域 -->
      <div class="survey-questions">
        <!-- 固定题目（就读年级和性别） -->
        <div v-for="question in fixedQuestions" :key="question.id" class="question-item">
          <div class="question-title">
            <span class="q-number">{{ question.id }}.</span>
            <span class="q-text">{{ question.title }}</span>
            <span class="type-badge">[{{ getTypeText(question.type) }}]</span>
          </div>
          
          <!-- 选择题统计 -->
          <div v-if="question.options && question.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in question.options" 
              :key="index"
              class="option-stat"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-text">{{ option }}</span>
              <div class="stat-inline">
                <div class="stat-bar-container">
                  <div 
                    class="stat-bar"
                    :style="{ width: getOptionPercentage(question.id, index) + '%' }"
                  ></div>
                </div>
                <div class="stat-numbers">
                  <span class="stat-count">{{ getOptionCount(question.id, index) }}人</span>
                  <span class="stat-percent">{{ getOptionPercentage(question.id, index).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 使用时长题目 -->
        <div v-if="durationQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">3.</span>
            <span class="q-text">{{ durationQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(durationQuestion.type) }}]</span>
            <span class="tag-badge">使用时长</span>
          </div>
          
          <!-- 填空题 - 显示所有答案 -->
          <div v-if="durationQuestion.type === 'fill'" class="fill-answers">
            <div v-if="getFillAnswers(durationQuestion.id).length > 0" class="answer-list">
              <div 
                v-for="(answer, idx) in getFillAnswers(durationQuestion.id)" 
                :key="idx"
                class="fill-answer-item"
              >
                {{ answer.answer }}
              </div>
            </div>
            <div v-else class="no-answers">暂无答案</div>
          </div>
          
          <!-- 选择题统计 -->
          <div v-else-if="durationQuestion.options && durationQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in durationQuestion.options" 
              :key="index"
              class="option-stat"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-text">{{ option }}</span>
              <div class="stat-inline">
                <div class="stat-bar-container">
                  <div 
                    class="stat-bar"
                    :style="{ width: getOptionPercentage(durationQuestion.id, index) + '%' }"
                  ></div>
                </div>
                <div class="stat-numbers">
                  <span class="stat-count">{{ getOptionCount(durationQuestion.id, index) }}人</span>
                  <span class="stat-percent">{{ getOptionPercentage(durationQuestion.id, index).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 使用影响题目 -->
        <div v-if="impactQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ durationQuestion ? '4' : '3' }}.</span>
            <span class="q-text">{{ impactQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(impactQuestion.type) }}]</span>
            <span class="tag-badge">使用影响</span>
          </div>
          
          <!-- 选择题统计 -->
          <div v-if="impactQuestion.options && impactQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in impactQuestion.options" 
              :key="index"
              class="option-stat"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-text">{{ option }}</span>
              <div class="stat-inline">
                <div class="stat-bar-container">
                  <div 
                    class="stat-bar"
                    :style="{ width: getOptionPercentage(impactQuestion.id, index) + '%' }"
                  ></div>
                </div>
                <div class="stat-numbers">
                  <span class="stat-count">{{ getOptionCount(impactQuestion.id, index) }}人</span>
                  <span class="stat-percent">{{ getOptionPercentage(impactQuestion.id, index).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 使用用途题目 -->
        <div v-if="usageQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ [durationQuestion, impactQuestion].filter(Boolean).length + 3 }}.</span>
            <span class="q-text">{{ usageQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(usageQuestion.type) }}]</span>
            <span class="tag-badge usage">使用用途</span>
          </div>
          
          <!-- 选择题统计（多选题） -->
          <div v-if="usageQuestion.options && usageQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in usageQuestion.options" 
              :key="index"
              class="option-stat"
            >
              <span class="option-marker">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-text">{{ option }}</span>
              <div class="stat-inline">
                <div class="stat-bar-container">
                  <div 
                    class="stat-bar multiple"
                    :style="{ width: getMultipleOptionPercentage(usageQuestion.id, index) + '%' }"
                  ></div>
                </div>
                <div class="stat-numbers">
                  <span class="stat-count">{{ getMultipleOptionCount(usageQuestion.id, index) }}人</span>
                  <span class="stat-percent">{{ getMultipleOptionPercentage(usageQuestion.id, index).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!hasAnyQuestion" class="empty-state">
          <el-icon class="empty-icon"><DocumentCopy /></el-icon>
          <p>暂无问卷数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'
import { useActivity } from '@/store/activity'
import type { QuestionOption } from '@/store/activity'

const activity = useActivity()

// 从 store 读取响应式问卷数据和所有答题结果
const questionnaire = computed(() => activity.questionnaire)
const allAnswers = computed(() => activity.ac3_allQuestionnaireAnswer)

// 统计总提交人数
const totalSubmitted = computed(() => {
  return Object.keys(allAnswers.value).length
})

// 只获取固定题目（ID 1和2：就读年级和性别）
const fixedQuestions = computed<QuestionOption[]>(() => {
  return activity.questionnaire.questions.filter(q => q.id === 1 || q.id === 2)
})

// 从问卷中读取使用时长题目（固定ID=3）
const durationQuestion = computed<QuestionOption | null>(() => {
  return activity.questionnaire.questions.find(q => q.id === 3) || null
})

// 从问卷中读取使用影响题目（固定ID=4）
const impactQuestion = computed<QuestionOption | null>(() => {
  const question = activity.questionnaire.questions.find(q => q.id === 4)
  if (!question) return null
  if (question.title === '我认为以上题目都不合适。') return null
  return question
})

// 从问卷中读取使用用途题目（固定ID=5）
const usageQuestion = computed<QuestionOption | null>(() => {
  return activity.questionnaire.questions.find(q => q.id === 5) || null
})

// 检查是否有任何题目
const hasAnyQuestion = computed(() => {
  return fixedQuestions.value.length > 0 || durationQuestion.value || impactQuestion.value || usageQuestion.value
})

// 获取题目类型的文本
const getTypeText = (type: 'fill' | 'single' | 'multiple'): string => {
  const typeMap = {
    'fill': '填空',
    'single': '单选',
    'multiple': '多选'
  }
  return typeMap[type] || '单选'
}

// 获取单选题某个选项的选择人数
const getOptionCount = (questionId: number, optionIndex: number): number => {
  const letter = String.fromCharCode(65 + optionIndex)
  let count = 0
  
  Object.values(allAnswers.value).forEach(answer => {
    const question = answer.questions.find(q => q.id === questionId)
    if (question && question.answer === letter) {
      count++
    }
  })
  
  return count
}

// 获取单选题某个选项的选择百分比
const getOptionPercentage = (questionId: number, optionIndex: number): number => {
  if (totalSubmitted.value === 0) return 0
  const count = getOptionCount(questionId, optionIndex)
  return (count / totalSubmitted.value) * 100
}

// 获取多选题某个选项的选择人数
const getMultipleOptionCount = (questionId: number, optionIndex: number): number => {
  const letter = String.fromCharCode(65 + optionIndex)
  let count = 0
  
  Object.values(allAnswers.value).forEach(answer => {
    const question = answer.questions.find(q => q.id === questionId)
    if (question && Array.isArray(question.answer)) {
      if (question.answer.includes(letter)) {
        count++
      }
    }
  })
  
  return count
}

// 获取多选题某个选项的选择百分比
const getMultipleOptionPercentage = (questionId: number, optionIndex: number): number => {
  if (totalSubmitted.value === 0) return 0
  const count = getMultipleOptionCount(questionId, optionIndex)
  return (count / totalSubmitted.value) * 100
}

// 获取填空题的所有答案
const getFillAnswers = (questionId: number) => {
  const answers: Array<{ groupNo: string; studentNo: string; answer: string }> = []
  
  Object.values(allAnswers.value).forEach(answer => {
    const question = answer.questions.find(q => q.id === questionId)
    if (question && question.answer && String(question.answer).trim()) {
      answers.push({
        groupNo: answer.groupNo,
        studentNo: answer.studentNo,
        answer: String(question.answer)
      })
    }
  })
  
  return answers
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

/* 问卷标题 */
.survey-title {
  font-size: 24px;
  font-weight: 600;
  color: #0ea5e9;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.4;
}

/* 问卷说明 */
.survey-intro {
  margin-bottom: 12px;
}

.intro-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.8;
  text-indent: 2em;
  margin: 0;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
  margin: 24px 0;
}

/* 统计横幅 */
.stats-banner {
  display: flex;
  gap: 32px;
  justify-content: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  margin-bottom: 32px;
  border: 2px solid #bae6fd;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 20px;
}

.stat-text {
  font-size: 15px;
  color: #0c4a6e;
}

.stat-text strong {
  font-size: 18px;
  font-weight: 700;
  color: #0ea5e9;
  margin: 0 2px;
}

/* 题目区域 */
.survey-questions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 18px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item.highlight {
  background: linear-gradient(to right, rgba(16, 185, 129, 0.03), transparent);
  padding: 18px 20px;
  margin: 0 -20px;
  border-radius: 12px;
  border-bottom: none;
}

/* 题目标题 */
.question-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
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
  font-weight: 500;
}

.type-badge {
  font-size: 14px;
  color: #6b7280;
  margin-left: 4px;
}

.tag-badge {
  font-size: 12px;
  padding: 2px 10px;
  background: #10b981;
  color: white;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.tag-badge.usage {
  background: #f59e0b;
}

/* 选项统计区域 */
.question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 28px;
}

.option-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.option-marker {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  min-width: 24px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
  min-width: 0;
}

.stat-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.stat-bar-container {
  width: 140px;
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.stat-bar {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 5px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.stat-bar.multiple {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3);
}

.stat-numbers {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: 90px;
}

.stat-count {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  min-width: 40px;
}

.stat-percent {
  font-size: 13px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 44px;
  text-align: right;
}

.option-stat:hover .stat-bar {
  filter: brightness(1.15);
}

/* 填空题答案 */
.fill-answers {
  padding-left: 28px;
}

.answer-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.fill-answer-item {
  display: inline-block;
  padding: 6px 14px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
}

.fill-answer-item:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.no-answers {
  text-align: center;
  padding: 30px 20px;
  color: #9ca3af;
  font-size: 14px;
  font-style: italic;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .questionnaire-card {
    padding: 20px;
  }

  .stats-banner {
    flex-direction: column;
    gap: 12px;
  }

  .question-options {
    padding-left: 0;
  }

  .option-stat {
    flex-wrap: wrap;
    gap: 8px;
  }

  .stat-inline {
    flex: 1;
    min-width: 200px;
  }

  .stat-bar-container {
    flex: 1;
  }
}
</style>
