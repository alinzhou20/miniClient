<template>
  <div class="question-bank-container">
    <div class="question-bank-card">
      <!-- 卡片标题 -->
      <div class="bank-title">{{ title }}</div>
      
      <!-- 卡片说明 -->
      <div class="bank-intro">
        <p class="intro-text">{{ description }}</p>
      </div>
       
      <!-- 题目列表 -->
      <div class="question-list">        
        <div 
          v-for="question in questions" 
          :key="question.id"
          class="question-item"
          :class="{ 'selected': selectedId === question.id }"
          @click="selectQuestion(question.id)"
        >
          <div class="question-header">
            <span class="question-number">{{ getQuestionNumber(question.id) }}.</span>
            <span class="question-title">{{ question.title }}</span>
            <el-icon 
              class="check-icon"
              :class="{ 'is-visible': selectedId === question.id }"
            >
              <CircleCheck />
            </el-icon>
          </div>
          
          <div v-if="question.options && question.options.length > 0" class="question-options">
            <div v-for="(opt, idx) in question.options" :key="idx" class="option-text">
              {{ opt }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 理由部分 -->
      <div v-if="showReason && selectedId !== null" class="reason-section">
        <div class="reason-row">
          <label class="reason-label" :class="{ 'typing': isTyping }">
            <span v-for="(char, index) in labelChars" :key="index" class="char" :style="{ animationDelay: `${index * 0.1}s` }">
              {{ char }}
            </span>
          </label>
          <el-checkbox 
            v-model="hasReason"
            size="large"
            class="checkbox-fade-in"
            :class="{ 'visible': showCheckbox }"
          >
            小组已讨论理由
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleCheck } from '@element-plus/icons-vue'
import { useActivity } from '@/store/activity'
import type { QuestionOption } from '@/store/activity'

interface Props {
  title: string
  description: string
  questions: QuestionOption[]
  type: 'duration' | 'impact'  // 题库类型
  showReason?: boolean  // 是否显示理由部分，默认为 true
}

const props = withDefaults(defineProps<Props>(), {
  showReason: true
})

const activity = useActivity()

// 打字机效果状态
const isTyping = ref(false)
const showCheckbox = ref(false)
const labelChars = ref<string[]>([])
const labelText = '选择理由：'

// 根据类型获取当前选中的题目ID
const selectedId = computed(() => {
  if (!activity.ac2_1_stuSelectResult) return null
  return props.type === 'duration' 
    ? activity.ac2_1_stuSelectResult.selectedDurationQuestion
    : activity.ac2_1_stuSelectResult.selectedImpactQuestion
})

// 触发打字机效果
const triggerTypingEffect = () => {
  // 重置状态
  isTyping.value = true
  showCheckbox.value = false
  labelChars.value = []
  
  // 逐字添加文字
  const chars = Array.from(labelText)
  chars.forEach((char, index) => {
    setTimeout(() => {
      labelChars.value.push(char)
      
      // 最后一个字符添加后，显示复选框
      if (index === chars.length - 1) {
        setTimeout(() => {
          isTyping.value = false
          showCheckbox.value = true
        }, 100)
      }
    }, index * 100) // 每个字符间隔100ms
  })
}

// 重置打字机效果
const resetTypingEffect = () => {
  isTyping.value = false
  showCheckbox.value = false
  labelChars.value = []
}

// 监听题目选择变化，触发打字机效果
watch(selectedId, (newVal, oldVal) => {
  if (newVal !== null && newVal !== oldVal) {
    // 选中了新题目，触发打字机效果
    triggerTypingEffect()
  } else if (newVal === null) {
    // 取消选择，重置状态
    resetTypingEffect()
  }
}, { immediate: true })

// 根据类型获取理由状态
const hasReason = computed({
  get: () => {
    if (!activity.ac2_1_stuSelectResult) return false
    const reason = props.type === 'duration'
      ? activity.ac2_1_stuSelectResult.durationReason
      : activity.ac2_1_stuSelectResult.impactReason
    return !!reason
  },
  set: (value: boolean) => {
    if (!activity.ac2_1_stuSelectResult) return
    const reasonText = value ? '已讨论' : ''
    if (props.type === 'duration') {
      activity.ac2_1_stuSelectResult.durationReason = reasonText
    } else {
      activity.ac2_1_stuSelectResult.impactReason = reasonText
    }
  }
})

// 获取题目序号
const getQuestionNumber = (id: number): number => {
  const index = props.questions.findIndex(q => q.id === id)
  return index + 1
}

// 选择题目 - 直接修改 store 并添加到问卷
const selectQuestion = (id: number) => {
  if (!activity.ac2_1_stuSelectResult) return
  
  if (props.type === 'duration') {
    // 时长题目：正常保存选择
    activity.ac2_1_stuSelectResult.selectedDurationQuestion = id
    
    // 添加到问卷（固定ID=3）
    const selectedQ = props.questions.find(q => q.id === id)
    if (selectedQ) {
      const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 3)
      const newQuestion: QuestionOption = {
        ...selectedQ,
        id: 3  // 固定ID为3
      }
      
      if (existingIndex !== -1) {
        activity.questionnaire.questions[existingIndex] = newQuestion
      } else {
        activity.questionnaire.questions.push(newQuestion)
      }
    }
  } else {
    // 影响题目：正常保存选择
    activity.ac2_1_stuSelectResult.selectedImpactQuestion = id
    
    // 检查是否选择了"我认为以上题目都不合适"（题目4）
    const selectedQ = props.questions.find(q => q.id === id)
    const isNotSuitableOption = selectedQ?.title === '我认为以上题目都不合适。'
    
    if (isNotSuitableOption) {
      // 如果是"不合适"选项，从问卷中移除（不显示在预览中）
      const index = activity.questionnaire.questions.findIndex(q => q.id === 4)
      if (index !== -1) {
        activity.questionnaire.questions.splice(index, 1)
      }
    } else {
      // 其他选项正常添加到问卷（固定ID=4）
      if (selectedQ) {
        const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 4)
        const newQuestion: QuestionOption = {
          ...selectedQ,
          id: 4  // 固定ID为4
        }
        
        if (existingIndex !== -1) {
          activity.questionnaire.questions[existingIndex] = newQuestion
        } else {
          activity.questionnaire.questions.push(newQuestion)
        }
      }
    }
  }
}
</script>

<style scoped>
.question-bank-container {
  margin: 0 auto;
}

.question-bank-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-height: 10000px;
}

/* 卡片标题 */
.bank-title {
  font-size: 18px;
  font-weight: 800;
  color: #0ea5e9;
  margin-bottom: 10px;
  line-height: 1.4;
}

/* 卡片说明 */
.bank-intro {
  margin-bottom: 8px;
}

.intro-text {
  font-size: 14px;
  font-weight: 900;
  color: #4b5563;
  text-indent: 2em;
  margin: 0;
}

/* 分隔线 */
.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
  margin: 2px 0;
}

.section-tip {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 16px;
  line-height: 1.6;
}

/* 题目项样式 - 参考问卷预览 */
.question-item {
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
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding-right: 28px;
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  min-width: 28px;
}

.question-title {
  flex: 1;
  font-size: 15px;
  color: #1f2937;
  line-height: 1.2;
}

.check-icon {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 20px;
  color: #10b981;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.check-icon.is-visible {
  opacity: 1;
}

/* 选项区域 - 参考问卷预览 */
.question-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 28px;
}

.option-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
}

.option-text::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  flex-shrink: 0;
  background: white;
}

/* 理由部分 */
.reason-section {
  padding-top: 4px;
  border-top: 2px solid #f0f0f0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reason-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.reason-label {
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  display: inline-flex;
}

/* 打字机效果 */
.reason-label .char {
  opacity: 0;
  animation: charFadeIn 0.1s ease forwards;
}

@keyframes charFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reason-label.typing .char {
  color: #0ea5e9;
}

/* 复选框渐入效果 */
.checkbox-fade-in {
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.checkbox-fade-in.visible {
  opacity: 1;
  transform: translateX(0);
}

/* 自定义复选框样式 */
.reason-row :deep(.el-checkbox) {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
}

.reason-row :deep(.el-checkbox__input) {
  transform: scale(1.3);
}

.reason-row :deep(.el-checkbox__label) {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  padding-left: 8px;
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
</style>


