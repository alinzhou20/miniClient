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
          <!-- 左侧：学生设计的题目（粘性卡片） -->
          <DesignAnswerList @add-question="addQuestionToQuestionnaire" />

          <!-- 右侧：问卷编辑 -->
          <div class="preview-right">
            <div class="preview-container">
              <div class="preview-header">
                <div class="preview-header-left">
                  <h3 class="preview-title">问卷编辑</h3>
                </div>
                <div class="header-actions">
                  <button 
                    class="survey-object-btn"
                    :class="{ 'added': hasSurveyObjectQuestions }"
                    @click="addSurveyObjectQuestions"
                  >
                    <span class="btn-text">{{ hasSurveyObjectQuestions ? '已添加调查对象' : '添加调查对象' }}</span>
                  </button>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/store/socket'
import { useStatus } from '@/store/status'
import { ElMessage } from 'element-plus'
import { useActivity, questionnaireSecondData, type QuestionOption } from '@/store/activity'
import { EntityMode, EventType } from '@/types'
import QuestionnairePreviewCard from './preview.vue'
import DesignAnswerList from './answer.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// Note: Activity3的设计提交处理已移至 listener.vue 统一管理

// ==================== 调查对象题目 ====================
// 检查是否已添加调查对象题目
const hasSurveyObjectQuestions = computed(() => {
  return activity.questionnaire.questions.some(q => q.questionType === 'grade' || q.questionType === 'gender')
})

// 添加调查对象题目（年级、性别）
function addSurveyObjectQuestions() {
  // 如果已经添加过，不再重复添加
  if (hasSurveyObjectQuestions.value) {
    ElMessage.info('调查对象题目已存在')
    return
  }
  
  // 定义调查对象题目（插入到问卷最前面）
  const surveyObjectQuestions: QuestionOption[] = [
    {
      id: 1,
      title: '就读年级',
      options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
      type: 'single',
      questionType: 'grade',
      answer: '',
      visibility: 'teacher'
    },
    {
      id: 2,
      title: '你的性别',
      options: ['男', '女'],
      type: 'single',
      questionType: 'gender',
      answer: '',
      visibility: 'teacher'
    }
  ]
  
  // 将调查对象题目插入到问卷最前面
  activity.questionnaire.questions.unshift(...surveyObjectQuestions)
  
  // 重新分配所有题目的 ID（从1开始连续编号）
  activity.questionnaire.questions.forEach((q, idx) => {
    q.id = idx + 1
  })
  
  ElMessage.success('已添加调查对象题目（年级、性别）')
}

onMounted(() => {
  // 初始化问卷（如果还没有）
  if (!activity.questionnaire || activity.questionnaire.questions.length === 0) {
    activity.questionnaire = JSON.parse(JSON.stringify(questionnaireSecondData))
  }
  
  // 如果问卷为空，添加默认题目
  if (activity.questionnaire.questions.length === 0) {
    activity.questionnaire.questions = [
      // 题目1：使用时长（填空题）
      {
        id: 1,
        title: '你每周使用数字设备的大概时间是 _________。（单位：分钟）',
        type: 'fill',
        questionType: 'duration',
        answer: '',
        visibility: 'both',
        limit: -2  // 只能填入数字
      },
      // 题目2：设备类型（多选题）
      {
        id: 2,
        title: '你最常使用哪种数字设备？（多选题，最多选3个）',
        options: ['电话手表', '手机', '平板', '电视', '电脑', '其他___'],
        type: 'multiple',
        questionType: 'type',
        answer: '',
        visibility: 'both',
        limit: 3  // 最多选3个
      }
    ]
  }
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
// 添加题目到问卷（由 answer.vue 组件调用）
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
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  align-items: start;
}

.preview-right {
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

/* 调查对象按钮 */
.survey-object-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  white-space: nowrap;
}

.survey-object-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  background: linear-gradient(135deg, #4f46e5, #4338ca);
}

.survey-object-btn.added {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: default;
}

.survey-object-btn.added:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #9ca3af, #6b7280);
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
