<template>
  <div class="page">
    <!-- 活动说明 -->
    <div class="activity-description">
      <strong>AI学习助手活动</strong><br>
      使用AI助手获取学习提示，或根据教师要求进行拍照上传
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 问一问功能卡片 -->
      <div class="ask-ai-card" v-if="!showUploadCard && !showEditCard && !showViewCard">
        <div class="card-header">
          <h3 class="card-title">🤖 问一问 AI助手</h3>
          <div class="header-info">
            <div class="viewpoint-display" v-if="selectedViewpoint">
              <span class="viewpoint-badge" :class="'badge-' + selectedViewpoint.toLowerCase()">
                观点{{ selectedViewpoint }}：{{ getViewpointMeaning(selectedViewpoint) }}
              </span>
            </div>
            <div class="questions-remaining">
              <span class="remaining-label">剩余次数:</span>
              <span class="remaining-count">{{ remainingQuestions }}/2</span>
            </div>
          </div>
        </div>

        <!-- 问一问按钮 -->
        <div class="ask-button-container">
          <el-button 
            type="primary" 
            size="large"
            :disabled="!selectedViewpoint || isAsking || remainingQuestions <= 0"
            :loading="isAsking"
            @click="askAI"
            class="ask-button"
          >
            <el-icon v-if="!isAsking"><ChatDotRound /></el-icon>
            <span v-if="isAsking" class="generating-text">
              <span class="dot-animation">正在生成AI提示</span>
              <span class="ai-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
            </span>
            <span v-else>{{ remainingQuestions > 0 ? `问一问 AI助手 (${remainingQuestions}次机会)` : '提问次数已用完' }}</span>
          </el-button>
        </div>

        <!-- AI提示词展示区域 -->
        <div v-if="allTips.length > 0" class="tips-container">
          <div class="tips-header">
            <h4 class="tips-title">💡 AI学习提示</h4>
            <div class="tips-count">共{{ allTips.length }}个提示</div>
          </div>
          
          <!-- 按观点分组显示 -->
          <div v-for="(group, viewpoint) in groupedTips" :key="viewpoint" class="viewpoint-group">
            <div class="group-header">
              <span class="viewpoint-label" :class="'viewpoint-' + viewpoint.toLowerCase()">
                观点{{ viewpoint }}：{{ getViewpointMeaning(viewpoint as 'A' | 'B') }}
              </span>
              <span class="group-count">({{ group.length }}个提示)</span>
            </div>
            
            <div class="tips-grid">
              <div 
                v-for="(tip, index) in group" 
                :key="tip.id"
                class="tip-bubble"
                :class="'bubble-' + viewpoint.toLowerCase()"
              >
                <div class="tip-number">{{ index + 1 }}</div>
                <div class="tip-text">{{ tip.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传功能卡片 -->
      <div class="upload-card" v-if="showUploadCard && uploadEnabled && !showEditCard && !showViewCard">
        <div class="card-header">
          <h3 class="card-title">📷 拍照上传</h3>
          <div class="upload-status">
            <span v-if="uploadResults.length === 0" class="status-active">拍照上传中</span>
            <span v-else class="status-completed">已完成{{ uploadResults.length }}次分析</span>
          </div>
        </div>

        <!-- 摄像头预览区域 -->
        <div class="camera-preview-wrapper">
          <video 
            ref="videoRef" 
            class="camera-preview"
            autoplay 
            muted 
            playsinline
            @loadedmetadata="onVideoLoaded"
            :style="{ objectFit: 'contain' }"
          ></video>
          
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-overlay">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在启动摄像头...</p>
          </div>
          
          <!-- 错误状态 -->
          <div v-if="cameraError" class="error-overlay">
            <el-icon class="error-icon"><Warning /></el-icon>
            <p>{{ cameraError }}</p>
            <el-button type="primary" @click="initCamera">重新尝试</el-button>
          </div>
        </div>

        <!-- 上传控制按钮 -->
        <div class="upload-controls">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!isCameraReady || isUploading || isAnalyzing"
            :loading="isUploading"
            @click="captureAndUpload"
            class="upload-button"
          >
            <el-icon v-if="!isUploading && !isAnalyzing"><Camera /></el-icon>
            {{ getUploadButtonText() }}
          </el-button>
        </div>

        <!-- 分析进度提示 -->
        <div v-if="isAnalyzing" class="analysis-progress">
          <div class="progress-content">
            <el-icon class="progress-icon"><Loading /></el-icon>
            <span class="progress-text">正在分析图片，请稍候...</span>
          </div>
        </div>

        <!-- 分析结果列表 -->
        <div v-if="uploadResults.length > 0" class="results-container">
          <div class="results-header">
            <h4 class="results-title">📸 分析结果 ({{ uploadResults.length }}次)</h4>
            <div class="results-hint">选择最满意的结果发送给教师</div>
          </div>
          
          <div class="results-list">
            <div 
              v-for="(result, index) in uploadResults" 
              :key="result.id"
              class="result-item"
              :class="{ 'selected': selectedResultIndex === index }"
              @click="selectedResultIndex = index"
            >
              <div class="result-item-header">
                <span class="result-number">第{{ index + 1 }}次分析</span>
                <span class="result-time">{{ formatTime(result.timestamp) }}</span>
                <el-icon v-if="selectedResultIndex === index" class="selected-icon"><CircleCheck /></el-icon>
              </div>
              <div class="result-item-content">{{ result.result }}</div>
            </div>
          </div>
          
          <!-- 发送按钮 -->
          <div class="send-controls">
            <el-button 
              type="success" 
              size="large"
              :disabled="selectedResultIndex === -1 || hasSentResult"
              @click="sendResultToTeacher"
              class="send-button"
            >
              <el-icon><Position /></el-icon>
              {{ hasSentResult ? '已发送给教师' : '发送选中结果给教师' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 编辑功能卡片 -->
      <div class="edit-card" v-if="showEditCard && !showViewCard">
        <div class="card-header">
          <h3 class="card-title">✏️ 编辑分析结果</h3>
          <div class="edit-status">
            <span v-if="!hasSubmittedEdit" class="status-active">请完善分析内容</span>
            <span v-else class="status-completed">已提交</span>
          </div>
        </div>

        <div class="edit-content">
          <div class="edit-section">
            <div class="edit-label">问题1：</div>
            <div class="original-text">原始内容：{{ originalData.q1 }}</div>
            <el-input
              v-model="analysisData.q1"
              type="textarea"
              :rows="3"
              placeholder="请完善或修改问题1的内容"
              maxlength="200"
              show-word-limit
              class="edit-input"
            />
          </div>

          <div class="edit-section">
            <div class="edit-label">问题2：</div>
            <div class="original-text">原始内容：{{ originalData.q2 }}</div>
            <el-input
              v-model="analysisData.q2"
              type="textarea"
              :rows="3"
              placeholder="请完善或修改问题2的内容"
              maxlength="200"
              show-word-limit
              class="edit-input"
            />
          </div>
        </div>

        <div class="edit-controls">
          <el-button 
            type="success" 
            size="large"
            :disabled="!analysisData.q1.trim() || !analysisData.q2.trim() || hasSubmittedEdit"
            @click="submitEditedData"
            class="submit-button"
          >
            <el-icon><Position /></el-icon>
            {{ hasSubmittedEdit ? '已提交给教师和同学' : '提交给教师和同学' }}
          </el-button>
        </div>
      </div>

      <!-- 查看功能卡片 -->
      <div class="view-card" v-if="showViewCard">
        <div class="card-header">
          <h3 class="card-title">👀 查看所有小组结果</h3>
          <div class="view-status">
            <span class="status-info">共收到{{ wordCloudData.length }}组数据</span>
          </div>
        </div>

        <div class="wordcloud-container">
          <div class="wordcloud-section">
            <h4 class="section-title">分析问题 - 词云图</h4>
            <div class="wordcloud-display">
              <div 
                ref="wordCloudRef" 
                id="wordcloud-chart"
                class="echarts-wordcloud"
              ></div>
              <div v-if="wordCloudData.length === 0" class="empty-wordcloud">
                <el-icon class="empty-icon"><Document /></el-icon>
                <p>暂无词云数据</p>
              </div>
            </div>
          </div>
        </div>

        <div class="view-controls">
          <el-button 
            type="primary" 
            size="large"
            @click="refreshWordCloud"
            class="refresh-button"
          >
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button 
            type="success" 
            size="large"
            @click="generateTestData"
            class="test-button"
            v-if="wordCloudData.length === 0"
          >
            生成测试数据
          </el-button>
        </div>
      </div>

      <!-- 上传功能关闭提示 -->
      <div class="upload-disabled-card" v-if="showUploadCard && !uploadEnabled">
        <div class="card-header">
          <h3 class="card-title">📷 拍照上传</h3>
          <div class="upload-status">
            <span class="status-disabled">教师已关闭上传功能</span>
          </div>
        </div>
        <div class="disabled-content">
          <el-icon class="disabled-icon"><Lock /></el-icon>
          <p>上传功能暂时关闭，请等待教师重新开启</p>
        </div>
      </div>
    </div>

    <!-- 隐藏的Canvas用于图像处理 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStatus } from '@/store/status'
import { useSocket } from '@/utils/socket'
import { EntityMode } from '@/types'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Camera, Loading, Warning, Position, CircleCheck, Lock, Refresh, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'

// 基础状态
const status = useStatus()
const socket = useSocket()
const groupNo = computed(() => String(status.userStatus?.groupNo ?? ''))

// 问一问功能状态
const selectedViewpoint = ref<'A' | 'B' | null>(null)
const isAsking = ref(false)
const allTips = ref<Array<{id: string, viewpoint: 'A' | 'B', text: string, timestamp: number}>>([])
const remainingQuestions = ref(2) // 限制为2次提问

// 上传功能状态
const showUploadCard = ref(false)
const isUploading = ref(false)
const isAnalyzing = ref(false)
const uploadResults = ref<Array<{id: string, result: string, timestamp: number}>>([])
const selectedResultIndex = ref<number>(-1)
const hasSentResult = ref(false)

// 编辑功能状态
const showEditCard = ref(false)
const analysisData = ref<{q1: string, q2: string}>({q1: '', q2: ''})
const originalData = ref<{q1: string, q2: string}>({q1: '', q2: ''})
const hasSubmittedEdit = ref(false)

// 查看功能状态
const showViewCard = ref(false)
const wordCloudData = ref<Array<{groupNo: string, q1: string, q2: string}>>([])

// 上传功能是否可用
const uploadEnabled = ref(false)

// 摄像头相关状态
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)

// ECharts词云图相关状态
const wordCloudRef = ref<HTMLElement>()
const wordCloudChart = ref<echarts.ECharts | null>(null)

// API配置
const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const ASK_WORKFLOW_ID = '7554010166815899682' // 问一问工作流ID
const UPLOAD_WORKFLOW_ID = '7553827536788193322' // 上传分析工作流ID

// 获取观点含义
const getViewpointMeaning = (choice: 'A' | 'B' | null): string => {
  if (choice === 'A') return '使用数字设备利大于弊'
  if (choice === 'B') return '使用数字设备弊大于利'
  return ''
}

// 获取上传按钮文本
const getUploadButtonText = (): string => {
  if (isUploading.value) return '正在上传...'
  if (isAnalyzing.value) return '分析中...'
  return '拍照上传'
}

// 按观点分组的提示词
const groupedTips = computed(() => {
  const groups: Record<string, typeof allTips.value> = {}
  allTips.value.forEach(tip => {
    if (!groups[tip.viewpoint]) {
      groups[tip.viewpoint] = []
    }
    groups[tip.viewpoint].push(tip)
  })
  return groups
})

// 问一问功能
const askAI = async () => {
  if (!selectedViewpoint.value || isAsking.value) return
  
  isAsking.value = true
  
  try {
    console.log('[Activity6] 开始向AI提问，观点:', selectedViewpoint.value)
    
    const viewpointText = getViewpointMeaning(selectedViewpoint.value)
    
    // 调用问一问工作流
    const payload = {
      workflow_id: ASK_WORKFLOW_ID,
      parameters: {
        input_type: viewpointText
      }
    }
    
    console.log('[Activity6] 问一问请求参数:', payload)
    
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error('AI请求失败')
    }
    
    const result = await response.json()
    console.log('[Activity6] AI响应:', result)
    
    if (result.code === 0 && result.data) {
      const analysisData = JSON.parse(result.data)
      const outputArray = analysisData.output || []
      
      console.log('[Activity6] 解析到提示词:', outputArray)
      
      // 将新提示词添加到列表，限制为3个
      if (Array.isArray(outputArray)) {
        const limitedTips = outputArray.slice(0, 3) // 每次最多3个提示
        limitedTips.forEach((tipText: string, index: number) => {
          if (tipText && tipText.trim()) {
            allTips.value.push({
              id: `tip_${Date.now()}_${index}`,
              viewpoint: selectedViewpoint.value!,
              text: tipText.trim(),
              timestamp: Date.now()
            })
          }
        })
        
        // 减少剩余机会
        remainingQuestions.value--
        
        ElMessage.success(`获得${limitedTips.length}个AI提示！剩余${remainingQuestions.value}次机会`)
        
        // 保存到本地存储
        saveToLocalStorage()
      } else {
        ElMessage.warning('AI没有返回有效提示')
      }
    } else {
      throw new Error(result.msg || 'AI分析失败')
    }
    
  } catch (error: any) {
    console.error('[Activity6] AI提问失败:', error)
    ElMessage.error('AI提问失败，请稍后重试')
  } finally {
    isAsking.value = false
  }
}

// 初始化摄像头
const initCamera = async () => {
  console.log('[Activity6] 开始初始化摄像头')
  isLoading.value = true
  cameraError.value = ''
  
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
    
    isCameraReady.value = true
    ElMessage.success('摄像头启动成功')
  } catch (error: any) {
    console.error('[Activity6] 摄像头启动失败:', error)
    
    if (error.name === 'NotAllowedError') {
      cameraError.value = '摄像头权限被拒绝，请允许访问'
    } else if (error.name === 'NotFoundError') {
      cameraError.value = '未找到摄像头设备'
    } else {
      cameraError.value = `摄像头启动失败: ${error.message}`
    }
  } finally {
    isLoading.value = false
  }
}

const onVideoLoaded = () => {
  console.log('[Activity6] 视频流加载完成')
}

// 拍照上传功能
const captureAndUpload = async () => {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return
  
  isUploading.value = true
  
  try {
    // 拍照
    const video = videoRef.value
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    if (!context) throw new Error('无法获取Canvas上下文')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // 上传图片
    const fileId = await uploadImage(dataUrl)
    
    if (fileId) {
      // 上传成功，停止加载状态
      isUploading.value = false
      isAnalyzing.value = true
      
      ElMessage.success('图片上传成功！正在分析...')
      
      // 分析图片
      await analyzeUploadedImage(fileId)
    } else {
      ElMessage.error('图片上传失败，请重试')
    }
    
  } catch (error: any) {
    console.error('[Activity6] 上传失败:', error)
    ElMessage.error('上传失败，请重试')
  } finally {
    isUploading.value = false
    isAnalyzing.value = false
  }
}

// 上传图片
const uploadImage = async (dataUrl: string): Promise<string | null> => {
  try {
    const filename = `activity6_${Date.now()}.jpg`
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
    console.log('[Activity6] 上传响应:', uploadResult)
    
    if (uploadResult.code !== 0 || !uploadResult.data?.id) {
      throw new Error('上传响应异常')
    }
    
    return uploadResult.data.id
    
  } catch (error: any) {
    console.error('[Activity6] 图片上传失败:', error)
    return null
  }
}

// 分析上传的图片
const analyzeUploadedImage = async (fileId: string) => {
  try {
    const payload = {
      workflow_id: UPLOAD_WORKFLOW_ID,
      parameters: {
        input_img: {
          file_id: fileId
        },
        input_index: 1 // 使用input_index为1
      }
    }
    
    console.log('[Activity6] 开始分析上传图片:', payload)
    
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error('分析请求失败')
    }
    
    const result = await response.json()
    console.log('[Activity6] 分析响应:', result)
    
    if (result.code === 0 && result.data) {
      const workflowData = JSON.parse(result.data)
      console.log('[Activity6] 解析分析数据:', workflowData)
      
      // 获取output2的q1和q2数据
      if (workflowData.output2 && typeof workflowData.output2 === 'object') {
        const q1 = workflowData.output2.q1 || ''
        const q2 = workflowData.output2.q2 || ''
        
        if (q1 && q2) {
          // 设置原始数据和编辑数据
          originalData.value = { q1, q2 }
          analysisData.value = { q1, q2 }
          
          // 隐藏上传卡片，显示编辑卡片
          showUploadCard.value = false
          showEditCard.value = true
          
          // 清理摄像头资源
          cleanup()
          
          ElMessage.success('分析完成！请完善分析内容')
          saveToLocalStorage()
        } else {
          throw new Error('分析结果中缺少q1或q2数据')
        }
      } else {
        throw new Error('未找到output2数据或格式错误')
      }
    } else {
      throw new Error(result.msg || '分析失败')
    }
    
  } catch (error: any) {
    console.error('[Activity6] 分析失败:', error)
    ElMessage.error('分析失败，请重试')
  } finally {
    isAnalyzing.value = false
  }
}

// 发送结果给教师
const sendResultToTeacher = async () => {
  if (selectedResultIndex.value === -1 || hasSentResult.value || uploadResults.value.length === 0) return
  
  const selectedResult = uploadResults.value[selectedResultIndex.value]
  if (!selectedResult) return
  
  const g = groupNo.value
  if (!g) return
  
  try {
    console.log('[Activity2] 📤 发送分析结果给教师')
    
    socket.submit({
      mode: EntityMode.GROUP,
      messageType: 'upload',
      activityIndex: '2',
      data: { 
        analysisResult: selectedResult.result,
        analysisCount: uploadResults.value.length,
        selectedIndex: selectedResultIndex.value + 1,
        timestamp: selectedResult.timestamp
      },
      from: {
        id: g,
        groupNo: g
      },
      to: null
    })
    
    hasSentResult.value = true
    ElMessage.success(`第${selectedResultIndex.value + 1}次分析结果已发送给教师！`)
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity6] 发送结果失败:', error)
    ElMessage.error('发送失败，请重试')
  }
}

// 时间格式化
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  
  return date.toLocaleDateString('zh-CN')
}

// 从Activity5获取观点选择
const loadViewpointFromActivity5 = () => {
  const g = groupNo.value
  if (!g) return
  
  const activity5Key = `activity5_vote_${g}`
  try {
    const stored = localStorage.getItem(activity5Key)
    if (stored) {
      const data = JSON.parse(stored)
      if (data.voteChoice) {
        selectedViewpoint.value = data.voteChoice
        console.log('[Activity6] 从Activity5加载观点:', data.voteChoice)
        ElMessage.info(`已自动加载您在活动五中的选择：观点${data.voteChoice}`)
      }
    }
  } catch (error) {
    console.warn('从Activity5加载观点失败:', error)
  }
}

// 转换base64为File对象
const dataURLtoFile = (dataurl: string, filename: string): File => {
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

// 清理摄像头资源
const cleanup = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  isCameraReady.value = false
}

// 提交编辑后的数据
const submitEditedData = async () => {
  if (!analysisData.value.q1.trim() || !analysisData.value.q2.trim() || hasSubmittedEdit.value) return
  
  const g = groupNo.value
  if (!g) return
  
  try {
    console.log('[Activity2] 📤 发送编辑结果给教师和同学')
    
    // 发送给教师端
    socket.submit({
      mode: EntityMode.GROUP,
      messageType: 'edit_result',
      activityIndex: '2',
      data: { 
        q1: analysisData.value.q1.trim(),
        q2: analysisData.value.q2.trim(),
        originalQ1: originalData.value.q1,
        originalQ2: originalData.value.q2,
        timestamp: Date.now()
      },
      from: {
        id: g,
        groupNo: g
      },
      to: null
    })
    
    // 发送给其他学生 (discuss)
    socket.discuss({
      mode: EntityMode.GROUP,
      messageType: 'discuss',
      activityIndex: '2',
      data: { 
        q1: analysisData.value.q1.trim(),
        q2: analysisData.value.q2.trim(),
        groupNo: g,
        timestamp: Date.now()
      },
      from: {
        id: g,
        groupNo: g
      },
      to: {
        groupNo: [g]
      }
    })
    
    hasSubmittedEdit.value = true
    showEditCard.value = false
    showViewCard.value = true
    
    ElMessage.success('数据已提交给教师和同学！')
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity6] 提交编辑数据失败:', error)
    ElMessage.error('提交失败，请重试')
  }
}

// 初始化词云图
const initWordCloud = () => {
  if (!wordCloudRef.value) return
  
  if (wordCloudChart.value) {
    wordCloudChart.value.dispose()
  }
  
  wordCloudChart.value = echarts.init(wordCloudRef.value)
  
  // 设置响应式
  window.addEventListener('resize', () => {
    if (wordCloudChart.value) {
      wordCloudChart.value.resize()
    }
  })
  
  updateWordCloud()
}

// 更新词云图数据
const updateWordCloud = () => {
  if (!wordCloudChart.value || wordCloudData.value.length === 0) return
  
  // 获取词云数据
  const wordData = getWordCloudData()
  
  const option = {
    backgroundColor: '#ffffff',
    tooltip: {
      show: true,
      formatter: (params: any) => {
        return `${params.name}: 第${params.data.groupNo}组`
      }
    },
    series: [{
      type: 'wordCloud',
      sizeRange: [16, 60],
      rotationRange: [-45, 45],
      rotationStep: 15,
      gridSize: 8,
      shape: 'circle',
      width: '100%',
      height: '100%',
      drawOutOfBound: false,
      layoutAnimation: true,
      textStyle: {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontWeight: 'bold',
        color: () => {
          const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
          ]
          return colors[Math.floor(Math.random() * colors.length)]
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 10,
          shadowColor: '#333'
        }
      },
      data: wordData
    }]
  }
  
  wordCloudChart.value.setOption(option, true)
}

// 获取词云图数据
const getWordCloudData = () => {
  const wordFreq: Record<string, {value: number, groupNo: string}> = {}
  
  wordCloudData.value.forEach(item => {
    if (item.q1 && item.q1.trim()) {
      const word = item.q1.trim()
      if (wordFreq[word]) {
        wordFreq[word].value++
      } else {
        wordFreq[word] = { value: 1, groupNo: item.groupNo }
      }
    }
    
    if (item.q2 && item.q2.trim()) {
      const word = item.q2.trim()
      if (wordFreq[word]) {
        wordFreq[word].value++
      } else {
        wordFreq[word] = { value: 1, groupNo: item.groupNo }
      }
    }
  })
  
  return Object.entries(wordFreq).map(([name, data]) => ({
    name,
    value: data.value * 10 + 20, // 调整大小权重
    groupNo: data.groupNo
  }))
}

// 刷新词云图数据
const refreshWordCloud = () => {
  updateWordCloud()
  ElMessage.info('词云图数据已刷新')
}

// 生成测试数据
const generateTestData = () => {
  const testData = [
    { groupNo: '1', q1: '是否监管', q2: '使用频率' },
    { groupNo: '2', q1: '安全性', q2: '学习效果' },
    { groupNo: '3', q1: '隐私保护', q2: '使用时长' },
    { groupNo: '4', q1: '内容质量', q2: '是否监管' },
    { groupNo: '5', q1: '学习效果', q2: '安全性' },
    { groupNo: '6', q1: '使用频率', q2: '隐私保护' },
    { groupNo: '7', q1: '技术依赖', q2: '内容质量' },
    { groupNo: '8', q1: '网络成瘾', q2: '技术依赖' }
  ]
  
  wordCloudData.value = testData
  saveToLocalStorage()
  
  // 初始化词云图
  setTimeout(() => {
    initWordCloud()
  }, 100)
  
  ElMessage.success('测试数据已生成，词云图已更新！')
}


// 处理教师端消息
const handleDistribute = (payload: any) => {
  if (!payload) return
  
  if (payload.type === 'show_upload_card') {
    console.log('[Activity6] 收到显示上传卡片消息')
    showUploadCard.value = true
    uploadEnabled.value = true
    showEditCard.value = false
    showViewCard.value = false
    // 自动启动摄像头
    setTimeout(() => {
      initCamera()
    }, 500)
    ElMessage.info('教师已开启上传功能')
  } else if (payload.type === 'hide_upload_card') {
    console.log('[Activity6] 收到关闭上传卡片消息')
    uploadEnabled.value = false
    cleanup() // 清理摄像头资源
    ElMessage.warning('教师已关闭上传功能')
  } else if (payload.type === 'show_ask_card') {
    console.log('[Activity6] 收到显示问一问卡片消息')
    showUploadCard.value = false
    showEditCard.value = false
    showViewCard.value = false
    cleanup() // 清理摄像头资源
    ElMessage.info('教师已切换到问一问功能')
  } else if (payload.type === 'show_view_card') {
    console.log('[Activity6] 收到显示查看卡片消息')
    showUploadCard.value = false
    showEditCard.value = false
    showViewCard.value = true
    cleanup() // 清理摄像头资源
    ElMessage.info('教师已切换到查看功能')
    
    // 初始化词云图
    setTimeout(() => {
      initWordCloud()
    }, 100)
  }
}

// 处理discuss消息
const handleDiscuss = (payload: any) => {
  if (!payload || payload.type !== 'activity6_discuss') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  const groupNo = String(from.groupNo ?? '').trim()
  const q1 = data.q1 || ''
  const q2 = data.q2 || ''
  
  if (groupNo && q1 && q2) {
    // 检查是否已存在该组的数据
    const existingIndex = wordCloudData.value.findIndex(item => item.groupNo === groupNo)
    
    const newData = { groupNo, q1, q2 }
    
    if (existingIndex >= 0) {
      wordCloudData.value[existingIndex] = newData
    } else {
      wordCloudData.value.push(newData)
    }
    
    console.log(`[Activity6] 收到第${groupNo}组的讨论数据`)
    saveToLocalStorage()
    
    // 更新词云图
    if (showViewCard.value && wordCloudChart.value) {
      updateWordCloud()
    }
  }
}

// 本地存储
const getStorageKey = () => {
  const g = groupNo.value
  return g ? `activity6_data_${g}` : null
}

const saveToLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  const data = {
    selectedViewpoint: selectedViewpoint.value,
    remainingQuestions: remainingQuestions.value,
    allTips: allTips.value,
    showUploadCard: showUploadCard.value,
    showEditCard: showEditCard.value,
    showViewCard: showViewCard.value,
    uploadResults: uploadResults.value,
    selectedResultIndex: selectedResultIndex.value,
    hasSentResult: hasSentResult.value,
    analysisData: analysisData.value,
    originalData: originalData.value,
    hasSubmittedEdit: hasSubmittedEdit.value,
    wordCloudData: wordCloudData.value,
    uploadEnabled: uploadEnabled.value,
    isAnalyzing: isAnalyzing.value,
    timestamp: Date.now()
  }
  localStorage.setItem(key, JSON.stringify(data))
}

const loadFromLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      // 不从本地存储恢复 selectedViewpoint，因为要从Activity5获取
      remainingQuestions.value = data.remainingQuestions ?? 2
      allTips.value = data.allTips || []
      showUploadCard.value = data.showUploadCard || false
      showEditCard.value = data.showEditCard || false
      showViewCard.value = data.showViewCard || false
      uploadResults.value = data.uploadResults || []
      selectedResultIndex.value = data.selectedResultIndex ?? -1
      hasSentResult.value = data.hasSentResult || false
      analysisData.value = data.analysisData || {q1: '', q2: ''}
      originalData.value = data.originalData || {q1: '', q2: ''}
      hasSubmittedEdit.value = data.hasSubmittedEdit || false
      wordCloudData.value = data.wordCloudData || []
      uploadEnabled.value = data.uploadEnabled || false
      isAnalyzing.value = data.isAnalyzing || false
      console.log('Activity6 学生端数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity6本地数据失败:', error)
  }
}

// 组件生命周期
onMounted(() => {
  console.log('[Activity2] 🟢 组件已挂载，开始监听消息')
  loadFromLocalStorage()
  loadViewpointFromActivity5() // 从Activity5加载观点选择
  socket.on('dispatch', handleDistribute)
  socket.on('discuss', handleDiscuss)
})

onUnmounted(() => {
  console.log('[Activity2] 🔴 组件卸载，清理监听器和资源')
  socket.off('dispatch', handleDistribute)
  socket.off('discuss', handleDiscuss)
  cleanup()
  
  // 销毁词云图实例
  if (wordCloudChart.value) {
    wordCloudChart.value.dispose()
    wordCloudChart.value = null
  }
})
</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 活动说明区域 */
.activity-description {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 卡片通用样式 */
.ask-ai-card,
.upload-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 问一问卡片样式 */
.header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.viewpoint-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewpoint-badge {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 16px;
  color: white;
}

.viewpoint-badge.badge-a {
  background: #ef4444;
}

.viewpoint-badge.badge-b {
  background: #3b82f6;
}

.questions-remaining {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remaining-label {
  font-size: 14px;
  color: #6b7280;
}

.remaining-count {
  font-size: 16px;
  font-weight: 700;
  color: #059669;
  background: #d1fae5;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 观点选择器 */
.viewpoint-selector {
  margin-bottom: 20px;
}

.selector-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.viewpoint-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.viewpoint-btn {
  flex: 1;
  min-width: 200px;
  height: 48px;
  font-size: 14px;
  border-radius: 12px;
}

/* 问一问按钮 */
.ask-button-container {
  text-align: center;
  margin-bottom: 24px;
}

.ask-button {
  min-width: 250px;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.ask-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(139, 92, 246, 0.4);
}

/* AI生成动画 */
.generating-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-dots {
  display: flex;
  gap: 4px;
}

.ai-dots .dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: dot-pulse 1.4s infinite ease-in-out;
}

.ai-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.ai-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 提示词展示区域 */
.tips-container {
  margin-top: 20px;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tips-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.tips-count {
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 观点分组 */
.viewpoint-group {
  margin-bottom: 20px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.viewpoint-label {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
  color: white;
}

.viewpoint-label.viewpoint-a {
  background: #ef4444;
}

.viewpoint-label.viewpoint-b {
  background: #3b82f6;
}

.group-count {
  font-size: 12px;
  color: #6b7280;
}

/* 提示词气泡网格 */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.tip-bubble {
  position: relative;
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.tip-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.bubble-a {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fca5a5;
}

.bubble-b {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #93c5fd;
}

.tip-number {
  position: absolute;
  top: -8px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: #374151;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.tip-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  padding-top: 8px;
}

/* 上传功能卡片样式 */
.upload-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-active {
  color: #3b82f6;
  font-weight: 600;
}

.status-completed {
  color: #059669;
  font-weight: 600;
}

/* 摄像头预览区域 */
.camera-preview-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  background: #1f2937;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  background: #000000;
}

/* 加载和错误状态 */
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #ffffff;
  text-align: center;
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.error-overlay {
  background: rgba(239, 68, 68, 0.8);
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 32px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 上传控制按钮 */
.upload-controls {
  text-align: center;
  margin-bottom: 20px;
}

.upload-button {
  min-width: 200px;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.upload-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
}

/* 分析进度样式 */
.analysis-progress {
  margin-top: 16px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  text-align: center;
}

.progress-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.progress-icon {
  font-size: 20px;
  color: #0ea5e9;
  animation: spin 1s linear infinite;
}

.progress-text {
  font-size: 16px;
  font-weight: 600;
  color: #0c4a6e;
}

/* 分析结果容器 */
.results-container {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.results-header {
  margin-bottom: 16px;
  text-align: center;
}

.results-title {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 8px 0;
}

.results-hint {
  font-size: 14px;
  color: #6b7280;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.result-item.selected {
  border-color: #10b981;
  background: #f0fdf4;
}

.result-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-number {
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
}

.result-time {
  font-size: 12px;
  color: #6b7280;
}

.selected-icon {
  color: #10b981;
  font-size: 18px;
}

.result-item-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 发送按钮 */
.send-controls {
  text-align: center;
}

.send-button {
  min-width: 180px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .viewpoint-buttons {
    flex-direction: column;
  }
  
  .viewpoint-btn {
    min-width: auto;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .camera-preview-wrapper {
    height: 250px;
  }
}

/* 编辑功能卡片样式 */
.edit-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.edit-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-active {
  color: #3b82f6;
  font-weight: 600;
}

.status-completed {
  color: #059669;
  font-weight: 600;
}

.edit-content {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-label {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.original-text {
  font-size: 14px;
  color: #6b7280;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.edit-input {
  margin-top: 8px;
}

.edit-controls {
  text-align: center;
}

.submit-button {
  min-width: 250px;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
}

/* 查看功能卡片样式 */
.view-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.view-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-info {
  color: #3b82f6;
  font-weight: 600;
}

.wordcloud-container {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wordcloud-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 16px 0;
  text-align: center;
}

.wordcloud-display {
  min-height: 400px;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  border: 1px solid #e5e7eb;
}

.echarts-wordcloud {
  width: 100%;
  height: 360px;
}

.empty-wordcloud {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #9ca3af;
}

.empty-wordcloud .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-wordcloud p {
  margin: 0;
  font-size: 16px;
}

.view-controls {
  text-align: center;
}

.refresh-button,
.test-button {
  min-width: 180px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  margin: 0 8px;
}

/* 上传关闭提示卡片样式 */
.upload-disabled-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-disabled {
  color: #ef4444;
  font-weight: 600;
}

.disabled-content {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.disabled-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ef4444;
}
</style>
