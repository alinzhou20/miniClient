<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">🎯 现场投票</h2>
      <div class="activity-description">请对准教师的摄像头进行拍摄</div>
    </div>

    <!-- 照片卡片 -->
    <div v-if="!hasPhoto" class="camera-section">
        <!-- 拍摄状态显示 -->
        <div v-if="!isLoading && !isCameraReady && !cameraError" class="waiting-status">
          <el-icon class="waiting-icon"><Camera /></el-icon>
          <p>点击下方按钮启动摄像头</p>
        </div>

        <!-- 摄像头预览区域 -->
        <div class="camera-preview-wrapper" v-if="(isLoading || isCameraReady || cameraError) && !isAnalyzing">
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
        
        <!-- 拍摄控制按钮 -->
        <div class="camera-controls">
          <el-button 
            v-if="!isCameraReady && !cameraError && !isAnalyzing"
            type="primary" 
            size="large" 
            :loading="isLoading"
            @click="initCamera"
            class="camera-button"
          >
            <el-icon v-if="!isLoading"><VideoCamera /></el-icon>
            {{ isLoading ? '启动中...' : '启动摄像头' }}
          </el-button>
          
          <el-button 
            v-if="isCameraReady && !isAnalyzing"
            type="success" 
            size="large" 
            @click="capturePhoto"
            class="capture-button"
          >
            <el-icon><Camera /></el-icon>
            拍摄示例
          </el-button>
        </div>
    </div>

    <!-- 照片展示卡片 -->
    <div v-if="hasPhoto && !activity0.voteResult" class="photo-section">
      <div class="photo-card">
        <div class="photo-header">
          <h3 class="photo-title">📷 拍摄照片</h3>
          <div v-if="isAnalyzing" class="analyzing-badge">分析中...</div>
        </div>
        <div class="photo-display">
          <img :src="capturedPhotoUrl" alt="拍摄照片" class="captured-photo" />
        </div>
      </div>
    </div>

    <!-- 结果展示卡片 -->
    <div v-if="activity0.voteResult" class="stats-section">
      <div class="stats-card">
        <div class="stats-header">
          <h3 class="stats-title">📊 分析结果</h3>
          <div class="demo-info">
            <span class="demo-label">示例结果</span>
          </div>
        </div>

        <!-- 投票结果展示 -->
        <div class="result-display">
          <div class="result-header">
            <div class="result-label">AI 分析结果:</div>
            <div class="result-badge" :class="'result-' + activity0.voteResult.result.toLowerCase()">
              观点{{ activity0.voteResult.result }}：{{ getViewpointMeaning(activity0.voteResult.result) }}
            </div>
          </div>
          <div class="result-details">
            <p><strong>观点A计数:</strong> {{ activity0.voteResult.countA }}</p>
            <p><strong>观点B计数:</strong> {{ activity0.voteResult.countB }}</p>
            <p><strong>总计数:</strong> {{ totalCount }}</p>
            <p><strong>分析时间:</strong> {{ formatTimestamp(activity0.voteResult.timestamp) }}</p>
          </div>
        </div>

        <!-- 模拟统计对战界面 -->
        <div class="demo-battle-arena">
          <div class="option-section option-a">
            <div class="option-header">
              <div class="option-label">观点A：使用数字设备利大于弊</div>
              <div class="option-count">{{ activity0.voteResult.countA }}</div>
            </div>
            <div class="option-bar">
              <div 
                class="option-fill option-a-fill" 
                :style="{ width: optionAPercentage + '%' }"
              ></div>
            </div>
            <div class="option-percentage">{{ optionAPercentage }}%</div>
          </div>

          <div class="vs-divider">
            <div class="vs-text">VS</div>
          </div>

          <div class="option-section option-b">
            <div class="option-header">
              <div class="option-label">观点B：使用数字设备弊大于利</div>
              <div class="option-count">{{ activity0.voteResult.countB }}</div>
            </div>
            <div class="option-bar">
              <div 
                class="option-fill option-b-fill" 
                :style="{ width: optionBPercentage + '%' }"
              ></div>
            </div>
            <div class="option-percentage">{{ optionBPercentage }}%</div>
          </div>
        </div>

        <!-- 照片展示 -->
        <div class="photo-display" style="margin-top: 24px;">
          <img :src="capturedPhotoUrl" alt="拍摄照片" class="captured-photo" style="max-width: 100%; border-radius: 12px;" />
        </div>

        <!-- 重新拍摄按钮 -->
        <div class="reset-controls" style="margin-top: 24px;">
          <el-button 
            type="info" 
            size="large"
            @click="resetDemo"
            class="reset-button"
          >
            <el-icon><Refresh /></el-icon>
            重新拍摄
          </el-button>
        </div>
      </div>
    </div>

    <!-- 隐藏的Canvas用于图像处理 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, VideoCamera, Loading, Warning, Refresh } from '@element-plus/icons-vue'
import { useSocket } from '@/utils/socket'
import { useActivity0 } from '@/store/activity'
import { EntityMode } from '@/types'

const socket = useSocket()
const activity0 = useActivity0()

// 拍摄状态
const hasPhoto = ref(false)
const isAnalyzing = ref(false)
const capturedPhotoUrl = ref<string>('')

// 分析过程的临时变量
const countA = ref<number>(0)
const countB = ref<number>(0)
const rawAnalysisResult = ref<string>('')

// 摄像头相关状态
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)

// Coze API 配置
const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WORKFLOW_ID = '7553827536788193322' // 使用相同的工作流ID

// 计算属性
const totalCount = computed(() => {
  if (!activity0.voteResult) return 0
  return activity0.voteResult.countA + activity0.voteResult.countB
})

const optionAPercentage = computed(() => {
  if (!activity0.voteResult || totalCount.value === 0) return 0
  return Math.round((activity0.voteResult.countA / totalCount.value) * 100)
})

const optionBPercentage = computed(() => {
  if (!activity0.voteResult || totalCount.value === 0) return 0
  return Math.round((activity0.voteResult.countB / totalCount.value) * 100)
})

// 获取观点含义
const getViewpointMeaning = (choice: 'A' | 'B' | null): string => {
  if (choice === 'A') return '使用数字设备利大于弊'
  if (choice === 'B') return '使用数字设备弊大于利'
  return ''
}

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
}

// 初始化摄像头
const initCamera = async () => {
  console.log('[Activity0] 开始初始化摄像头')
  isLoading.value = true
  cameraError.value = ''
  
  try {
    // 检查浏览器支持
    if (!navigator.mediaDevices) {
      throw new Error('浏览器不支持 MediaDevices API')
    }
    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 getUserMedia API')
    }
    
    // 检查协议
    console.log('[Activity0] 当前协议:', window.location.protocol)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('[Activity0] 摄像头API需要HTTPS或localhost环境')
    }
    
    // 停止现有流
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
    }
    
    // 请求摄像头权限
    const constraints = { 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // 优先使用后置摄像头
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
    console.error('[Activity0] 摄像头启动失败:', error)
    
    if (error.name === 'NotAllowedError') {
      cameraError.value = '摄像头权限被拒绝，请点击地址栏摄像头图标允许访问'
    } else if (error.name === 'NotFoundError') {
      cameraError.value = '未找到摄像头设备，请检查摄像头是否连接'
    } else if (error.name === 'NotReadableError') {
      cameraError.value = '摄像头被其他应用占用，请关闭其他使用摄像头的应用'
    } else if (error.name === 'SecurityError') {
      cameraError.value = '安全限制：请确保在HTTPS或localhost环境下使用'
    } else {
      cameraError.value = `摄像头启动失败: ${error.message}`
    }
  } finally {
    isLoading.value = false
  }
}

const onVideoLoaded = () => {
  console.log('[Activity0] 视频流加载完成')
}

// 拍摄照片
const capturePhoto = async () => {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return
  
  try {
    // 1. 拍照
    const video = videoRef.value
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    
    if (!context) throw new Error('无法获取Canvas上下文')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    capturedPhotoUrl.value = dataUrl
    hasPhoto.value = true
    
    // 2. 立即广播照片给学生
    broadcastPhoto(dataUrl)
    
    cleanup() // 清理摄像头资源
    ElMessage.success('照片已拍摄并发送给学生')
    
    // 3. 开始后台分析
    startAnalysis(dataUrl)
    
  } catch (error: any) {
    console.error('[Activity0] 拍摄失败:', error)
    ElMessage.error('拍摄失败，请重试')
  }
}

// 上传图片，返回file_id
const uploadImage = async (dataUrl: string): Promise<string | null> => {
  try {
    const filename = `demo_${Date.now()}.jpg`
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
    console.log('[Activity0] 上传响应:', uploadResult)
    
    if (uploadResult.code !== 0 || !uploadResult.data?.id) {
      throw new Error('上传响应异常')
    }
    
    console.log('[Activity0] 图片上传成功，file_id:', uploadResult.data.id)
    return uploadResult.data.id
    
  } catch (error: any) {
    console.error('[Activity0] 图片上传失败:', error)
    return null
  }
}

// 广播照片给学生
const broadcastPhoto = (photoBase64: string) => {
  try {
    console.log('[Activity0] 广播照片给所有学生')
    
    socket.dispatch({
      mode: EntityMode.GROUP,
      messageType: 'vote_photo',
      activityIndex: '0',
      data: {
        photo: photoBase64,
        timestamp: Date.now()
      },
      from: null,
      to: {}
    })
    
    console.log('[Activity0] 照片已广播')
  } catch (error: any) {
    console.error('[Activity0] 广播照片失败:', error)
  }
}

// 开始分析
const startAnalysis = async (dataUrl: string) => {
  isAnalyzing.value = true
  ElMessage.info('开始分析照片...')
  
  try {
    // 上传图片并获取file_id
    const fileId = await uploadImage(dataUrl)
    
    if (fileId) {
      // 分析图片
      await analyzeImage(fileId)
      ElMessage.success('分析完成！')
    } else {
      throw new Error('图片上传失败')
    }
  } catch (error: any) {
    console.error('[Activity0] 分析失败:', error)
    ElMessage.error('分析失败，使用默认结果')
    // 使用默认结果
    const fallbackResult = {
      result: 'A' as const,
      countA: 1,
      countB: 0,
      timestamp: Date.now()
    }
    activity0.voteResult = fallbackResult
    broadcastResult()
  } finally {
    isAnalyzing.value = false
  }
}

// 分析图片
const analyzeImage = async (fileId: string) => {
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
    
    console.log('[Activity0] 开始工作流分析:', workflowPayload)
    
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
    console.log('[Activity0] 工作流响应:', workflowResult)
    
    if (workflowResult.code !== 0) {
      throw new Error('工作流执行失败')
    }
    
    // 解析分析结果
    let choice: 'A' | 'B' = 'A' // 默认值
    
    if (workflowResult.data) {
      try {
        const analysisData = JSON.parse(workflowResult.data)
        console.log('[Activity0] 解析分析数据:', analysisData)
        
        // 获取output0的值
        const output0 = analysisData.output0
        console.log('[Activity0] output0值:', output0)
        
        if (output0) {
          rawAnalysisResult.value = String(output0)
          
          try {
            // 解析output0中的JSON字符串
            const countData = JSON.parse(output0)
            console.log('[Activity0] 解析计数数据:', countData)
            
            // 获取count_A和count_B
            const parsedCountA = parseInt(countData.count_A || '0', 10)
            const parsedCountB = parseInt(countData.count_B || '0', 10)
            
            countA.value = parsedCountA
            countB.value = parsedCountB
            
            console.log(`[Activity0] 解析结果 - count_A: ${parsedCountA}, count_B: ${parsedCountB}`)
            
            // 根据计数判断哪个更多
            if (parsedCountA > parsedCountB) {
              choice = 'A'
            } else if (parsedCountB > parsedCountA) {
              choice = 'B'
            } else {
              // 如果相等，随机选择或使用默认
              choice = Math.random() > 0.5 ? 'A' : 'B'
            }
            
          } catch (countParseError) {
            console.warn('[Activity0] 解析计数数据失败:', countParseError)
            // 如果无法解析计数，尝试原来的逻辑
            const outputStr = String(output0).toUpperCase()
            if (outputStr.includes('A') || outputStr === 'A') {
              choice = 'A'
            } else if (outputStr.includes('B') || outputStr === 'B') {
              choice = 'B'
            } else {
              choice = outputStr.charCodeAt(0) % 2 === 0 ? 'A' : 'B'
            }
          }
        }
        
      } catch (parseError) {
        console.warn('[Activity0] 解析分析结果失败:', parseError)
        // 使用默认值
        rawAnalysisResult.value = '{"count_A":"0","count_B":"0"}'
        countA.value = 0
        countB.value = 0
      }
    }
    
    // 更新 store
    activity0.voteResult = {
      result: choice,
      countA: countA.value,
      countB: countB.value,
      timestamp: Date.now()
    }
    
    ElMessage.success(`分析完成！结果：观点${choice} (A:${countA.value}, B:${countB.value})`)
    
    // 广播结果给所有学生
    broadcastResult()
    
  } catch (error: any) {
    console.error('[Activity0] 分析失败:', error)
    ElMessage.error('分析失败，使用随机结果')
    // 分析失败时使用随机选择
    const fallbackChoice: 'A' | 'B' = Math.random() > 0.5 ? 'A' : 'B'
    countA.value = fallbackChoice === 'A' ? 1 : 0
    countB.value = fallbackChoice === 'B' ? 1 : 0
    
    activity0.voteResult = {
      result: fallbackChoice,
      countA: countA.value,
      countB: countB.value,
      timestamp: Date.now()
    }
    
    // 即使失败也广播结果
    broadcastResult()
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

// 广播结果给所有学生
const broadcastResult = () => {
  try {
    if (!activity0.voteResult) return
    
    console.log('[Activity0] 广播投票结果给所有学生')
    
    socket.dispatch({
      mode: EntityMode.GROUP,
      messageType: 'vote_result',
      activityIndex: '0',
      data: activity0.voteResult,
      from: null,
      to: {}
    })
    
    console.log('[Activity0] 投票结果已广播')
    ElMessage.success('投票结果已发送给所有学生')
  } catch (error: any) {
    console.error('[Activity0] 广播失败:', error)
    ElMessage.warning('发送结果给学生失败，但教师端已记录')
  }
}

// 重新开始演示
const resetDemo = () => {
  hasPhoto.value = false
  isAnalyzing.value = false
  capturedPhotoUrl.value = ''
  activity0.voteResult = null
  activity0.photo = null
  countA.value = 0
  countB.value = 0
  rawAnalysisResult.value = ''
  isCameraReady.value = false
  cameraError.value = ''
  
  ElMessage.info('已重置，可以重新进行演示')
}

// 清理摄像头资源
const cleanup = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  isCameraReady.value = false
}

// 组件生命周期
onMounted(() => {
  console.log('[Activity0] 教师端组件已挂载')
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.page {
  padding: 0;
  width: 1240px;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 活动标题 */
.activity-header {
  margin-bottom: 24px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.activity-description {
  color: #6b7280;
  font-size: 16px;
}

/* 拍摄区域 */
.camera-section {
  margin-bottom: 24px;
}



/* 拍摄状态显示 */
.waiting-status {
  padding: 40px 20px;
  color: #6b7280;
  text-align: center;
}

.waiting-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

/* 摄像头预览区域 */
.camera-preview-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
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
  background: #F5F5F0;
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

/* 拍摄控制按钮 */
.camera-controls {
  text-align: center;
}

.camera-button,
.capture-button {
  min-width: 200px;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.camera-button {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.capture-button {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.camera-button:not(:disabled):hover,
.capture-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
}

/* 照片区域 */
.photo-section {
  margin-bottom: 24px;
}

.photo-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.photo-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.analyzing-badge {
  color: #3b82f6;
  font-weight: 600;
  background: #dbeafe;
  padding: 6px 16px;
  border-radius: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.photo-display {
  text-align: center;
}

.captured-photo {
  max-width: 100%;
  max-height: 500px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 统计区域 */
.stats-section {
  margin-bottom: 24px;
}

.stats-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.demo-info {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
}

.demo-label {
  color: #059669;
  font-weight: 600;
  background: #dcfce7;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 结果显示 */
.result-display {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
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

.result-details {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.result-details p {
  margin: 8px 0;
}

/* 演示对战界面 */
.demo-battle-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.option-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-label {
  font-size: 16px;
  font-weight: 700;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
}

.option-a .option-label {
  background: #ef4444;
}

.option-b .option-label {
  background: #3b82f6;
}

.option-count {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.option-bar {
  height: 20px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.option-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.option-a-fill {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.option-b-fill {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.option-percentage {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
}

.vs-divider {
  display: flex;
  justify-content: center;
  align-items: center;
}

.vs-text {
  font-size: 24px;
  font-weight: 900;
  color: #6b7280;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 重置控制 */
.reset-controls {
  text-align: center;
}

.reset-button {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #6b7280, #4b5563);
  border: none;
  box-shadow: 0 6px 20px rgba(107, 114, 128, 0.3);
  transition: all 0.3s ease;
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(107, 114, 128, 0.4);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .demo-battle-arena {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .vs-divider {
    order: 1;
  }
  
  .option-a {
    order: 0;
  }
  
  .option-b {
    order: 2;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .camera-preview-wrapper {
    height: 300px;
  }
  
  .stats-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .result-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
