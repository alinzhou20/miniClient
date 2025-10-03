<template>
  <div class="ai-chat">
    <!-- 头部 -->
    <div class="ai-header">
      <div class="ai-title">小敏老师</div>
      <button class="clear-btn" @click="clearChat">清空</button>
    </div>
    
    <!-- 消息区域 -->
    <div class="ai-body" ref="messagesRef">
      <div v-for="msg in messages" :key="msg.id" :class="['msg', msg.type]">
        <div class="msg-content">
          {{ msg.content }}<span v-if="isTyping && msg.id === messages[messages.length - 1].id" class="typing-cursor">|</span>
        </div>
      </div>
      
      <!-- 生成的题目展示 -->
      <div v-if="generatedQuestions.length > 0" class="generated-questions">
        <div class="question-header">✨ AI 为你生成的题目</div>
        <div class="questions-container">
          <div 
            v-for="(question, qIdx) in generatedQuestions" 
            :key="qIdx"
            :class="['question-card', { 'selected': selectedQuestionIndex === qIdx }]"
            @click="selectedQuestionIndex = qIdx"
          >
            <div class="question-number">方式 {{ qIdx + 1 }}</div>
            <div class="question-title">{{ question.title }}</div>
            <div v-if="question.options && question.options.length > 0" class="question-options">
              <div v-for="(option, idx) in question.options" :key="idx" class="option-item">
                <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>
            <div v-if="selectedQuestionIndex === qIdx" class="selected-badge">✓ 已选中</div>
          </div>
        </div>
      </div>
      
      <div v-if="isAsking" class="msg ai">
        <div class="msg-content">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="ai-footer">
      <el-button 
        type="primary" 
        size="large"
        @click="generateQuestions" 
        :disabled="isAsking || isTyping || generatedQuestions.length > 0"
        class="action-btn"
      >
        <span>一键生成</span>
      </el-button>
      <el-button 
        type="success" 
        size="large"
        @click="submitChallenge" 
        :disabled="generatedQuestions.length === 0 || isAsking || isTyping"
        class="action-btn"
      >
        <span>加入问卷</span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useActivity } from '@/store/activity'
import type { QuestionOption, Rating } from '@/store/activity'

const activity = useActivity()

const WELCOME = '你好！我是小敏老师，你的AI学习助手。\n\n点击下方"一键生成"按钮，我将为你生成多个题目方案供你选择！'

// 预设题目方案
const PRESET_QUESTIONS: QuestionOption[] = [
  {
    id: 1,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '运动', '交流', '旅游'],
    type: 'multiple',
    questionType: 'design',
    answer: ''
  },
  {
    id: 2,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '娱乐'],
    type: 'multiple',
    questionType: 'design',
    answer: ''
  },
  {
    id: 3,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '运动', '娱乐', '交流', '旅游', '其他_____'],
    type: 'multiple',
    questionType: 'design',
    answer: ''
  }
]

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
}

const messages = ref<Message[]>([])
const isAsking = ref(false)
const isTyping = ref(false)
const messagesRef = ref<HTMLElement>()
const generatedQuestions = ref<QuestionOption[]>([])
const selectedQuestionIndex = ref(0)
let typingTimer: number | null = null

// 组件挂载后显示欢迎词的打字机效果
onMounted(() => {
  typeWriter(WELCOME, 'welcome')
})

const scroll = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

// 生成题目
const generateQuestions = async () => {
  if (isAsking.value || isTyping.value) return
  
  isAsking.value = true
  
  try {
    // 显示生成消息
    await typeWriter('正在为你生成题目方案...', `gen_${Date.now()}`)
    
    // 模拟延迟，让用户感受到生成过程
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 使用所有预设题目（临时ID，提交时会设为5）
    generatedQuestions.value = PRESET_QUESTIONS.map((q, idx) => ({
      ...q,
      id: 1000 + idx  // 临时ID，避免冲突
    }))
    
    selectedQuestionIndex.value = 0
    
    isAsking.value = false
    
    // 显示完成消息
    await typeWriter('已为你生成 3 个题目方案！请选择一个点击"加入问卷"。', `done_${Date.now()}`)
    
    // 滚动到底部
    await nextTick()
    scroll()
    setTimeout(() => scroll(), 100)
  } catch (error: any) {
    console.error('[AIOneCard] 生成失败:', error)
    isAsking.value = false
    await typeWriter('抱歉，生成失败，请重试。', `e${Date.now()}`)
  }
}

// 加入问卷
const submitChallenge = () => {
  if (generatedQuestions.value.length === 0 || !activity.ac2_2_stuDesignResult) return
  
  try {
    // 保存选中的题目
    const selectedQuestion = generatedQuestions.value[selectedQuestionIndex.value]
    activity.ac2_2_stuDesignResult.designQuestion = selectedQuestion
    
    // 将题目加入问卷（固定ID=5）
    const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 5)
    const newQuestionForQuestionnaire: QuestionOption = {
      ...selectedQuestion,
      id: 5  // 固定ID为5（使用用途题目）
    }
    
    if (existingIndex !== -1) {
      activity.questionnaire.questions[existingIndex] = newQuestionForQuestionnaire
    } else {
      activity.questionnaire.questions.push(newQuestionForQuestionnaire)
    }
    
    // 更新评分 - 二星挑战完成
    const rating = activity.ac2_2_stuDesignResult.rating.find((r: Rating) => r.index === 1)
    if (rating) rating.score = 1
    
    // 更新提交时间
    activity.ac2_2_stuDesignResult.submittedAt = Date.now()
    
    ElMessage.success('二星挑战完成！题目已加入问卷')
  } catch (error: any) {
    console.error('[AIOneCard] 提交失败:', error)
    ElMessage.error(`提交失败: ${error.message}`)
  }
}

// 打字机效果函数 - 使用 setInterval 逐字显示
const typeWriter = (text: string, messageId: string): Promise<void> => {
  return new Promise((resolve) => {
    isTyping.value = true
    
    // 创建一个空的 AI 消息
    const aiMessage: Message = { id: messageId, type: 'ai', content: '' }
    messages.value.push(aiMessage)
    scroll()
    
    let currentIndex = 0
    const chars = Array.from(text) // 使用 Array.from 正确处理 emoji 等特殊字符
    let displayedContent = '' // 累积显示的内容
    
    // 使用 setInterval 逐字添加
    typingTimer = window.setInterval(() => {
      if (currentIndex < chars.length) {
        // 累积内容
        displayedContent += chars[currentIndex]
        
        // 找到消息并更新（强制触发响应式）
        const msgIndex = messages.value.findIndex(m => m.id === messageId)
        if (msgIndex !== -1) {
          // 创建新数组以强制触发 Vue 响应式更新
          const newMessages = [...messages.value]
          newMessages[msgIndex] = {
            ...newMessages[msgIndex],
            content: displayedContent
          }
          messages.value = newMessages
        }
        
        currentIndex++
        
        // 每几个字符滚动一次
        if (currentIndex % 5 === 0) {
          scroll()
        }
      } else {
        // 打字完成
        if (typingTimer) {
          clearInterval(typingTimer)
          typingTimer = null
        }
        scroll()
        isTyping.value = false
        resolve()
      }
    }, 50) // 每 50ms 添加一个字符
  })
}

const clearChat = () => {
  // 清除可能正在进行的打字动画
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
  isTyping.value = false
  messages.value = []
  generatedQuestions.value = []
  selectedQuestionIndex.value = 0
  // 重新显示欢迎词的打字机效果
  typeWriter(WELCOME, 'welcome')
}
</script>

<style scoped>
.ai-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid #B6E1FF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(182, 225, 255, 0.3);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #B6E1FF, #8EC5FC);
  border-bottom: 2px solid #B6E1FF;
  border-radius: 14px 14px 0 0;
}

.ai-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.clear-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f0f9ff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}

.msg.user {
  align-items: flex-end;
}

.msg-content {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  background: white;
  color: #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 90%;
}

.msg.user .msg-content {
  background: #3b82f6;
  color: white;
}

/* 生成的题目展示 */
.generated-questions {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  animation: fadeIn 0.5s ease;
}

.question-header {
  font-size: 16px;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
  border-color: #86efac;
}

.question-card.selected {
  border-color: #059669;
  background: linear-gradient(135deg, #ffffff, #f0fdf4);
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
}

.question-number {
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #059669;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  animation: fadeIn 0.3s ease;
}

.question-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.6;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
}

.option-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.option-label {
  font-weight: 600;
  color: #059669;
  min-width: 25px;
}

.option-text {
  flex: 1;
}

.typing {
  display: flex;
  gap: 4px;
}

.typing span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; transform: translateY(-4px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 打字光标 */
.typing-cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  color: #3b82f6;
  font-weight: bold;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ai-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;
  display: flex;
  gap: 12px;
  background: white;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

