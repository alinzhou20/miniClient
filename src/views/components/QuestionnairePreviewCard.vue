<template>
  <div class="questionnaire-container">
    <div class="questionnaire-card">
      <!-- 问卷标题 -->
      <div 
        v-if="props.editable" 
        class="survey-title editable-title"
        contenteditable="true"
        @blur="updateTitle"
        @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
        ref="titleRef"
      >
        {{ questionnaire.title }}
      </div>
      <div v-else class="survey-title">{{ questionnaire.title }}</div>
      
      <!-- 问卷说明 -->
      <div class="survey-intro">
        <p 
          v-if="props.editable"
          class="intro-text editable-intro"
          contenteditable="true"
          @blur="updateDescription"
          @keydown.enter="handleEnterKey"
          ref="descRef"
        >
          {{ questionnaire.description }}
        </p>
        <p v-else class="intro-text">{{ questionnaire.description }}</p>
      </div>
      
      <!-- 分隔线 -->
      <div class="divider"></div>
      
      <!-- 动态渲染所有题目 -->
      <div class="survey-questions">
        <div v-for="(question, qIndex) in visibleQuestions" :key="question.id">
          <!-- 题目项 -->
          <div 
            class="question-item" 
            :class="{ 
              'editable-question': props.editable,
              'highlight': shouldHighlight(question)
            }"
          >
            <div class="question-title">
              <span class="q-number">{{ qIndex + 1 }}.</span>
              <span 
                v-if="props.editable"
                class="q-text editable-q-text"
                contenteditable="true"
                @blur="(e) => updateQuestionTitle(question, e)"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
              >
                {{ question.title }}
              </span>
              <span v-else class="q-text">{{ question.title }}</span>
              <span class="type-badge">[{{ getTypeText(question.type) }}]</span>
              <span 
                v-if="getQuestionTypeLabel(question.questionType)" 
                class="tag-badge"
                :class="getQuestionTypeLabel(question.questionType)?.class"
              >
                {{ getQuestionTypeLabel(question.questionType)?.text }}
              </span>
              <button 
                v-if="props.editable"
                class="delete-question-btn"
                @click="deleteQuestion(question.id)"
                title="删除此题目"
              >
                ×
              </button>
            </div>
          </div>
          
          <!-- 选择题选项 -->
          <div v-if="question.options && question.options.length > 0" class="question-options">
            <div 
              v-for="(option, index) in question.options" 
              :key="index"
              :class="['option-item', { 
                'answerable': props.answerable,
                'selected': props.answerable && isOptionSelected(question, index)
              }]"
              @click="props.answerable && handleOptionClick(question, index)"
            >
              <span :class="getOptionClass(question, index)"></span>
              <span 
                v-if="props.editable"
                class="option-text editable-option"
                contenteditable="true"
                @blur="(e) => updateOption(question, index, e)"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
              >
                {{ option }}
              </span>
              <span v-else class="option-text">{{ option }}</span>
              <button 
                v-if="props.editable && question.options && question.options.length > 1"
                class="delete-option-btn"
                @click.stop="deleteOption(question, index)"
                title="删除此选项"
              >
                ×
              </button>
            </div>
            <button 
              v-if="props.editable"
              class="add-option-btn"
              @click="addOption(question)"
            >
              添加选项
            </button>
          </div>
          
          <!-- 填空题输入框 -->
          <div v-else class="fill-blank">
            <el-input 
              v-if="props.answerable"
              v-model="question.answer"
              placeholder="请输入答案"
              size="large"
              class="fill-input"
            />
            <span v-else class="blank-line">_______________</span>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="questionnaire.questions.length === 0" class="empty-state">
          <el-icon class="empty-icon"><DocumentCopy /></el-icon>
          <p>暂无题目</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'
import { useActivity } from '@/store/activity'
import type { QuestionOption } from '@/store/activity'
import { ElMessage } from 'element-plus'

// 定义 props
interface Props {
  answerable?: boolean  // 是否支持答题（学生端答题功能）
  editable?: boolean    // 是否可编辑（教师端编辑功能）
}

const props = withDefaults(defineProps<Props>(), {
  answerable: false,
  editable: false
})

const activity = useActivity()

// Refs
const titleRef = ref<HTMLElement>()
const descRef = ref<HTMLElement>()

// 从 store 读取响应式问卷数据
const questionnaire = computed(() => activity.questionnaire)

// 根据可见性过滤题目（学生端过滤仅教师可见的题目）
const visibleQuestions = computed(() => {
  const questions = questionnaire.value.questions
  
  // 如果是学生端（非编辑模式），过滤掉仅教师可见的题目
  if (!props.editable) {
    return questions.filter(q => q.visibility !== 'teacher')
  }
  
  // 教师端显示所有题目
  return questions
})

// 判断题目是否需要高亮显示（duration、impact、design 类型）
const shouldHighlight = (question: QuestionOption): boolean => {
  return ['duration', 'impact', 'design'].includes(question.questionType)
}

// 获取题目类型的文本
const getTypeText = (type: 'fill' | 'single' | 'multiple'): string => {
  const typeMap = {
    'fill': '填空',
    'single': '单选',
    'multiple': '多选'
  }
  return typeMap[type] || '单选'
}

// 根据 questionType 获取标签文本和样式类
const getQuestionTypeLabel = (questionType: string): { text: string; class: string } | null => {
  const labelMap: Record<string, { text: string; class: string }> = {
    'duration': { text: '使用时长', class: '' },
    'impact': { text: '使用影响', class: '' },
    'design': { text: '使用用途', class: 'usage' }
  }
  return labelMap[questionType] || null
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
      const answers = question.answer.split('、').filter((a: string) => a)
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

// ==================== 编辑模式功能 ====================

// 更新问卷标题
const updateTitle = (event: Event) => {
  const target = event.target as HTMLElement
  const newTitle = target.innerText.trim()
  if (newTitle && newTitle !== questionnaire.value.title) {
    questionnaire.value.title = newTitle
  }
}

// 更新问卷说明
const updateDescription = (event: Event) => {
  const target = event.target as HTMLElement
  const newDesc = target.innerText.trim()
  if (newDesc && newDesc !== questionnaire.value.description) {
    questionnaire.value.description = newDesc
  }
}

// 处理 Enter 键（允许换行）
const handleEnterKey = () => {
  // 允许换行，不做特殊处理
}

// 更新题目标题
const updateQuestionTitle = (question: QuestionOption, event: Event) => {
  const target = event.target as HTMLElement
  const newTitle = target.innerText.trim()
  if (!newTitle || newTitle === question.title) return
  
  // 直接在 store 中找到对应的题目并修改
  const storeQuestion = activity.questionnaire.questions.find(q => q.id === question.id)
  if (storeQuestion) {
    storeQuestion.title = newTitle
  }
}

// 更新选项内容
const updateOption = (question: QuestionOption, index: number, event: Event) => {
  const target = event.target as HTMLElement
  const newOption = target.innerText.trim()
  if (!newOption || !question.options || newOption === question.options[index]) return
  
  // 直接在 store 中找到对应的题目并修改
  const storeQuestion = activity.questionnaire.questions.find(q => q.id === question.id)
  if (storeQuestion && storeQuestion.options && storeQuestion.options[index] !== undefined) {
    storeQuestion.options[index] = newOption
  }
}

// 删除选项
const deleteOption = (question: QuestionOption, index: number) => {
  // 直接在 store 中找到对应的题目并修改
  const storeQuestion = activity.questionnaire.questions.find(q => q.id === question.id)
  if (!storeQuestion || !storeQuestion.options || storeQuestion.options.length <= 1) {
    ElMessage.warning('至少需要保留一个选项')
    return
  }
  
  storeQuestion.options.splice(index, 1)
  ElMessage.success('选项已删除')
}

// 添加选项
const addOption = (question: QuestionOption) => {
  // 直接在 store 中找到对应的题目并修改
  const storeQuestion = activity.questionnaire.questions.find(q => q.id === question.id)
  if (!storeQuestion) return
  
  if (!storeQuestion.options) {
    storeQuestion.options = []
  }
  
  const optionLetter = String.fromCharCode(65 + storeQuestion.options.length) // A, B, C, D...
  storeQuestion.options.push(`新选项 ${optionLetter}`)
  ElMessage.success('选项已添加，请点击编辑')
}

// 删除题目
const deleteQuestion = (questionId: number) => {
  const index = activity.questionnaire.questions.findIndex(q => q.id === questionId)
  if (index === -1) return
  
  // 删除题目
  activity.questionnaire.questions.splice(index, 1)
  
  // 重新分配ID（从1开始连续编号）
  activity.questionnaire.questions.forEach((q, idx) => {
    q.id = idx + 1
  })
  
  ElMessage.success('题目已删除')
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

/* ==================== 编辑模式样式 ==================== */

/* 可编辑标题 - 保持原样式，只添加微弱提示 */
.editable-title {
  cursor: text;
  transition: all 0.2s ease;
  padding: 2px 8px;
  margin: -2px -8px 20px;
  border-radius: 4px;
}

.editable-title:hover {
  background: rgba(14, 165, 233, 0.05);
}

.editable-title:focus {
  outline: none;
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

/* 可编辑说明 - 保持原样式 */
.editable-intro {
  cursor: text;
  transition: all 0.2s ease;
  padding: 8px;
  margin: -8px;
  border-radius: 4px;
}

.editable-intro:hover {
  background: rgba(14, 165, 233, 0.03);
}

.editable-intro:focus {
  outline: none;
  background: rgba(14, 165, 233, 0.05);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
}

/* 可编辑题目文本 - 保持原样式 */
.editable-q-text {
  cursor: text;
  transition: all 0.2s ease;
  padding: 4px 6px;
  margin: -4px -6px;
  border-radius: 4px;
}

.editable-q-text:hover {
  background: rgba(14, 165, 233, 0.05);
}

.editable-q-text:focus {
  outline: none;
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

/* 可编辑选项 - 保持原样式 */
.editable-option {
  cursor: text;
  transition: all 0.2s ease;
  padding: 4px 6px;
  margin: -4px -6px;
  border-radius: 4px;
}

.editable-option:hover {
  background: rgba(14, 165, 233, 0.05);
}

.editable-option:focus {
  outline: none;
  background: rgba(14, 165, 233, 0.08);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
}

/* 删除选项按钮 */
.delete-option-btn {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  z-index: 10;
}

.option-item:hover .delete-option-btn {
  opacity: 1;
}

.delete-option-btn:hover {
  background: #dc2626;
  transform: translateY(-50%) scale(1.1);
}

.delete-option-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* 添加选项按钮 */
.add-option-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  background: transparent;
  color: #9ca3af;
  border: none;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
}

/* 悬停选项区域时显示添加按钮 */
.question-options:hover .add-option-btn {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.add-option-btn::before {
  content: '+';
  width: 16px;
  height: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 3px;
  flex-shrink: 0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #d1d5db;
  transition: all 0.2s ease;
}

.add-option-btn:hover {
  color: #0ea5e9;
}

.add-option-btn:hover::before {
  border-color: #0ea5e9;
  border-style: solid;
  background: #f0f9ff;
  color: #0ea5e9;
}

.add-option-btn:active {
  transform: scale(0.95);
}

/* 删除题目按钮 */
.delete-question-btn {
  margin-left: auto;
  width: 20px;
  height: 20px;
  padding: 0;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  color: #6b7280;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.question-item.editable-question:hover .delete-question-btn {
  opacity: 1;
  pointer-events: auto;
}

.delete-question-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.delete-question-btn:active {
  background: #fecaca;
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
  position: relative;
}

.question-item:last-child {
  border-bottom: none;
}

/* 可编辑题目的悬停效果 */
.question-item.editable-question:hover {
  background: rgba(0, 0, 0, 0.01);
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
  transition: all 0.2s ease;
}

/* 可答题的选项 */
.option-item.answerable {
  cursor: pointer;
  transition: all 0.2s;
}

.option-item.answerable:hover {
  background: #e0f2fe;
  transform: translateY(-1px);
}

.option-item.selected {
  background: #dbeafe;
  border: 1px solid #0ea5e9;
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
  font-size: 14px;
  color: #374151;
  line-height: 1.4;
  white-space: nowrap;
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

