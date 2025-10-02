<template>
  <div class="design-workspace">
    <!-- 操作要求模块 -->
    <div class="task-block">
      <div class="op-title">7.智能问题设计</div>
      <div class="op-text">
        <span style="font-weight: bold;">设计方向：{{ designDirection }}</span> - 
        根据您的小组组号，请围绕 <span style="font-weight: bold;">{{ designDirection }}</span> 主题设计问卷问题
      </div>
    </div>
    
    <!-- 左右布局：左侧设计区域，右侧功能区域 -->
    <div class="main-layout">
      <!-- 左侧：问题设计区域 -->
      <div class="left-panel">
        <!-- 问题设计表单 -->
        <el-card class="design-card" shadow="never">
          <template #header>
            <div class="design-header">
              <span class="design-title">问题设计</span>
              <el-button size="small" type="success" :disabled="!canSubmitDesign" @click="submitDesign">
                提交问题
              </el-button>
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

        <!-- 已设计问题列表 -->
        <el-card class="history-card" shadow="never">
          <template #header>
            <span class="history-title">已设计问题</span>
          </template>
          <div class="history-body">
            <el-empty v-if="!designedQuestions.length" description="暂无已设计的问题" />
            <div v-for="(question, index) in designedQuestions" :key="question.id" class="question-item">
              <div class="question-header">
                <span class="question-index">{{ index + 1 }}.</span>
                <span class="question-text">{{ question.text }}</span>
                <span class="question-type-tag">{{ typeTag(question.type) }}</span>
              </div>
              <div v-if="'options' in question && Array.isArray(question.options)" class="question-options">
                <div v-for="(opt, oi) in question.options" :key="oi" class="option">
                  {{ letter(oi) }}. {{ opt }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：功能区域 -->
      <div class="right-panel">
        <!-- 功能按钮区域 -->
        <el-card class="function-card" shadow="never">
          <template #header>
            <span class="function-title">AI助手功能</span>
          </template>
          <div class="function-body">
            <div class="function-buttons">
              <el-button 
                type="primary" 
                size="large"
                :icon="Camera"
                class="function-btn"
                @click="openCameraUpload"
              >
                拍照上传
              </el-button>
              <el-button 
                type="warning" 
                size="large"
                :icon="Key"
                class="function-btn"
                @click="openKeywordDialog"
                disabled
              >
                关键词获取
                <span class="coming-soon">(待开发)</span>
              </el-button>
              <el-button 
                type="success" 
                size="large"
                :icon="Star"
                class="function-btn"
                @click="openAIQuestionGeneration"
              >
                获取问卷问题
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- AI分析结果展示区域 -->
        <el-card class="result-card" shadow="never" v-if="parsedQuestion || analysisResult">
          <template #header>
            <div class="result-header">
              <span class="result-title">🤖 AI分析结果</span>
              <div class="result-actions" v-if="parsedQuestion">
                <el-button size="small" type="success" @click="addAIQuestionDirectly" :icon="Plus">
                  一键添加
                </el-button>
                <el-button size="small" type="primary" @click="fillAIQuestionToDesign">
                  智能填充
                </el-button>
              </div>
              <el-button v-else size="small" type="info" @click="copyRawResultToDesign" :icon="Plus">
                复制原始结果
              </el-button>
            </div>
          </template>
          <div class="result-body">
            <!-- 智能解析的问题信息 -->
            <div v-if="parsedQuestion" class="smart-question">
              <div class="question-info">
                <div class="question-type">
                  <el-tag :type="parsedQuestion.type === 1 ? 'warning' : parsedQuestion.type === 2 ? 'success' : 'info'">
                    {{ getTypeDisplayName(parsedQuestion.type) }}
                  </el-tag>
                </div>
                <div class="question-text">
                  <h4>问题内容：</h4>
                  <p>{{ parsedQuestion.question }}</p>
                </div>
                <div v-if="parsedQuestion.options.length > 0" class="question-options">
                  <h4>选项内容：</h4>
                  <div class="options-list">
                    <div v-for="(option, index) in parsedQuestion.options" :key="index" class="option-item">
                      <span class="option-label">{{ letter(index) }}.</span>
                      <span class="option-text">{{ option }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="smart-tip">
                <el-icon class="tip-icon"><Star /></el-icon>
                <span>AI已智能解析问题格式，点击"一键添加"直接加入问题列表，或"智能填充"到设计区进行修改</span>
              </div>
            </div>
            
            <!-- 原始结果（当无法解析时显示） -->
            <div v-else-if="analysisResult" class="raw-result">
              <div class="result-tip">
                <el-icon class="tip-icon"><Warning /></el-icon>
                <span>AI返回了分析结果，但无法自动解析问题格式，您可以查看原始内容并手动复制</span>
              </div>
              <div class="result-content">
                <pre>{{ analysisResult }}</pre>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 分析进度提示卡片 -->
        <el-card class="progress-card" shadow="never" v-if="isAnalyzing">
          <div class="progress-content">
            <el-icon class="progress-icon"><Loading /></el-icon>
            <div class="progress-info">
              <h4>AI正在分析图片</h4>
              <p>根据{{ designDirection }}方向生成问题建议...</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 拍照上传对话框 -->
    <el-dialog
      v-model="showCameraDialog"
      title="拍照上传"
      width="600px"
      :before-close="closeCameraDialog"
    >
      <div class="camera-container">
        <div class="camera-preview">
          <video 
            ref="videoRef" 
            class="camera-video"
            autoplay 
            muted 
            playsinline
            v-show="!isUploading && !isAnalyzing"
          ></video>
          <div v-if="isUploading" class="loading-overlay">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在上传图片...</p>
          </div>
          <div v-if="isAnalyzing" class="loading-overlay">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在分析图片...</p>
          </div>
        </div>
        <div class="camera-actions">
          <el-button 
            type="primary" 
            size="large"
            @click="captureAndUpload"
            :loading="isUploading || isAnalyzing"
            :disabled="!mediaStream || isUploading || isAnalyzing"
          >
            <el-icon v-if="!isUploading && !isAnalyzing"><Camera /></el-icon>
            {{ getUploadButtonText() }}
          </el-button>
          <el-button size="large" @click="closeCameraDialog">
            取消
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 关键词获取对话框（占位） -->
    <el-dialog
      v-model="showKeywordDialog"
      title="关键词获取"
      width="500px"
    >
      <div class="placeholder-content">
        <el-icon class="placeholder-icon"><Tools /></el-icon>
        <p>此功能正在开发中，敬请期待...</p>
      </div>
    </el-dialog>

    <!-- AI问题生成对话框 -->
    <el-dialog
      v-model="showAIDialog"
      title="AI问卷问题设计助手"
      width="700px"
      :before-close="closeAIDialog"
    >
      <div class="ai-chat-container">
        <div class="direction-info">
          <el-tag type="success">{{ designDirection }}方向</el-tag>
          <span class="direction-desc">专业AI助手帮您设计相关问题</span>
        </div>
        
        <div class="chat-messages" ref="chatMessagesRef">
          <div v-for="(message, index) in chatMessages" :key="index" class="message-item" :class="message.role">
            <div class="message-avatar">
              <el-icon v-if="message.role === 'assistant'"><ChatDotRound /></el-icon>
              <el-icon v-else><User /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
              <div v-if="message.role === 'assistant'" class="message-actions">
                <el-button size="small" type="primary" @click="copyAIMessageToDesign(message.content)">
                  复制到设计区
                </el-button>
              </div>
            </div>
          </div>
          <!-- AI思考中状态 -->
          <div v-if="isAIThinking" class="message-item assistant">
            <div class="message-avatar">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text thinking">
                <el-icon class="thinking-icon"><Loading /></el-icon>
                AI正在思考中...
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请描述您想设计的问题类型，例如：关于使用时长的选择题、设备类型的填空题等"
            maxlength="500"
            show-word-limit
            @keydown.ctrl.enter="sendAIMessage"
          />
          <div class="input-actions">
            <div class="input-tip">按 Ctrl+Enter 快速发送</div>
            <el-button 
              type="primary" 
              :disabled="!userInput.trim() || isAIThinking"
              :loading="isAIThinking"
              @click="sendAIMessage"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { EntityMode } from '@/types'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Camera, Key, Star, Loading, Tools, Warning, User, ChatDotRound } from '@element-plus/icons-vue'
import { CozeAPI } from '@coze/api'

// 问题类型定义
type QSingle = { id: string; type: 'single'; text: string; options: string[]; createdAt: number }
type QMulti = { id: string; type: 'multi'; text: string; options: string[]; createdAt: number }
type QText = { id: string; type: 'text'; text: string; createdAt: number }
type Question = QSingle | QMulti | QText

const status = useStatus()
const socket = useSocket()

// 问题设计表单
const designForm = reactive<{
  type: 'single' | 'multi' | 'text'
  text: string
  options: string[]
}>({
  type: 'single',
  text: '',
  options: ['', '']
})

// 已设计问题列表
const designedQuestions = reactive<Question[]>([])

// 摄像头相关状态
const showCameraDialog = ref(false)
const videoRef = ref<HTMLVideoElement>()
const mediaStream = ref<MediaStream | null>(null)
const isUploading = ref(false)
const isAnalyzing = ref(false)

// 对话框状态
const showKeywordDialog = ref(false)
const showAIDialog = ref(false)

// AI对话相关状态
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const chatMessages = reactive<ChatMessage[]>([])
const userInput = ref('')
const isAIThinking = ref(false)
const chatMessagesRef = ref<HTMLElement>()

// AI分析结果
const analysisResult = ref('')
const parsedQuestion = ref<{
  type: number
  question: string
  options: string[]
} | null>(null)

// Coze API配置（参考Activity5和Activity6）
const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WORKFLOW_ID = '7553827536788193322' // 与Activity5、Activity6使用相同的工作流ID

// AI对话客户端配置
const cozeClient = new CozeAPI({
  token: COZE_API_TOKEN,
  baseURL: 'https://api.coze.cn',
  allowPersonalAccessTokenInBrowser: true
})
const AI_BOT_ID = '7552721160778530855' // AI问卷设计助手Bot ID

// 计算设计方向
const designDirection = computed(() => {
  const user = status.userStatus
  if (!user || !user.groupNo) return '未知方向'
  
  const groupNo = parseInt(String(user.groupNo))
  const remainder = groupNo % 4
  
  switch (remainder) {
    case 0: return '设备类型'
    case 1: return '使用时长'
    case 2: return '使用用途'
    case 3: return '监管情况'
    default: return '未知方向'
  }
})

// 计算是否可以提交设计
const canSubmitDesign = computed(() => {
  if (!designForm.text.trim()) return false
  if (designForm.type === 'single' || designForm.type === 'multi') {
    return designForm.options.filter(opt => opt.trim()).length >= 2
  }
  return true
})

// 工具函数
function letter(i: number): string { 
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[i] || '?' 
}

function typeTag(type: string): string {
  return type === 'single' ? '[单选题]' : 
         type === 'multi' ? '[多选题]' : '[填空题]'
}

// AI类型转换为表单类型
function convertAITypeToFormType(aiType: number): 'single' | 'multi' | 'text' {
  switch (aiType) {
    case 1: return 'text'    // 填空题
    case 2: return 'single'  // 选择题（默认为单选）
    case 3: 
    default: return 'text'   // 无类型，默认为填空题
  }
}

// 获取类型显示名称
function getTypeDisplayName(aiType: number): string {
  switch (aiType) {
    case 1: return '填空题'
    case 2: return '选择题'
    case 3: return '无类型'
    default: return '未知类型'
  }
}

function rid(prefix = 'q'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

// 消息时间格式化
function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

// 选项操作
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

// 提交设计
async function submitDesign() {
  if (!canSubmitDesign.value) return
  
  const user = status.userStatus
  if (!user || !user.groupNo) {
    ElMessage.error('未获取到小组信息，无法提交设计')
    return
  }

  const questionId = rid('design')
  const now = Date.now()
  
  // 构造问题数据
  let questionData: Question
  
  if (designForm.type === 'text') {
    questionData = {
      id: questionId,
      type: 'text',
      text: designForm.text.trim(),
      createdAt: now
    }
  } else {
    const validOptions = designForm.options.filter(opt => opt.trim())
    questionData = {
      id: questionId,
      type: designForm.type,
      text: designForm.text.trim(),
      options: validOptions,
      createdAt: now
    } as QSingle | QMulti
  }

  try {
    console.log('[Activity3] 📤 提交问题设计')
    
    // 提交到教师端
    socket.submit({
      mode: EntityMode.STUDENT_GROUP_ROLE,
      messageType: 'design',
      activityIndex: '3',
      data: {
        direction: designDirection.value,
        question: questionData
      },
      from: {
        id: String(user.groupNo),
        groupNo: String(user.groupNo)
      },
      to: null
    })
    
    console.log('[Activity3] ✅ 问题设计已提交')
    ElMessage.success('问题设计提交成功！')
    
    // 添加到本地列表
    designedQuestions.push(questionData)
    
    // 清空设计表单
    designForm.text = ''
    designForm.options = ['', '']
    designForm.type = 'single'
    
    console.log('[Activity3] 问题设计已保存')
    
  } catch (error: any) {
    console.error('[Activity3] ❌ 提交设计失败', error)
    ElMessage.error(error.message || '提交设计失败，请重试')
  }
}

// 摄像头功能
async function openCameraUpload() {
  showCameraDialog.value = true
  await nextTick()
  await initCamera()
}

async function initCamera() {
  console.log('[Activity7] 开始初始化摄像头')
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持摄像头功能')
    }
    
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
    }
    
    const constraints = { 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment'
      } 
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    mediaStream.value = stream
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
    
    ElMessage.success('摄像头启动成功')
  } catch (error: any) {
    console.error('[Activity7] 摄像头启动失败:', error)
    
    if (error.name === 'NotAllowedError') {
      ElMessage.error('摄像头权限被拒绝，请允许访问')
    } else if (error.name === 'NotFoundError') {
      ElMessage.error('未找到摄像头设备')
    } else {
      ElMessage.error(`摄像头启动失败: ${error.message}`)
    }
  }
}

function closeCameraDialog() {
  showCameraDialog.value = false
  cleanup()
}

function cleanup() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

// Base64转File
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

async function captureAndUpload() {
  if (!videoRef.value || !mediaStream.value) return
  
  isUploading.value = true
  
  try {
    // 创建canvas并截取图片
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = videoRef.value.videoWidth
    canvas.height = videoRef.value.videoHeight
    context.drawImage(videoRef.value, 0, 0)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // 上传图片并获取file_id
    const fileId = await uploadImage(dataUrl)
    
    if (fileId) {
      // 上传成功，立即停止加载状态并开始分析
      isUploading.value = false
      isAnalyzing.value = true
      
      ElMessage.success('图片上传成功！正在AI分析...')
      console.log('[Activity7] 图片上传成功，开始分析，file_id:', fileId)
      
      // 使用Coze工作流分析图片（index=2）
      await analyzeUploadedImage(fileId)
    } else {
      ElMessage.error('图片上传失败，请重新拍照')
    }
    
  } catch (error: any) {
    console.error('[Activity7] 拍照上传失败:', error)
    ElMessage.error('拍照上传失败：' + (error.message || '未知错误'))
  } finally {
    isUploading.value = false
    isAnalyzing.value = false
  }
}

// 上传图片，返回file_id（参考Activity5和Activity6实现）
const uploadImage = async (dataUrl: string): Promise<string | null> => {
  try {
    const filename = `activity7_${Date.now()}.jpg`
    const file = dataURLtoFile(dataUrl, filename)
    
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadResponse = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`
      },
      body: formData
    })
    
    if (!uploadResponse.ok) {
      throw new Error('图片上传失败')
    }
    
    const uploadResult = await uploadResponse.json()
    console.log('[Activity7] 上传响应:', uploadResult)
    
    if (uploadResult.code !== 0 || !uploadResult.data?.id) {
      throw new Error('上传响应异常')
    }
    
    console.log('[Activity7] 图片上传成功，file_id:', uploadResult.data.id)
    return uploadResult.data.id
    
  } catch (error: any) {
    console.error('[Activity7] 图片上传失败:', error)
    return null
  }
}

async function analyzeUploadedImage(fileId: string) {
  try {
    // 调用工作流分析（参考Activity5和Activity6实现）
    const workflowPayload = {
      workflow_id: WORKFLOW_ID,
      parameters: {
        input_img: {
          file_id: fileId
        },
        input_index: 2 // Activity7使用input_index为2
      }
    }
    
    console.log('[Activity7] 开始工作流分析:', workflowPayload)
    
    const workflowResponse = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowPayload)
    })
    
    if (!workflowResponse.ok) {
      throw new Error('工作流调用失败')
    }
    
    const workflowResult = await workflowResponse.json()
    console.log('[Activity7] 工作流响应:', workflowResult)
    
    if (workflowResult.code !== 0) {
      throw new Error('工作流执行失败')
    }
    
    // 解析分析结果
    if (workflowResult.data) {
      analysisResult.value = workflowResult.data
      
      // 专门解析output3字段
      try {
        let parsedData
        if (typeof workflowResult.data === 'string') {
          parsedData = JSON.parse(workflowResult.data)
        } else {
          parsedData = workflowResult.data
        }
        
        console.log('[Activity7] 解析AI返回数据:', parsedData)
        
        // 提取output3字段
        if (parsedData && parsedData.output3) {
          const output3 = parsedData.output3
          console.log('[Activity7] 提取到output3:', output3)
          
          if (output3.question && typeof output3.type === 'number') {
            parsedQuestion.value = {
              type: output3.type,
              question: output3.question,
              options: Array.isArray(output3.options) ? output3.options : []
            }
            
            console.log('[Activity7] 成功解析问题:', parsedQuestion.value)
            ElMessage.success(`AI分析完成！识别到${getTypeDisplayName(output3.type)}`)
          } else {
            console.warn('[Activity7] output3格式不正确:', output3)
            parsedQuestion.value = null
            ElMessage.warning('AI分析完成，但未识别到有效问题格式')
          }
        } else {
          console.warn('[Activity7] 未找到output3字段:', parsedData)
          parsedQuestion.value = null
          ElMessage.warning('AI分析完成，但未找到问题内容(output3)')
        }
        
      } catch (parseError) {
        console.error('[Activity7] 解析output3失败:', parseError)
        parsedQuestion.value = null
        ElMessage.warning('AI分析完成，但解析问题格式失败')
      }
    } else {
      throw new Error('分析结果为空')
    }
    
  } catch (error: any) {
    console.error('[Activity7] 图片分析失败:', error)
    ElMessage.error('图片分析失败：' + (error.message || '未知错误'))
  } finally {
    isAnalyzing.value = false
    closeCameraDialog()
  }
}

function getUploadButtonText(): string {
  if (isUploading.value) return '正在上传...'
  if (isAnalyzing.value) return '分析中...'
  return '拍照上传'
}

// 智能填充AI分析的问题到设计区
function fillAIQuestionToDesign() {
  if (!parsedQuestion.value) {
    ElMessage.warning('没有可填充的AI问题')
    return
  }
  
  const { type, question, options } = parsedQuestion.value
  
  // 转换AI类型到表单类型
  const formType = convertAITypeToFormType(type)
  
  // 填充到设计表单
  designForm.type = formType
  designForm.text = question
  
  if (formType === 'single' || formType === 'multi') {
    // 如果是选择题，填充选项
    if (options.length > 0) {
      designForm.options = [...options]
      // 确保至少有2个选项
      while (designForm.options.length < 2) {
        designForm.options.push('')
      }
    } else {
      // 如果没有选项，提供默认选项
      designForm.options = ['', '']
    }
  } else {
    // 填空题，重置选项
    designForm.options = ['', '']
  }
  
  ElMessage.success(`AI${getTypeDisplayName(type)}已智能填充到设计区！`)
  console.log('[Activity7] AI问题已智能填充:', {
    originalType: type,
    formType,
    question,
    options: options.length
  })
}

// 一键添加AI问题到问题列表
function addAIQuestionDirectly() {
  if (!parsedQuestion.value) {
    ElMessage.warning('没有可添加的AI问题')
    return
  }
  
  // 先智能填充
  fillAIQuestionToDesign()
  
  // 然后提交设计（使用现有的提交逻辑）
  setTimeout(() => {
    submitDesign()
  }, 100)
}

// 复制原始AI结果到设计区（保留原功能）
function copyRawResultToDesign() {
  if (analysisResult.value) {
    try {
      const parsedResult = JSON.parse(analysisResult.value)
      designForm.text = JSON.stringify(parsedResult, null, 2)
    } catch {
      designForm.text = String(analysisResult.value)
    }
    
    ElMessage.success('原始AI分析结果已复制到问题设计区！')
  } else {
    ElMessage.warning('没有可复制的AI分析结果')
  }
}

// 占位功能
function openKeywordDialog() {
  showKeywordDialog.value = true
}

// AI问卷问题生成功能
function openAIQuestionGeneration() {
  showAIDialog.value = true
  // 添加欢迎消息（如果没有消息历史）
  if (chatMessages.length === 0) {
    chatMessages.push({
      role: 'assistant',
      content: `您好！我是智能问题设计助手，可以帮助您设计${designDirection.value}相关的问卷问题。请告诉我您想设计什么类型的问题，我将为您提供专业的建议和示例。`,
      timestamp: Date.now()
    })
  }
}

function closeAIDialog() {
  showAIDialog.value = false
}

// AI对话发送功能
async function sendAIMessage() {
  if (!userInput.value.trim() || isAIThinking.value) return
  
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
      bot_id: AI_BOT_ID,
      user_id: status.userStatus?.groupNo?.toString() || '1',
      additional_messages: [
        {
          content_type: 'text',
          role: 'user' as any,
          content: `我的设计方向是${designDirection.value}，请帮我：${currentInput}`
        }
      ]
    })

    let assistantMessage = ''
    for await (const chunk of response) {
      if (chunk.event === 'conversation.message.delta') {
        assistantMessage += chunk.data?.content || ''
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
    console.error('[Activity7] AI请求失败:', error)
    chatMessages.push({
      role: 'assistant',
      content: '抱歉，AI服务暂时不可用，请稍后重试。您也可以参考拍照分析的结果或手动设计问题。',
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

// 复制AI消息内容到设计区
function copyAIMessageToDesign(content: string) {
  designForm.text = content
  ElMessage.success('AI建议已复制到设计区')
}

// 本地存储
const getStorageKey = () => {
  const user = status.userStatus
  if (!user || !user.groupNo) return null
  return `activity7_${user.groupNo}`
}


onMounted(() => {
  // 组件已挂载
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.design-workspace {
  padding: 8px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 操作要求模块 */
.task-block {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.op-title {
  font-weight: 700;
  margin-bottom: 6px;
  color: #111827;
}

.op-text {
  text-indent: 2em;
  color: #374151;
  font-size: 14px;
  margin-bottom: 6px;
}

/* 主布局 */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 设计卡片样式 */
.design-card {
  border-radius: 10px;
  background: #fef9e7;
  border: 1px solid #f59e0b;
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

.design-body {
  margin-top: 12px;
}

.design-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* 历史记录卡片 */
.history-card {
  border-radius: 10px;
}

.history-title {
  font-weight: 700;
  color: #374151;
  font-size: 14px;
}

.history-body {
  max-height: 300px;
  overflow-y: auto;
}

.question-item {
  padding: 8px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.question-item:last-child {
  border-bottom: none;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.question-index {
  color: #2b6aa6;
  font-weight: 600;
}

.question-text {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.question-type-tag {
  font-size: 12px;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.question-options {
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option {
  font-size: 13px;
  color: #6b7280;
}

/* 功能卡片样式 */
.function-card {
  border-radius: 10px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.function-title {
  font-weight: 700;
  color: #0c4a6e;
  font-size: 14px;
}

.function-body {
  margin-top: 12px;
}

.function-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.function-btn {
  width: 100%;
  height: 60px;
  font-size: 16px;
  position: relative;
}

.coming-soon {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 10px;
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

/* 结果卡片样式 */
.result-card {
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #22c55e;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-title {
  font-weight: 700;
  color: #166534;
  font-size: 14px;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-body {
  margin-top: 12px;
}

/* 智能问题展示样式 */
.smart-question {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-info {
  background: #ffffff;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  padding: 16px;
}

.question-type {
  margin-bottom: 12px;
}

.question-text h4,
.question-options h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.question-text p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.question-options {
  margin-top: 12px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.option-label {
  font-weight: 600;
  color: #2563eb;
  min-width: 20px;
}

.option-text {
  font-size: 14px;
  color: #374151;
}

.smart-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 13px;
  color: #065f46;
}

.tip-icon {
  font-size: 16px;
  color: #10b981;
}

/* 原始结果展示样式 */
.raw-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
}

.result-tip .tip-icon {
  color: #f59e0b;
}

.result-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.result-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

/* 分析进度卡片样式 */
.progress-card {
  border-radius: 10px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
}

.progress-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.progress-icon {
  font-size: 32px;
  color: #d97706;
  animation: spin 2s linear infinite;
}

.progress-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
}

.progress-info p {
  margin: 0;
  font-size: 14px;
  color: #a16207;
}

/* AI对话框样式 */
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.direction-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 16px;
}

.direction-desc {
  font-size: 14px;
  color: #0c4a6e;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item.assistant .message-avatar {
  background: #dbeafe;
  color: #1e40af;
}

.message-item.user .message-avatar {
  background: #f3f4f6;
  color: #374151;
}

.message-content {
  flex: 1;
  max-width: calc(100% - 44px);
}

.message-item.user .message-content {
  text-align: right;
}

.message-text {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-item.assistant .message-text {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.message-item.user .message-text {
  background: #f0f0f0;
  border: 1px solid #d1d5db;
}

.message-text.thinking {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.thinking-icon {
  animation: spin 1s linear infinite;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.message-item.user .message-time {
  text-align: right;
}

.message-actions {
  margin-top: 8px;
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

.input-tip {
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

/* 摄像头对话框样式 */
.camera-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.camera-preview {
  position: relative;
  width: 100%;
  height: 360px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.camera-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 占位内容样式 */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.placeholder-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.placeholder-content p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 滚动条样式 */
.history-body::-webkit-scrollbar {
  width: 6px;
}

.history-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.history-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.history-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
