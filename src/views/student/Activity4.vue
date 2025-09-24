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
            拍照
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
              <div class="history-actions">
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
import { Camera, Loading, Warning, Picture } from '@element-plus/icons-vue'

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
}

const photoHistory = ref<PhotoRecord[]>([])

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

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
const confirmPhoto = () => {
  if (!capturedPhoto.value) return
  
  const photo: PhotoRecord = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dataUrl: capturedPhoto.value,
    timestamp: Date.now(),
    submitted: false
  }
  
  photoHistory.value.unshift(photo)
  capturedPhoto.value = null
  
  // 保存到本地存储
  saveToLocalStorage()
  
  ElMessage.success('照片已保存到历史记录')
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

/* 拍照控制按钮 */
.camera-controls {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.capture-button {
  min-width: 120px;
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

.history-actions {
  display: flex;
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
