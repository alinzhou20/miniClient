<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📊 问卷设计，精研问题</h2>
      </div>

      <!-- 问卷预览模式 -->
      <div v-if="showPreviewMode" class="preview-mode">
        <div class="preview-grid">
          <!-- 左侧：问卷编辑 -->
          <div class="preview-left">
            <div class="preview-container">
              <div class="preview-header">
                <div class="preview-header-left">
                  <h3 class="preview-title">问卷编辑 - 可修改学生选择的题目</h3>
                  <span class="edit-hint">💡 点击任意文本即可编辑，修改会实时保存</span>
                </div>
                <div class="header-actions">
                  <button class="send-btn" @click="sendQuestionnaireToStudents">
                    📤 发送问卷给学生
                  </button>
                  <button class="back-btn" @click="navigateToActivity2_2">
                    ← 返回题库统计
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
            <p class="design-hint">💡 点击题目卡片即可添加到问卷</p>
            
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
                  <span class="group-info">第{{ design.groupNo }}组 · 👍{{ design.great || 0 }}</span>
                  <span v-if="design.designQuestion" class="question-type" :class="design.taskType">
                    {{ design.taskType === 'challenge' ? '挑战' : design.taskType === 'basic' ? '基础' : '' }} · {{ getQuestionTypeText(design.designQuestion.type) }}
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

      <!-- 题库统计区域 - 单列布局 -->
      <div v-else class="question-bank-section">
        <!-- 使用时长题库 -->
        <div class="bank-container">
          <div class="bank-header">
            <div class="bank-header-left">
            <span class="bank-icon">⏱️</span>
            <span class="bank-title">使用时长</span>
            </div>
            <button class="activity-btn" @click="navigateToActivity2_2">
              活动2-2
            </button>
          </div>
          <div class="question-list">
            <div 
              v-for="question in durationQuestions" 
              :key="question.id"
              class="question-card"
            >
              <!-- 左侧：题目信息 -->
              <div class="question-info">
                <div class="question-header">
                  <span class="question-number">题目{{ question.id }}</span>
                  <span class="question-count">{{ getQuestionCount('duration', question.id) }}组</span>
                </div>
                <div class="question-text">{{ question.title }}</div>
                <div v-if="question.options" class="question-options">
                  <div v-for="(opt, idx) in question.options" :key="idx" class="option-item">
                    {{ opt }}
                  </div>
                </div>
              </div>
              
              <!-- 右侧：选择的小组 -->
              <div class="groups-section">
                <div v-if="getGroupsByQuestion('duration', question.id).length > 0" class="groups-grid">
                  <div 
                    v-for="group in getGroupsByQuestion('duration', question.id)" 
                    :key="group" 
                    class="group-badge"
                  >
                    第{{ group }}组
                  </div>
                </div>
                <div v-else class="no-groups">暂无小组选择</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用影响题库 -->
        <div class="bank-container">
          <div class="bank-header">
            <div class="bank-header-left">
              <span class="bank-icon">💡</span>
              <span class="bank-title">使用影响</span>
            </div>
          </div>
          <div class="question-list">
            <div 
              v-for="question in impactQuestions" 
              :key="question.id"
              class="question-card"
            >
              <!-- 左侧：题目信息 -->
              <div class="question-info">
                <div class="question-header">
                  <span class="question-number">题目{{ question.id }}</span>
                  <span class="question-count">{{ getQuestionCount('impact', question.id) }}组</span>
                </div>
                <div class="question-text">{{ question.title }}</div>
                <div v-if="question.options" class="question-options">
                  <div v-for="(opt, idx) in question.options" :key="idx" class="option-item">
                    {{ opt }}
                  </div>
                </div>
              </div>
              
              <!-- 右侧：选择的小组 -->
              <div class="groups-section">
                <div v-if="getGroupsByQuestion('impact', question.id).length > 0" class="groups-grid">
                  <div 
                    v-for="group in getGroupsByQuestion('impact', question.id)" 
                    :key="group" 
                    class="group-badge"
                  >
                    第{{ group }}组
                  </div>
                </div>
                <div v-else class="no-groups">暂无小组选择</div>
              </div>
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
// import { ElMessage } from 'element-plus'
// import { Plus } from '@element-plus/icons-vue'
import { bank, useActivity, questionnaireSecondData, type QuestionOption } from '@/store/activity'
import { EntityMode, EventType } from '@/types'
import QuestionnairePreviewCard from '../components/QuestionnairePreviewCard.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// 显示模式：false 显示题库统计，true 显示问卷预览
const showPreviewMode = ref(false)

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

// 题库数据
const durationQuestions = bank.durationQuestions
const impactQuestions = bank.impactQuestions

// 问卷数据（旧的，已废弃 - 仅保留 designStore 用于其他 socket 事件）
// const designItems = computed(() => {
//   return Array.from(designStore.values())
//     .sort((a, b) => (b.at || 0) - (a.at || 0))
//     .map(p => ({ ...p, key: p.from.groupNo }))
// })

// 活动2.1选择结果数据（新的，基于小组）
const selectResults = computed(() => {
  return Object.entries(activity.ac2_1_allSelectResult).map(([groupNo, result]) => ({
    groupNo,
    ...result
  }))
})

// 获取选择某题目的小组数量
function getQuestionCount(type: 'duration' | 'impact', questionId: number): number {
  return selectResults.value.filter(item => {
    if (type === 'duration') {
      // 使用时长题目 ID 范围：1-2
      return item.selectedDurationQuestion === questionId
    } else {
      // 使用影响题目 ID 范围：1-4
      return item.selectedImpactQuestion === questionId
    }
  }).length
}

// 获取选择某题目的小组列表
function getGroupsByQuestion(type: 'duration' | 'impact', questionId: number): string[] {
  const groups = selectResults.value
    .filter(item => {
      if (type === 'duration') {
        return item.selectedDurationQuestion === questionId
      } else {
        return item.selectedImpactQuestion === questionId
      }
    })
    .map(item => item.groupNo)
    .sort((a, b) => parseInt(a) - parseInt(b))
  
  return groups
}

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
    // console.log(`[Activity2 Teacher] 收到问卷设计: 第${groupNo}组 (首次提交)`)
    // ElMessage.success(`第${groupNo}组提交了问卷设计`)
  } else {
    // console.log(`[Activity2 Teacher] 更新问卷设计: 第${groupNo}组 (覆盖之前的设计)`)
    // ElMessage.info(`第${groupNo}组更新了问卷设计`)
  }
}

onMounted(() => {
  // console.log('[Activity2 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  socket.on('submit', handleDesignSubmission)
})

onBeforeUnmount(() => {
  // console.log('[Activity2 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleDesignSubmission)
})

// ==================== 活动2-2按钮处理 ====================
function navigateToActivity2_2() {
  // 切换显示模式
  const isEnteringPreviewMode = !showPreviewMode.value
  showPreviewMode.value = isEnteringPreviewMode
  
  // 如果进入预览模式（活动2-2），重置问卷为 questionnaireSecondData
  if (isEnteringPreviewMode) {
    // 深拷贝 questionnaireSecondData 以避免直接修改原始数据
    activity.questionnaire = JSON.parse(JSON.stringify(questionnaireSecondData))
    // ElMessage.success('已加载活动2-2问卷模板')
    // 发送问卷给所有学生
     socket.dispatch({
      mode: EntityMode.STUDENT,
      messageType: 'sync_questionnaire',
      activityIndex: '2',
      data: {
        questionnaire: activity.questionnaire
      },
      from: null,
      to: {}, // 发送给所有学生
      eventType: EventType.DISPATCH
    })   
  }

}

// ==================== 发送问卷给学生 ====================
function sendQuestionnaireToStudents() {
  try {
    // 1. 在发送前，将所有题目的可见性改为 'both'
    activity.questionnaire.questions.forEach(question => {
      question.visibility = 'both'
    })
    
    // 2. 发送问卷给所有学生
    socket.dispatch({
      mode: EntityMode.STUDENT,
      messageType: 'sync_questionnaire',
      activityIndex: '2',
      data: {
        questionnaire: activity.questionnaire
      },
      from: null,
      to: {}, // 发送给所有学生
      eventType: EventType.DISPATCH
    })
    
    // ElMessage.success('问卷已发送，正在切换到活动3')
    
    // 3. 自动跳转到活动3
    setTimeout(() => {
      // 更新活动状态
      status.activityStatus.now = 3
      status.activityStatus.all.forEach(a => {
        a.isActive = (a.id === 3)
      })
      
      // 路由跳转
      router.push('/teacher/activity3')
      
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
    console.error('[Activity2 Teacher] 发送问卷失败:', error)
    // ElMessage.error(`发送失败: ${error.message}`)
  }
}

// ==================== 学生设计题目相关 ====================
// 当前选中的设计
const selectedDesignGroupNo = ref<string | null>(null)

// 学生设计题目数量
const studentDesignCount = computed(() => {
  return Object.keys(activity.ac2_2_allDesignResult).length
})

// 排序后的设计结果（按点赞数降序，相同点赞数按提交时间升序）
const sortedDesignResults = computed(() => {
  return Object.entries(activity.ac2_2_allDesignResult)
    .map(([groupNo, result]) => {
      // 根据rating或challengeLevel判断任务类型
      let taskType = ''
      
      // 优先使用challengeLevel判断
      if (result.challengeLevel) {
        if (result.challengeLevel === 'three') {
          taskType = 'challenge' // 挑战任务
        } else if (result.challengeLevel === 'two') {
          taskType = 'basic' // 基础任务
        }
      } 
      // 如果没有challengeLevel，使用rating判断
      else if (result.rating) {
        const challengeItem = result.rating.find(r => r.index === 1 && r.score === 2)
        const basicItem = result.rating.find(r => r.index === 2 && r.score === 1)
        
        if (challengeItem) {
          taskType = 'challenge' // 挑战任务
        } else if (basicItem) {
          taskType = 'basic' // 基础任务
        }
      }
      
      return {
        groupNo,
        ...result,
        taskType
      }
    })
    .sort((a, b) => {
      // 先按点赞数降序
      const greatA = a.great || 0
      const greatB = b.great || 0
      
      if (greatB !== greatA) {
        return greatB - greatA
      }
      
      // 点赞数相同，按提交时间升序（早的排前面）
      return (a.submittedAt || 0) - (b.submittedAt || 0)
    })
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
function addQuestionToQuestionnaire(question: QuestionOption) {
  try {
    // 查找是否已存在 design 类型的题目
    const existingDesignIndex = activity.questionnaire.questions.findIndex(
      q => q.questionType === 'design'
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
    console.error('[Activity2 Teacher] 添加题目失败:', error)
    // ElMessage.error(`添加失败: ${error.message}`)
  }
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

/* 题库统计区域 - 单列布局 */
.question-bank-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 题库容器 */
.bank-container {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 题库头部 */
.bank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 3px solid #f3f4f6;
}

.bank-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bank-icon {
  font-size: 28px;
}

.bank-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.activity-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.activity-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

/* 题目列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 题目卡片 - 横向布局 */
.question-card {
  display: flex;
  align-items: stretch;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  gap: 24px;
  transition: all 0.3s ease;
}

.question-card:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 左侧：题目信息 */
.question-info {
  flex: 0 0 640px;
  min-width: 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-number {
  font-size: 14px;
  font-weight: 800;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 10px;
  border-radius: 8px;
}

.question-count {
  font-size: 14px;
  font-weight: 900;
  color: #10b981;
  background: #d1fae5;
  padding: 4px 12px;
  border-radius: 8px;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.5;
}

/* 题目选项 - 横向排布 */
.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #e5e7eb;
}

.option-item::before {
  content: '';
  width: 8px;
  height: 8px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  flex-shrink: 0;
  background: white;
}

/* 右侧：小组区域 */
.groups-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-left: 2px solid #e5e7eb;
  padding-left: 24px;
  min-width: 0;
}

.groups-label {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.groups-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #93c5fd;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  transition: all 0.2s ease;
  cursor: pointer;
}

.group-badge:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #1d4ed8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.no-groups {
  text-align: center;
  padding: 20px 12px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
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

.back-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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

.group-info {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  background: #e5e7eb;
  color: #374151;
  flex-shrink: 0;
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

/* 响应式设计 */
@media (max-width: 1240px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 1024px) {
  .question-card {
    flex-direction: column;
    gap: 16px;
  }
  
  .question-info {
    flex: 1 1 auto;
  }
  
  .groups-section {
    flex: 1 1 auto;
    border-left: none;
    border-top: 2px solid #e5e7eb;
    padding-left: 0;
    padding-top: 16px;
  }
  
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
  
  .bank-title {
    font-size: 18px;
  }
  
  .bank-container {
    padding: 20px;
  }
  
  .question-card {
    padding: 16px;
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
