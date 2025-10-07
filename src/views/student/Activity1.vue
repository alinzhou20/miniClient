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
          <span class="star">{{ rating.score === 1 ? '⭐' : '' }}</span>
        </div>
      </div>
    </div>
    <!-- 底部区域：左右分栏 -->
    <div class="bottom-section">
      <!-- 左侧任务区 -->
    <div class="left-panel">

      <!-- 第一步 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">1. 小组讨论，将理由写在纸质调查问卷上。</h3>
        </div>
      </div>
      <!-- 第二步 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">2. 点击"拍照上传"（问卷拍完整、清晰）</h3>
          <div class="header-btns">
            <el-button type="primary" @click="startCamera">
              {{ hasRecognitionResult ? '重新拍摄' : '拍照上传' }}
            </el-button>
            <el-button type="success" @click="submitResult" :disabled="!canSubmit">
              提交
            </el-button>
          </div>
        </div>
    
        <!-- 识别中加载动画 -->
        <div v-if="isRecognizing" class="recognition-form loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在识别手写内容...</div>
        </div>

        <!-- 可编辑表单 -->
        <div v-else class="recognition-form">
          <el-form label-width="100px">
            <el-form-item label="小组观点：">
              <el-select 
                v-model="activity.ac1_stuResult!.viewpoint" 
                placeholder="请选择观点"
                style="width: 100%"
              >
                <el-option label="A 使用数字设备利大于弊" value="A" />
                <el-option label="B 使用数字设备弊大于利" value="B" />
              </el-select>
            </el-form-item>
            <el-form-item label="理由一：">
              <el-input
                v-model="activity.ac1_stuResult!.point[1]"
                type="textarea"
                :rows="2"
                placeholder="请输入理由一"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="理由二：">
              <el-input
                v-model="activity.ac1_stuResult!.point[2]"
                type="textarea"
                :rows="2"
                placeholder="请输入理由二"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
        <!-- 摄像头组件 -->
        <StudentCamera 
          v-model="showCamera" 
          @upload="handlePhotoUpload" 
          @exit="handleCameraExit" 
        />
      </div>

      <!-- 提交按钮 -->
  </div>
    <!-- 右侧AI助手 -->
    <div class="right-panel">
        <AIChatCard />
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStatus } from '@/store/status'
import { useActivity } from '@/store/activity'
import { useSocket } from '@/store/socket'
import { useCoze, WORKFLOW } from '@/utils/coze'
import { ElMessage } from 'element-plus'
import StudentCamera from '../components/StudentCamera.vue'
import AIChatCard from '../components/AIChatCard.vue'
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
    activity.ac1_stuResult?.point[1] || 
    activity.ac1_stuResult?.point[2]
  )
})

// 判断是否可以提交
const canSubmit = computed(() => {
  return !!(
    activity.ac1_stuResult?.viewpoint && (
      activity.ac1_stuResult?.point[1] || 
      activity.ac1_stuResult?.point[2]
    )
  )
})

// 启动摄像头并重置数据
const startCamera = () => {
  // 重置 ac1_stuResult
  if (activity.ac1_stuResult) {
    activity.ac1_stuResult.viewpoint = null
    activity.ac1_stuResult.point = { 1: '', 2: '' }
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
      activity.ac1_stuResult.point[1] = q2.q2_1
      activity.ac1_stuResult.point[2] = q2.q2_2
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
  if (activity.ac1_stuResult?.viewpoint && activity.ac1_stuResult?.point[1] && activity.ac1_stuResult?.point[2]) {
    activity.ac1_stuResult.rating[0].score = 1
    // 同步更新小组得分
    status.groupScores.activity1 = 1
  }
}

// 处理摄像头退出事件
const handleCameraExit = () => {
  // console.log('[Activity1] 用户退出摄像头')
  showCamera.value = false
}
</script>

<style scoped>
/* 页面布局 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
  height: 400px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  overflow-y: auto;
}

.right-panel {
  height: 100%;
  overflow-y: auto;
}

/* 卡片样式 */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

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

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .card-title {
  margin: 0;
  flex: 1;
}

.header-btns {
  display: flex;
  gap: 12px;
}

/* 可编辑表单 */
.recognition-form {
  padding: 24px;
  margin-top: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  min-height: 210px;
}

/* 加载状态 */
.recognition-form.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #bae6fd;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e0f2fe;
  border-top: 4px solid #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #0369a1;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 评价标准 */
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

/* 响应式 */
@media (max-width: 1024px) {
  .bottom-section { 
    grid-template-columns: 1fr; 
  }
}
</style>
