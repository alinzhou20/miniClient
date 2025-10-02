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
    <el-button class="action-button" v-if="!status.takePhoto" type="primary" @click="capturePhoto">拍摄</el-button>
    <el-button class="action-button" v-else type="danger" @click="resetPhoto">重置</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useStatus } from '@/store/status'

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)

const initCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
    }
    console.log('尺寸为', videoRef.value?.videoWidth, videoRef.value?.videoHeight)
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
  width: 400px;
  height: 300px;
  margin: 60px auto;
}

video, .captured-photo {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  object-fit: cover;
}

.action-button {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.6;
}
</style>
