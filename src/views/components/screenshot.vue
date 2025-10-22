<template>
  <!-- 遮罩层 + 弹窗容器 -->
  <transition name="screenshot-modal">
    <div v-if="visible" class="screenshot-modal-overlay">
      <div class="screenshot-card">
        <div class="screenshot-container">
          <!-- 屏幕预览 -->
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

          <!-- 截图按钮 -->
          <el-button 
            class="action-button" 
            type="primary" 
            size="large"
            @click="captureAndUpload"
          >
            截图
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useStatus } from '@/store/status'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  upload: [photo: string]
  exit: []
}>()

const visible = defineModel<boolean>({ default: false })

const status = useStatus()
const videoRef = ref<HTMLVideoElement>()
const stream = ref<MediaStream | null>(null)

// 计算视频样式
const videoStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const
  }
})

// 视频元数据加载完成的回调
const onVideoMetadataLoaded = () => {
  console.log('[Screenshot] 视频元数据已加载')
  if (videoRef.value) {
    console.log(`[Screenshot] 视频尺寸: ${videoRef.value.videoWidth} x ${videoRef.value.videoHeight}`)
  }
}

const initScreenCapture = async () => {
  try {
    // 请求屏幕共享
    stream.value = await navigator.mediaDevices.getDisplayMedia({ 
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      },
      audio: false
    })
    
    console.log('[Screenshot] 屏幕流获取成功')
    
    // 打印实际获取到的视频轨道设置
    const videoTrack = stream.value.getVideoTracks()[0]
    const settings = videoTrack.getSettings()
    console.log('[Screenshot] 视频轨道设置:', settings)
    console.log(`[Screenshot] 屏幕实际分辨率: ${settings.width} x ${settings.height}`)
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      await nextTick()
      try {
        await videoRef.value.play()
      } catch (playError) {
        console.warn('[Screenshot] 自动播放失败:', playError)
        videoRef.value.muted = true
        await videoRef.value.play().catch(e => {
          console.error('[Screenshot] 播放失败:', e)
        })
      }
    }

    // 监听用户停止共享（点击浏览器的停止共享按钮）
    videoTrack.addEventListener('ended', () => {
      console.log('[Screenshot] 用户停止了屏幕共享')
      visible.value = false
    })
  } catch (error: any) {
    console.error('屏幕捕获失败:', error)
    if (error.name === 'NotAllowedError') {
      ElMessage.warning('用户取消了屏幕共享')
    } else {
      ElMessage.error('屏幕捕获失败，请重试')
    }
    visible.value = false
  }
}

// 截图并立即上传
const captureAndUpload = () => {
  if (!videoRef.value) return
  
  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight
  
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(videoRef.value, 0, 0)
    // 转为 jpg 格式（质量参数 0.95）
    const photoData = canvas.toDataURL('image/jpeg', 0.95)
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

// 监听弹窗打开/关闭，自动启动/清理屏幕捕获
watch(visible, async (newVal) => {
  if (newVal) {
    // 弹窗打开时自动启动屏幕捕获
    await initScreenCapture()
  } else {
    // 弹窗关闭时清理资源
    cleanup()
    status.photo = null
  }
})
</script>

<style scoped>
/* 遮罩层 */
.screenshot-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

/* 截图卡片 */
.screenshot-card {
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  background: #000;
}

.screenshot-container {
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
.screenshot-modal-enter-active,
.screenshot-modal-leave-active {
  transition: opacity 0.3s ease;
}

.screenshot-modal-enter-active .screenshot-card,
.screenshot-modal-leave-active .screenshot-card {
  transition: transform 0.3s ease;
}

.screenshot-modal-enter-from,
.screenshot-modal-leave-to {
  opacity: 0;
}

.screenshot-modal-enter-from .screenshot-card,
.screenshot-modal-leave-to .screenshot-card {
  transform: scale(0.9);
}
</style>
