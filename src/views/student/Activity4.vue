<template>
  <div class="page">
    <!-- 活动说明 -->
    <div class="activity-description">
      <strong>摄像头拍照活动</strong><br>
      请使用下方摄像头进行拍照，记录学习过程中的重要信息
    </div>

    <!-- 摄像头区域 -->
    <div class="camera-container">
      <div class="camera-panel">
        <h3 class="section-title">📷 摄像头拍照</h3>
        
        <!-- 摄像头预览区域 -->
        <div class="camera-preview-wrapper">
          <video 
            ref="videoRef" 
            class="camera-preview"
            :class="{ 'is-recording': isRecording }"
            autoplay 
            muted 
            playsinline
            @loadedmetadata="onVideoLoaded"
          ></video>
          
          <!-- 拍照结果显示 -->
          <div v-if="capturedPhoto" class="captured-photo-overlay">
            <img :src="capturedPhoto" alt="拍照结果" class="captured-image" />
            <div class="photo-actions">
              <el-button type="primary" @click="confirmPhoto">确认保存</el-button>
              <el-button @click="retakePhoto">重新拍照</el-button>
            </div>
          </div>
          
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
        
        <!-- 题目选择器 -->
        <div class="topic-selector">
          <div class="selector-label">
            <el-icon><InfoFilled /></el-icon>
            <span>选择要分析的题目：</span>
          </div>
          <div class="topic-buttons">
            <el-button 
              v-for="index in [1, 2, 3]" 
              :key="index"
              :type="selectedInputIndex === index ? 'primary' : 'default'"
              :class="{ 'active-topic': selectedInputIndex === index }"
              @click="selectedInputIndex = index"
              size="default"
            >
              题目{{ index }}
            </el-button>
          </div>
        </div>
        
        <!-- 当前选择提示 -->
        <div class="current-selection">
          <el-icon><Camera /></el-icon>
          <span>当前将分析：<strong>题目{{ selectedInputIndex }}</strong></span>
        </div>
        
        <!-- 拍照控制按钮 -->
        <div class="camera-controls">
          <el-button 
            type="primary" 
            size="large" 
            :disabled="!isCameraReady || !!capturedPhoto"
            @click="capturePhoto"
            class="capture-button"
          >
            <el-icon><Camera /></el-icon>
            {{ captureButtonText }}
          </el-button>
          
          <el-button 
            v-if="!isCameraReady && !cameraError" 
            type="success" 
            size="large"
            @click="initCamera"
            :loading="isLoading"
          >
            启动摄像头
          </el-button>
        </div>
      </div>

      <!-- 拍照历史区域 -->
      <div class="photo-history">
        <h3 class="section-title">📸 拍照历史</h3>
        <div class="history-grid">
          <div 
            v-for="(photo, index) in photoHistory" 
            :key="photo.id" 
            class="history-item"
          >
            <div class="history-image">
              <img :src="photo.dataUrl" :alt="`拍照${index + 1}`" />
            </div>
            <div class="history-info">
              <div class="history-time">{{ formatTime(photo.timestamp) }}</div>
              
              <!-- 题目信息显示 -->
              <div v-if="photo.inputIndex" class="topic-info">
                <el-tag size="small" type="info">题目{{ photo.inputIndex }}</el-tag>
              </div>
              
              <!-- 上传状态显示 -->
              <div class="upload-status">
                <div v-if="photo.uploadStatus === 'uploading'" class="status-item uploading">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  <span>上传中...</span>
                </div>
                <div v-else-if="photo.uploadStatus === 'success'" class="status-item success">
                  <el-icon><CircleCheck /></el-icon>
                  <span>已上传</span>
                </div>
                <div v-else-if="photo.uploadStatus === 'failed'" class="status-item failed">
                  <el-icon><CircleClose /></el-icon>
                  <span>上传失败</span>
                  <el-tooltip v-if="photo.uploadError" :content="photo.uploadError">
                    <el-icon class="error-info"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </div>
              
              <!-- 工作流状态显示 -->
              <div v-if="photo.uploadStatus === 'success' && photo.fileId" class="workflow-status">
                <div v-if="photo.workflowStatus === 'running'" class="status-item workflow-running">
                  <el-icon class="loading-icon"><Loading /></el-icon>
                  <span>正在分析题目{{ photo.inputIndex }}...</span>
                </div>
                <div v-else-if="photo.workflowStatus === 'success'" class="status-item workflow-success">
                  <el-icon><CircleCheck /></el-icon>
                  <span>题目{{ photo.inputIndex }}分析完成</span>
                  <!-- Token使用统计 -->
                  <div v-if="photo.tokenUsage" class="token-usage">
                    (用量: {{ photo.tokenUsage.total }} tokens)
                  </div>
                </div>
                <div v-else-if="photo.workflowStatus === 'failed'" class="status-item workflow-failed">
                  <el-icon><CircleClose /></el-icon>
                  <span>题目{{ photo.inputIndex }}分析失败</span>
                  <el-tooltip v-if="photo.workflowError" :content="photo.workflowError">
                    <el-icon class="error-info"><Warning /></el-icon>
                  </el-tooltip>
                </div>
              </div>
              
              <!-- 工作流结果显示 -->
              <div v-if="photo.workflowResult" class="workflow-result">
                <div class="result-label">分析结果:</div>
                <div class="result-content">{{ photo.workflowResult }}</div>
              </div>
              
              <div class="history-actions">
                <!-- 重新上传按钮（仅在上传失败时显示）-->
                <el-button 
                  v-if="photo.uploadStatus === 'failed'"
                  type="warning" 
                  size="small" 
                  @click="retryUpload(photo)"
                >
                  重新上传
                </el-button>
                
                <!-- 重新分析按钮（仅在分析失败时显示）-->
                <el-button 
                  v-if="photo.workflowStatus === 'failed'"
                  type="warning" 
                  size="small" 
                  @click="runWorkflowAuto(photo, photo.inputIndex || selectedInputIndex)"
                >
                  重新分析题目{{ photo.inputIndex || selectedInputIndex }}
                </el-button>
                
                <el-button 
                  type="success" 
                  size="small" 
                  :disabled="photo.submitted"
                  @click="submitPhoto(photo)"
                >
                  {{ photo.submitted ? '已发送' : '发送' }}
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deletePhoto(photo.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="photoHistory.length === 0" class="empty-state">
            <el-icon class="empty-icon"><Picture /></el-icon>
            <p>还没有拍照记录</p>
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
import { Camera, Loading, Warning, Picture, CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue'

// 摄像头相关状态
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)
const isRecording = ref(false)

// 拍照相关状态
const capturedPhoto = ref<string | null>(null)

// 照片历史记录
interface PhotoRecord {
  id: string
  dataUrl: string
  timestamp: number
  submitted: boolean
  uploadStatus?: 'uploading' | 'success' | 'failed'
  uploadUrl?: string
  uploadError?: string
  fileId?: string  // Coze文件ID
  workflowStatus?: 'pending' | 'running' | 'success' | 'failed'
  workflowResult?: string
  workflowError?: string
  inputIndex?: number  // 使用的题目编号
  tokenUsage?: {
    input: number
    output: number
    total: number
  }
}

const photoHistory = ref<PhotoRecord[]>([])

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

// Coze API 配置
const COZE_API_URL = 'https://api.coze.cn/v1/files/upload'
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run' // 使用非流式API
const COZE_API_TOKEN = 'sat_3NtHyM2cY3Un8anULY7pAp9bLwLMdW9sVH4CRcfZC8G378M5OrT4dS2TzeAZQ2vg'
const WORKFLOW_ID = '7553827536788193322'

// 题目选择状态
const selectedInputIndex = ref<number>(1) // 默认选择题目1

// 计算属性：拍照按钮文本
const captureButtonText = computed(() => `拍照分析题目${selectedInputIndex.value}`)

// 初始化摄像头
const initCamera = async () => {
  console.log('[Camera Debug] 开始初始化摄像头')
  isLoading.value = true
  cameraError.value = ''
  
  try {
    // 检查浏览器支持
    console.log('[Camera Debug] 检查浏览器支持')
    if (!navigator.mediaDevices) {
      throw new Error('浏览器不支持 MediaDevices API')
    }
    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 getUserMedia API')
    }
    console.log('[Camera Debug] 浏览器支持检查通过')
    
    // 检查协议
    console.log('[Camera Debug] 当前协议:', window.location.protocol)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('[Camera Debug] 摄像头API需要HTTPS或localhost环境')
    }
    
    // 停止现有流
    if (mediaStream.value) {
      console.log('[Camera Debug] 停止现有摄像头流')
      mediaStream.value.getTracks().forEach(track => track.stop())
    }
    
    // 获取可用设备
    console.log('[Camera Debug] 获取可用媒体设备')
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter(device => device.kind === 'videoinput')
    console.log('[Camera Debug] 发现视频设备数量:', videoDevices.length)
    videoDevices.forEach((device, index) => {
      console.log(`[Camera Debug] 设备${index + 1}:`, device.label || '未命名设备', device.deviceId)
    })
    
    if (videoDevices.length === 0) {
      throw new Error('未检测到摄像头设备')
    }
    
    // 请求摄像头权限
    console.log('[Camera Debug] 请求摄像头权限')
    const constraints = { 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment' // 优先使用后置摄像头
      } 
    }
    console.log('[Camera Debug] 约束条件:', constraints)
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    console.log('[Camera Debug] 成功获取摄像头流')
    console.log('[Camera Debug] 流信息 - 活跃轨道数:', stream.getTracks().length)
    
    stream.getTracks().forEach((track, index) => {
      console.log(`[Camera Debug] 轨道${index + 1}:`, track.kind, track.label, track.readyState)
    })
    
    mediaStream.value = stream
    
    if (videoRef.value) {
      console.log('[Camera Debug] 设置视频元素源')
      videoRef.value.srcObject = stream
    } else {
      console.error('[Camera Debug] 视频元素引用不存在')
    }
    
    isCameraReady.value = true
    console.log('[Camera Debug] 摄像头初始化完成')
    ElMessage.success('摄像头启动成功')
  } catch (error: any) {
    console.error('[Camera Debug] 摄像头启动失败:', error)
    console.error('[Camera Debug] 错误名称:', error.name)
    console.error('[Camera Debug] 错误消息:', error.message)
    console.error('[Camera Debug] 错误堆栈:', error.stack)
    
    if (error.name === 'NotAllowedError') {
      cameraError.value = '摄像头权限被拒绝，请点击地址栏摄像头图标允许访问'
    } else if (error.name === 'NotFoundError') {
      cameraError.value = '未找到摄像头设备，请检查摄像头是否连接'
    } else if (error.name === 'NotReadableError') {
      cameraError.value = '摄像头被其他应用占用，请关闭其他使用摄像头的应用'
    } else if (error.name === 'OverconstrainedError') {
      cameraError.value = '摄像头不支持所需参数，请尝试使用其他摄像头'
    } else if (error.name === 'SecurityError') {
      cameraError.value = '安全限制：请确保在HTTPS或localhost环境下使用'
    } else {
      cameraError.value = `摄像头启动失败: ${error.message}`
    }
  } finally {
    isLoading.value = false
    console.log('[Camera Debug] 初始化流程结束')
  }
}

// 将base64数据URL转换为File对象
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

// 上传文件到Coze API
const uploadToCoze = async (photo: PhotoRecord): Promise<{ success: boolean; fileId?: string; fileName?: string; url?: string; error?: string }> => {
  try {
    console.log('[Upload Debug] 开始上传文件到Coze API')
    
    // 将base64转换为File对象
    const filename = `photo_${photo.id}_${Date.now()}.jpg`
    const file = dataURLtoFile(photo.dataUrl, filename)
    
    console.log('[Upload Debug] 文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    // 创建FormData
    const formData = new FormData()
    formData.append('file', file)
    
    // 发送请求
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`
        // 注意：不要手动设置 Content-Type，让浏览器自动设置multipart/form-data边界
      },
      body: formData
    })
    
    console.log('[Upload Debug] 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Upload Debug] 上传失败响应:', errorText)
      throw new Error(`上传失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('[Upload Debug] 上传成功响应:', result)
    
    // 检查响应格式 {"code":0,"data":{"id":"7553936125526736948",...},"msg":""}
    if (result.code === 0 && result.data?.id) {
      const returnValue = {
        success: true,
        fileId: result.data.id,
        fileName: result.data.file_name,
        url: result.data.url || result.file_url
      }
      console.log('[Upload Debug] 返回上传结果:', returnValue)
      return returnValue
    } else {
      console.error('[Upload Debug] 响应格式检查失败:', {
        code: result.code,
        hasData: !!result.data,
        hasId: !!result.data?.id,
        msg: result.msg
      })
      throw new Error(result.msg || '上传响应格式异常')
    }
  } catch (error: any) {
    console.error('[Upload Debug] 上传异常:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}

// 视频加载完成
const onVideoLoaded = () => {
  console.log('[Camera Debug] 视频流加载完成')
  if (videoRef.value) {
    console.log('[Camera Debug] 视频尺寸:', videoRef.value.videoWidth, 'x', videoRef.value.videoHeight)
    console.log('[Camera Debug] 视频状态:', {
      readyState: videoRef.value.readyState,
      paused: videoRef.value.paused,
      ended: videoRef.value.ended,
      muted: videoRef.value.muted
    })
  }
}

// 拍照功能
const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return
  
  const video = videoRef.value
  const canvas = canvasRef.value
  const context = canvas.getContext('2d')
  
  if (!context) return
  
  // 设置canvas尺寸与视频一致
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // 绘制当前帧到canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  // 转换为图片数据
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  capturedPhoto.value = dataUrl
  
  ElMessage.success('拍照成功！')
}

// 确认保存照片
const confirmPhoto = async () => {
  if (!capturedPhoto.value) return
  
  const photo: PhotoRecord = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dataUrl: capturedPhoto.value,
    timestamp: Date.now(),
    submitted: false,
    uploadStatus: 'uploading',
    inputIndex: selectedInputIndex.value // 保存选择的题目编号
  }
  
  // 先添加到历史记录（显示上传中状态）
  photoHistory.value.unshift(photo)
  capturedPhoto.value = null
  
  // 保存到本地存储
  saveToLocalStorage()
  
  ElMessage.success('照片已保存，正在上传到云端...')
  
  // 异步上传到Coze API
  try {
    const uploadResult = await uploadToCoze(photo)
    console.log('[confirmPhoto Debug] 上传结果:', uploadResult)
    
    if (uploadResult.success && uploadResult.fileId) {
      // 更新照片记录
      photo.uploadStatus = 'success'
      photo.uploadUrl = uploadResult.url
      photo.fileId = uploadResult.fileId
      photo.workflowStatus = 'running'  // 立即开始工作流分析
      console.log('[confirmPhoto Debug] 状态已更新为success:', {
        uploadStatus: photo.uploadStatus,
        fileId: photo.fileId,
        workflowStatus: photo.workflowStatus
      })
      
      // 强制触发响应式更新
      photoHistory.value = [...photoHistory.value]
      saveToLocalStorage()
      
      ElMessage.success('照片上传成功，正在分析...')
      
      // 自动开始工作流分析（使用用户选择的题目）
      await runWorkflowAuto(photo, selectedInputIndex.value)
      
    } else {
      // 上传失败
      photo.uploadStatus = 'failed'
      photo.uploadError = uploadResult.error
      console.log('[confirmPhoto Debug] 上传失败:', uploadResult)
      ElMessage.warning(`照片上传失败: ${uploadResult.error}`)
    }
  } catch (error: any) {
    console.error('上传过程异常:', error)
    photo.uploadStatus = 'failed'
    photo.uploadError = error.message || '上传过程发生异常'
    ElMessage.error('照片上传失败，请稍后重试')
  }
  
  // 强制触发响应式更新
  photoHistory.value = [...photoHistory.value]
  
  // 保存更新后的状态
  saveToLocalStorage()
  console.log('[confirmPhoto Debug] 本地存储已保存，当前照片状态:', photo)
}

// 重新上传照片
const retryUpload = async (photo: PhotoRecord) => {
  if (photo.uploadStatus === 'uploading') return
  
  photo.uploadStatus = 'uploading'
  photo.uploadError = undefined
  saveToLocalStorage()
  
  ElMessage.info('正在重新上传照片...')
  
  try {
    const uploadResult = await uploadToCoze(photo)
    console.log('[retryUpload Debug] 重新上传结果:', uploadResult)
    
    if (uploadResult.success && uploadResult.fileId) {
      photo.uploadStatus = 'success'
      photo.uploadUrl = uploadResult.url
      photo.fileId = uploadResult.fileId
      photo.workflowStatus = 'running'  // 立即开始工作流分析
      console.log('[retryUpload Debug] 状态已更新为success:', {
        uploadStatus: photo.uploadStatus,
        fileId: photo.fileId
      })
      
      // 强制触发响应式更新
      photoHistory.value = [...photoHistory.value]
      saveToLocalStorage()
      
      ElMessage.success('照片重新上传成功，正在分析...')
      
      // 自动开始工作流分析（使用用户选择的题目）
      await runWorkflowAuto(photo, selectedInputIndex.value)
      
    } else {
      photo.uploadStatus = 'failed'
      photo.uploadError = uploadResult.error
      console.log('[retryUpload Debug] 重新上传失败:', uploadResult)
      ElMessage.warning(`照片上传失败: ${uploadResult.error}`)
    }
  } catch (error: any) {
    console.error('重新上传异常:', error)
    photo.uploadStatus = 'failed'
    photo.uploadError = error.message || '上传过程发生异常'
    ElMessage.error('照片上传失败，请稍后重试')
  }
  
  // 强制触发响应式更新
  photoHistory.value = [...photoHistory.value]
  
  saveToLocalStorage()
  console.log('[retryUpload Debug] 重新上传完成，当前照片状态:', photo)
}

// 自动执行工作流（使用指定题目）- 一次性响应版本
const runWorkflowAuto = async (photo: PhotoRecord, inputIndex: number) => {
  if (!photo.fileId) return
  
  console.log('[WorkflowAuto Debug] 开始自动执行工作流:', { fileId: photo.fileId, inputIndex })
  
  // 初始化工作流状态
  photo.workflowError = undefined
  photo.workflowResult = undefined
  photo.tokenUsage = undefined
  
  // 实时更新UI
  photoHistory.value = [...photoHistory.value]
  saveToLocalStorage()
  
  try {
    console.log('[WorkflowAuto Debug] 开始调用工作流API')
    
    // 使用原生 fetch 调用非流式工作流 API
    const payload = {
      workflow_id: WORKFLOW_ID,
      parameters: {
        input_img: {
          file_id: photo.fileId
        },
        input_index: inputIndex
      }
    }
    
    console.log('[WorkflowAuto Debug] 请求参数:', payload)
    
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[WorkflowAuto Debug] 工作流请求失败:', errorText)
      throw new Error(`工作流执行失败: ${response.status} ${response.statusText}`)
    }
    
    const res = await response.json()
    console.log('[WorkflowAuto Debug] 工作流执行完成，响应:', res)
    
    // 检查响应状态 {"code":0,"msg":"","data":"...","debug_url":"...","usage":{...}}
    if (res.code === 0) {
      // 解析 data 字段（JSON字符串）
      let analysisResults = {}
      if (res.data) {
        try {
          analysisResults = JSON.parse(res.data)
          console.log('[WorkflowAuto Debug] 解析分析结果:', analysisResults)
        } catch (parseError) {
          console.error('[WorkflowAuto Debug] 解析data字段失败:', parseError)
          // 如果解析失败，直接使用字符串作为结果
          photo.workflowResult = res.data
          photo.workflowStatus = 'success'
          ElMessage.success(`题目${inputIndex}分析完成！`)
          return
        }
      }
      
      // 保存Token使用统计
      if (res.usage) {
        photo.tokenUsage = {
          input: res.usage.input_count,
          output: res.usage.output_count,
          total: res.usage.token_count
        }
        console.log('[WorkflowAuto Debug] Token使用统计:', photo.tokenUsage)
      }
      
      // 格式化并保存分析结果
      photo.workflowResult = formatWorkflowResults(analysisResults, inputIndex)
      photo.workflowStatus = 'success'
      
      // 显示调试URL（如果有的话）
      if (res.debug_url) {
        console.log('[WorkflowAuto Debug] 调试页面:', res.debug_url)
      }
      
      ElMessage.success(`题目${inputIndex}分析完成！`)
      
    } else {
      // 处理API调用失败
      console.error('[WorkflowAuto Debug] API调用失败:', {
        code: res.code,
        msg: res.msg
      })
      throw new Error(res.msg || `API调用失败，状态码: ${res.code}`)
    }
    
  } catch (error: any) {
    console.error('[WorkflowAuto Debug] 工作流执行异常:', error)
    photo.workflowStatus = 'failed'
    photo.workflowError = error.message || '工作流执行失败'
    ElMessage.error(`题目${inputIndex}分析失败，请重试`)
  }
  
  // 最终更新状态
  photoHistory.value = [...photoHistory.value]
  saveToLocalStorage()
}

// 格式化工作流结果显示
const formatWorkflowResults = (contentObj: any, targetIndex?: number): string => {
  console.log('[Format Debug] 开始格式化结果:', contentObj, 'targetIndex:', targetIndex)
  
  let formattedResult = ''
  
  // 处理所有题目的结果，但优先显示目标题目
  const indices = targetIndex ? [targetIndex, ...([1, 2, 3].filter(i => i !== targetIndex))] : [1, 2, 3]
  
  for (const i of indices) {
    const outputKey = `output${i}`
    const outputValue = contentObj[outputKey]
    
    if (outputValue && outputValue !== '' && outputValue !== null) {
      const isTarget = i === targetIndex
      formattedResult += `${isTarget ? '🎯 ' : ''}=== 题目${i}分析结果 ===${isTarget ? ' (主要分析)' : ''}\n`
      
      try {
        // 检查是否是对象格式（如 output2 的格式）
        if (typeof outputValue === 'object' && outputValue !== null) {
          // 处理对象格式: {"q1":"里面都是游戏","q2":"数学题少",...}
          Object.entries(outputValue).forEach(([key, value]) => {
            if (value && value !== '') {
              formattedResult += `${key}: ${value}\n`
            }
          })
        } else if (typeof outputValue === 'string' && outputValue.trim() !== '') {
          // 处理字符串格式
          formattedResult += `${outputValue}\n`
        }
      } catch (error) {
        console.warn('[Format Debug] 格式化单个结果失败:', error)
        formattedResult += `${outputValue}\n`
      }
      
      formattedResult += '\n'
    }
  }
  
  if (formattedResult === '') {
    formattedResult = '暂无分析结果'
  }
  
  console.log('[Format Debug] 格式化完成:', formattedResult)
  return formattedResult
}


// 重新拍照
const retakePhoto = () => {
  capturedPhoto.value = null
}

// 发送照片到教师端
const submitPhoto = async (photo: PhotoRecord) => {
  if (photo.submitted) return
  
  const g = groupNo.value
  const s = studentNo.value
  if (!g || !s) {
    ElMessage.error('用户信息不完整，无法发送')
    return
  }
  
  try {
    const payload = {
      type: 'activity4_photo',
      from: { groupNo: g, studentNo: s },
      data: { 
        photoId: photo.id,
        photoData: photo.dataUrl,
        timestamp: photo.timestamp
      },
      at: Date.now()
    }
    
    const ack = await socketService.submit(payload as any)
    if (ack.code !== 200) {
      throw new Error(ack.message || '发送失败')
    }
    
    // 标记为已发送
    photo.submitted = true
    saveToLocalStorage()
    
    ElMessage.success('照片发送成功！')
  } catch (error: any) {
    console.error('照片发送失败:', error)
    ElMessage.error(error.message || '发送失败，请重试')
  }
}

// 删除照片
const deletePhoto = (photoId: string) => {
  const index = photoHistory.value.findIndex(p => p.id === photoId)
  if (index > -1) {
    photoHistory.value.splice(index, 1)
    saveToLocalStorage()
    ElMessage.success('照片已删除')
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 本地存储相关
const getStorageKey = () => {
  const g = groupNo.value
  const s = studentNo.value
  return g && s ? `activity4_photos_${g}_${s}` : null
}

const saveToLocalStorage = () => {
  const key = getStorageKey()
  if (!key) return
  
  const data = {
    photoHistory: photoHistory.value,
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
      photoHistory.value = data.photoHistory || []
      console.log('Activity4 照片数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity4本地数据失败:', error)
  }
}

// 清理摄像头资源
const cleanup = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

// 组件挂载时初始化
onMounted(() => {
  console.log('[Camera Debug] Activity4组件已挂载')
  console.log('[Camera Debug] 用户代理:', navigator.userAgent)
  console.log('[Camera Debug] 当前URL:', window.location.href)
  console.log('[Camera Debug] 是否支持 MediaDevices:', !!navigator.mediaDevices)
  console.log('[Camera Debug] 是否支持 getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
  
  loadFromLocalStorage()
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1400px;
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
}

/* 摄像头容器 */
.camera-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

/* 摄像头面板 */
.camera-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
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
  object-fit: cover;
  border-radius: 12px;
}

.camera-preview.is-recording {
  border: 3px solid #ef4444;
  animation: recording-pulse 1s infinite;
}

@keyframes recording-pulse {
  0% { border-color: #ef4444; }
  50% { border-color: #fca5a5; }
  100% { border-color: #ef4444; }
}

/* 拍照结果叠加层 */
.captured-photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.captured-image {
  max-width: 90%;
  max-height: 70%;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.photo-actions {
  display: flex;
  gap: 12px;
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

/* 题目选择器 */
.topic-selector {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.topic-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.active-topic {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.topic-buttons .el-button {
  transition: all 0.2s ease;
  font-weight: 500;
}

.topic-buttons .el-button:hover:not(.active-topic) {
  transform: scale(1.02);
}

/* 当前选择提示 */
.current-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px 16px;
  background: #ecfdf5;
  border: 1px solid #86efac;
  border-radius: 8px;
  color: #166534;
  font-size: 14px;
}

/* 拍照控制按钮 */
.camera-controls {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.capture-button {
  min-width: 180px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.capture-button:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.capture-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
}

/* 照片历史区域 */
.photo-history {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  height: fit-content;
}

.history-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.history-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.history-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-time {
  font-size: 12px;
  color: #6b7280;
}

.topic-info {
  margin: 4px 0;
}

/* 状态显示样式 */
.upload-status,
.workflow-status {
  margin: 8px 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-item.uploading,
.status-item.workflow-running {
  color: #3b82f6;
}

.status-item.uploading .loading-icon,
.status-item.workflow-running .loading-icon {
  animation: spin 1s linear infinite;
}

.status-item.success,
.status-item.workflow-success {
  color: #10b981;
}

.status-item.failed,
.status-item.workflow-failed {
  color: #ef4444;
}

.error-info {
  cursor: help;
  margin-left: 4px;
}

.token-usage {
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
}

/* 工作流结果样式 */
.workflow-result {
  margin: 8px 0;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.result-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.result-content {
  font-size: 13px;
  color: #1f2937;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .camera-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .camera-preview-wrapper {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .camera-preview-wrapper {
    height: 250px;
  }
  
  .camera-controls {
    flex-direction: column;
  }
  
  .history-item {
    padding: 12px;
  }
  
  .history-image {
    width: 60px;
    height: 60px;
  }
}
</style>
