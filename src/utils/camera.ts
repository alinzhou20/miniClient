import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 摄像头工具
 */
export function useCamera() {
  const videoRef = ref<HTMLVideoElement>()
  const mediaStream = ref<MediaStream | null>(null)
  const isLoading = ref(false)
  const cameraError = ref('')
  const isCameraReady = ref(false)

  // 初始化摄像头
  const initCamera = async (constraints?: MediaStreamConstraints) => {
    isLoading.value = true
    cameraError.value = ''
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能')
      }
      
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('[Camera] 摄像头需要HTTPS或localhost环境')
      }
      
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => track.stop())
      }
      
      const defaultConstraints: MediaStreamConstraints = {
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints)
      mediaStream.value = stream
      
      if (videoRef.value) {
        videoRef.value.srcObject = stream
      }
      
      isCameraReady.value = true
      ElMessage.success('摄像头启动成功')
    } catch (error: any) {
      console.error('[Camera] 启动失败:', error)
      
      if (error.name === 'NotAllowedError') {
        cameraError.value = '摄像头权限被拒绝'
      } else if (error.name === 'NotFoundError') {
        cameraError.value = '未找到摄像头设备'
      } else if (error.name === 'NotReadableError') {
        cameraError.value = '摄像头被占用'
      } else {
        cameraError.value = `摄像头启动失败: ${error.message}`
      }
    } finally {
      isLoading.value = false
    }
  }

  const retryCamera = () => {
    isCameraReady.value = false
    cameraError.value = ''
    initCamera()
  }

  const cleanup = () => {
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
      mediaStream.value = null
    }
    isCameraReady.value = false
    cameraError.value = ''
  }

  const capturePhoto = (): string | null => {
    if (!videoRef.value || !isCameraReady.value) {
      console.error('[Camera] 摄像头未就绪')
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      
      canvas.width = videoRef.value.videoWidth
      canvas.height = videoRef.value.videoHeight
      context.drawImage(videoRef.value, 0, 0)
      
      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      console.error('[Camera] 拍照失败:', error)
      return null
    }
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    videoRef,
    mediaStream,
    isLoading,
    cameraError,
    isCameraReady,
    initCamera,
    retryCamera,
    cleanup,
    capturePhoto
  }
}
