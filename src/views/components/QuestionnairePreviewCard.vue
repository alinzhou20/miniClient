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
      
      <!-- 固定题目（只显示ID 1和2：就读年级和性别） -->
      <div class="survey-questions">
        <div v-for="question in fixedQuestions" :key="question.id">
          <div class="question-item">
            <div class="question-title">
              <span class="q-number">{{ question.id }}.</span>
              <span class="q-text">{{ question.title }}<span class="type-badge">[{{ getTypeText(question.type) }}]</span></span>
            </div>
          </div>
          <div class="question-options">
            <div 
              v-for="(option, index) in question.options" 
              :key="index"
              :class="['option-item', { 
                'answerable': answerable,
                'selected': answerable && isOptionSelected(question, index)
              }]"
              @click="answerable && handleOptionClick(question, index)"
            >
              <span :class="getOptionClass(question, index)"></span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>        
        <!-- 使用时长题目 -->
        <div v-if="durationQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">3.</span>
            <span class="q-text">{{ durationQuestion.title }}<span class="type-badge">[{{ getTypeText(durationQuestion.type) }}]</span></span>
            <span class="tag-badge">使用时长</span>
          </div>
          <div v-if="durationQuestion.options && durationQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in durationQuestion.options" 
              :key="index"
              :class="['option-item', { 
                'answerable': answerable,
                'selected': answerable && isOptionSelected(durationQuestion, index)
              }]"
              @click="answerable && handleOptionClick(durationQuestion, index)"
            >
              <span :class="getOptionClass(durationQuestion, index)"></span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
          <div v-else class="fill-blank">
            <el-input 
              v-if="answerable"
              v-model="durationQuestion.answer"
              placeholder="请输入答案"
              size="large"
              class="fill-input"
            />
            <span v-else class="blank-line">_________________</span>
          </div>
        </div>
        
        <!-- 使用影响题目 -->
        <div v-if="impactQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ durationQuestion ? '4' : '3' }}.</span>
            <span class="q-text">{{ impactQuestion.title }}<span class="type-badge">[{{ getTypeText(impactQuestion.type) }}]</span></span>
            <span class="tag-badge">使用影响</span>
          </div>
          <div v-if="impactQuestion.options && impactQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in impactQuestion.options" 
              :key="index"
              :class="['option-item', { 
                'answerable': answerable,
                'selected': answerable && isOptionSelected(impactQuestion, index)
              }]"
              @click="answerable && handleOptionClick(impactQuestion, index)"
            >
              <span :class="getOptionClass(impactQuestion, index)"></span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>
        
        <!-- 使用用途题目 -->
        <div v-if="usageQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ [durationQuestion, impactQuestion].filter(Boolean).length + 3 }}.</span>
            <span class="q-text">{{ usageQuestion.title }}<span class="type-badge">[{{ getTypeText(usageQuestion.type) }}]</span></span>
            <span class="tag-badge usage">使用用途</span>
          </div>
          <div v-if="usageQuestion.options && usageQuestion.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in usageQuestion.options" 
              :key="index"
              :class="['option-item', { 
                'answerable': answerable,
                'selected': answerable && isOptionSelected(usageQuestion, index)
              }]"
              @click="answerable && handleOptionClick(usageQuestion, index)"
            >
              <span :class="getOptionClass(usageQuestion, index)"></span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="!durationQuestion && !impactQuestion && !usageQuestion" class="empty-state">
          <el-icon class="empty-icon"><DocumentCopy /></el-icon>
          <p>请从题库中选择题目</p>
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

// 定义 props
interface Props {
  answerable?: boolean  // 是否支持答题
}

const props = withDefaults(defineProps<Props>(), {
  answerable: false
})

const activity = useActivity()

// 从 store 读取响应式问卷数据
const questionnaire = computed(() => activity.questionnaire)

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
  return activity.questionnaire.questions.find(q => q.id === 4) || null
})

// 从问卷中读取使用用途题目（固定ID=5）
const usageQuestion = computed<QuestionOption | null>(() => {
  return activity.questionnaire.questions.find(q => q.id === 5) || null
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

// 获取选项样式类名
const getOptionClass = (question: QuestionOption, index: number): string => {
  const baseClass = question.type === 'multiple' ? 'checkbox-square' : 'radio-circle'
  if (!props.answerable) return baseClass
  
  const isSelected = isOptionSelected(question, index)
  return `${baseClass} ${isSelected ? 'selected' : ''}`
}

// 判断选项是否被选中
const isOptionSelected = (question: QuestionOption, index: number): boolean => {
  if (!question.answer) return false
  
  const letter = String.fromCharCode(65 + index) // A, B, C, D...
  
  if (question.type === 'multiple') {
    // 多选题：检查答案中是否包含该字母
    return question.answer.includes(letter)
  } else {
    // 单选题：答案等于该字母
    return question.answer === letter
  }
}

// 处理选项点击（直接修改 Pinia store 中的数据，自动响应式）
const handleOptionClick = (question: QuestionOption, index: number) => {
  if (!props.answerable) return
  
  const letter = String.fromCharCode(65 + index) // A, B, C, D...
  
  if (question.type === 'multiple') {
    // 多选题逻辑
    if (!question.answer) {
      question.answer = letter
    } else {
      const answers = question.answer.split('、').filter(a => a)
      const letterIndex = answers.indexOf(letter)
      
      if (letterIndex > -1) {
        // 已选中，取消选择
        answers.splice(letterIndex, 1)
      } else {
        // 未选中，添加选择
        answers.push(letter)
      }
      
      // 按字母顺序排序
      answers.sort()
      question.answer = answers.join('、')
    }
  } else {
    // 单选题逻辑
    question.answer = letter
  }
  // 因为 question 是 Pinia store 中的响应式对象，修改会自动触发更新
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

.intro-greeting {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.8;
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
  margin: 2px 0;
}

/* 题目区域 */
.survey-questions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-item {
  padding: 5px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.question-item:last-child {
  border-bottom: none;
}

/* 题目标题 */
.question-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
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

/* 题目分类标签 */
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

/* 选项区域 */
.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 28px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 可答题的选项 */
.option-item.answerable {
  cursor: pointer;
  padding: 8px 12px;
  margin: -8px -12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.option-item.answerable:hover {
  background: #f0f9ff;
}

.option-item.selected {
  background: #dbeafe;
}

/* 单选圆圈 */
.radio-circle {
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  flex-shrink: 0;
  background: white;
  transition: all 0.2s;
  position: relative;
}

.radio-circle.selected {
  border-color: #0ea5e9;
  background: #0ea5e9;
}

.radio-circle.selected::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
}

.option-item:hover .radio-circle {
  border-color: #0ea5e9;
}

/* 多选方框 */
.checkbox-square {
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 3px;
  flex-shrink: 0;
  background: white;
  transition: all 0.2s;
  position: relative;
}

.checkbox-square.selected {
  border-color: #0ea5e9;
  background: #0ea5e9;
}

.checkbox-square.selected::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.option-item:hover .checkbox-square {
  border-color: #0ea5e9;
}

.option-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
}

/* 填空题 */
.fill-blank {
  padding-left: 28px;
}

.blank-line {
  display: inline-block;
  min-width: 200px;
  border-bottom: 2px solid #d1d5db;
  font-size: 14px;
  color: #9ca3af;
}

.fill-input {
  max-width: 400px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #d1d5db;
}
</style>

