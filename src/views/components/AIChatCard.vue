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
          <div v-if="!isTyping || msg.id !== messages[messages.length - 1].id" class="suggestions">
            💡 猜你想问
            <button @click="ask('我认为使用数字设备利大于弊')">利大于弊</button>
            <button @click="ask('我认为使用数字设备弊大于利')">弊大于利</button>
          </div>
        </template>
        <div v-else class="msg-content">{{ msg.content }}</div>
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
          <el-button @click="send" :disabled="!input.trim() || isAsking || isTyping">
            发送
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

const WORKFLOW_ID = '7554010166815899682'
const API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WELCOME = '你好！我是小敏老师，你的AI学习助手。\n我可以帮你分析观点、提供论据建议。有什么问题随时问我！'

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

const ask = async (q: string) => {
  if (!q || isAsking.value || isTyping.value) return
  
  input.value = ''
  messages.value.push({ id: `u${Date.now()}`, type: 'user', content: q })
  scroll()
  
  isAsking.value = true
  try {
    const res = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${API_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        workflow_id: WORKFLOW_ID, 
        parameters: { input_type: q } 
      })
    })
    
    const result = await res.json()
    const data = result.code === 0 && result.data ? JSON.parse(result.data) : {}
    const reply = (data.output || []).slice(0, 5).filter((t: string) => t?.trim()).join('\n\n') || '抱歉，我遇到了一些问题。'
    
    isAsking.value = false
    
    // 使用打字机效果显示回复
    await typeWriter(reply, `a${Date.now()}`)
  } catch (err) {
    isAsking.value = false
    await typeWriter('抱歉，请求失败，请稍后再试。', `e${Date.now()}`)
  }
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
}
</style>

