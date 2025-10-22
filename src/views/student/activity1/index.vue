<template>
  <div class="main-content">  
    <!-- 顶部区域：自我评价 -->
    <Evaluation />
    <!-- 主内容区 -->
    <div class="content-section">
      <!-- 双拍摄区域 -->
      <div class="dual-capture-container">
        <!-- 左侧：第一次拍摄 -->
        <div class="capture-area">
          <div class="capture-title">第一次拍摄</div>
          <div class="capture-card" :class="{ 'has-photo': ac1.takePhoto1 }">
            <!-- 识别中状态 -->
            <div v-if="isRecognizing && currentCapture === 1" class="recognition-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">识别中...</div>
            </div>
            <!-- 显示第一张照片 -->
            <div v-else-if="ac1.takePhoto1" class="photo-preview">
              <img :src="ac1.takePhoto1" alt="第一次拍摄" />
              <el-button 
                class="retake-button" 
                size="small" 
                @click="retakePhoto(1)"
              >
                重拍
              </el-button>
            </div>
            <!-- 拍摄按钮 -->
            <div v-else class="capture-content">
              <el-button 
                type="primary" 
                size="large" 
                @click="startCamera(1)"
                class="capture-button"
              >
                开始拍摄
              </el-button>
            </div>
          </div>
        </div>

        <!-- 右侧：第二次拍摄 -->
        <div class="capture-area">
          <div class="capture-title">第二次拍摄</div>
          <div class="capture-card" :class="{ 'has-photo': ac1.takePhoto2, 'disabled': !ac1.takePhoto1 }">
            <!-- 识别中状态 -->
            <div v-if="isRecognizing && currentCapture === 2" class="recognition-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">识别中...</div>
            </div>
            <!-- 显示第二张照片 -->
            <div v-else-if="ac1.takePhoto2" class="photo-preview">
              <img :src="ac1.takePhoto2" alt="第二次拍摄" />
              <el-button 
                class="retake-button" 
                size="small" 
                @click="retakePhoto(2)"
              >
                重拍
              </el-button>
            </div>
            <!-- 拍摄按钮 -->
            <div v-else class="capture-content">
              <el-button 
                type="primary" 
                size="large" 
                @click="startCamera(2)"
                :disabled="!ac1.takePhoto1"
                class="capture-button"
              >
                开始拍摄
              </el-button>
              <div v-if="!ac1.takePhoto1" class="tip-text">
                请先完成第一次拍摄
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 摄像头组件 -->
    <StudentCamera 
      v-model="showCamera" 
      @upload="handlePhotoUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStuStatus } from '@/store/status'
import { useStuAc1 } from '@/store/activity/activity1'
import { useSocket } from '@/store/socket'
import { useCoze, WORKFLOW } from '@/utils/coze'
import { ElMessage } from 'element-plus'
import { EventType } from '@/type/event'
import StudentCamera from '../../components/camera.vue'
import Evaluation from '../../components/evaluation.vue'

const status = useStuStatus()
const ac1 = useStuAc1()
const socket = useSocket()
const { uploadFile, runWorkflow } = useCoze()

// 摄像头和识别
const showCamera = ref(false)
const isRecognizing = ref(false)
const recognitionResult = ref<any>(null)
const currentCapture = ref<1 | 2>(1) // 当前拍摄的是第几次

// 启动摄像头
const startCamera = (captureIndex: 1 | 2) => {
  currentCapture.value = captureIndex
  showCamera.value = true
}

// 重拍某一张照片
const retakePhoto = (captureIndex: 1 | 2) => {
  if (captureIndex === 1) {
    ac1.takePhoto1 = null
    // 如果重拍第一张，也清空第二张
    ac1.takePhoto2 = null
  } else {
    ac1.takePhoto2 = null
  }
  
  // 清空识别结果和评分
  if (status.activity1Score) {
    Object.values(status.activity1Score).forEach(rating => {
      rating = 0
    })
  }
  
  startCamera(captureIndex)
}

// 处理摄像头上传事件
const handlePhotoUpload = async () => {
  showCamera.value = false
  
  if (!status.photo) {
    ElMessage.warning('照片未拍摄成功')
    return
  }

  // 保存照片到对应的位置
  if (currentCapture.value === 1) {
    ac1.takePhoto1 = status.photo
  } else {
    ac1.takePhoto2 = status.photo
  }

  // 如果两张照片都已拍摄，开始识别
  if (ac1.takePhoto1 && ac1.takePhoto2) {
    await recognizePhotos()
  }
}

// 识别两张照片
const recognizePhotos = async () => {
  isRecognizing.value = true
  
  try {
    // 使用第一张照片进行识别（或者根据需求使用第二张）
    const photoToRecognize = ac1.takePhoto1!
    
    // 1. 上传图片获取file_id（需要旋转90度）
    const fileId = await uploadFile(photoToRecognize, `activity1_${Date.now()}.jpg`, true)
    if (!fileId) throw new Error('图片上传失败')
    
    // 2. 调用识别工作流
    const result = await runWorkflow(WORKFLOW.GET_PICTURE, {
      img: { file_id: fileId },
      index: 1
    })

    // 3. 解析识别结果
    const resultData = JSON.parse(result)
    recognitionResult.value = resultData
    
    // 4. 更新评分状态
    if (resultData.output1 && status.activity1Score) {
      // 识别成功，更新第一个评分标准
      if (status.activity1Score[1]) {
        status.activity1Score[1] = 1
      }
    }
    
    // 5. 提交照片到教师端
    if (status.user?.groupNo && status.user?.studentNo) {
      socket.emit('submit', {
        eventType: EventType.SUBMIT,
        messageType: 'activity1_photo_submit',
        data: {
          groupNo: status.user.groupNo,
          photo1: ac1.takePhoto1,
          photo2: ac1.takePhoto2,
          submittedAt: Date.now()
        },
        from: {
          studentNo: status.user.studentNo,
          groupNo: status.user.groupNo,
          studentRole: status.user.studentRole
        }
      })
    }
    
    ElMessage.success('手写识别完成！已自动提交')
  } catch (error: any) {
    console.error('[Activity1] 识别失败:', error)
    ElMessage.error(`识别失败: ${error.message}`)
  } finally {
    isRecognizing.value = false
  }
}
</script>

<style scoped>
/* 页面布局 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 主内容区 */
.content-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 双拍摄区域容器 */
.dual-capture-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 拍摄区域 */
.capture-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 拍摄标题 */
.capture-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 拍摄卡片 */
.capture-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 40px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.capture-card.has-photo {
  padding: 0;
  overflow: hidden;
}

.capture-card.disabled {
  opacity: 0.6;
  background: #f9fafb;
}

.capture-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.capture-icon {
  font-size: 80px;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.capture-button {
  font-size: 18px;
  padding: 16px 48px;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.capture-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 照片预览 */
.photo-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  min-height: 450px;
}

.photo-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

/* 重拍按钮 */
.retake-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
}

.retake-button:hover {
  background: white;
  transform: scale(1.05);
}

/* 提示文本 */
.tip-text {
  margin-top: 12px;
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
}

/* 识别加载状态 */
.recognition-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.loading-spinner {
  width: 80px;
  height: 80px;
  border: 6px solid #e0f2fe;
  border-top: 6px solid #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 18px;
  color: #0369a1;
  font-weight: 600;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 表单卡片 */
.form-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-content {
  padding: 40px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 40px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 响应式 */
@media (max-width: 768px) {
  .dual-capture-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .capture-card {
    padding: 40px 20px;
    min-height: 350px;
  }
  
  .photo-preview {
    min-height: 350px;
  }
  
  .capture-icon {
    font-size: 60px;
  }
  
  .capture-button {
    font-size: 16px;
    padding: 14px 36px;
  }
  
  .form-content {
    padding: 20px;
  }
  
  .form-actions {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
}
</style>
