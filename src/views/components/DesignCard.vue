<template>
  <div class="three-star-card">
    <!-- 头部 -->
    <div class="card-header">
      <div class="card-title">小敏老师</div>
      <button class="clear-btn" @click="removePhoto" v-if="hasRecognitionResult">清空</button>
    </div>
    
    <!-- 主体内容区域 -->
    <div class="card-body" ref="bodyRef">

      <!-- 识别中加载动画 -->
      <div v-if="isRecognizing" class="recognition-form loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在识别手写内容...</div>
      </div>

      <!-- 识别结果显示区域 - 单个题目 -->
      <div 
        v-else-if="hasRecognitionResult"
        class="recognition-form"
      >
        <div class="form-item">
          <span class="form-label">题目：</span>
          <span class="form-value" :class="{ 'empty': !designQuestion?.title }">
            {{ designQuestion?.title || '未识别' }}
          </span>
        </div>
        <div class="form-item" v-if="designQuestion?.options && designQuestion.options.length > 0">
          <span class="form-label">选项：</span>
          <div class="options-container">
            <div 
              v-for="(option, optIndex) in designQuestion.options" 
              :key="optIndex"
              class="option-item"
            >
              <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
              <span class="form-value" :class="{ 'empty': !option }">
                {{ option || '未识别' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">点击下方"启动摄像头"拍照识别题目</p>
      </div>
    </div>

    <!-- 底部操作区域 -->
    <div class="card-footer">
      <el-button 
        type="primary" 
        size="large"
        @click="openCamera" 
        class="action-btn camera-btn"
      >
        <el-icon><Camera /></el-icon>
        <span>{{ hasRecognitionResult ? '重新拍摄' : '启动摄像头' }}</span>
      </el-button>
      <el-button 
        type="success" 
        size="large"
        @click="submitChallenge" 
        :disabled="!canSubmit"
        class="action-btn submit-btn"
      >
        <span>加入问卷</span>
      </el-button>
    </div>
  </div>

  <!-- 相机组件 -->
  <StudentCamera 
    v-model="showCamera" 
    @upload="handlePhotoUpload"
    @exit="handleCameraExit"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useActivity } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useCoze, WORKFLOW } from '@/utils/coze'
import StudentCamera from './StudentCamera.vue'
import { QuestionOption } from '@/store/activity'

const activity = useActivity()
const status = useStatus()
const { uploadFile, runWorkflow } = useCoze()

const showCamera = ref(false)
const bodyRef = ref<HTMLElement>()
const isRecognizing = ref(false)

// 获取设计的单个题目
const designQuestion = computed(() => {
  return activity.ac2_2_stuDesignResult?.designQuestion || null
})

// 判断是否有识别结果
const hasRecognitionResult = computed(() => {
  return !!designQuestion.value
})

// 判断是否可以提交
const canSubmit = computed(() => {
  // 题目存在且有标题
  return !!(designQuestion.value?.title && designQuestion.value.title.trim() !== '')
})

// 启动摄像头
const openCamera = () => {
  showCamera.value = true
}

// 处理摄像头上传事件（参考 activity1.vue）
const handlePhotoUpload = async () => {
  // console.log('[DesignCard] 收到上传照片')
  showCamera.value = false
  
  if (!status.takePhoto) {
    ElMessage.warning('照片未拍摄成功')
    return
  }

  isRecognizing.value = true
  
  try {
    // 1. 上传图片获取file_id（需要旋转90度）
    const fileId = await uploadFile(status.takePhoto, `activity2_design_${Date.now()}.jpg`, true)
    if (!fileId) throw new Error('图片上传失败')
    
    // 2. 调用识别工作流（index: 2）
    const result = await runWorkflow(WORKFLOW.GET_PICTURE, {
      img: { file_id: fileId },
      index: 2
    })

    // 3. 解析识别结果（使用 output2）
    const resultData = JSON.parse(result)
    // console.log('[DesignCard] 识别结果:', resultData)
 
    // 4. 存入 pinia - 保存单个题目
    if (resultData.output2 && activity.ac2_2_stuDesignResult) {
      // 构建题目对象（使用 'design' 类型标识这是学生设计的题目）
      const newQuestion: QuestionOption = {
        id: 1,
        title: resultData.output2.question || '',
        options: resultData.output2.options || [],
        type: (resultData.output2.type || 'multiple') as 'fill' | 'single' | 'multiple',
        questionType: 'design' as const,  // 使用 'design' 标识学生设计的题目
        answer: ''
      }
      console.log('[DesignCard] 新题目:', newQuestion)
      
      // 直接赋值给 designQuestion（覆盖旧的）
      activity.ac2_2_stuDesignResult.designQuestion = newQuestion
      
      ElMessage.success('题目识别成功！')
    } else {
      ElMessage.warning('识别结果格式异常')
    }
  } catch (error: any) {
    console.error('[DesignCard] 识别失败:', error)
    ElMessage.error(`识别失败: ${error.message}`)
  } finally {
    isRecognizing.value = false
  }
}

// 处理摄像头退出事件
const handleCameraExit = () => {
  // console.log('[DesignCard] 用户退出摄像头')
  showCamera.value = false
}

// 清空题目和照片
const removePhoto = () => {
  if (activity.ac2_2_stuDesignResult) {
    activity.ac2_2_stuDesignResult.designQuestion = null
  }
  status.takePhoto = null
  ElMessage.info('已清空题目')
}

// 加入问卷
const submitChallenge = () => {
  if (canSubmit.value && activity.ac2_2_stuDesignResult && designQuestion.value) {
    try {
      // 1. 将设计的题目加入到问卷中（固定ID=5）
      const existingIndex = activity.questionnaire.questions.findIndex(q => q.id === 5)
      const newQuestionForQuestionnaire: QuestionOption = {
        ...designQuestion.value,
        id: 5  // 固定ID为5（使用用途题目）
      }
      
      // 如果已存在就替换，否则添加
      if (existingIndex !== -1) {
        activity.questionnaire.questions[existingIndex] = newQuestionForQuestionnaire
        // console.log('[DesignCard] 替换已存在的设计题目')
      } else {
        activity.questionnaire.questions.push(newQuestionForQuestionnaire)
        // console.log('[DesignCard] 添加新的设计题目到问卷')
      }
      
      // console.log('[DesignCard] 当前问卷题目:', activity.questionnaire.questions)
      
      ElMessage.success('题目已加入问卷！请点击"提交设计"按钮完成提交')
    } catch (error: any) {
      console.error('[DesignCard] 提交失败:', error)
      ElMessage.error(`提交失败: ${error.message}`)
    }
  }
}
</script>

<style scoped>
/* 主容器 - 与 AI 卡片保持一致 */
.three-star-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid #B6E1FF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(182, 225, 255, 0.3);
}

/* 头部 - 与 AI 卡片一致的渐变背景 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #B6E1FF, #8EC5FC);
  border-bottom: 2px solid #B6E1FF;
  border-radius: 14px 14px 0 0;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.clear-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* 主体内容区 - 与 AI 卡片一致的浅蓝背景 */
.card-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f0f9ff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 介绍文本 */
.intro-box {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease;
}

.intro-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* 模板区域 */
.template-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.3s ease 0.1s backwards;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #0369a1;
  margin: 0;
}

.template-box {
  background: white;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.template-line {
  margin: 8px 0;
  line-height: 1.8;
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-line.option {
  padding-left: 20px;
}

.label {
  font-weight: 600;
  color: #1f2937;
  min-width: 60px;
}

.option-label {
  font-weight: 600;
  color: #60a5fa;
  min-width: 30px;
}

.underline {
  flex: 1;
  color: #9ca3af;
  letter-spacing: 0.5px;
}

/* 识别表单区域 */
.recognition-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #bae6fd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease 0.2s backwards;
}

/* 加载状态 */
.recognition-form.loading {
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #7dd3fc;
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

.form-item {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 15px;
}

.form-label {
  font-weight: 600;
  color: #374151;
  min-width: 70px;
  white-space: nowrap;
}

.form-value {
  flex: 1;
  color: #1f2937;
  font-size: 14px;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  word-break: break-word;
}

.form-value.empty {
  color: #9ca3af;
  border-bottom: 2px solid #d1d5db;
  font-style: italic;
}

.form-value:not(.empty) {
  color: #059669;
  font-weight: 500;
  border-bottom: 2px solid #10b981;
}

/* 选项容器 */
.options-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-left: 12px;
}

.option-item .option-label {
  font-weight: 600;
  color: #60a5fa;
  min-width: 25px;
}

.option-item .form-value {
  flex: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #bae6fd;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 底部操作区 - 与 AI 卡片一致 */
.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;
  display: flex;
  gap: 12px;
  background: white;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 动画效果 */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* 滚动条样式 - 与 AI 卡片一致 */
.card-body::-webkit-scrollbar {
  width: 6px;
}

.card-body::-webkit-scrollbar-track {
  background: transparent;
}

.card-body::-webkit-scrollbar-thumb {
  background: #bae6fd;
  border-radius: 3px;
}

.card-body::-webkit-scrollbar-thumb:hover {
  background: #7dd3fc;
}
</style>

