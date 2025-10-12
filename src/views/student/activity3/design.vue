<template>
  <div class="design-card">
    <!-- 卡片标题 -->
    <h2 class="card-header-title">设计题目</h2>
    
    <!-- 选择难度 -->
    <div class="difficulty-section">
      <button
        v-for="item in challengeItems" 
        :key="item.level"
        class="challenge-btn"
        :class="[item.level, { 'selected': selectedLevel === item.level }]"
        @click="selectLevel(item.level)"
      >
        {{ item.stars }} {{ item.name }}
      </button>
    </div>
    
    <!-- 2星难度：拍照识别 -->
    <div v-if="selectedLevel === 'two'" class="design-section">
      <div class="design-title">填写学习单设计题目，拍照上传</div>
      
      <!-- 初始状态：显示拍摄按钮 -->
      <div v-if="!twoStarQuestion && !isRecognizing" class="capture-card">
        <div class="capture-content">
          <el-button 
            type="primary" 
            size="large" 
            @click="openCamera"
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
          <el-form label-width="45px">
            <el-form-item label="题目">
              <el-input
                v-model="twoStarQuestion!.title"
                type="textarea"
                :rows="2"
                placeholder="请输入题目"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item 
              v-for="(_option, idx) in (twoStarQuestion!.options || [])" 
              :key="idx"
              :label="String.fromCharCode(65 + idx)"
            >
              <el-input
                v-model="twoStarQuestion!.options![idx]"
                type="textarea"
                :rows="1"
                :placeholder="`请输入选项${String.fromCharCode(65 + idx)}`"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
        
        <div class="form-actions">
          <el-button @click="openCamera" size="large">重拍</el-button>
          <el-button type="success" @click="saveTwoStar" size="large">加入问卷</el-button>
        </div>
      </div>
    </div>

    <!-- 1星难度：题库选择 -->
    <div v-else-if="selectedLevel === 'one'" class="design-section">
      <div class="design-title">与小敏老师对话，选择加入问卷的题目</div>

      <!-- AI 对话卡片 1：介绍文字 -->
      <div class="ai-chat-card" :class="{ 'show': showAiIntro }">
        <div class="ai-avatar-wrapper">
          <div class="ai-avatar">
            <img src="/chat.png" alt="小敏" />
          </div>
          <div class="ai-name">小敏</div>
        </div>
        <div class="ai-message">
          <div class="ai-message-content">
            <span class="typing-text">{{ displayedIntroText }}</span>
            <span v-if="isTyping" class="typing-cursor">|</span>
          </div>
        </div>
      </div>

      <!-- AI 对话卡片 2：题目列表 -->
      <div class="ai-chat-card" :class="{ 'show': showQuestionList }">
        <div class="ai-avatar-wrapper">
          <div class="ai-avatar">
            <img src="/chat.png" alt="小敏" />
          </div>
          <div class="ai-name">小敏</div>
        </div>
        <div class="ai-message">
          <div class="ai-message-content">
            <div class="question-list">
              <div 
                v-for="(question, qIndex) in displayedQuestions" 
                :key="question.id"
                class="question-item"
                :class="{ 
                  'selected': selectedOneStarId === question.id,
                  'show': visibleQuestionIndices.includes(qIndex)
                }"
                @click="selectOneStarQuestion(question.id, $event)"
              >
                <div class="question-header">
                  <span class="question-checkbox" :class="{ 'checked': selectedOneStarId === question.id }"></span>
                  <span class="question-title">
                    {{ questionTitles[qIndex] || '' }}
                    <span v-if="typingQuestionIndex === qIndex" class="typing-cursor">|</span>
                  </span>
                </div>
                
                <div 
                  v-if="showQuestionOptions[qIndex] && question.options && question.options.length > 0" 
                  class="question-options"
                  :class="{ 'show': showQuestionOptions[qIndex] }"
                >
                  <div 
                    v-for="(opt, idx) in question.options" 
                    :key="idx" 
                    class="option-text"
                    :data-option-label="String.fromCharCode(65 + idx)"
                  >
                    {{ opt }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useActivity } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useCoze, WORKFLOW } from '@/utils/coze'
import StudentCamera from '../../components/StudentCamera.vue'
import type { QuestionOption } from '@/store/activity'

const activity = useActivity()
const status = useStatus()
const { uploadFile, runWorkflow } = useCoze()

const emit = defineEmits<{
  (e: 'challenge-selected', level: 'one' | 'two' | null): void
}>()

// 难度选择
const selectedLevel = ref<'one' | 'two' | null>(null)

const challengeItems = [
  { level: 'two' as const, stars: '⭐⭐', name: '2星难度' },
  { level: 'one' as const, stars: '⭐', name: '1星难度' }
]

const selectLevel = (level: 'one' | 'two') => {
  selectedLevel.value = level
  emit('challenge-selected', level)
}

// 2星难度相关
const showCamera = ref(false)
const isRecognizing = ref(false)
const twoStarQuestion = computed(() => activity.threeStarDraft)

// 1星难度相关 - 题库数据
const allOneStarQuestions: QuestionOption[] = [
  {
    id: 1,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '运动', '交流', '旅游'],
    type: 'multiple',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  },
  {
    id: 2,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '娱乐'],
    type: 'multiple',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  },
  {
    id: 3,
    title: '你使用数字设备主要用于哪些场景？（可多选）',
    options: ['学习', '运动', '娱乐', '交流', '旅游', '其他_____'],
    type: 'multiple',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  },
  {
    id: 4,
    title: '你认为数字设备主要用于哪些场景？',
    options: [],
    type: 'fill',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  },
  {
    id: 5,
    title: '你最常使用数字设备做什么？',
    options: [],
    type: 'fill',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  },
  {
    id: 6,
    title: '你每天使用数字设备的主要用途是什么？（可多选）',
    options: ['学习查资料', '娱乐游戏', '社交聊天', '看视频', '其他_____'],
    type: 'multiple',
    questionType: 'design',
    answer: '',
    visibility: 'both',
    limit: -1
  }
]

const displayedQuestions = ref<QuestionOption[]>([])
const selectedOneStarId = ref<number | null>(null)

// AI 对话卡片相关
const showAiIntro = ref(false)
const showQuestionList = ref(false)
const displayedIntroText = ref('')
const isTyping = ref(false)
const visibleQuestionIndices = ref<number[]>([])
const questionTitles = ref<string[]>(['', '', ''])
const showQuestionOptions = ref<boolean[]>([false, false, false])
const typingQuestionIndex = ref<number | null>(null)
const fullIntroText = '我为你准备了 3 个问卷题目，请从中选择 1 个加入问卷吧！'

// 打字机效果
const typeWriterEffect = (text: string, callback?: () => void) => {
  displayedIntroText.value = ''
  isTyping.value = true
  let index = 0
  
  const type = () => {
    if (index < text.length) {
      displayedIntroText.value += text[index]
      index++
      setTimeout(type, 45) // 每个字45ms，更快
    } else {
      isTyping.value = false
      if (callback) {
        callback()
      }
    }
  }
  
  type()
}

// 单个题目标题打字机效果
const typeQuestionTitle = (questionIndex: number, fullText: string, callback?: () => void) => {
  questionTitles.value[questionIndex] = ''
  typingQuestionIndex.value = questionIndex
  let index = 0
  
  const type = () => {
    if (index < fullText.length) {
      questionTitles.value[questionIndex] += fullText[index]
      index++
      setTimeout(type, 35) // 题目标题打字更快一点，35ms/字
    } else {
      typingQuestionIndex.value = null
      if (callback) {
        callback()
      }
    }
  }
  
  type()
}

// 逐个显示题目（带标题打字机效果）
const showQuestionsOneByOne = () => {
  visibleQuestionIndices.value = []
  questionTitles.value = ['', '', '']
  showQuestionOptions.value = [false, false, false]
  let index = 0
  
  const showNext = () => {
    if (index < displayedQuestions.value.length) {
      const currentIndex = index
      // 先显示题目卡片
      visibleQuestionIndices.value.push(currentIndex)
      
      // 延迟一点开始打字机效果
      setTimeout(() => {
        const fullTitle = displayedQuestions.value[currentIndex].title
        typeQuestionTitle(currentIndex, fullTitle, () => {
          // 标题打字完成后，显示选项
          showQuestionOptions.value[currentIndex] = true
          // 延迟后显示下一个题目
          setTimeout(() => {
            index++
            showNext()
          }, 300)
        })
      }, 100)
    }
  }
  
  showNext()
}

// 随机选择3个题目
const randomSelectQuestions = () => {
  // 如果正在打字，不重复执行
  if (isTyping.value) return
  
  const shuffled = [...allOneStarQuestions].sort(() => Math.random() - 0.5)
  displayedQuestions.value = shuffled.slice(0, 3)
  selectedOneStarId.value = null
  
  // 重置 AI 对话状态
  showAiIntro.value = false
  showQuestionList.value = false
  displayedIntroText.value = ''
  visibleQuestionIndices.value = []
  questionTitles.value = ['', '', '']
  showQuestionOptions.value = [false, false, false]
  typingQuestionIndex.value = null
  
  // 延迟显示 AI 对话
  setTimeout(() => {
    showAiIntro.value = true
    typeWriterEffect(fullIntroText, () => {
      // 打字完成后延迟显示题目列表卡片
      setTimeout(() => {
        showQuestionList.value = true
        // 再延迟一点，逐个显示题目
        setTimeout(() => {
          showQuestionsOneByOne()
        }, 200)
      }, 500)
    })
  }, 300)
}

// 监听难度切换
watch(selectedLevel, (newLevel) => {
  if (newLevel === 'one') {
    randomSelectQuestions()
  } else {
    // 切换到其他难度时，重置 AI 对话状态
    showAiIntro.value = false
    showQuestionList.value = false
    isTyping.value = false
    visibleQuestionIndices.value = []
    questionTitles.value = ['', '', '']
    showQuestionOptions.value = [false, false, false]
    typingQuestionIndex.value = null
  }
})

// 2星难度方法
const openCamera = () => {
  // 如果已有题目，清空数据
  if (twoStarQuestion.value) {
    activity.threeStarDraft = null
    status.takePhoto = null
    
    if (activity.ac3_stuResult) {
      activity.ac3_stuResult.designQuestion = null
    }
    
    const index = activity.questionnaire.questions.findIndex(q => q.questionType === 'design')
    if (index !== -1) {
      activity.questionnaire.questions.splice(index, 1)
    }
  }
  
  showCamera.value = true
}

const handlePhotoUpload = async () => {
  showCamera.value = false
  
  if (!status.takePhoto) {
    ElMessage.warning('照片未拍摄成功')
    return
  }

  isRecognizing.value = true
  
  try {
    const fileId = await uploadFile(status.takePhoto, `activity3_design_${Date.now()}.jpg`, true)
    if (!fileId) throw new Error('图片上传失败')
    
    const result = await runWorkflow(WORKFLOW.GET_PICTURE, {
      img: { file_id: fileId },
      index: 2
    })

    const resultData = JSON.parse(result)
  
    if (resultData.output2) {
      const questionType = (resultData.output2.type || 'multiple') as 'fill' | 'single' | 'multiple'
      const options = resultData.output2.options || []
      
      const newQuestion: QuestionOption = {
        id: 5,
        title: resultData.output2.question || '',
        options: options,
        type: questionType,
        questionType: 'design' as const,
        answer: '',
        visibility: 'both',
        limit: questionType === 'single' ? undefined : -1
      }
      
      // 保存到草稿
      activity.threeStarDraft = newQuestion
      
      ElMessage.success('题目识别成功！请点击"加入问卷"按钮')
      
      // 不自动加入问卷，等待用户点击"加入问卷"按钮
    } else {
      ElMessage.warning('识别结果格式异常')
    }
  } catch (error: any) {
    console.error('[Design] 识别失败:', error)
    ElMessage.error(`识别失败: ${error.message}`)
  } finally {
    isRecognizing.value = false
  }
}

const handleCameraExit = () => {
  showCamera.value = false
}

const saveTwoStar = () => {
  if (!twoStarQuestion.value || !twoStarQuestion.value.title.trim()) {
    ElMessage.warning('题目内容不能为空')
    return
  }
  
  // 执行飞行动画
  const sourceEl = document.querySelector('.form-card')
  if (sourceEl) {
    createFlyAnimation(sourceEl as HTMLElement, twoStarQuestion.value.title.substring(0, 20) + '...')
  }
  
  // 延迟更新数据，让飞行动画先执行
  setTimeout(() => {
    // 更新 pinia 中的数据（因为用户可能编辑了）
    if (activity.ac3_stuResult && twoStarQuestion.value) {
      activity.ac3_stuResult.designQuestion = { ...twoStarQuestion.value }
    }
    
    // 更新问卷中的数据
    const existingIndex = activity.questionnaire.questions.findIndex(q => q.questionType === 'design')
    if (existingIndex !== -1 && twoStarQuestion.value) {
      activity.questionnaire.questions[existingIndex] = { ...twoStarQuestion.value }
    }
    
    ElMessage.success('题目已更新到问卷')
  }, 500)
}

// 创建飞行动画
const createFlyAnimation = (sourceEl: HTMLElement | null, questionTitle: string) => {
  if (!sourceEl) return
  
  const sourceRect = sourceEl.getBoundingClientRect()
  
  // 获取目标位置（右侧预览区域）
  const targetEl = document.querySelector('.student-questions-area')
  if (!targetEl) return
  const targetRect = targetEl.getBoundingClientRect()
  
  // 创建飞行元素
  const flyEl = document.createElement('div')
  flyEl.className = 'flying-question'
  flyEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 0 12px;">
      <span style="width: 18px; height: 18px; border: 2px solid #0ea5e9; background: #0ea5e9; border-radius: 4px; flex-shrink: 0; position: relative; display: inline-block;">
        <svg style="position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;" viewBox="0 0 14 14">
          <path d="M2 7L5.5 10.5L12 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span style="flex: 1; color: #1f2937; font-size: 15px;">${questionTitle}</span>
    </div>
  `
  flyEl.style.cssText = `
    position: fixed;
    left: ${sourceRect.left}px;
    top: ${sourceRect.top}px;
    width: ${sourceRect.width}px;
    padding: 12px 0;
    background: white;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    border-bottom: 1px dashed #e5e7eb;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `
  document.body.appendChild(flyEl)
  
  // 强制重排以确保初始位置生效
  flyEl.offsetHeight
  
  // 设置目标位置
  flyEl.style.left = `${targetRect.left + targetRect.width / 2 - sourceRect.width / 2}px`
  flyEl.style.top = `${targetRect.top + 50}px`
  flyEl.style.transform = 'scale(0.9)'
  flyEl.style.opacity = '0.3'
  
  // 动画结束后移除元素
  setTimeout(() => {
    flyEl.remove()
  }, 1000)
}

// 1星难度方法
const selectOneStarQuestion = (id: number, event?: MouseEvent) => {
  const selectedQ = displayedQuestions.value.find(q => q.id === id)
  if (!selectedQ) return
  
  // 如果已经选中同一个题目，不重复操作
  if (selectedOneStarId.value === id) return
  
  selectedOneStarId.value = id
  
  // 执行飞行动画
  if (event) {
    createFlyAnimation(event.currentTarget as HTMLElement, selectedQ.title.substring(0, 20) + '...')
  }
  
  // 延迟更新数据，让飞行动画先执行
  setTimeout(() => {
    // 保存到 twoStarDraft
    activity.twoStarDraft = { ...selectedQ }
    
    // 保存到 designQuestion（不自动评分）
    if (activity.ac3_stuResult) {
      activity.ac3_stuResult.designQuestion = { ...selectedQ, id: 5 }
    }
    
    // 保存到问卷
    const existingIndex = activity.questionnaire.questions.findIndex(q => q.questionType === 'design')
    const newQuestion: QuestionOption = {
      ...selectedQ,
      id: existingIndex !== -1 ? activity.questionnaire.questions[existingIndex].id : 5,
      visibility: selectedQ.visibility || 'both'
    }
    
    if (existingIndex !== -1) {
      activity.questionnaire.questions[existingIndex] = newQuestion
    } else {
      activity.questionnaire.questions.push(newQuestion)
    }
    
    ElMessage.success('题目已加入问卷！请点击"提交设计"按钮完成提交')
  }, 500)
}
</script>

<style scoped>
.design-card {
  background: #fdfbf7;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.card-header-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.design-section {
  display: flex;
  flex-direction: column;
}

.design-section-title {
  font-size: 20px;
  font-weight: 600;
  color: #0ea5e9;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.design-title {
  font-size: 18px;
  font-weight: 800;
  color: #000000;
  margin-bottom: 16px;
  line-height: 1.4;
}

/* 难度选择区域 */
.difficulty-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.challenge-btn {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #6b7280;
  transition: all 0.2s;
}

.challenge-btn:hover {
  border-color: #9ca3af;
}

.challenge-btn.selected {
  border-color: #0ea5e9;
  background: #f0f9ff;
  color: #0ea5e9;
}

/* 2星难度样式 - 参考 activity1 */
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

/* 1星难度样式 - AI 对话卡片 */
.ai-chat-card {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s ease;
}

.ai-chat-card.show {
  opacity: 1;
  transform: translateY(0);
}

.ai-avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: white;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-name {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.ai-message {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ai-message-content {
  padding: 20px;
  font-size: 15px;
  line-height: 1.8;
  color: #1f2937;
}

.typing-text {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #1f2937;
  margin-left: 2px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 1星难度样式 - 参考 bank.vue */
.question-list {
  display: flex;
  flex-direction: column;
}

.question-item {
  position: relative;
  padding: 12px 0;
  border-bottom: 1px dashed #e5e7eb;
  cursor: pointer;
  opacity: 0;
  transform: translateX(-20px);
  transition: all 0.2s ease;
}

.question-item.show {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background: #f9fafb;
}

.question-item.selected {
  background: #f0f9ff;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #9ca3af;
  border-radius: 4px;
  flex-shrink: 0;
  background: white;
  transition: all 0.2s ease;
  position: relative;
}

.question-checkbox.checked {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.question-checkbox.checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.question-title {
  flex: 1;
  font-size: 15px;
  color: #1f2937;
  line-height: 1.5;
}

.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding-left: 30px;
  opacity: 0;
  transform: translateY(-5px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.question-options.show {
  opacity: 1;
  transform: translateY(0);
}

.option-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
}

.option-text::before {
  content: attr(data-option-label) ".";
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
