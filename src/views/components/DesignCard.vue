<template>
  <div class="three-star-card">
    <!-- 头部 -->
    <div class="card-header">
      <div class="card-title">小敏老师</div>
      <div class="header-actions">
        <button class="clear-btn" @click="removePhoto" v-if="hasRecognitionResult">清空</button>
      </div>
    </div>
    
    <!-- 主体内容区域 -->
    <div class="card-body" ref="bodyRef">

      <!-- 识别中加载动画 -->
      <div v-if="isRecognizing" class="recognition-form loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在识别手写内容...</div>
      </div>

      <!-- 可编辑表单 - 单个题目 -->
      <div 
        v-else-if="hasRecognitionResult"
        class="recognition-form"
      >
        <!-- 题型标题 -->
        <div class="question-type-title">
          {{ questionTypeText }}
        </div>
        
        <el-form label-width="45px">
          <el-form-item label="题目">
            <el-input
              v-model="designQuestion!.title"
              type="textarea"
              :rows="2"
              placeholder="请输入题目"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item 
            v-for="(_option, optIndex) in (designQuestion?.options || [])" 
            :key="optIndex"
            :label="String.fromCharCode(65 + optIndex)"
          >
            <el-input
              v-model="designQuestion!.options![optIndex]"
              type="textarea"
              :rows="1"
              :placeholder="`请输入选项${String.fromCharCode(65 + optIndex)}`"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-form>
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
const testMode = ref<'multiple' | 'fill'>('multiple')

// 获取挑战任务的独立数据源（three-star）
const designQuestion = computed(() => {
  return activity.threeStarDraft || null
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

// 题型显示文本
const questionTypeText = computed(() => {
  if (!designQuestion.value) return ''
  const typeMap: Record<string, string> = {
    'fill': '填空题',
    'single': '单选题',
    'multiple': '多选题'
  }
  return typeMap[designQuestion.value.type] || '未知题型'
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
 
    // 4. 存入 pinia - 保存到挑战任务独立数据源
    if (resultData.output2) {
      const questionType = (resultData.output2.type || 'multiple') as 'fill' | 'single' | 'multiple'
      const options = resultData.output2.options || []
      
      // 构建题目对象（使用 'design' 类型标识这是学生设计的题目）
      const newQuestion: QuestionOption = {
        id: 1,
        title: resultData.output2.question || '',
        options: options,
        type: questionType,
        questionType: 'design' as const,  // 使用 'design' 标识学生设计的题目
        answer: '',
        visibility: 'both',
        // 学生设计的题目不限制：多选题不限制选项数量，填空题不限制输入内容和类型（-1 表示不限制）
        limit: questionType === 'single' ? undefined : -1
      }
      console.log('[DesignCard] 新题目:', newQuestion)
      
      // 保存到挑战任务独立数据源（不影响基础任务）
      activity.threeStarDraft = newQuestion
      
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
  activity.threeStarDraft = null
  status.takePhoto = null
  ElMessage.info('已清空题目')
}

// 加入问卷
const submitChallenge = () => {
  if (canSubmit.value && activity.ac2_2_stuDesignResult && designQuestion.value) {
    try {
      // 1. 同步到 designQuestion（最终提交的题目）
      activity.ac2_2_stuDesignResult.designQuestion = { ...designQuestion.value }
      
      // 2. 覆盖问卷中 questionType 为 'design' 的题目
      const existingDesignIndex = activity.questionnaire.questions.findIndex(q => q.questionType === 'design')
      const newQuestionForQuestionnaire: QuestionOption = {
        ...designQuestion.value,
        id: existingDesignIndex !== -1 ? activity.questionnaire.questions[existingDesignIndex].id : 5,  // 保留原ID或使用5
        visibility: designQuestion.value.visibility || 'both'
      }
      
      if (existingDesignIndex !== -1) {
        // 覆盖已存在的 design 题目
        activity.questionnaire.questions[existingDesignIndex] = newQuestionForQuestionnaire
        console.log('[DesignCard] 覆盖已存在的 design 题目')
      } else {
        // 添加新的 design 题目
        activity.questionnaire.questions.push(newQuestionForQuestionnaire)
        console.log('[DesignCard] 添加新的 design 题目到问卷')
      }
      
      ElMessage.success('题目已加入问卷！请点击"提交设计"按钮完成提交')
    } catch (error: any) {
      console.error('[DesignCard] 提交失败:', error)
      ElMessage.error(`提交失败: ${error.message}`)
    }
  }
}

// 填充测试数据
const fillTestData = () => {
  if (testMode.value === 'multiple') {
    // 填充选择题测试数据
    const testQuestion: QuestionOption = {
      id: 1,
      title: '你平常使用数字设备最多的用途是什么？',
      options: [
        '学习查找资料',
        '娱乐游戏',
        '社交聊天',
        '观看视频'
      ],
      type: 'multiple',
      questionType: 'design',
      answer: '',
      visibility: 'both',
      limit: -1  // 学生设计的题目不限制选项数量
    }
    activity.threeStarDraft = testQuestion
    ElMessage.success('已填充选择题测试数据')
    testMode.value = 'fill'
  } else {
    // 填充填空题测试数据
    const testQuestion: QuestionOption = {
      id: 1,
      title: '你认为使用数字设备对学习最大的帮助是什么？',
      options: [],
      type: 'fill',
      questionType: 'design',
      answer: '',
      visibility: 'both',
      limit: -1  // 学生设计的填空题不限制输入内容和类型
    }
    activity.threeStarDraft = testQuestion
    ElMessage.success('已填充填空题测试数据')
    testMode.value = 'multiple'
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

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.test-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fbbf24;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  color: #78350f;
}

.test-btn:hover {
  background: linear-gradient(135deg, #fde68a, #fcd34d);
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
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

/* 识别表单区域 */
.recognition-form {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #bae6fd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease 0.2s backwards;
}

/* 题型标题 */
.question-type-title {
  font-size: 16px;
  font-weight: 700;
  color: #0ea5e9;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-left: 4px solid #0ea5e9;
  border-radius: 6px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 加载状态 */
.recognition-form.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #7dd3fc;
  min-height: 200px;
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

