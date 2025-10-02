import { ref, onUnmounted, computed } from 'vue'

export interface CameraConfig {
  /** 旋转角度：0, 90, 180, 270 */
  rotation?: number
  /** 是否镜像 */
  mirror?: boolean
}

/**
 * 摄像头工具
 */
export function cameraUtils(config: CameraConfig = {}) {
  const { rotation = 0, mirror = false } = config
  
  const videoRef = ref<HTMLVideoElement>()
  const mediaStream = ref<MediaStream | null>(null)
  const isLoading = ref(false)
  const cameraError = ref('')
  const isCameraReady = ref(false)
  const videoWidth = ref(0)
  const videoHeight = ref(0)

  // 根据旋转角度计算实际显示尺寸
  const displayWidth = computed(() => {
    if (rotation === 90 || rotation === 270) {
      return videoHeight.value
    }
    return videoWidth.value
  })

  const displayHeight = computed(() => {
    if (rotation === 90 || rotation === 270) {
      return videoWidth.value
    }
    return videoHeight.value
  })

  // 视频旋转样式
  const videoStyle = computed(() => {
    const styles: Record<string, string> = {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }

    // 根据旋转角度应用 CSS transform
    if (rotation !== 0) {
      styles.transform = `rotate(${-rotation}deg)` // 负数为逆时针
      styles.transformOrigin = 'center center'
    }

    // 镜像翻转
    if (mirror) {
      styles.transform = (styles.transform || '') + ' scaleX(-1)'
    }

    return styles
  })

  /**
   * 初始化摄像头
   */
  const initCamera = async () => {
    isLoading.value = true
    cameraError.value = ''
    
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能')
      }
      
      // 清理现有流
      if (mediaStream.value) {
        mediaStream.value.getTracks().forEach(track => track.stop())
        mediaStream.value = null
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true
      })
      
      mediaStream.value = stream
      
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        
        // 等待视频元数据加载，获取实际尺寸
        await new Promise<void>((resolve) => {
          if (videoRef.value) {
            videoRef.value.onloadedmetadata = () => {
              if (videoRef.value) {
                videoWidth.value = videoRef.value.videoWidth
                videoHeight.value = videoRef.value.videoHeight
                console.log(`[Camera] 视频尺寸: ${videoWidth.value} x ${videoHeight.value}`)
              }
              resolve()
            }
          }
        })
      }
      
      isCameraReady.value = true
    } catch (error: any) {
      console.error('[Camera] 初始化失败:', error)
      if (error.name === 'NotAllowedError') {
        cameraError.value = '摄像头权限被拒绝'
      } else if (error.name === 'NotFoundError') {
        cameraError.value = '未找到摄像头设备'
      } else if (error.name === 'NotReadableError') {
        cameraError.value = '摄像头被占用'
      } else {
        cameraError.value = '摄像头启动失败'
      }
      isCameraReady.value = false
      mediaStream.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 清理摄像头资源
   */
  const cleanup = () => {
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
      mediaStream.value = null
    }
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    isCameraReady.value = false
    cameraError.value = ''
    videoWidth.value = 0
    videoHeight.value = 0
  }

  /**
   * 拍摄照片 - PNG 无损格式
   */
  const capturePhoto = (): string | null => {
    if (!videoRef.value || !isCameraReady.value) return null

    try {
      const video = videoRef.value
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      
      // 根据旋转角度设置 canvas 尺寸
      if (rotation === 90 || rotation === 270) {
        canvas.width = video.videoHeight
        canvas.height = video.videoWidth
      } else {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      
      // 应用变换
      context.translate(canvas.width / 2, canvas.height / 2)
      
      // 旋转（逆时针为负角度）
      if (rotation === 90) {
        context.rotate(-Math.PI / 2) // 逆时针90度
      } else if (rotation === 180) {
        context.rotate(Math.PI)
      } else if (rotation === 270) {
        context.rotate(Math.PI / 2) // 顺时针90度
      }
      
      // 镜像
      if (mirror) {
        context.scale(-1, 1)
      }
      
      context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight)
      
      return canvas.toDataURL('image/png')
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
    isLoading,
    cameraError,
    isCameraReady,
    videoWidth,
    videoHeight,
    displayWidth,
    displayHeight,
    videoStyle,
    initCamera,
    cleanup,
    capturePhoto
  }
}
