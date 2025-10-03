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
        <template v-if="msg.type === 'ai'">
          <div class="msg-content">
            {{ msg.content }}<span v-if="isTyping && msg.id === messages[messages.length - 1].id" class="typing-cursor">|</span>
          </div>
          <div v-if="!isAsking && !isTyping && msg.id === messages[messages.length - 1].id && conversationState < 3 && currentSuggestions.length > 0" class="suggestions">
            💡 猜你想问
            <button 
              v-for="(suggestion, index) in currentSuggestions" 
              :key="index" 
              @click="handleSuggestionClick(suggestion, index)"
            >
              {{ conversationState === 1 ? (index === 0 ? '选择题' : '填空题') : suggestion }}
            </button>
            <button 
              v-if="conversationState === 2" 
              class="refresh-btn"
              @click="refreshSuggestions"
              title="刷新建议"
            >
              🔄
            </button>
          </div>
        </template>
        <div v-else class="msg-content">{{ msg.content }}</div>
      </div>
      
      <!-- 设计结果展示 -->
      <div v-if="designedQuestions.length > 0" class="designed-question">
        <div class="question-header">✨ AI 为你设计的题目</div>
        
        <!-- 单个题目显示（选择题） -->
        <div v-if="designedQuestions.length === 1" class="question-body">
          <div class="question-title">{{ designedQuestions[0].title }}</div>
          <div v-if="designedQuestions[0].options && designedQuestions[0].options.length > 0" class="question-options">
            <div v-for="(option, idx) in designedQuestions[0].options" :key="idx" class="option-item">
              <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>
        
        <!-- 多个题目显示（填空题数组） -->
        <div v-else class="fill-questions-container">
          <div 
            v-for="(question, qIdx) in designedQuestions" 
            :key="qIdx"
            :class="['question-body', 'selectable', { 'selected': selectedQuestionIndex === qIdx }]"
            @click="selectedQuestionIndex = qIdx"
          >
            <div class="question-number">题目 {{ qIdx + 1 }}</div>
            <div class="question-title">{{ question.title }}</div>
            <div v-if="selectedQuestionIndex === qIdx" class="selected-badge">✓ 已选中</div>
          </div>
        </div>
        
        <el-button type="success" @click="saveQuestion" class="save-btn">
          保存到问卷
        </el-button>
      </div>
      
      <div v-if="isAsking" class="msg ai">
        <div class="msg-content">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="ai-footer">
      <el-input 
        v-model="input" 
        placeholder="输入你的问题..." 
        @keyup.enter="send"
        :disabled="isAsking || isTyping"
      >
        <template #append>
          <el-button @click="send" :disabled="(conversationState !== 2 && !input.trim()) || isAsking || isTyping">
            发送
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useCoze, WORKFLOW } from '@/utils/coze'
import { useActivity } from '@/store/activity'
import type { QuestionOption } from '@/store/activity'

const { runWorkflow } = useCoze()
const activity = useActivity()

const API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'

// 多状态欢迎词
const WELCOME_STATE_1 = '你好！我是小敏老师，你的AI学习助手。\n我可以帮你分析设计调查问卷，请问你想设计什么类型的题目？'
const WELCOME_STATE_2 = '好的，现在请告诉我你想调查哪个方向的内容？'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
}

const messages = ref<Message[]>([])
const isAsking = ref(false)
const isTyping = ref(false)
const input = ref('')
const messagesRef = ref<HTMLElement>()
let typingTimer: number | null = null

// 状态管理
const conversationState = ref(1) // 1: 确定题型, 2: 确定方向, 3: 设计环节
const questionType = ref<string>('') // 1: 选择题, 2: 填空题
const direction = ref<string>('') // 调查方向
const suggestions = ref<string[]>(['设计一道调查数字设备使用用途的选择题', '设计一道调查数字设备使用用途的填空题']) // 动态猜你想问
const designedQuestions = ref<QuestionOption[]>([]) // 设计好的题目列表（填空题为数组）
const selectedQuestionIndex = ref(0) // 选中的题目索引

// 计算当前建议（根据状态）
const currentSuggestions = computed(() => {
  if (conversationState.value === 1) {
    return ['设计一道调查数字设备使用用途的选择题', '设计一道调查数字设备使用用途的填空题']
  } else if (conversationState.value === 2) {
    return suggestions.value
  }
  return []
})

// 组件挂载后显示欢迎词的打字机效果
onMounted(() => {
  typeWriter(WELCOME_STATE_1, 'welcome')
})

const scroll = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const send = () => ask(input.value.trim())

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

// 调用 TargetWorkflow
const callTargetWorkflow = async (index: number, userInput: string) => {
  try {
    const res = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${API_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        workflow_id: WORKFLOW.GET_TARGET,
        parameters: { 
          index,
          input: userInput
        } 
      })
    })
    
    const result = await res.json()
    if (result.code !== 0 || !result.data) {
      throw new Error('工作流调用失败')
    }
    
    return JSON.parse(result.data)
  } catch (error) {
    console.error('[AITwoCard] TargetWorkflow 调用失败:', error)
    throw error
  }
}

// 调用 GET_QUESTION 工作流
const callQuestionWorkflow = async (inputIndex: string, inputQuestion: string) => {
  try {
    console.log('[AITwoCard] GET_QUESTION 调用:', {
      input_index: inputIndex,
      input_question: inputQuestion
    })
    const result = await runWorkflow(WORKFLOW.GET_QUESTION, {
      input_index: inputIndex,
      input_question: inputQuestion
    })
    
    return JSON.parse(result)
  } catch (error) {
    console.error('[AITwoCard] GET_QUESTION 调用失败:', error)
    throw error
  }
}

// 刷新建议（状态2）
const refreshSuggestions = async () => {
  if (conversationState.value !== 2 || isAsking.value || isTyping.value) return
  
  isAsking.value = true
  
  try {
    // 调用工作流获取新的建议，传入空字符串
    const resultData = await callTargetWorkflow(2, '')
    console.log('[AITwoCard] 刷新建议结果:', resultData)
    
    isAsking.value = false
    
    // 显示消息（如果有）
    if (resultData.message_d) {
      await typeWriter(resultData.message_d, `refresh_${Date.now()}`)
    }
    
    // 更新建议
    if (resultData.class_d && Array.isArray(resultData.class_d)) {
      suggestions.value = resultData.class_d
      // 确保新建议按钮可见
      await nextTick()
      scroll()
    }
  } catch (err: any) {
    console.error('[AITwoCard] 刷新建议失败:', err)
    isAsking.value = false
    ElMessage.warning('刷新失败，请稍后再试')
  }
}

// 处理建议点击
const handleSuggestionClick = async (suggestion: string, index: number) => {
  if (conversationState.value === 1) {
    // 状态1：直接确定题型
    questionType.value = index === 0 ? 'multiple' : 'fill' // 0->1(选择题), 1->2(填空题)
    await ask(suggestion, true) // 跳过工作流，直接进入状态2
  } else if (conversationState.value === 2) {
    // 状态2：选择方向，进入状态3
    direction.value = suggestion
    // 先添加用户消息
    const userMessage = `我想问有关${suggestion}方向的题目`
    input.value = ''
    messages.value.push({ id: `u${Date.now()}`, type: 'user', content: userMessage })
    scroll()
    // 然后进入设计环节
    await proceedToDesign(suggestion)
  }
}

const ask = async (q: string, skipWorkflow: boolean = false) => {
  // 状态2允许空字符串，其他状态需要有内容
  if (conversationState.value !== 2 && !q) return
  if (isAsking.value || isTyping.value) return
  
  input.value = ''
  // 只有非空内容才添加用户消息
  if (q) {
    messages.value.push({ id: `u${Date.now()}`, type: 'user', content: q })
    scroll()
  }
  
  isAsking.value = true
  
  try {
    if (conversationState.value === 1) {
      // 状态1：确定题型
      if (skipWorkflow) {
        // 直接进入状态2
        conversationState.value = 2
        isAsking.value = false
        await typeWriter(WELCOME_STATE_2, `state2_${Date.now()}`)
        // 默认建议
        suggestions.value = ['是否监管', '使用场景']
        // 确保建议按钮可见
        await nextTick()
        scroll()
      } else {
        // 调用工作流
        const resultData = await callTargetWorkflow(1, q)
        console.log('[AITwoCard] 状态1 结果:', resultData)
        
        isAsking.value = false
        
        // 显示消息
        if (resultData.message_t) {
          await typeWriter(resultData.message_t, `a${Date.now()}`)
        }
        
        // 判断是否进入状态2
        if (resultData.target_t === 1 || resultData.target_t === 2) {
          questionType.value = resultData.target_t
          conversationState.value = 2
          await typeWriter(WELCOME_STATE_2, `state2_${Date.now()}`)
          suggestions.value = ['是否监管', '使用场景']
          // 确保建议按钮可见
          await nextTick()
          scroll()
        }
        // target_t === 3 时保持状态1
      }
    } else if (conversationState.value === 2) {
      // 状态2：确定方向
      const resultData = await callTargetWorkflow(2, q)
      console.log('[AITwoCard] 状态2 结果:', resultData)
      
      isAsking.value = false
      
      // 显示消息
      if (resultData.message_d) {
        await typeWriter(resultData.message_d, `a${Date.now()}`)
      }
      
      // 更新建议
      if (resultData.class_d && Array.isArray(resultData.class_d)) {
        suggestions.value = resultData.class_d
        // 确保建议按钮可见
        await nextTick()
        scroll()
      }
    }
  } catch (err: any) {
    console.error('[AITwoCard] 请求失败:', err)
    isAsking.value = false
    await typeWriter('抱歉，请求失败，请稍后再试。', `e${Date.now()}`)
  }
}

// 进入设计环节
const proceedToDesign = async (selectedDirection: string) => {
  if (!questionType.value) {
    ElMessage.warning('题型未确定')
    return
  }
  
  conversationState.value = 3
  isAsking.value = true
  
  try {
    // 调用 GET_QUESTION 工作流
    const resultData = await callQuestionWorkflow(questionType.value, selectedDirection)
    console.log('[AITwoCard] 设计结果:', resultData)
    
    isAsking.value = false
    
    // 解析设计好的题目
    if (resultData.output_s || resultData.output_i) {
      const newQuestions: QuestionOption[] = []
      
      if (resultData.output_s) {
        // 选择题（单个）
        newQuestions.push({
          id: 2000,  // 临时ID，提交时会设为5
          title: resultData.output_s.q || '',
          options: resultData.output_s.o || [],
          type: 'multiple',
          questionType: 'design',
          answer: ''
        })
      } else if (resultData.output_i) {
        // 填空题（数组，包含三道题）
        const fillQuestions = Array.isArray(resultData.output_i) ? resultData.output_i : [resultData.output_i]
        fillQuestions.forEach((item: any, idx: number) => {
          newQuestions.push({
            id: 2000 + idx,  // 临时ID，提交时会设为5
            title: item.q || item || '',
            options: [],
            type: 'fill',
            questionType: 'design',
            answer: ''
          })
        })
      }
      
      if (newQuestions.length > 0) {
        designedQuestions.value = newQuestions
        selectedQuestionIndex.value = 0 // 默认选中第一个
        const tipMsg = newQuestions.length > 1 
          ? `已为你设计了 ${newQuestions.length} 道题目！请选择一道保存到问卷。` 
          : '题目已设计完成！请查看下方结果。'
        await typeWriter(tipMsg, `design_${Date.now()}`)
        // 等待题目卡片渲染后再滚动
        await nextTick()
        scroll()
        // 延迟一点再滚动一次，确保题目卡片完全渲染
        setTimeout(() => scroll(), 100)
      } else {
        ElMessage.warning('没有设计题目')
      }
    } else {
      ElMessage.warning('设计结果格式异常')
    }
  } catch (error: any) {
    console.error('[AITwoCard] 设计失败:', error)
    isAsking.value = false
    await typeWriter('抱歉，题目设计失败，请重试。', `e${Date.now()}`)
  }
}

// 保存题目到问卷
const saveQuestion = () => {
  if (designedQuestions.value.length === 0 || !activity.ac2_2_stuDesignResult) return
  
  // 保存选中的题目
  const selectedQuestion = designedQuestions.value[selectedQuestionIndex.value]
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
  const rating = activity.ac2_2_stuDesignResult.rating.find(r => r.index === 2)
  if (rating) rating.score = 1
  
  // 更新提交时间
  activity.ac2_2_stuDesignResult.submittedAt = Date.now()
  
  ElMessage.success('二星挑战完成！题目已加入问卷')
  
  // 可以选择重置状态或保留
  // resetConversation()
}

const clearChat = () => {
  // 清除可能正在进行的打字动画
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
  isTyping.value = false
  messages.value = []
  input.value = ''
  
  // 重置状态
  conversationState.value = 1
  questionType.value = ''
  direction.value = ''
  suggestions.value = ['设计一道调查数字设备使用用途的选择题', '设计一道调查数字设备使用用途的填空题']
  designedQuestions.value = []
  selectedQuestionIndex.value = 0
  
  // 重新显示欢迎词的打字机效果
  typeWriter(WELCOME_STATE_1, 'welcome')
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

.suggestions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f0f9ff;
  border: 1px dashed #bae6fd;
  border-radius: 8px;
  font-size: 12px;
  color: #0369a1;
  font-weight: 500;
  animation: fadeInSuggestions 0.4s ease;
}

@keyframes fadeInSuggestions {
  from { 
    opacity: 0; 
    transform: translateY(-8px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.suggestions button {
  padding: 4px 10px;
  font-size: 11px;
  background: white;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  color: #0369a1;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestions button:hover {
  background: #0ea5e9;
  color: white;
  border-color: #0ea5e9;
}

.refresh-btn {
  padding: 4px 8px !important;
  font-size: 14px !important;
  background: white;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  margin-left: auto;
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

/* 设计题目展示 */
.designed-question {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 2px solid #86efac;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
  animation: fadeInSuggestions 0.5s ease;
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

.fill-questions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.question-body {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  position: relative;
}

.question-body.selectable {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  margin-bottom: 0;
}

.question-body.selectable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
  border-color: #86efac;
}

.question-body.selectable.selected {
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

.designed-question .option-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.designed-question .option-label {
  font-weight: 600;
  color: #059669;
  min-width: 25px;
}

.designed-question .option-text {
  flex: 1;
}

.save-btn {
  width: 100%;
  font-weight: 600;
}

.ai-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;
}
</style>

