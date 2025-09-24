<template>
  <div class="survey-monitor">
    <!-- 操作要求模块 -->
    <div class="task-block">
      <div class="op-title">3.协作问卷设计</div>
      <div class="op-text"><span style="font-weight: bold;">设计</span>新的问题并与同学协作，<span style="font-weight: bold;">选择</span>合适的问题组成完整的问卷</div>
    </div>
    
    <!-- 两栏布局：左侧设计+筛选+网格；右侧选中预览侧栏 -->
    <div class="layout">
      <div class="main">
        <!-- 问题设计板块 -->
        <div class="design-panel" ref="designPanelRef">
          <el-card class="design-card" shadow="never">
            <template #header>
              <div class="design-header">
                <span class="design-title">问题设计</span>
                <div class="design-actions">
                  <el-button size="small" type="primary" :icon="ChatDotRound" @click="openAIHelper">AI求助</el-button>
                  <el-button size="small" type="success" :disabled="!canSubmitDesign" @click="submitDesign">发送设计</el-button>
                </div>
              </div>
            </template>
            <div class="design-body">
              <div class="design-form">
                <div class="form-row">
                  <label class="form-label">问题类型：</label>
                  <el-select v-model="designForm.type" placeholder="选择问题类型" size="small" style="width: 120px;">
                    <el-option label="单选题" value="single" />
                    <el-option label="多选题" value="multi" />
                    <el-option label="填空题" value="text" />
                    <el-option label="说明" value="description" />
                  </el-select>
                </div>
                <div class="form-row">
                  <label class="form-label">问题内容：</label>
                  <el-input 
                    v-model="designForm.text" 
                    placeholder="请输入问题内容" 
                    size="small"
                    style="flex: 1;"
                    maxlength="200"
                    show-word-limit
                  />
                </div>
                <div v-if="designForm.type === 'single' || designForm.type === 'multi'" class="form-row options-row">
                  <label class="form-label">选项内容：</label>
                  <div class="options-container">
                    <div v-for="(_option, oi) in designForm.options" :key="oi" class="option-item">
                      <span class="option-letter">{{ letter(oi) }}.</span>
                      <el-input 
                        v-model="designForm.options[oi]" 
                        placeholder="请输入选项内容" 
                        size="small"
                        maxlength="100"
                        @keydown.enter="addOption"
                      />
                      <el-button 
                        size="small" 
                        type="danger" 
                        :icon="Delete" 
                        circle
                        :disabled="designForm.options.length <= 2"
                        @click="removeOption(oi)"
                      />
                    </div>
                    <el-button 
                      size="small" 
                      type="primary" 
                      :icon="Plus" 
                      :disabled="designForm.options.length >= 8"
                      @click="addOption"
                    >
                      添加选项
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 卡片网格（每卡片仅展示一道题目） -->
        <div class="card-grid">
          <el-card
            v-for="item in filteredQuestions"
            :key="item.key + '-' + ((item.q as any).id || item.idx)"
            class="survey-card"
            shadow="hover"
          >
            <div class="pv-item" :class="{ selected: isSelected(item.key, (item.q as any).id) }">
              <!-- 左上角标注 -->
              <div class="pv-tags">
                <span class="type-tag" :class="item.isDescription ? 'desc-tag' : 'question-tag'">{{ item.isDescription ? '说明' : '问题' }}</span>
                <span class="source-tag">{{ getSourceLabel((item.q as any).source) }}</span>
              </div>
              <div class="pv-row">
                <div class="pv-content">
                  <div class="pv-q" :class="{ 'desc-only': item.isDescription }">
                    {{ (item.q as any).text || '（未命名内容）' }}
                  </div>
                  <!-- 如果是说明部分，不显示任何选项 -->
                  <template v-if="!item.isDescription">
                    <template v-if="(item.q as any).type === 'single'">
                      <el-radio-group>
                        <el-radio v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi" :label="oi" disabled>
                          {{ opt || `${letter(oi)}. 选项` }}
                        </el-radio>
                      </el-radio-group>
                    </template>
                    <template v-else-if="(item.q as any).type === 'multi'">
                      <el-checkbox-group>
                        <el-checkbox v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi" :label="oi" disabled>
                          {{ opt || `${letter(oi)}. 选项` }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </template>
                    <template v-else>
                      <div class="pv-blank" aria-hidden="true"></div>
                    </template>
                  </template>
                </div>
                <div class="pv-check">
                  <el-checkbox
                    size="large"
                    :model-value="isSelected(item.key, (item.q as any).id)"
                    @change="() => toggleSelect(item.key, (item.q as any).id)"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <aside class="side">
        <!-- 选中题目渲染卡片（右侧侧栏） -->
        <el-card class="selected-card" shadow="never">
          <template #header>
            <div class="sel-head">
              <!-- 操作按钮移到最上方 -->
              <div class="sel-actions">
                <el-button size="default" type="success" :disabled="!questionOnlyList.length" @click="sendSelectedToTeacher">重新提交</el-button>
                <el-button size="default" :disabled="!selectedList.length" @click="clearSelected">清空</el-button>
              </div>
              <div class="pv-title">数字设备对学习的利与弊调查问卷</div>
              <div class="pv-desc">{{ currentDescription }}</div>
            </div>
          </template>
          <div class="sel-body">
            <div class="sel-item" v-for="(item, idx) in questionOnlyList" :key="item.key + '-' + item.qid">
              <div class="q-block">
                <div class="q-head">
                  <span class="q-index">{{ idx + 1 }}.</span>
                  <span class="q-text">{{ item.q.text || '（未命名题目）' }}</span>
                  <span class="q-type">{{ typeTag(item.q.type) }}</span>
                </div>
                <div v-if="Array.isArray((item.q as any).options)" class="q-opts">
                  <div class="q-opt" v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi">{{ letter(oi) }}. {{ opt }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </aside>
    </div>

    <!-- AI助手对话框 -->
    <el-dialog
      v-model="aiDialogVisible"
      title="AI问卷设计助手"
      width="600px"
      :before-close="closeAIDialog"
    >
      <div class="ai-chat-container">
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(message, index) in chatMessages" :key="index" class="message-item" :class="message.role">
            <div class="message-avatar">
              <el-icon v-if="message.role === 'assistant'"><ChatDotRound /></el-icon>
              <el-icon v-else><User /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
            </div>
          </div>
          <div v-if="isAIThinking" class="message-item assistant">
            <div class="message-avatar">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text thinking">AI正在思考中...</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请描述您想设计的问卷主题或具体问题，例如：关于学习效率的调查问卷"
            @keydown.ctrl.enter="sendMessage"
            :disabled="isAIThinking"
          />
          <div class="input-actions">
            <span class="input-hint">Ctrl+Enter 发送</span>
            <el-button type="primary" @click="sendMessage" :loading="isAIThinking" :disabled="!userInput.trim()">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'
import { socketService } from '@/services/socket'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Plus, Delete, User, ChatDotRound } from '@element-plus/icons-vue'
import { CozeAPI } from '@coze/api'

type QSingle = { id: string; type: 'single'; text: string; options: string[]; index?: number; createdAt?: number; source?: number }
type QMulti = { id: string; type: 'multi'; text: string; options: string[]; index?: number; createdAt?: number; source?: number }
type QText = { id: string; type: 'text'; text: string; index?: number; createdAt?: number; source?: number }
type QDescription = { id: string; type: 'description'; text: string; index?: number; createdAt?: number; source?: number }

interface SurveyPayload {
  type: 'survey'
  from: { groupNo: string; studentNo: string }
  data: {
    title: string;
    version?: number;
    author?: { groupNo: string; studentNo: string };
    topic?: string;
    formattedText?: string;
    descriptions: Array<QDescription>;
    questions: Array<QSingle | QMulti | QText>;
  }
  at: number
}

interface DesignPayload {
  type: 'design'  // 数据类型，表示这是设计的问题
  from: { groupNo: string; studentNo: string }
  data: QSingle | QMulti | QText | QDescription
  at: number
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const designPanelRef = ref()
const store = reactive(new Map<string, SurveyPayload>())
const designStore = reactive(new Map<string, DesignPayload>())

// 问题设计表单
const designForm = reactive<{
  type: 'single' | 'multi' | 'text' | 'description'
  text: string
  options: string[]
}>({
  type: 'single',
  text: '',
  options: ['', '']
})

// AI助手相关状态
const aiDialogVisible = ref(false)
const chatMessages = reactive<ChatMessage[]>([])
const userInput = ref('')
const isAIThinking = ref(false)
const chatMessagesRef = ref()

// 行聚合：同一小组仅保留最新一份（覆盖）
const rows = computed(() => {
  const latestByGroup = new Map<string, SurveyPayload>()
  Array.from(store.values()).forEach(p => {
    const g = String(p.from.groupNo)
    const prev = latestByGroup.get(g)
    if (!prev || (p.at || 0) > (prev.at || 0)) {
      latestByGroup.set(g, p)
    }
  })
  return Array.from(latestByGroup.values()).map(p => ({
    groupNo: String(p.from.groupNo),
    studentNo: String(p.from.studentNo),
    title: p.data?.title || '',
    qCount: p.data?.questions?.length || 0,
    at: p.at || Date.now(),
    key: `${p.from.groupNo}` // 以小组作为 key
  })).sort((a,b) => b.at - a.at)
})

// 设计题目行聚合
const designRows = computed(() => {
  return Array.from(designStore.values()).map(p => ({
    groupNo: String(p.from.groupNo),
    studentNo: String(p.from.studentNo),
    question: p.data,
    at: p.at || Date.now(),
    key: `design-${p.from.groupNo}-${p.from.studentNo}-${p.at}`
  })).sort((a,b) => b.at - a.at)
})

// 工具栏过滤
const filter = reactive({ group: '', student: '', keyword: '', topic: '' })
const filtered = computed(() => {
  const kw = filter.keyword.trim().toLowerCase()
  return rows.value.filter(r => {
    const matchGroup = !filter.group || r.groupNo === filter.group
    const matchStu = !filter.student || r.studentNo === filter.student
    const topicVal = (getByKey(r.key)?.data as any)?.topic || ''
    const matchTopic = !filter.topic || String(topicVal) === String(filter.topic)
    let matchKw = true
    if (kw) {
      const payload = getByKey(r.key)
      const inTitle = (r.title || '').toLowerCase().includes(kw)
      const inQuestions = !!payload?.data?.questions?.some(q => (q.text || '').toLowerCase().includes(kw))
      matchKw = inTitle || inQuestions
    }
    return matchGroup && matchStu && matchTopic && matchKw
  })
})

// 将小组维度的 filtered 行展开为题目维度，包含descriptions和questions
const filteredQuestions = computed(() => {
  const out: Array<{ key: string; q: any; idx: number; isDescription?: boolean }> = []
  const banMarkers = ['[量表题]', '[矩阵题]', '[排序题]']
  
  // 添加设计题目（隐藏第0组，每组仅显示最新的一道题目）
  const latestDesignByGroup = new Map<string, any>()
  designRows.value.forEach(row => {
    const q = row.question
    const allowType = q.type === 'single' || q.type === 'multi' || q.type === 'text' || q.type === 'description'
    const sourceGroup = parseInt(row.groupNo) || 0
    // 隐藏第0组的卡片
    if (allowType && sourceGroup !== 0) {
      const groupKey = row.groupNo
      const existing = latestDesignByGroup.get(groupKey)
      if (!existing || row.at > existing.at) {
        latestDesignByGroup.set(groupKey, {
          key: row.key, 
          q: { ...q, source: sourceGroup }, 
          idx: 0, 
          isDescription: q.type === 'description',
          at: row.at
        })
      }
    }
  })
  
  // 添加每组最新的设计题目
  latestDesignByGroup.forEach(item => {
    out.push({
      key: item.key,
      q: item.q,
      idx: item.idx,
      isDescription: item.isDescription
    })
  })
  
  // 添加问卷题目（隐藏第0组）
  filtered.value.forEach(row => {
    const payload = getByKey(row.key)
    
    // 添加描述项
    const descriptions = payload?.data?.descriptions || []
    descriptions.forEach((desc: any, i: number) => {
      // 隐藏第0组的卡片
      if ((desc.source || 0) !== 0) {
        out.push({ key: row.key, q: desc, idx: i, isDescription: true })
      }
    })
    
    // 添加问题项
    const qs = payload?.data?.questions || []
    qs.forEach((q: any, i: number) => {
      const t = (q?.type || '').toLowerCase()
      const text = String(q?.text || '')
      const allowType = t === 'single' || t === 'multi' || t === 'text'
      const hasBanMarker = banMarkers.some(m => text.includes(m))
      // 隐藏第0组的卡片
      if (allowType && !hasBanMarker && (q.source || 0) !== 0) {
        out.push({ key: row.key, q, idx: i, isDescription: false })
      }
    })
  })
  return out
})

// 卡片内选项字母与访问器
function getByKey(key: string): SurveyPayload | null {
  // 按小组作为 key，需从 latestByGroup 视角获取；此处简单遍历 store 中同组最新一条
  let latest: SurveyPayload | null = null
  Array.from(store.values()).forEach(p => {
    if (String(p.from.groupNo) !== String(key)) return
    if (!latest || (p.at || 0) > (latest.at || 0)) latest = p
  })
  return latest
}
function letter(i: number): string { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[i] || '?' }

// 选中（按卡片-小组维度）
type UIState = { selected: string[] }
const ui = reactive(new Map<string, UIState>())
function uiGet(key: string): UIState {
  if (!ui.has(key)) ui.set(key, { selected: [] })
  return ui.get(key)!
}
function isSelected(key: string, qid: string): boolean {
  const s = uiGet(key).selected
  return s.includes(qid)
}
// 全局选择顺序（跨小组）
const selectedGlobal = reactive<Array<{ key: string; qid: string }>>([])
function toggleSelect(key: string, qid: string) {
  const s = uiGet(key).selected
  const i = s.indexOf(qid)
  if (i >= 0) s.splice(i, 1)
  else s.push(qid)
  // 维护全局顺序
  const gi = selectedGlobal.findIndex(v => v.key === key && v.qid === qid)
  if (gi >= 0) {
    selectedGlobal.splice(gi, 1)
  } else {
    selectedGlobal.push({ key, qid })
  }
  saveToLocalStorage() // 选择变化时保存状态
}

// 计算已选题目（全局，按选择顺序）
const selectedList = computed(() => {
  const out: Array<{ key: string; qid: string; q: any; isDescription?: boolean }> = []
  selectedGlobal.forEach(it => {
    // 先检查是否是设计题目
    if (it.key.startsWith('design-')) {
      const designPayload = designStore.get(it.key.replace('design-', ''))
      if (designPayload) {
        out.push({ 
          key: it.key, 
          qid: it.qid, 
          q: designPayload.data, 
          isDescription: designPayload.data.type === 'description' 
        })
        return
      }
    }
    
    const payload = getByKey(it.key)
    
    // 在descriptions中查找
    const descQ = payload?.data?.descriptions?.find((qq: any) => qq.id === it.qid)
    if (descQ) {
      out.push({ key: it.key, qid: it.qid, q: descQ, isDescription: true })
      return
    }
    
    // 在questions中查找
    const questionQ = payload?.data?.questions?.find((qq: any) => qq.id === it.qid)
    if (questionQ) {
      out.push({ key: it.key, qid: it.qid, q: questionQ, isDescription: false })
    }
  })
  return out
})

// 只包含问题部分的列表（右侧题目列表显示用）
const questionOnlyList = computed(() => {
  return selectedList.value.filter(item => !item.isDescription)
})

function typeTag(t: string) {
  return t === 'single' ? '[单选题]' : (t === 'multi' ? '[多选题]' : '[填空题]')
}

// 获取来源标签
function getSourceLabel(source: number): string {
  return `第${source}组`
}

// 动态获取当前选中项目中的说明部分内容
const currentDescription = computed(() => {
  const descItem = selectedList.value.find(item => item.isDescription)
  return descItem?.q.text || null
})

// 设计表单验证
const canSubmitDesign = computed(() => {
  if (!designForm.text.trim()) return false
  if (designForm.type === 'single' || designForm.type === 'multi') {
    return designForm.options.filter(opt => opt.trim()).length >= 2
  }
  return true
})

// 设计操作
function addOption() {
  if (designForm.options.length < 8) {
    designForm.options.push('')
  }
}

function removeOption(index: number) {
  if (designForm.options.length > 2) {
    designForm.options.splice(index, 1)
  }
}

function clearSelected() {
  selectedGlobal.splice(0, selectedGlobal.length)
  ui.forEach(state => state.selected.splice(0, state.selected.length))
  saveToLocalStorage() // 清空选择后保存状态
}

// AI助手功能
const cozeClient = new CozeAPI({
  token: import.meta.env.VITE_COZE_KEY || '',
  baseURL: 'https://api.coze.cn',
  allowPersonalAccessTokenInBrowser: true  // 允许在浏览器中使用PAT（仅限开发环境）
})

function openAIHelper() {
  aiDialogVisible.value = true
  // 添加欢迎消息
  if (chatMessages.length === 0) {
    chatMessages.push({
      role: 'assistant',
      content: '您好！我是问卷设计助手，可以帮助您设计调查问卷。请告诉我您想调查的主题或具体问题，我将为您提供专业的建议和示例问题。',
      timestamp: Date.now()
    })
  }
}

function closeAIDialog() {
  aiDialogVisible.value = false
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  if (!userInput.value.trim() || isAIThinking.value) return
  
  const token = import.meta.env.VITE_COZE_KEY
  if (!token) {
    ElMessage.error('AI服务未配置，请联系管理员')
    return
  }

  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: userInput.value.trim(),
    timestamp: Date.now()
  }
  chatMessages.push(userMessage)
  
  const currentInput = userInput.value.trim()
  userInput.value = ''
  isAIThinking.value = true
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })

  try {
    const response = await cozeClient.chat.stream({
      bot_id: '7552721160778530855',
      user_id: authStore.currentUser?.studentNo?.toString() || '123456789',
      additional_messages: [
        {
          content_type: 'text',
          role: 'user' as any,
          type: 'question',
          content: currentInput
        }
      ]
    })

    let assistantMessage = ''
    
    // 处理流式响应
    for await (const chunk of response) {
      if (chunk.event === 'conversation.message.delta' && chunk.data?.content) {
        assistantMessage += chunk.data.content
      }
    }

    // 添加AI回复
    if (assistantMessage) {
      chatMessages.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: Date.now()
      })
    } else {
      chatMessages.push({
        role: 'assistant',
        content: '抱歉，我暂时无法回答您的问题，请稍后重试。',
        timestamp: Date.now()
      })
    }
  } catch (error: any) {
    console.error('AI请求失败:', error)
    chatMessages.push({
      role: 'assistant',
      content: '抱歉，AI服务暂时不可用，请稍后重试。您也可以参考其他同学的设计或查阅相关资料。',
      timestamp: Date.now()
    })
    ElMessage.error('AI请求失败，请稍后重试')
  } finally {
    isAIThinking.value = false
    // 滚动到底部
    nextTick(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
      }
    })
  }
}

const authStore = useAuthStore()

// 本地存储相关
const getStorageKey = () => {
  const user = authStore.currentUser
  if (!user || !user.groupNo || !user.studentNo) return null
  return `activity3_${user.groupNo}_${user.studentNo}`
}

const getActivity2StorageKey = () => {
  const user = authStore.currentUser
  if (!user || !user.groupNo || !user.studentNo) return null
  return `activity2_${user.groupNo}_${user.studentNo}`
}

// 保存到本地存储
const saveToLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  const data = {
    selectedGlobal: selectedGlobal,
    ui: Object.fromEntries(ui.entries()),
    store: Object.fromEntries(store.entries()),
    designStore: Object.fromEntries(designStore.entries()),
    timestamp: Date.now()
  }
  localStorage.setItem(key, JSON.stringify(data))
}

// 从本地存储恢复
const loadFromLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      
      // 恢复选择状态
      if (data.selectedGlobal) {
        selectedGlobal.splice(0, selectedGlobal.length, ...data.selectedGlobal)
      }
      
      // 恢复UI状态
      if (data.ui) {
        ui.clear()
        Object.entries(data.ui).forEach(([key, value]) => {
          ui.set(key, value as UIState)
        })
      }
      
      // 恢复问卷数据
      if (data.store) {
        store.clear()
        Object.entries(data.store).forEach(([key, value]) => {
          store.set(key, value as SurveyPayload)
        })
      }
      
      // 恢复设计数据
      if (data.designStore) {
        designStore.clear()
        Object.entries(data.designStore).forEach(([key, value]) => {
          designStore.set(key, value as DesignPayload)
        })
      }
      
      console.log('Activity3 数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity3本地数据失败:', error)
  }
}

// 从Activity2恢复数据
const loadFromActivity2 = () => {
  const key = getActivity2StorageKey()
  if (!key) return
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      
      // 恢复Activity2的选择状态到当前Activity3
      if (data.selectedGlobal) {
        selectedGlobal.splice(0, selectedGlobal.length, ...data.selectedGlobal)
      }
      
      // 恢复Activity2的UI状态
      if (data.ui) {
        ui.clear()
        Object.entries(data.ui).forEach(([key, value]) => {
          ui.set(key, value as UIState)
        })
      }
      
      // 恢复Activity2的问卷数据
      if (data.store) {
        store.clear()
        Object.entries(data.store).forEach(([key, value]) => {
          store.set(key, value as SurveyPayload)
        })
      }
      
      console.log('Activity2 数据已恢复到Activity3')
    }
  } catch (error) {
    console.warn('从Activity2恢复数据失败:', error)
  }
}

function rid(prefix = 'q'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

// 将所选题目生成文本格式，供复制与发送中的 formattedText 复用
function buildFormattedFromSelected(): string {
  if (!selectedList.value.length) return ''
  const lines: string[] = []
  selectedList.value.forEach((item) => {
    const q: any = item.q
    const topic = (getByKey(item.key) as any)?.data?.topic || ''
    const topicTag = topic ? ` [主题:${topic}]` : ''
    lines.push(`${q.text || ''} ${typeTag(q.type)}${topicTag}`.trim())
    if (Array.isArray(q.options)) {
      (q.options as string[]).forEach((opt: string, oi: number) => {
        lines.push(`${letter(oi)}.${opt || ''}`)
      })
    }
    lines.push('')
  })
  return lines.join('\n')
}

// 提交设计的问题
async function submitDesign() {
  if (!canSubmitDesign.value) return
  
  const user = authStore.currentUser
  if (!user || !user.groupNo || !user.studentNo) {
    console.warn('未获取到学生身份，无法发送设计')
    return
  }

  const questionId: string = rid('design')
  const now = Date.now()
  
  // 构造问题数据
  let questionData: QSingle | QMulti | QText | QDescription
  
  const sourceValue: number = parseInt(String(user.groupNo!)) || 0
  const currentTime: number = now
  
  if (designForm.type === 'description') {
    questionData = {
      id: questionId,
      type: 'description',
      text: designForm.text.trim(),
      source: sourceValue,
      index: 1,
      createdAt: currentTime
    } as QDescription
  } else if (designForm.type === 'text') {
    questionData = {
      id: questionId,
      type: 'text',
      text: designForm.text.trim(),
      source: sourceValue,
      index: 1,
      createdAt: currentTime
    } as QText
  } else {
    const validOptions = designForm.options.filter(opt => opt.trim())
    questionData = {
      id: questionId,
      type: designForm.type,
      text: designForm.text.trim(),
      options: validOptions,
      source: sourceValue,
      index: 1,
      createdAt: currentTime
    } as QSingle | QMulti
  }

  const payload = {
    type: 'design',
    from: {
      groupNo: String(user.groupNo!),
      studentNo: String(user.studentNo!)
    },
    data: questionData,
    at: now
  }

  try {
    // 同时发送discuss和submit事件（数据类型为'design'）
    const discussAck = await socketService.discuss(payload as any)
    const submitAck = await socketService.submit(payload as any)
    
    if (discussAck.code !== 200) {
      throw new Error(discussAck.message || '发送discuss失败')
    }
    if (submitAck.code !== 200) {
      throw new Error(submitAck.message || '发送submit失败')
    }
    
    ElMessage.success('问题设计发送成功！')
    
    // 清空设计表单
    designForm.text = ''
    designForm.options = ['', '']
    designForm.type = 'single'
    
    // 保存到本地
    const key = `${user.groupNo}-${user.studentNo}-${now}`
    designStore.set(key, payload as DesignPayload)
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('发送设计失败', error)
    ElMessage.error(error.message || '发送设计失败，请重试')
  }
}

async function sendSelectedToTeacher() {
  if (!questionOnlyList.value.length) return
  const user = authStore.currentUser
  if (!user || !user.groupNo || !user.studentNo) {
    console.warn('未获取到学生身份，无法发送')
    return
  }

  // 分离说明部分和问题部分
  const descriptionItems = selectedList.value.filter(item => item.isDescription)
  
  // 组合描述（按选择顺序）
  const descriptions = descriptionItems.map((item, idx) => {
    const src: any = item.q
    return {
      id: src.id || rid('desc'),
      type: 'description',
      text: src.text,
      source: src.source || 0,
      index: idx + 1,
      createdAt: Date.now()
    }
  })
  
  // 组合题目（按选择顺序，仅包含问题部分）
  const questions = questionOnlyList.value.map((item, idx) => {
    const src: any = item.q
    return {
      id: src.id || rid('sel'),
      type: src.type,
      text: src.text,
      options: Array.isArray(src.options) ? [...src.options] : undefined,
      source: src.source || 0,
      index: idx + 1,
      createdAt: Date.now()
    }
  })

  const payload = {
    type: 'survey',
    from: {
      groupNo: String(user.groupNo!),
      studentNo: String(user.studentNo!)
    },
    data: {
      title: '数字设备对学习的利与弊调查问卷',
      topic: '协作设计',
      formattedText: buildFormattedFromSelected(),
      descriptions,
      questions
    },
    at: Date.now()
  }

  try {
    const ack = await socketService.submit(payload as any)
    if (ack.code !== 200) {
      throw new Error(ack.message || '发送失败')
    }
    ElMessage.success('问卷重新提交成功！')
    saveToLocalStorage() // 发送成功后保存状态
    // 保留右侧选中列表，不清空，便于继续查看与修改
  } catch (error: any) {
    console.error('发送失败', error)
    ElMessage.error(error.message || '发送失败，请重试')
  }
}

// 处理接收到的数据

// Socket事件处理函数
function handleIncomingSurvey(payload: any) {
  if (!payload || String(payload.type || '') !== 'survey') return
  const from = payload.from || {}
  const data = payload.data || {}
  const g = String(from.groupNo ?? '').trim()
  const s = String(from.studentNo ?? '').trim()
  
  if (!g || !s) return
  
  // 生成唯一key
  const key = `${g}-${s}`
  
  // 构造SurveyPayload
  const surveyPayload: SurveyPayload = {
    type: 'survey',
    from: { groupNo: g, studentNo: s },
    data: {
      title: data.title || '未命名问卷',
      topic: data.topic || '',
      formattedText: data.formattedText || '',
      descriptions: Array.isArray(data.descriptions) ? data.descriptions.map((d: any, index: number) => ({
        ...d,
        source: parseInt(g) || 0,
        index: index + 1,
        createdAt: d.createdAt || Date.now()
      })) : [],
      questions: Array.isArray(data.questions) ? data.questions.map((q: any, index: number) => ({
        ...q,
        source: parseInt(g) || 0,
        index: index + 1,
        createdAt: q.createdAt || Date.now()
      })) : []
    },
    at: payload.at || Date.now()
  }
  
  // 添加到store中
  store.set(key, surveyPayload)
  
  // 保存到本地存储
  saveToLocalStorage()
  
  console.log(`[Activity3] 收到新问卷: 第${g}组-${s}号, 描述数: ${surveyPayload.data.descriptions.length}, 题目数: ${surveyPayload.data.questions.length}`)
  
  // 用户提示
  ElMessage.success(`收到第${g}组的问卷数据`)
}

function handleIncomingDesign(payload: any) {
  if (!payload || String(payload.type || '') !== 'design') return
  const from = payload.from || {}
  const data = payload.data || {}
  const g = String(from.groupNo ?? '').trim()
  const s = String(from.studentNo ?? '').trim()
  
  if (!g || !s) return
  
  // 不处理自己的设计
  const user = authStore.currentUser
  if (user && String(user.groupNo) === g && String(user.studentNo) === s) return
  
  // 生成唯一key
  const key = `${g}-${s}-${payload.at}`
  
  // 构造DesignPayload
  const designPayload: DesignPayload = {
    type: 'design',
    from: { groupNo: g, studentNo: s },
    data: {
      ...data,
      source: parseInt(g) || 0,
      createdAt: payload.at || Date.now()
    },
    at: payload.at || Date.now()
  }
  
  // 添加到设计store中
  designStore.set(key, designPayload)
  
  // 保存到本地存储
  saveToLocalStorage()
  
  console.log(`[Activity3] 收到新设计题目: 第${g}组-${s}号`)
  
  // 不再弹出提示，静默接收discuss消息
}

onMounted(() => {
  // 从Activity2恢复数据
  setTimeout(() => {
    loadFromActivity2()
  }, 50)
  
  // 恢复本地存储的用户数据
  setTimeout(() => {
    loadFromLocalStorage()
  }, 100)
  
  // 监听socket事件，接收其他来源的数据
  
  // submit事件：接收正式提交的问卷数据
  socketService.on('submit', (payload: any) => {
    handleIncomingSurvey(payload)
  })
  
  // discuss事件：接收协作讨论的问题设计（数据类型为'design'）
  socketService.on('discuss', (payload: any) => {
    handleIncomingDesign(payload)
  })
  
  console.log('[Activity3] 开始监听问卷和设计数据')
})

// 监听数据变化，自动保存
watch([selectedGlobal, ui, store, designStore], () => {
  saveToLocalStorage()
}, { deep: true })
</script>

<style scoped>
.survey-monitor { padding: 8px; max-width: 1268px; margin: 0 0; }
.task-block { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
.op-title { font-weight: 700; margin-bottom: 6px; color: #111827; }
.op-text { text-indent: 2em; color: #374151; font-size: 14px; margin-bottom: 6px; }
.layout { display: grid; grid-template-columns: 1fr 440px; column-gap: 24px; align-items: start; }
.main { min-width: 0; }
.side { min-width: 0; position: sticky; top: 8px; align-self: start; }

/* 问题设计板块样式 */
.design-panel {
  position: sticky;
  top: 8px;
  z-index: 100;
  margin-bottom: 12px;
}
.design-card { 
  border-radius: 10px; 
  width: 100%; 
  height: 240px;
  background: #fef9e7;
  border: 1px solid #f59e0b;
}
.design-card :deep(.el-card__body) { 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
  min-height: 0; 
  padding: 8px 12px; 
}
.design-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.design-title {
  font-weight: 700;
  color: #92400e;
  font-size: 14px;
}
.design-actions {
  display: flex;
  gap: 8px;
}
.design-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}
.design-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  min-width: 70px;
  text-align: right;
}
.options-row {
  align-items: flex-start;
}
.options-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.option-letter {
  font-weight: 600;
  color: #2b6aa6;
  min-width: 20px;
}

.card-grid { display: grid; grid-template-columns: repeat(2, 380px); gap: 8px 8px; justify-content: start; }
.survey-card { border-radius: 10px; width: 380px; height: 160px; }
.survey-card :deep(.el-card__body) { height: 100%; display: flex; flex-direction: column; min-height: 0; padding: 8px 10px; }
.pv-item { height: 100%; display: flex; flex-direction: column; position: relative; }
.pv-tags { display: flex; gap: 6px; margin-bottom: 8px; }
.source-tag { 
  font-size: 11px; 
  background: #e0e7ff; 
  color: #3730a3; 
  padding: 2px 8px; 
  border-radius: 10px; 
  font-weight: 500; 
}
.type-tag { 
  font-size: 11px; 
  padding: 2px 8px; 
  border-radius: 10px; 
  font-weight: 500; 
}
.desc-tag { 
  background: #fef3c7; 
  color: #92400e; 
}
.question-tag { 
  background: #dcfce7; 
  color: #166534; 
}
.pv-row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; flex: 1; }
.pv-content { overflow: hidden; flex: 1 1 auto; min-width: 0; }
.pv-check { flex: 0 0 auto; }
.pv-q { margin-bottom: 6px; font-weight: 600; white-space: normal; overflow: visible; text-overflow: clip; }
.pv-q.desc-only { 
  font-weight: 400; 
  color: #666; 
  line-height: 1.5; 
  text-indent: 2em; 
  font-size: 13px;
  margin-bottom: 0;
}
.pv-blank { height: 18px; border-bottom: 2px solid #bbb; width: 60%; margin-top: 8px; }

/* 选中预览卡片固定高度并内部滚动 */
.selected-card { width: 100%; height: 500px; display: flex; flex-direction: column; }
.sel-head { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 12px; }
.sel-actions { 
  display: flex; 
  gap: 8px; 
  justify-content: flex-end; 
  margin-bottom: 8px;
}
.selected-card :deep(.el-card__body) { flex: 1 1 auto; overflow: auto; padding-right: 6px; }
.sel-body { padding-right: 2px; }
.pv-title { font-size: 24px; font-weight: 900; color: #1677ff; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px; }
.pv-desc { text-indent: 2em;font-size: 14px; color: #444; text-align: left; }
/* 放大复选框，增强可见性 */
:deep(.pv-check .el-checkbox .el-checkbox__inner) { transform: scale(1.4); }
:deep(.pv-check .el-checkbox.is-checked .el-checkbox__inner) { border-color: #409EFF; background-color: #409EFF; }
.sel-item { padding: 10px 0; border-bottom: 1px dashed #eee; }
.q-block { display: flex; flex-direction: column; gap: 6px; }
.q-head { display: flex; align-items: baseline; gap: 0; }
.q-index { margin-right: 6px; color: #2b6aa6; }
.q-text { font-weight: 600; color: #222; flex: 1 1 auto; }
.q-type { font-size: 12px; color: #999; margin-left: 0; }
.q-opts { display: grid; grid-template-columns: 1fr; gap: 4px; margin-left: 0; color: #333; }
.q-opt { padding-left: 2px; }

/* AI助手对话框样式 */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 16px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: #3b82f6;
  color: white;
  border-radius: 18px 4px 18px 18px;
}

.message-item.assistant .message-content {
  background: #e5e7eb;
  color: #374151;
  border-radius: 4px 18px 18px 18px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.user .message-avatar {
  background: #3b82f6;
  color: white;
}

.message-item.assistant .message-avatar {
  background: #10b981;
  color: white;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  word-wrap: break-word;
}

.message-text {
  line-height: 1.5;
  margin-bottom: 4px;
}

.message-text.thinking {
  font-style: italic;
  color: #6b7280;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.chat-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-hint {
  font-size: 12px;
  color: #6b7280;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
