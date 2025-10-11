<template>
  <div class="camera-card">
    <div class="camera-container">
      <!-- 未打开摄像头的占位界面 - 可点击启动 -->
      <div 
        v-if="!cameraStarted && !status.takePhoto" 
        class="camera-placeholder"
        @click="startCamera"
      >
        <div class="placeholder-icon">📷</div>
        <p class="placeholder-text">点击开始拍摄</p>
      </div>

      <!-- 摄像头视频流 -->
      <video 
        v-show="cameraStarted && !status.takePhoto"
        ref="videoRef" 
        autoplay 
        muted 
        playsinline
        :style="videoStyle"
      ></video>

      <!-- 拍摄的照片 -->
      <img 
        v-if="status.takePhoto" 
        :src="status.takePhoto" 
        alt="拍摄的照片" 
        class="captured-photo"
        :style="photoStyle"
      />

      <!-- 操作按钮 -->
      <el-button 
        v-if="cameraStarted && !status.takePhoto" 
        class="action-button" 
        type="primary" 
        @click="capturePhoto"
      >
        拍摄
      </el-button>
      <div v-else-if="status.takePhoto" class="photo-actions">
        <el-button type="success" @click="uploadPhoto">确定</el-button>
        <el-button type="danger" @click="resetPhoto">重拍</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStatus } from '@/store/status'

const emit = defineEmits<{
  upload: [photo: string]
  reset: []  // 重置事件
}>()

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const cameraStarted = ref(false)

// 计算视频样式（旋转-90度，宽高互换以填满容器）
const videoStyle = computed(() => {
  // video旋转-90度后，宽高互换
  // 容器是 432×768，所以video原始尺寸应该是 768×432
  // 这样旋转后刚好变成 432×768，完美填充容器
  return {
    width: '768px',
    height: '432px',
    transform: 'rotate(-90deg)',
    transformOrigin: 'center center',
    objectFit: 'cover' as const
  }
})

const photoStyle = computed(() => videoStyle.value)

const startCamera = async () => {
  if (cameraStarted.value) return
  await initCamera()
  cameraStarted.value = true
}

const initCamera = async () => {
  try {
    // 请求超高分辨率视频流（支持4K/2K/1080p自适应降级）
    stream.value = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 3840, min: 1280 },
        height: { ideal: 2160, min: 720 },
        frameRate: { ideal: 30 }
      }
    })
    
    console.log('[StudentCamera] 摄像头流获取成功')
    
    // 打印实际获取到的视频轨道设置
    const videoTrack = stream.value.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    console.log('[StudentCamera] 视频轨道设置:', settings)
    console.log(`[StudentCamera] 摄像头实际分辨率: ${settings.width} x ${settings.height}, 帧率: ${settings.frameRate}`)
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
  }
}

const capturePhoto = () => {
  if (!videoRef.value) return
  
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(videoRef.value, 0, 0)
    // 转为无压缩的 jpg 格式（质量参数 1.0）
    status.takePhoto = canvas.toDataURL('image/jpeg', 1.0)
  }
}

const resetPhoto = () => {
  status.takePhoto = null
  // 发送重置事件，让父组件清空识别结果
  emit('reset')
  // 重置后重新启动摄像头
  startCamera()
}

const uploadPhoto = () => {
  if (status.takePhoto) {
    emit('upload', status.takePhoto)
    // 上传后关闭摄像头
    cleanup()
    cameraStarted.value = false
  }
}

const cleanup = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}
</script>

<style scoped>
.camera-card {
  width: 324px;
  height: 576px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

/* 占位界面 - 可点击 */
.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b, #334155);
  cursor: pointer;
  transition: all 0.3s ease;
}

.camera-placeholder:hover {
  background: linear-gradient(135deg, #334155, #475569);
}

.camera-placeholder:hover .placeholder-icon {
  opacity: 1;
  transform: scale(1.1);
}

.placeholder-icon {
  font-size: 80px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.placeholder-text {
  font-size: 16px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
  text-align: center;
  padding: 0 32px;
}

.action-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.photo-actions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 20px;
}
</style>
