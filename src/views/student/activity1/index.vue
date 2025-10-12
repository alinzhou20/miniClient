<template>
  <div class="main-content">
  
    <!-- 顶部区域：自我评价 -->
    <div class="evaluation-card">
      <h3>评价标准</h3>
      <div class="criteria-grid">
        <div 
          v-for="rating in activity.ac1_stuResult?.rating" 
          :key="rating.index" 
          class="criterion-item"
          :class="{ 'completed': rating.score === 1 }"
        >
          <span class="criterion-text">{{ rating.criteria }}</span>
        </div>
      </div>
    </div>
    <!-- 主内容区 -->
    <div class="content-section">
      <!-- 初始状态：显示拍摄卡片 -->
      <div v-if="!hasRecognitionResult && !isRecognizing" class="capture-card">
        <div class="capture-content">
          <el-button 
            type="primary" 
            size="large" 
            @click="startCamera"
            class="capture-button"
          >
            拍照上传
          </el-button>
        </div>
      </div>

      <!-- 识别中状态 -->
      <div v-else-if="isRecognizing" class="capture-card">
        <div class="recognition-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在识别手写内容...</div>
        </div>
      </div>

      <!-- 识别完成：显示表单 -->
      <div v-else class="form-card">
        <div class="form-content">
          <el-form label-width="100px">
            <el-form-item label="观点：">
              <el-select 
                v-model="activity.ac1_stuResult!.viewpoint" 
                placeholder="请选择观点"
                style="width: 100%"
              >
                <el-option label="A 使用数字设备利大于弊" value="A" />
                <el-option label="B 使用数字设备弊大于利" value="B" />
              </el-select>
            </el-form-item>
            <el-form-item label="理由：">
              <el-input
                v-model="activity.ac1_stuResult!.point[1]"
                type="textarea"
                :rows="6"
                placeholder="请输入理由"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="form-actions">
          <el-button @click="startCamera" size="large">
            重拍
          </el-button>
          <el-button type="success" @click="submitResult" :disabled="!canSubmit" size="large">
            提交
          </el-button>
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
import { ref, computed } from 'vue'
import { useStatus } from '@/store/status'
import { useActivity } from '@/store/activity'
import { useSocket } from '@/store/socket'
import { useCoze, WORKFLOW } from '@/utils/coze'
import { ElMessage } from 'element-plus'
import StudentCamera from '../../components/StudentCamera.vue'
import { EntityMode, EventType } from '@/types'

const status = useStatus()
const activity = useActivity()
const socket = useSocket()
const { uploadFile, runWorkflow } = useCoze()

// 摄像头和识别
const showCamera = ref(false)
const isRecognizing = ref(false)
const recognitionResult = ref<any>(null)

// 判断是否有识别结果
const hasRecognitionResult = computed(() => {
  return !!(
    activity.ac1_stuResult?.viewpoint || 
    activity.ac1_stuResult?.point[1]
  )
})

// 判断是否可以提交
const canSubmit = computed(() => {
  return !!(
    activity.ac1_stuResult?.viewpoint && 
    activity.ac1_stuResult?.point[1]
  )
})

// 启动摄像头并重置数据
const startCamera = () => {
  // 重置 ac1_stuResult
  if (activity.ac1_stuResult) {
    activity.ac1_stuResult.viewpoint = null
    activity.ac1_stuResult.point = { 1: '' }
    activity.ac1_stuResult.rating[0].score = 0
    // 重置小组得分
    status.groupScores.activity1 = 0
  }
  
  // 启动摄像头
  showCamera.value = true
  // ElMessage.info('已重置数据，请重新拍摄')
}

// 提交结果
const submitResult = () => {
  autoScore()
  try {
    const user = status.userStatus
    socket.submit({
      mode: user?.mode || EntityMode.STUDENT,
      eventType: EventType.SUBMIT,
      messageType: 'activity1_submit',
      activityIndex: '1',
      data: {
        viewpoint: activity.ac1_stuResult?.viewpoint,
        point: activity.ac1_stuResult?.point,
        rating: activity.ac1_stuResult?.rating,
        submittedAt: Date.now()
      },
      from: {
        id: `${user?.studentNo || ''}_${user?.groupNo || ''}`,
        studentNo: user?.studentNo,
        groupNo: user?.groupNo,
        studentRole: user?.studentRole
      },
      to: null
    })
    
    // ElMessage.success('提交成功！')
  } catch (error: any) {
    console.error('[Activity1] 提交失败:', error)
    // ElMessage.error(`提交失败: ${error.message}`)
  }
}

// 处理摄像头上传事件
const handlePhotoUpload = async () => {
  // console.log('[Activity1] 收到上传照片')
  showCamera.value = false
  
  if (!status.takePhoto) {
    // ElMessage.warning('照片未拍摄成功')
    return
  }

  isRecognizing.value = true
  
  try {
    // 1. 上传图片获取file_id（需要旋转90度）
    const fileId = await uploadFile(status.takePhoto, `activity1_${Date.now()}.jpg`, true)
    if (!fileId) throw new Error('图片上传失败')
    
    // 2. 调用识别工作流
    const result = await runWorkflow(WORKFLOW.GET_PICTURE, {
      img: { file_id: fileId },
      index: 1
    })

    // 3. 解析识别结果
    const resultData = JSON.parse(result)
    recognitionResult.value = resultData
    
    // 4. 存入pinia
    if (resultData.output1 && activity.ac1_stuResult) {
      const { q1, q2 } = resultData.output1
      activity.ac1_stuResult.viewpoint = q1
      activity.ac1_stuResult.point[1] = q2.q2_1 || ''
    }
    
    ElMessage.success('手写识别完成！已自动保存')
  } catch (error: any) {
    console.error('[Activity1] 识别失败:', error)
    ElMessage.error(`识别失败: ${error.message}`)
  } finally {
    isRecognizing.value = false
  }
}

// 自动打分
const autoScore = () => {
  if (activity.ac1_stuResult?.viewpoint && activity.ac1_stuResult?.point[1]) {
    activity.ac1_stuResult.rating[0].score = 1
    // 同步更新小组得分
    status.groupScores.activity1 = 1
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

/* 评价标准 */
.evaluation-card {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.evaluation-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.criteria-grid {
  display: flex;
  gap: 15px;
  flex: 1;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.criterion-item.completed {
  background: #fef3c7;
  border-color: #fbbf24;
  font-weight: 600;
}

.criterion-item .star {
  font-size: 14px;
}

.criterion-item .criterion-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.criterion-item.completed .criterion-text {
  color: #374151;
  font-weight: 600;
}

/* 主内容区 */
.content-section {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 拍摄卡片 */
.capture-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 80px 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  .capture-card {
    padding: 60px 20px;
    min-height: 300px;
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
