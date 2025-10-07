<template>
  <div class="main-content">
    <!-- 评价标准 -->
    <div class="evaluation-card">
      <h3>评价标准</h3>
      <div class="criteria-grid">
        <div 
          v-for="rating in activity.ac3_stuResult?.rating" 
          :key="rating.index" 
          class="criterion-item"
          :class="{ 'completed': rating.score === 1 }"
        >
          <span>{{ rating.criteria }}</span>
          <span v-if="rating.score === 1">⭐</span>
        </div>
      </div>
    </div>

    <!-- 问卷预览和答题 -->
    <div class="questionnaire-section">
      <div class="section-header">
        <h3>1. 填写问卷，思考题目设计是否合理。</h3>
        <div class="submit-area">
          <span v-if="!canSubmit && !hasSubmitted" class="submit-hint">
            请完成所有题目（{{ unansweredCount }}题未完成）
          </span>
          <el-button type="success" @click="submitQuestionnaire" :disabled="!canSubmit || hasSubmitted">
            {{ hasSubmitted ? '已提交' : '提交问卷' }}
          </el-button>
        </div>
      </div>
      <QuestionnairePreview :answerable="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useActivity } from '@/store/activity'
import { useSocket } from '@/store/socket'
import { useStatus } from '@/store/status'
import { EntityMode, EventType } from '@/types'
import QuestionnairePreview from '../components/QuestionnairePreviewCard.vue'

const activity = useActivity()
const socket = useSocket()
const status = useStatus()

// 判断是否已提交
const hasSubmitted = computed(() => {
  return activity.ac3_stuResult?.submittedAt && activity.ac3_stuResult.submittedAt > 0
})

// 判断题目是否已回答
const isQuestionAnswered = (q: any): boolean => {
  if (!q.answer) return false
  
  if (q.type === 'fill') {
    // 填空题：检查是否有内容
    return typeof q.answer === 'string' && q.answer.trim() !== ''
  } else if (q.type === 'multiple') {
    // 多选题：检查是否选择了至少一个选项
    if (Array.isArray(q.answer)) {
      return q.answer.length > 0
    } else if (typeof q.answer === 'string') {
      return q.answer.trim() !== ''
    }
    return false
  } else {
    // 单选题：检查是否有选择
    return typeof q.answer === 'string' && q.answer.trim() !== ''
  }
}

// 未回答的题目数量
const unansweredCount = computed(() => {
  return activity.questionnaire.questions.filter(q => !isQuestionAnswered(q)).length
})

// 判断是否可以提交
const canSubmit = computed(() => {
  // 检查所有题目是否都已回答
  return activity.questionnaire.questions.every(q => isQuestionAnswered(q))
})

// 提交问卷
const submitQuestionnaire = () => {
  if (!canSubmit.value || hasSubmitted.value) {
    return
  }

  ElMessageBox.confirm(
    '确定要提交问卷吗？提交后将无法修改。',
    '确认提交',
    {
      confirmButtonText: '确定提交',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      try {
        const user = status.userStatus
        socket.submit({
          mode: EntityMode.STUDENT_GROUP_ROLE,
          messageType: 'questionnaire_submit',
          activityIndex: '3',
          data: {
            questions: activity.questionnaire.questions,
            submittedAt: Date.now()
          },
          from: {
            id: String(user?.studentNo || ''),
            groupNo: String(user?.groupNo || ''),
            studentNo: String(user?.studentNo || ''),
            studentRole: String(user?.studentRole || '')
          },
          to: null,
          eventType: EventType.SUBMIT
        })
        
        // 自动评分：提交成功得1分
        if (activity.ac3_stuResult) {
          activity.ac3_stuResult.rating[0].score = 1
          activity.ac3_stuResult.submittedAt = Date.now()
          // 同步更新小组得分
          status.groupScores.activity3 = 1
        }
        
        ElMessage.success('问卷提交成功！恭喜你获得⭐')
      } catch (error: any) {
        console.error('[Activity3] 提交失败:', error)
        ElMessage.error(`提交失败: ${error.message}`)
      }
    })
    .catch(() => {
      // 用户取消
    })
}
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.questionnaire-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  /* 保持与 activity2 相同的宽度比例（2/3），并居中显示 */
  max-width: 66.67%;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.submit-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.submit-hint {
  font-size: 13px;
  color: #f59e0b;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .questionnaire-section {
    max-width: 100%;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-header h3 {
    width: 100%;
  }
}
</style>
