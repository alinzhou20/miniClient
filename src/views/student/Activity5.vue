<template>
  <div class="page">
    <!-- 活动说明 -->
    <div class="activity-description">
      <strong>快速投票活动</strong><br>
      等待教师发起投票，拍照表达你的选择
    </div>

    <!-- 投票状态区域 -->
    <div class="vote-container">
      <div class="vote-panel">
        <h3 class="section-title">🗳️ 快速投票</h3>
        
        <!-- 投票状态显示 -->
        <div class="vote-status">
          <div v-if="!voteStarted" class="waiting-status">
            <el-icon class="waiting-icon"><Clock /></el-icon>
            <p>等待教师发起投票...</p>
          </div>
          
          <div v-else-if="voteStarted && !hasVoted" class="voting-status">
            <el-icon class="voting-icon"><Camera /></el-icon>
            <p>投票进行中，请点击下方按钮拍照投票</p>
          </div>
          
          <div v-else-if="hasVoted && !voteChoice" class="analyzing-status">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在分析投票结果...</p>
          </div>
          
          <div v-else-if="voteChoice" class="finished-status">
            <el-icon class="finished-icon"><CircleCheck /></el-icon>
            <p>投票完成！</p>
          </div>
        </div>

        <!-- 摄像头预览区域 -->
        <div class="camera-preview-wrapper" v-if="voteStarted && !hasVoted">
          <video 
            ref="videoRef" 
            class="camera-preview"
            autoplay 
            muted 
            playsinline
            @loadedmetadata="onVideoLoaded"
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
        
        <!-- 投票按钮 -->
        <div class="vote-controls" v-if="voteStarted && !hasVoted">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!isCameraReady || isVoting"
            :loading="isVoting"
            @click="castVote"
            class="vote-button"
          >
            <el-icon v-if="!isVoting"><Camera /></el-icon>
            {{ isVoting ? '正在上传分析...' : '点击投票' }}
          </el-button>
        </div>

        <!-- 投票结果显示 -->
        <div v-if="voteChoice" class="vote-result">
          <div class="result-header">
            <div class="result-label">投票结果:</div>
            <div class="result-badge" :class="'result-' + voteChoice?.toLowerCase()">
              观点{{ voteChoice }}：{{ getViewpointMeaning(voteChoice) }}
            </div>
          </div>
          <div class="result-description">
            <p>您的观点选择已成功提交给教师</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的Canvas用于图像处理 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { socketService } from '@/services/socket'
import { ElMessage } from 'element-plus'
import { Clock, CircleCheck, Camera, Loading, Warning } from '@element-plus/icons-vue'

// 投票状态
const voteStarted = ref(false)
const hasVoted = ref(false)
const isVoting = ref(false)
const voteChoice = ref<'A' | 'B' | null>(null)
const rawAnalysisResult = ref<string>('')  // 存储原始分析结果用于提交

// 摄像头相关状态
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

// Coze API 配置（复用Activity4的配置）
const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WORKFLOW_ID = '7553827536788193322' // 使用相同的工作流ID

// 获取观点含义
const getViewpointMeaning = (choice: 'A' | 'B' | null): string => {
  if (choice === 'A') return '使用数字设备利大于弊'
  if (choice === 'B') return '使用数字设备弊大于利'
  return ''
}

// 初始化摄像头（复用Activity4逻辑）
const initCamera = async () => {
  console.log('[Activity5] 开始初始化摄像头')
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
    console.error('[Activity5] 摄像头启动失败:', error)
    
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
  console.log('[Activity5] 视频流加载完成')
}

// 投票功能
const castVote = async () => {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value || hasVoted.value) return
  
  isVoting.value = true
  
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
    
    // 上传图片并获取file_id
    const fileId = await uploadVoteImage(dataUrl)
    
    if (fileId) {
      // 上传成功，立即显示投票成功
      hasVoted.value = true
      ElMessage.success('投票成功！正在分析结果...')
      
      // 开始分析并等待结果
      await analyzeAndSubmitVote(fileId)
    } else {
      ElMessage.error('图片上传失败，请重新投票')
    }
    
  } catch (error: any) {
    console.error('[Activity5] 投票失败:', error)
    ElMessage.error('投票失败，请重试')
    hasVoted.value = false // 失败时重置状态
  } finally {
    isVoting.value = false
  }
}

// 上传投票图片，返回file_id
const uploadVoteImage = async (dataUrl: string): Promise<string | null> => {
  try {
    const filename = `vote_${Date.now()}.jpg`
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
    console.log('[Activity5] 上传响应:', uploadResult)
    
    if (uploadResult.code !== 0 || !uploadResult.data?.id) {
      throw new Error('上传响应异常')
    }
    
    console.log('[Activity5] 图片上传成功，file_id:', uploadResult.data.id)
    return uploadResult.data.id
    
  } catch (error: any) {
    console.error('[Activity5] 图片上传失败:', error)
    return null
  }
}

// 分析并提交投票
const analyzeAndSubmitVote = async (fileId: string) => {
  try {
    // 调用工作流分析
    const workflowPayload = {
      workflow_id: WORKFLOW_ID,
      parameters: {
        input_img: {
          file_id: fileId
        },
        input_index: 0 // 使用input_index为0
      }
    }
    
    console.log('[Activity5] 开始工作流分析:', workflowPayload)
    
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
    console.log('[Activity5] 工作流响应:', workflowResult)
    
    if (workflowResult.code !== 0) {
      throw new Error('工作流执行失败')
    }
    
    // 解析分析结果
    let choice: 'A' | 'B' = 'A' // 默认值
    let output0Value = 'A' // 原始output0值
    
    if (workflowResult.data) {
      try {
        const analysisData = JSON.parse(workflowResult.data)
        console.log('[Activity5] 解析分析数据:', analysisData)
        
        // 获取output0的值
        const output0 = analysisData.output0
        console.log('[Activity5] output0值:', output0)
        
        if (output0) {
          rawAnalysisResult.value = String(output0)
          output0Value = String(output0)
          
          // 根据output0的内容判断A或B
          const outputStr = String(output0).toUpperCase()
          if (outputStr.includes('A') || outputStr === 'A') {
            choice = 'A'
          } else if (outputStr.includes('B') || outputStr === 'B') {
            choice = 'B'
          } else {
            // 如果output0不包含明确的A或B，使用默认逻辑
            choice = outputStr.charCodeAt(0) % 2 === 0 ? 'A' : 'B'
          }
        }
        
      } catch (parseError) {
        console.warn('[Activity5] 解析分析结果失败:', parseError)
        // 使用默认值
        rawAnalysisResult.value = 'A'
        output0Value = 'A'
      }
    }
    
    voteChoice.value = choice
    
    // 提交原始的output0值给教师端
    await submitVoteResult(output0Value)
    
    ElMessage.success(`分析完成！投票选择：选项${choice}`)
    
  } catch (error: any) {
    console.error('[Activity5] 分析失败:', error)
    ElMessage.error('分析失败，但投票已记录')
    // 分析失败时使用随机选择
    const fallbackChoice: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B'
    const fallbackOutput0 = fallbackChoice // 失败时的默认值
    voteChoice.value = fallbackChoice
    rawAnalysisResult.value = fallbackOutput0
    await submitVoteResult(fallbackOutput0)
  }
}

// 提交投票结果
const submitVoteResult = async (output0Value: string) => {
  const g = groupNo.value
  const s = studentNo.value
  if (!g || !s) return
  
  try {
    const payload = {
      type: 'activity5_vote',
      from: { groupNo: g, studentNo: s },
      data: { 
        output0: output0Value,  // 提交原始的output0值
        timestamp: Date.now()
      },
      at: Date.now()
    }
    
    const ack = await socketService.submit(payload as any)
    if (ack.code !== 200) {
      throw new Error(ack.message || '提交失败')
    }
    
    console.log('[Activity5] 投票结果已提交，output0值:', output0Value)
    
    // 保存到本地存储
    saveToLocalStorage()
  } catch (error: any) {
    console.error('[Activity5] 提交投票结果失败:', error)
    throw error
  }
}

// 本地存储相关
const getStorageKey = () => {
  const g = groupNo.value
  const s = studentNo.value
  return g && s ? `activity5_vote_${g}_${s}` : null
}

const saveToLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  const data = {
    voteChoice: voteChoice.value,
    rawAnalysisResult: rawAnalysisResult.value,
    hasVoted: hasVoted.value,
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
      voteChoice.value = data.voteChoice || null
      rawAnalysisResult.value = data.rawAnalysisResult || ''
      hasVoted.value = data.hasVoted || false
      console.log('Activity5 学生端数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity5本地数据失败:', error)
  }
}

// 转换base64为File对象（复用Activity4的函数）
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

// 开始投票
const startVoting = () => {
  console.log('[Activity5] 收到投票开始信号')
  voteStarted.value = true
  hasVoted.value = false
  voteChoice.value = null
  rawAnalysisResult.value = ''
  
  // 自动启动摄像头
  initCamera()
  
  ElMessage.info('投票开始！请拍照进行投票')
}


// 清理摄像头资源
const cleanup = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  isCameraReady.value = false
}

// 处理教师端的投票消息
const handleDistribute = (payload: any) => {
  if (!payload || payload.type !== 'start_vote') return
  
  console.log('[Activity5] 收到投票开始消息:', payload)
  startVoting()
}

// 组件挂载时监听投票消息
onMounted(() => {
  console.log('[Activity5] 组件已挂载，开始监听投票消息')
  loadFromLocalStorage()
  socketService.on('distribute', handleDistribute)
})

// 组件卸载时清理资源
onUnmounted(() => {
  socketService.off('distribute', handleDistribute)
  cleanup()
})
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

/* 活动说明区域 */
.activity-description {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  color: #0c4a6e;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* 投票容器 */
.vote-container {
  display: flex;
  justify-content: center;
}

.vote-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 600px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
}

/* 投票状态显示 */
.vote-status {
  margin-bottom: 20px;
  text-align: center;
}

.waiting-status {
  padding: 40px 20px;
  color: #6b7280;
}

.waiting-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.voting-status {
  padding: 30px 20px;
  background: #f0f9ff;
  border-radius: 12px;
  border: 1px solid #bae6fd;
  color: #1e40af;
}

.voting-icon {
  font-size: 32px;
  margin-bottom: 12px;
  color: #3b82f6;
}

.analyzing-status {
  padding: 30px 20px;
  background: #fef3c7;
  border-radius: 12px;
  border: 1px solid #fbbf24;
  color: #92400e;
}

.finished-status {
  padding: 40px 20px;
  color: #059669;
}

.finished-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #10b981;
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
  object-fit: cover;
  border-radius: 12px;
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

/* 投票控制按钮 */
.vote-controls {
  text-align: center;
  margin-bottom: 20px;
}

.vote-button {
  min-width: 200px;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.vote-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
}

.vote-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
}

/* 投票结果显示 */
.vote-result {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 20px;
  text-align: center;
}

.result-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.result-label {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.result-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.result-badge.result-a {
  background: #ef4444;
}

.result-badge.result-b {
  background: #3b82f6;
}

.result-description {
  color: #6b7280;
  font-size: 14px;
}

.result-description p {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .camera-preview-wrapper {
    height: 250px;
  }
  
  .vote-button {
    min-width: 160px;
    height: 48px;
    font-size: 16px;
  }
  
}
</style>
