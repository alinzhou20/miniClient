<template>
  <!-- 遮罩层 + 弹窗容器 -->
  <transition name="camera-modal">
    <div v-if="visible" class="camera-modal-overlay">
      <div class="camera-card">
        <div class="camera-container">
          <!-- 摄像头视频流 -->
          <video 
            ref="videoRef" 
            autoplay 
            muted 
            playsinline
            :style="videoStyle"
            @loadedmetadata="onVideoMetadataLoaded"
          ></video>

          <!-- 退出按钮 -->
          <el-button 
            class="exit-button" 
            type="danger" 
            size="small"
            @click="handleExit"
          >
            退出
          </el-button>

          <!-- 拍摄按钮 -->
          <el-button 
            class="action-button" 
            type="primary" 
            size="large"
            @click="captureAndUpload"
          >
            拍摄
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useStatus } from '@/store/status'

const emit = defineEmits<{
  upload: [photo: string]
  exit: []
}>()

const visible = defineModel<boolean>({ default: false })

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)

// 计算视频样式（旋转-90度，宽高互换以填满容器）
// 兼容 Chrome/Firefox/Edge
const videoStyle = computed(() => {
  return {
    width: '768px',
    height: '432px',
    transform: 'rotate(-90deg)',
    transformOrigin: 'center center',
    objectFit: 'cover' as const,
    // 确保 Edge 浏览器的渲染优化
    backfaceVisibility: 'hidden' as const
  }
})

// 视频元数据加载完成的回调
const onVideoMetadataLoaded = () => {
  console.log('[StudentCamera] 视频元数据已加载')
  if (videoRef.value) {
    console.log(`[StudentCamera] 视频尺寸: ${videoRef.value.videoWidth} x ${videoRef.value.videoHeight}`)
  }
}

const initCamera = async () => {
  try {
    // 请求超高分辨率视频流（支持4K/2K/1080p自适应降级）
    // 兼容 Chrome/Firefox/Edge
    stream.value = await navigator.mediaDevices.getUserMedia({ 
      video: {
        width: { ideal: 3840, min: 1280 },
        height: { ideal: 2160, min: 720 },
        frameRate: { ideal: 30 },
        facingMode: 'user' // 明确指定前置摄像头，提升 Edge 兼容性
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
      // Chrome/Edge 需要显式调用 play() 方法
      await nextTick()
      try {
        await videoRef.value.play()
      } catch (playError) {
        console.warn('[StudentCamera] 自动播放失败，可能需要用户交互:', playError)
        // Edge 浏览器备用方案：尝试静音播放
        videoRef.value.muted = true
        await videoRef.value.play().catch(e => {
          console.error('[StudentCamera] 播放失败:', e)
        })
      }
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
  }
}

// 拍照并立即上传
const captureAndUpload = () => {
  if (!videoRef.value) return
  
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(videoRef.value, 0, 0)
    // 转为无压缩的 jpg 格式（质量参数 1.0）
    const photoData = canvas.toDataURL('image/jpeg', 1.0)
    status.photo = photoData
    
    // 立即上传
    emit('upload', photoData)
    
    // 关闭弹窗
    visible.value = false
  }
}

// 处理退出按钮点击
const handleExit = () => {
  visible.value = false
  emit('exit')
}

const cleanup = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
}

// 监听弹窗打开/关闭，自动启动/清理摄像头
watch(visible, async (newVal) => {
  if (newVal) {
    // 弹窗打开时自动启动摄像头
    await initCamera()
  } else {
    // 弹窗关闭时清理资源
    cleanup()
    status.photo = null
  }
})
</script>

<style scoped>
/* 遮罩层 */
.camera-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

/* 相机卡片 */
.camera-card {
  width: 324px;
  height: 576px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
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

/* 退出按钮 */
.exit-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.action-button {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 16px;
  padding: 12px 40px;
}

/* 弹窗动画 */
.camera-modal-enter-active,
.camera-modal-leave-active {
  transition: opacity 0.3s ease;
}

.camera-modal-enter-active .camera-card,
.camera-modal-leave-active .camera-card {
  transition: transform 0.3s ease;
}

.camera-modal-enter-from,
.camera-modal-leave-to {
  opacity: 0;
}

.camera-modal-enter-from .camera-card,
.camera-modal-leave-to .camera-card {
  transform: scale(0.9);
}
</style>
