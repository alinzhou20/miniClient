<template>
  <div class="chat-page">
    <el-card class="chat-card">
      <template #header>
        <div class="card-header">
          <span>AI 对话（通义千问·OpenAI兼容）</span>
        </div>
      </template>

      <div class="messages" ref="listRef">
        <div v-for="(m, idx) in messages" :key="idx" class="msg" :class="m.role">
          <div class="role">{{ m.role === 'user' ? '我' : 'AI' }}</div>
          <div class="bubble" v-html="format(m.content)"></div>
        </div>
      </div>

      <div class="composer">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          placeholder="输入要提问的内容..."
          :disabled="loading"
          @keydown.enter.exact.prevent="send"
        />
        <div class="actions">
          <el-button :loading="loading" type="primary" @click="send">发送</el-button>
          <el-button :disabled="!messages.length" @click="clearChat" text>清空</el-button>
        </div>
      </div>

    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import OpenAI from 'openai'

const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const input = ref('')
const loading = ref(false)
const listRef = ref<HTMLElement | null>(null)
// 固定模型为 qwen-plus
const MODEL = 'qwen-plus'

// 优先使用环境变量，其次用用户输入
const apiKey = ref<string>((import.meta.env.VITE_DASHSCOPE_API_KEY as string) || '')

function format(text: string) {
  return text.replace(/\n/g, '<br/>')
}

function scrollToBottom() {
  nextTick(() => {
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function getClient() {
  const key = apiKey.value?.trim()
  if (!key) throw new Error('请先在顶部输入 API Key 或配置环境变量 VITE_DASHSCOPE_API_KEY')
  const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    dangerouslyAllowBrowser: true // 浏览器环境使用
  })
  return client
}

async function send() {
  if (!input.value.trim()) return
  if (loading.value) return

  const userText = input.value.trim()
  input.value = ''
  messages.value.push({ role: 'user', content: userText })
  messages.value.push({ role: 'assistant', content: '' })
  scrollToBottom()
  loading.value = true

  try {
    const client = getClient()
    // 组装上下文
    const history = messages.value.map(m => ({ role: m.role, content: m.content }))

    // 使用流式输出
    // 兼容OpenAI SDK：stream: true 时返回 AsyncIterable，可逐段读取 delta.content
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: history,
      stream: true
    } as any)

    for await (const part of stream as any) {
      const delta = part?.choices?.[0]?.delta
      const content = delta?.content || ''
      if (content) {
        // 将最后一条 assistant 内容增量拼接
        const lastIdx = messages.value.length - 1
        if (lastIdx >= 0 && messages.value[lastIdx].role === 'assistant') {
          messages.value[lastIdx].content += content
          scrollToBottom()
        }
      }
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '请求失败')
  } finally {
    loading.value = false
  }
}

function clearChat() {
  messages.value = []
}
</script>

<style scoped>
.chat-page { max-width: 980px; margin: 0 auto; padding: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.messages { height: 50vh; overflow: auto; padding: 8px; background: #fafafa; border-radius: 8px; }
.msg { display: flex; gap: 8px; margin-bottom: 10px; }
.msg .role { font-weight: 700; color: #666; width: 36px; text-align: right; }
.msg .bubble { background: #fff; border: 1px solid #eee; padding: 8px 10px; border-radius: 8px; flex: 1; }
.msg.user .bubble { background: #eef6ff; border-color: #dbeafe; }
.msg.assistant .bubble { background: #fff; }
.composer { margin-top: 10px; }
.actions { margin-top: 6px; display: flex; gap: 8px; }
</style>
