<template>
  <div class="main-content">
    <!-- 评价标准 -->
    <div class="evaluation-card">
      <h3>评价标准</h3>
      <div class="criteria-grid">
        <div 
          v-for="rating in currentRating" 
          :key="rating.index" 
          class="criterion-item"
          :class="{ 'completed': rating.score > 0 }"
        >
          <span>{{ rating.criteria }}</span>
        </div>
      </div>
    </div>

    <!-- 左右分栏 -->
    <div class="content-grid">
      <!-- 左侧：题库选择 -->
      <div class="design-panel">
        <QuestionBankCard />
      </div>

      <!-- 右侧：问卷预览 -->
      <div class="preview-panel">
        <QuestionnairePreview @submit="submitActivity" :is-submitting="isSubmitting" />
      </div>
    </div>

    <!-- 理由确认对话框 -->
    <el-dialog 
      v-model="showReasonDialog" 
      title="提交确认"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="reason-confirm-content">
        <div class="confirm-text">
          我们小组能够说出"使用时长"和"设备类型"题目的选择理由。
        </div>
        <el-radio-group v-model="reasonConfirmed" class="confirm-options" @change="handleReasonChange">
          <el-radio :value="true" size="large">是</el-radio>
          <el-radio :value="false" size="large">否</el-radio>
        </el-radio-group>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActivity } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { EventType } from '@/types'
import { ElMessage } from 'element-plus'
import QuestionBankCard from './bank.vue'
import QuestionnairePreview from './preview.vue'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

// 提交状态
const isSubmitting = ref(false)
const showReasonDialog = ref(false)
const reasonConfirmed = ref<boolean | null>(null)

// 当前评分
const currentRating = computed(() => {
  const result = activity.ac2_stuResult
  if (!result) return []
  
  const rating = result.rating || []
  const previewRating = rating.map(r => ({ ...r }))
  
  // 预览评分
  const hasDuration = result.selectedDurationQuestion !== null
  const durationItem = previewRating.find(r => r.index === 1)
  if (durationItem) {
    durationItem.score = (hasDuration && result.durationReason) ? 1 : 0
  }
  
  const hasImpact = result.selectedImpactQuestion !== null
  const impactItem = previewRating.find(r => r.index === 2)
  if (impactItem) {
    impactItem.score = (hasImpact && result.impactReason) ? 1 : 0
  }
  
  return previewRating
})

// 提交活动
const submitActivity = async () => {
  if (isSubmitting.value) return
  
  const result = activity.ac2_stuResult
  if (!result) {
    ElMessage.warning('没有可提交的数据')
    return
  }
  
  if (!result.selectedDurationQuestion && !result.selectedImpactQuestion) {
    ElMessage.warning('请至少选择一个题目')
    return
  }
  
  // 显示理由确认对话框
  reasonConfirmed.value = null
  showReasonDialog.value = true
}

// 处理理由选择变化
const handleReasonChange = (value: boolean) => {
  if (value === true) {
    // 点击"是"，直接确认提交
    confirmSubmit()
  } else {
    // 点击"否"，取消对话框
    showReasonDialog.value = false
  }
}

// 确认提交
const confirmSubmit = async () => {
  if (reasonConfirmed.value === null) {
    ElMessage.warning('请选择是否能够说出理由')
    return
  }
  
  showReasonDialog.value = false
  
  const result = activity.ac2_stuResult
  if (!result) return
  
  // 计算评分
  let score = 0
  const rating = result.rating || []
  
  // 先重置所有分数
  rating.forEach(r => r.score = 0)
  
  // 如果选择了时长题目，且确认能说出理由，第一项得分
  if (result.selectedDurationQuestion !== null && reasonConfirmed.value) {
    const ratingItem = rating.find(r => r.index === 1)
    if (ratingItem) {
      ratingItem.score = 1
      score++
    }
    result.durationReason = '已确认'
  }
  
  // 如果选择了影响题目，且确认能说出理由，第二项得分
  if (result.selectedImpactQuestion !== null && reasonConfirmed.value) {
    const ratingItem = rating.find(r => r.index === 2)
    if (ratingItem) {
      ratingItem.score = 1
      score++
    }
    result.impactReason = '已确认'
  }
  
  isSubmitting.value = true
  
  try {
    result.submittedAt = Date.now()
    
    socket.submit({
      mode: status.mode,
      eventType: EventType.SUBMIT,
      messageType: 'activity2_1_submit',
      activityIndex: '2',
      data: {
        selectedDurationQuestion: result.selectedDurationQuestion,
        selectedImpactQuestion: result.selectedImpactQuestion,
        durationReason: result.durationReason,
        impactReason: result.impactReason,
        rating: result.rating,
        submittedAt: result.submittedAt
      },
      from: {
        id: `${status.userStatus?.studentNo}_${status.userStatus?.groupNo}`,
        groupNo: status.userStatus?.groupNo,
        studentNo: status.userStatus?.studentNo,
        studentRole: status.userStatus?.studentRole
      },
      to: null
    })
    
    status.groupScores.activity2 = score
    ElMessage.success(`提交成功！获得 ${score} 分`)
  } catch (error) {
    console.error('[Activity2] 提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.preview-panel, .design-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-panel {
  display: flex;
  flex-direction: column;
}

/* 理由确认对话框 */
.reason-confirm-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 20px 0;
}

.confirm-text {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  line-height: 1.6;
  padding: 16px;
  border-radius: 8px;
}

.confirm-options {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.confirm-options :deep(.el-radio) {
  font-size: 18px;
  font-weight: 600;
}

.confirm-options :deep(.el-radio__input) {
  transform: scale(1.2);
}

.confirm-options :deep(.el-radio__label) {
  font-size: 18px;
  font-weight: 600;
  padding-left: 12px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* 全局飞行动画增强 */
:global(.flying-question) {
  animation: flyingShadow 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes flyingShadow {
  0% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background: #f9fafb;
  }
  50% {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    background: white;
  }
  100% {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    background: white;
  }
}
</style>
