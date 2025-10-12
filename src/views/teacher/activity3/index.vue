<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📊 问卷编辑，精研问题</h2>
      </div>

      <!-- 问卷预览模式 -->
      <div class="preview-mode">
        <div class="preview-grid">
          <!-- 左侧：问卷编辑 -->
          <div class="preview-left">
            <div class="preview-container">
              <div class="preview-header">
                <div class="preview-header-left">
                  <h3 class="preview-title">问卷编辑 - 可修改学生选择的题目</h3>
                </div>
                <div class="header-actions">
                  <button 
                    class="like-toggle-btn"
                    :class="{ 'active': activity.ac3_likeEnabled }"
                    @click="toggleLikeEnabled"
                  >
                    <span class="btn-text">{{ activity.ac3_likeEnabled ? '关闭点赞' : '开放点赞' }}</span>
                  </button>
                  <button class="send-btn" @click="sendQuestionnaireToStudents">
                    发送问卷
                  </button>
                </div>
              </div>
              <div class="preview-content">
                <QuestionnairePreviewCard :editable="true" />
              </div>
            </div>
          </div>

          <!-- 右侧：学生设计的题目（粘性卡片） -->
          <div class="design-list-container">
            <div class="design-list-header">
              <h3 class="design-list-title">📝 学生设计的题目</h3>
              <span class="design-count">{{ studentDesignCount }}个</span>
            </div>
            <p class="design-hint">💡 点击题目卡片即可添加到问卷 · 按提交时间顺序展示</p>
            
            <div v-if="studentDesignCount > 0" class="design-items">
              <div 
                v-for="design in sortedDesignResults" 
                :key="design.groupNo"
                class="design-item-card"
                :class="{ 
                  'no-question': !design.designQuestion,
                  'selected': selectedDesignGroupNo === design.groupNo
                }"
                @click="design.designQuestion && handleDesignClick(design)"
              >
                <div class="design-item-header">
                  <span class="like-info">👍 {{ design.great || 0 }}</span>
                  <span v-if="design.designQuestion" class="question-type" :class="design.taskType">
                    {{ design.taskType === 'challenge' ? '2星' : design.taskType === 'basic' ? '1星' : '' }} · {{ getQuestionTypeText(design.designQuestion.type) }}
                  </span>
                  <span class="design-time">{{ formatTime(design.submittedAt) }}</span>
                </div>
                
                <div v-if="design.designQuestion" class="question-content">
                  <div class="question-title-row">
                    <span class="question-label">题目：</span>
                    <span class="question-title-text">{{ design.designQuestion.title }}</span>
                  </div>
                  
                  <div v-if="design.designQuestion.options && design.designQuestion.options.length > 0" class="question-options-list">
                    <div 
                      v-for="(option, idx) in design.designQuestion.options" 
                      :key="idx"
                      class="option-text-item"
                    >
                      {{ String.fromCharCode(65 + idx) }}. {{ option }}
                    </div>
                  </div>
                </div>
                
                <div v-else class="no-design">
                  <span>暂未设计题目</span>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-design">
              <div class="empty-icon">📭</div>
              <p>暂无学生设计的题目</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/store/socket'
import { useStatus } from '@/store/status'
import { ElMessage } from 'element-plus'
import { useActivity, questionnaireSecondData, type QuestionOption } from '@/store/activity'
import { EntityMode, EventType } from '@/types'
import QuestionnairePreviewCard from './QuestionnairePreviewCard.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// 问卷设计数据结构
interface DesignPayload {
  type: 'activity2_design'
  from: { groupNo: string }
  data: {
  groupNo: string
    groupType: string
    purpose: string
    description: string
    selectedQuestion: number
    selectedQuestionText: string
    reason: string
    questionOptions: Array<{text: string, options: string}>
  }
  at: number
  key?: string
}

const designStore = reactive(new Map<string, DesignPayload>())

// Socket事件处理
function handleDesignSubmission(payload: any) {
  if (!payload || String(payload.type) !== 'activity2_design') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo) return
  
  const groupNo = String(from.groupNo)
  const key = groupNo
  
  const isFirstSubmission = !designStore.has(key)
  
  designStore.set(key, {
    type: 'activity2_design',
    from: { groupNo },
    data: {
      groupNo: data.groupNo || groupNo,
      groupType: data.groupType || '未知组别',
      purpose: data.purpose || '',
      description: data.description || '',
      selectedQuestion: data.selectedQuestion || 1,
      selectedQuestionText: data.selectedQuestionText || '',
      reason: data.reason || '',
      questionOptions: data.questionOptions || []
    },
    at: payload.at || Date.now()
  })
  
  if (isFirstSubmission) {
    // console.log(`[Activity3 Teacher] 收到问卷设计: 第${groupNo}组 (首次提交)`)
    // ElMessage.success(`第${groupNo}组提交了问卷设计`)
  } else {
    // console.log(`[Activity3 Teacher] 更新问卷设计: 第${groupNo}组 (覆盖之前的设计)`)
    // ElMessage.info(`第${groupNo}组更新了问卷设计`)
  }
}

onMounted(() => {
  // console.log('[Activity3 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  socket.on('submit', handleDesignSubmission)
  
  // 初始化问卷（如果还没有）
  if (!activity.questionnaire || activity.questionnaire.questions.length === 0) {
    activity.questionnaire = JSON.parse(JSON.stringify(questionnaireSecondData))
  }
})

onBeforeUnmount(() => {
  // console.log('[Activity3 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleDesignSubmission)
})

// ==================== 发送问卷给学生 ====================
function sendQuestionnaireToStudents() {
  try {
    // 1. 在发送前，将所有题目的可见性改为 'both'
    activity.questionnaire.questions.forEach((question: any) => {
      question.visibility = 'both'
    })
    
    // 2. 发送问卷给所有学生
    socket.dispatch({
      mode: EntityMode.STUDENT,
      messageType: 'sync_questionnaire',
      activityIndex: '3',
      data: {
        questionnaire: activity.questionnaire
      },
      from: null,
      to: {}, // 发送给所有学生
      eventType: EventType.DISPATCH
    })
    
    // ElMessage.success('问卷已发送，正在切换到活动4')
    
    // 3. 自动跳转到活动4
    setTimeout(() => {
      // 更新活动状态
      status.activityStatus.now = 4
      status.activityStatus.all.forEach(a => {
        a.isActive = (a.id === 4)
      })
      
      // 路由跳转
      router.push('/teacher/activity4')
      
      // 广播给学生切换活动
      socket.dispatch({
        mode: status.mode,
        eventType: EventType.DISPATCH,
        messageType: 'change_activity',
        activityIndex: '-1',
        data: { activityStatus: status.activityStatus },
        from: null,
        to: {}
      })
    }, 500)
  } catch (error: any) {
    console.error('[Activity3 Teacher] 发送问卷失败:', error)
    // ElMessage.error(`发送失败: ${error.message}`)
  }
}

// ==================== 学生设计题目相关 ====================
// 当前选中的设计
const selectedDesignGroupNo = ref<string | null>(null)

// 学生设计题目数量
const studentDesignCount = computed(() => {
  return sortedDesignResults.value.length
})

// 排序后的设计结果（按提交时间排序，已在提交时去重）
const sortedDesignResults = computed(() => {
  const allDesigns: any[] = []
  
  // 收集所有有效的设计
  Object.entries(activity.ac3_allResult).forEach(([groupNo, result]: [string, any]) => {
    if (result?.designQuestion && result.submittedAt > 0) {
      // 根据rating或challengeLevel判断任务类型
      let taskType = ''
      
      // 优先使用challengeLevel判断
      if (result.challengeLevel) {
        if (result.challengeLevel === 'two') {
          taskType = 'challenge' // 2星难度
        } else if (result.challengeLevel === 'one') {
          taskType = 'basic' // 1星难度
        }
      } 
      // 如果没有challengeLevel，使用rating判断
      else if (result.rating) {
        const challengeItem = result.rating.find((r: any) => r.index === 1 && r.score === 2)
        const basicItem = result.rating.find((r: any) => r.index === 2 && r.score === 1)
        
        if (challengeItem) {
          taskType = 'challenge' // 挑战任务
        } else if (basicItem) {
          taskType = 'basic' // 基础任务
        }
      }
      
      allDesigns.push({
        groupNo,
        ...result,
        taskType
      })
    }
  })
  
  // 按提交时间排序（早提交的在前）
  allDesigns.sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0))
  
  return allDesigns
})

// 格式化时间
function formatTime(timestamp: number): string {
  if (!timestamp) return '未知'
  
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 获取题目类型文本
function getQuestionTypeText(type: 'fill' | 'single' | 'multiple'): string {
  const typeMap = {
    'fill': '填空题',
    'single': '单选题',
    'multiple': '多选题'
  }
  return typeMap[type] || '未知'
}

// 处理设计卡片点击
function handleDesignClick(design: any) {
  if (!design.designQuestion) return
  
  // 设置选中状态
  selectedDesignGroupNo.value = design.groupNo
  
  // 添加到问卷
  addQuestionToQuestionnaire(design.designQuestion)
}

// 添加题目到问卷
function addQuestionToQuestionnaire(question: any) {
  try {
    // 查找是否已存在 design 类型的题目
    const existingDesignIndex = activity.questionnaire.questions.findIndex(
      (q: any) => q.questionType === 'design'
    )
    
    if (existingDesignIndex !== -1) {
      // 如果存在，替换该题目（保持原有 ID）
      const existingId = activity.questionnaire.questions[existingDesignIndex].id
      const updatedQuestion: QuestionOption = {
        id: existingId,
        title: question.title,
        type: question.type,
        questionType: 'design',
        options: question.options ? [...question.options] : undefined,
        answer: question.answer || '',
        visibility: question.visibility || 'both'
      }
      
      activity.questionnaire.questions[existingDesignIndex] = updatedQuestion
      // ElMessage.success('已替换问卷中的学生设计题目')
    } else {
      // 如果不存在，添加到最后面
      const newQuestion: QuestionOption = {
        id: activity.questionnaire.questions.length + 1,
        title: question.title,
        type: question.type,
        questionType: 'design',
        options: question.options ? [...question.options] : undefined,
        answer: question.answer || '',
        visibility: question.visibility || 'both'
      }
      
      activity.questionnaire.questions.push(newQuestion)
      // ElMessage.success('已将学生设计的题目添加到问卷')
    }
  } catch (error: any) {
    console.error('[Activity3 Teacher] 添加题目失败:', error)
    // ElMessage.error(`添加失败: ${error.message}`)
  }
}

// 切换点赞开放状态
function toggleLikeEnabled() {
  activity.ac3_likeEnabled = !activity.ac3_likeEnabled
  
  // 广播给所有学生
  socket.dispatch({
    mode: EntityMode.STUDENT,
    eventType: EventType.DISPATCH,
    messageType: 'like_enabled_changed',
    activityIndex: '3',
    data: {
      likeEnabled: activity.ac3_likeEnabled
    },
    from: null,
    to: {}
  })
  
  ElMessage.success(activity.ac3_likeEnabled ? '已开放点赞' : '已关闭点赞')
}
</script>

<style scoped>
.page {
  padding: 0;
  width: 1240px;
  margin: 0 auto;
  background: #F5F5F0;
}

.stats-section {
  padding: 40px 0;
}

/* 活动标题 */
.activity-header {
  text-align: center;
  margin-bottom: 32px;
}

.activity-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 问卷预览模式 */
.preview-mode {
  width: 100%;
}

/* 预览模式网格布局 */
.preview-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;
}

.preview-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-container {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 3px solid #f3f4f6;
}

.preview-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.preview-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.edit-hint {
  font-size: 14px;
  color: #f59e0b;
  font-weight: 500;
  padding: 8px 12px;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  display: inline-block;
  align-self: flex-start;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
}

.send-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.preview-content {
  width: 100%;
}

/* 学生设计题目列表 - 粘性卡片 */
.design-list-container {
  position: sticky;
  top: 20px;
  height: 640px;  /* 固定高度，与学生端保持一致 */
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

/* 滚动条样式 */
.design-list-container::-webkit-scrollbar {
  width: 6px;
}

.design-list-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.design-list-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.design-list-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.design-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 3px solid #f3f4f6;
}

.design-list-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.design-count {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 12px;
}

.design-hint {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px 0;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.design-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.design-item-card {
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.design-item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  background: #f7faff;
}

.design-item-card.no-question {
  cursor: default;
  opacity: 0.6;
}

.design-item-card.no-question:hover {
  border-color: #e5e7eb;
  box-shadow: none;
  background: #fafafa;
}

.design-item-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.design-item-card.selected:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.design-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  justify-content: space-between;
}

.like-info {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  color: #92400e;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.question-type {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  flex-shrink: 0;
}

.question-type.challenge {
  background: #fef3c7;
  color: #92400e;
}

.question-type.basic {
  background: #dbeafe;
  color: #1e40af;
}

.design-time {
  font-size: 11px;
  color: #6b7280;
  flex-shrink: 0;
  margin-left: auto;
}

.question-content {
  margin-bottom: 12px;
}

.question-title-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.question-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.question-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
}


.question-options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.option-text-item {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.no-design {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.empty-design {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-design p {
  margin: 0;
  font-size: 14px;
  font-style: italic;
}

/* 点赞控制 */
.like-control {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #f3f4f6;
}

.like-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.like-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.like-toggle-btn.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.like-toggle-btn.active:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.like-toggle-btn .btn-icon {
  font-size: 16px;
}

.like-toggle-btn .btn-text {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1240px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 1024px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
  
  .design-list-container {
    position: relative;
    top: 0;
    height: auto;
    max-height: 600px;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .send-btn,
  .back-btn {
    width: 100%;
  }
}
</style>
