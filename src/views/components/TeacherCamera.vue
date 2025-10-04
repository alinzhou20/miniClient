<template>
  <div class="camera-container">
    <video 
      v-show="!status.takePhoto"
      ref="videoRef" 
      autoplay 
      muted 
      playsinline
    ></video>
    <img v-if="status.takePhoto" :src="status.takePhoto" alt="拍摄的照片" class="captured-photo" />
    <el-button class="exit-button" @click="handleExit">退出</el-button>
    <el-button class="action-button" v-if="!status.takePhoto" type="primary" @click="capturePhoto">拍摄</el-button>
    <div v-else class="photo-actions">
      <el-button type="success" @click="uploadPhoto">上传</el-button>
      <el-button type="danger" @click="resetPhoto">重置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStatus } from '@/store/status'

const emit = defineEmits<{
  upload: [photo: string]
  exit: []
}>()

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)

const initCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
    // console.log('尺寸为', videoRef.value?.videoWidth, videoRef.value?.videoHeight)
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

video, .captured-photo {
  width: 960px;
  height: 720px;
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
