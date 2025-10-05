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
      
      <!-- 固定题目（只显示ID 1和2：就读年级和性别） -->
      <div class="survey-questions">
        <div v-for="question in fixedQuestions" :key="question.id">
          <div class="question-item">
            <div class="question-title">
              <span class="q-number">{{ question.id }}.</span>
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
        </div>        
        <!-- 使用时长题目 -->
        <div v-if="durationQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">3.</span>
            <span 
              v-if="props.editable"
              class="q-text editable-q-text"
              contenteditable="true"
              @blur="(e) => durationQuestion && updateQuestionTitle(durationQuestion, e)"
              @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
            >
              {{ durationQuestion.title }}
            </span>
            <span v-else class="q-text">{{ durationQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(durationQuestion.type) }}]</span>
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
              <span 
                v-if="props.editable"
                class="option-text editable-option"
                contenteditable="true"
                @blur="(e) => durationQuestion && updateOption(durationQuestion, index, e)"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
              >
                {{ option }}
              </span>
              <span v-else class="option-text">{{ option }}</span>
              <button 
                v-if="props.editable && durationQuestion.options && durationQuestion.options.length > 1"
                class="delete-option-btn"
                @click.stop="deleteOption(durationQuestion, index)"
                title="删除此选项"
              >
                ×
              </button>
            </div>
            <button 
              v-if="props.editable"
              class="add-option-btn"
              @click="addOption(durationQuestion)"
            >
              添加选项
            </button>
          </div>
          <div v-else class="fill-blank">
            <el-input 
              v-if="answerable"
              v-model="durationQuestion.answer"
              placeholder="请输入答案"
              size="large"
              class="fill-input"
            />
            <span v-else class="blank-line"> </span>
          </div>
        </div>
        
        <!-- 使用影响题目 -->
        <div v-if="impactQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ durationQuestion ? '4' : '3' }}.</span>
            <span 
              v-if="props.editable"
              class="q-text editable-q-text"
              contenteditable="true"
              @blur="(e) => impactQuestion && updateQuestionTitle(impactQuestion, e)"
              @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
            >
              {{ impactQuestion.title }}
            </span>
            <span v-else class="q-text">{{ impactQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(impactQuestion.type) }}]</span>
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
              <span 
                v-if="props.editable"
                class="option-text editable-option"
                contenteditable="true"
                @blur="(e) => impactQuestion && updateOption(impactQuestion, index, e)"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
              >
                {{ option }}
              </span>
              <span v-else class="option-text">{{ option }}</span>
              <button 
                v-if="props.editable && impactQuestion.options && impactQuestion.options.length > 1"
                class="delete-option-btn"
                @click.stop="deleteOption(impactQuestion, index)"
                title="删除此选项"
              >
                ×
              </button>
            </div>
            <button 
              v-if="props.editable"
              class="add-option-btn"
              @click="addOption(impactQuestion)"
            >
              添加选项
            </button>
          </div>
        </div>
        
        <!-- 使用用途题目 -->
        <div v-if="usageQuestion" class="question-item highlight">
          <div class="question-title">
            <span class="q-number">{{ [durationQuestion, impactQuestion].filter(Boolean).length + 3 }}.</span>
            <span 
              v-if="props.editable"
              class="q-text editable-q-text"
              contenteditable="true"
              @blur="(e) => usageQuestion && updateQuestionTitle(usageQuestion, e)"
              @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
            >
              {{ usageQuestion.title }}
            </span>
            <span v-else class="q-text">{{ usageQuestion.title }}</span>
            <span class="type-badge">[{{ getTypeText(usageQuestion.type) }}]</span>
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
              <span 
                v-if="props.editable"
                class="option-text editable-option"
                contenteditable="true"
                @blur="(e) => usageQuestion && updateOption(usageQuestion, index, e)"
                @keydown.enter.prevent="(e) => (e.target as HTMLElement)?.blur()"
              >
                {{ option }}
              </span>
              <span v-else class="option-text">{{ option }}</span>
              <button 
                v-if="props.editable && usageQuestion.options && usageQuestion.options.length > 1"
                class="delete-option-btn"
                @click.stop="deleteOption(usageQuestion, index)"
                title="删除此选项"
              >
                ×
              </button>
            </div>
            <button 
              v-if="props.editable"
              class="add-option-btn"
              @click="addOption(usageQuestion)"
            >
              添加选项
            </button>
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

// 只获取固定题目（ID 1和2：就读年级和性别）
const fixedQuestions = computed<QuestionOption[]>(() => {
  return activity.questionnaire.questions.filter(q => q.id === 1 || q.id === 2)
})

// 从问卷中读取使用时长题目（固定ID=3）
const durationQuestion = computed<QuestionOption | null>(() => {
  return activity.questionnaire.questions.find(q => q.id === 3) || null
})

// 从问卷中读取使用影响题目（固定ID=4）
// 注意：如果题目标题是"我认为以上题目都不合适。"，则不显示
const impactQuestion = computed<QuestionOption | null>(() => {
  const question = activity.questionnaire.questions.find(q => q.id === 4)
  if (!question) return null
  
  // 过滤掉"我认为以上题目都不合适"这个选项，不在预览中显示
  if (question.title === '我认为以上题目都不合适。') {
    return null
  }
  
  return question
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
  position: relative;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
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

