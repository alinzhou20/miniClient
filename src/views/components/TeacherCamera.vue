<template>
  <div class="camera-container">
    <div class="video-wrapper">
      <video 
        v-show="!status.takePhoto"
        ref="videoRef" 
        autoplay 
        muted 
        playsinline
        :style="videoStyle"
      ></video>
      <img 
        v-if="status.takePhoto" 
        :src="status.takePhoto" 
        alt="拍摄的照片" 
        class="captured-photo"
        :style="photoStyle"
      />
    </div>
    <el-button class="exit-button" @click="handleExit">退出</el-button>
    <el-button class="action-button" v-if="!status.takePhoto" type="primary" @click="capturePhoto">拍摄</el-button>
    <div v-else class="photo-actions">
      <el-button type="success" @click="uploadPhoto">上传</el-button>
      <el-button type="danger" @click="resetPhoto">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStatus } from '@/store/status'

const emit = defineEmits<{
  upload: [photo: string]
  exit: []
}>()

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const videoWidth = ref(0)
const videoHeight = ref(0)

// 计算视频样式
const videoStyle = computed(() => {
  if (videoWidth.value && videoHeight.value) {
    const aspectRatio = videoWidth.value / videoHeight.value
    return {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      aspectRatio: aspectRatio.toString()
    }
  }
  return {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  }
})

// 计算照片样式（与视频保持一致）
const photoStyle = computed(() => videoStyle.value)

const initCamera = async () => {
  try {
    // 请求超高分辨率视频流（支持4K/2K/1080p自适应降级）
    // ideal: 4K (3840x2160)，浏览器会尝试使用这个分辨率，不支持时自动降级到2K、1080p、720p等
    // min: 最低720p，保证基本清晰度
    stream.value = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 3840, min: 1280 },
        height: { ideal: 2160, min: 720 },
        frameRate: { ideal: 30 }
      }
    })
    
    console.log('[TeacherCamera] 摄像头流获取成功')
    
    // 打印实际获取到的视频轨道设置
    const videoTrack = stream.value.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    console.log('[TeacherCamera] 视频轨道设置:', settings)
    console.log(`[TeacherCamera] 摄像头实际分辨率: ${settings.width} x ${settings.height}, 帧率: ${settings.frameRate}`)
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      
      // 等待视频元数据加载完成，获取实际尺寸
      await new Promise<void>((resolve) => {
        if (videoRef.value) {
          videoRef.value.onloadedmetadata = () => {
            if (videoRef.value) {
              videoWidth.value = videoRef.value.videoWidth
              videoHeight.value = videoRef.value.videoHeight
              console.log(`[TeacherCamera] Video元素显示尺寸: ${videoWidth.value} x ${videoHeight.value}`)
            }
            resolve()
          }
        }
      })
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
}

const uploadPhoto = () => {
  if (status.takePhoto) {
    emit('upload', status.takePhoto)
  }
}

const handleExit = () => {
  cleanup()
  status.takePhoto = null
  emit('exit')
}

const cleanup = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
}

onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90vw;
  max-height: 90vh;
}

video, .captured-photo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.exit-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  opacity: 0.8;
}

.action-button {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.8;
}

.photo-actions {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 20px;
  opacity: 0.8;
}
</style>
