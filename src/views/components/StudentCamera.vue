<template>
  <el-dialog 
    v-model="visible" 
    :show-close="false"
    :close-on-click-modal="false"
    width="500px"
    height="400px"
    @close="handleClose"
  >
    <div class="camera-container">
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
      <el-button class="exit-button" @click="handleExit">退出</el-button>
      <el-button class="action-button" v-if="!status.takePhoto" type="primary" @click="capturePhoto">拍摄</el-button>
      <div v-else class="photo-actions">
        <el-button type="success" @click="uploadPhoto">上传</el-button>
        <el-button type="danger" @click="resetPhoto">重置</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useStatus } from '@/store/status'

const emit = defineEmits<{
  upload: [photo: string]
  exit: []
}>()

const visible = defineModel<boolean>({ default: false })

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)
const videoWidth = ref(0)
const videoHeight = ref(0)

// 计算视频样式（考虑90度旋转后的宽高互换）
const videoStyle = computed(() => {
  if (videoWidth.value && videoHeight.value) {
    // 因为旋转了-90度，宽高需要互换来计算宽高比
    const aspectRatio = videoHeight.value / videoWidth.value
    return {
      width: '100%',
      height: '100%',
      transform: 'rotate(-90deg)',
      objectFit: 'contain' as const,
      aspectRatio: aspectRatio.toString()
    }
  }
  return {
    width: '100%',
    height: '100%',
    transform: 'rotate(-90deg)',
    objectFit: 'contain' as const
  }
})

const photoStyle = computed(() => videoStyle.value)

watch(visible, (newVal) => {
  if (newVal) {
    initCamera()
  } else {
    cleanup()
  }
})

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
      
      // 等待视频元数据加载完成，获取实际尺寸
      await new Promise<void>((resolve) => {
        if (videoRef.value) {
          videoRef.value.onloadedmetadata = () => {
            if (videoRef.value) {
              videoWidth.value = videoRef.value.videoWidth
              videoHeight.value = videoRef.value.videoHeight
              console.log(`[StudentCamera] Video元素显示尺寸: ${videoWidth.value} x ${videoHeight.value}`)
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
  visible.value = false
}

const cleanup = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
}

const handleClose = () => {
  cleanup()
  status.takePhoto = null
}
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 480px;
  height: 360px;
  margin: 60px auto;
}

video, .captured-photo {
  max-width: 100%;
  max-height: 100%;
  /* transform 和 object-fit 由动态样式控制 */
}

.exit-button {
  position: absolute;
  top: -50px;
  right: 70px;
  z-index: 10;
  opacity: 0.8;
}

.action-button {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.8;
}

.photo-actions {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 20px;
  opacity: 0.8;
}
</style>
