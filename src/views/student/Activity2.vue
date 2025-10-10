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
          <span v-if="rating.score > 0" class="score-indicator">
            <template v-if="rating.score === 1">⭐</template>
            <template v-else-if="rating.score === 2">⭐⭐</template>
            <template v-else-if="rating.score === 3">⭐⭐⭐</template>
          </span>
        </div>
      </div>
    </div>

    <!-- 左右分栏 -->
    <div v-if="!showDesignPanel" class="content-grid">
      <!-- 问卷预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>{{ showChallengeMode ? '2. 为"使用用途"设计调查问题。你可以挑战不同难度。' : '1. 为"使用时长"选择合适的调查问题，并说明你的理由。' }}</h3>
          <div class="header-actions">
            <!-- 活动2-1提交按钮 -->
            <el-button 
              v-if="!showChallengeMode"
              type="success"
              :disabled="!canSubmitActivity2_1"
              :loading="isSubmitting2_1"
              @click="submitActivity2_1"
            >
              提交选择
            </el-button>
            <!-- 活动2-2提交按钮 -->
            <el-button 
              v-if="showChallengeMode"
              type="success"
              :disabled="!canSubmitActivity2_2"
              :loading="isSubmitting2_2"
              @click="submitActivity2_2"
            >
              {{ activity2_2Submitted ? '已提交 ✓' : '提交设计' }}
            </el-button>
            <!-- 切换按钮 -->
            <el-button 
              :type="showChallengeMode ? 'primary' : 'danger'" 
              @click="toggleChallengeMode"
            >
              {{ showChallengeMode ? '活动2-1' : '活动2-2' }}
            </el-button>
          </div>
        </div>
        <QuestionnairePreview />
      </div>

      <!-- 设计区 -->
      <div class="design-panel">
        <!-- 题库模式 -->
        <template v-if="!showChallengeMode">
          <QuestionBankCard
            title="使用时长"
            description="以下是关于使用时长的调查问题，请选择一种合适的表述，并说明理由。（选中即可加入问卷）"
            :questions="QUESTION_BANK.durationQuestions"
            type="duration"
          />
          <QuestionBankCard
            title="设备类型"
            description="以下是关于设备类型的调查问题，请选择一种合适的表述，并说明理由。（选中即可加入问卷）"
            :questions="QUESTION_BANK.impactQuestions"
            type="impact"
          />
        </template>

        <!-- 挑战模式 -->
        <template v-else>
          <div class="challenge-card">
            <h3>选择难度</h3>            
            <!-- 按钮区域 -->
            <div class="challenge-buttons">
              <el-button
                v-for="item in challengeItems" 
                :key="item.level"
                :type="selectedChallenge === item.level ? 'primary' : 'default'"
                size="default"
                class="challenge-btn"
                :class="item.level"
                @click="selectChallenge(item.level)"
              >
                <div class="btn-content">
                  <span class="star-text">{{ item.stars }}</span>
                  <span class="btn-label">{{ item.name }}</span>
                </div>
              </el-button>
            </div>

            <!-- 描述区域 -->
            <div class="challenge-description">
              <div class="desc-title">具体要求</div>
              <div class="desc-content">{{ currentChallengeDesc }}</div>
            </div>
          </div>
          <div class="help-card">
          <ThreeStarChallenge v-if="selectedChallenge === 'three'" />
          <TwoStarChallenge v-if="selectedChallenge === 'two'" />
        </div>
        </template>
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
          我们小组能够说出"使用时长"和"使用影响"题目的选择理由。
        </div>
        <el-radio-group v-model="reasonConfirmed" class="confirm-options">
          <el-radio :value="true" size="large">是</el-radio>
          <el-radio :value="false" size="large">否</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="showReasonDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmSubmit"
          :disabled="reasonConfirmed === null"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 各小组设计展示面板 -->
    <DesignShow v-if="showDesignPanel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useActivity, bank } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { EventType } from '@/types'
import { ElMessage } from 'element-plus'
import QuestionBankCard from '../components/QuestionBankCard.vue'
import QuestionnairePreview from '../components/QuestionnairePreviewCard.vue'
import ThreeStarChallenge from '../components/DesignCard.vue'
import TwoStarChallenge from '../components/AITwoCard.vue'
import DesignShow from '../components/DesignShow.vue'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

const showChallengeMode = ref(false)
const selectedChallenge = ref<'one' | 'two' | 'three' | null>(null)

// 活动2-1提交状态
const isSubmitting2_1 = ref(false)

// 活动2-2提交状态
const isSubmitting2_2 = ref(false)
const activity2_2Submitted = ref(false)

// 展示面板状态
const showDesignPanel = ref(false)

// 题库常量（传递给子组件）
const QUESTION_BANK = bank

const challengeItems: Array<{ level: 'one' | 'two' | 'three', stars: string, name: string }> = [
  { level: 'three', stars: '⭐⭐', name: '挑战任务' },
  { level: 'two', stars: '⭐', name: '基础任务' },
]

const challengeDescriptions = {
  three: '将自己设计的题目填写在"使用用途题目设计模版"中，并拍照上传。',
  two: '借助小敏老师（AI智能体）对话，共同完成问题设计。',
  one: '从AI推荐的"使用用途"题目中任选其一。'
}

const currentChallengeDesc = computed(() => {
  return selectedChallenge.value ? challengeDescriptions[selectedChallenge.value] : ''
})

// 当前评分（根据模式切换）
const currentRating = computed(() => {
  if (showChallengeMode.value) {
    // 活动2-2：根据挑战级别和设计题目实时计算预览评分
    const result = activity.ac2_2_stuDesignResult
    if (!result) return []
    
    const rating = result.rating || []
    
    // 创建副本以避免直接修改store（仅用于预览）
    const previewRating = rating.map(r => ({ ...r }))
    
    // 重置所有分数
    previewRating.forEach(r => r.score = 0)
    
    // 如果选择了挑战级别并且有设计题目，显示对应的得分预览
    if (selectedChallenge.value && result.designQuestion) {
      if (selectedChallenge.value === 'three') {
        // 挑战题：index=1, score=2
        const item = previewRating.find(r => r.index === 1)
        if (item) item.score = 2
      } else if (selectedChallenge.value === 'two') {
        // 基础题：index=2, score=1
        const item = previewRating.find(r => r.index === 2)
        if (item) item.score = 1
      }
    }
    
    return previewRating
  } else {
    // 活动2-1：实时计算预览评分
    const result = activity.ac2_1_stuSelectResult
    if (!result) return []
    
    const rating = result.rating || []
    
    // 创建副本以避免直接修改store（仅用于预览）
    const previewRating = rating.map(r => ({ ...r }))
    
    // 预览：如果有时长题目，显示第一项得分（提交后才会真正确认）
    const hasDuration = result.selectedDurationQuestion !== null
    const durationItem = previewRating.find(r => r.index === 1)
    if (durationItem) {
      // 如果已经提交并确认，显示分数；否则预览为0
      durationItem.score = (hasDuration && result.durationReason) ? 1 : 0
    }
    
    // 预览：如果有影响题目，显示第二项得分（提交后才会真正确认）
    const hasImpact = result.selectedImpactQuestion !== null
    const impactItem = previewRating.find(r => r.index === 2)
    if (impactItem) {
      // 如果已经提交并确认，显示分数；否则预览为0
      impactItem.score = (hasImpact && result.impactReason) ? 1 : 0
    }
    
    return previewRating
  }
})

const toggleChallengeMode = () => {
  showChallengeMode.value = !showChallengeMode.value
  selectedChallenge.value = null
}

const selectChallenge = (level: 'one' | 'two' | 'three') => {
  selectedChallenge.value = level
  
  // 等待 DOM 更新后滚动到页面底部
  nextTick(() => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    })
  })
}

// 检查是否可以提交活动2-1
const canSubmitActivity2_1 = computed(() => {
  const result = activity.ac2_1_stuSelectResult
  if (!result) return false
  
  // 至少需要选择一个题目
  return result.selectedDurationQuestion !== null || result.selectedImpactQuestion !== null
})

// 检查是否可以提交活动2-2
const canSubmitActivity2_2 = computed(() => {
  const result = activity.ac2_2_stuDesignResult
  if (!result) return false
  
  // 需要有设计的题目
  return result.designQuestion !== null
})

// 理由确认对话框状态
const showReasonDialog = ref(false)
const reasonConfirmed = ref<boolean | null>(null)

// 提交活动2-1
const submitActivity2_1 = async () => {
  if (isSubmitting2_1.value) return
  
  const result = activity.ac2_1_stuSelectResult
  if (!result) {
    ElMessage.warning('没有可提交的数据')
    return
  }
  
  // 验证是否至少选择了一个题目
  if (!result.selectedDurationQuestion && !result.selectedImpactQuestion) {
    ElMessage.warning('请至少选择一个题目')
    return
  }
  
  // 显示理由确认对话框
  reasonConfirmed.value = null
  showReasonDialog.value = true
}

// 确认提交
const confirmSubmit = async () => {
  if (reasonConfirmed.value === null) {
    ElMessage.warning('请选择是否能够说出理由')
    return
  }
  
  showReasonDialog.value = false
  
  const result = activity.ac2_1_stuSelectResult
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
    // 保存理由状态
    result.durationReason = '已确认'
  }
  
  // 如果选择了影响题目，且确认能说出理由，第二项得分
  if (result.selectedImpactQuestion !== null && reasonConfirmed.value) {
    const ratingItem = rating.find(r => r.index === 2)
    if (ratingItem) {
      ratingItem.score = 1
      score++
    }
    // 保存理由状态
    result.impactReason = '已确认'
  }
  
  isSubmitting2_1.value = true
  
  try {
    // 更新提交时间
    result.submittedAt = Date.now()
    
    // 发送 socket 消息
    socket.submit({
      mode: status.mode,
      eventType: EventType.SUBMIT,
      messageType: 'activity2_1_submit',
      activityIndex: '2-1',
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
    
    // 同步更新小组得分
    status.groupScores.activity2_1 = score
    ElMessage.success(`提交成功！获得 ${score} 分`)
  } catch (error) {
    console.error('[Activity 2-1] 提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    isSubmitting2_1.value = false
  }
}

// 检查题目是否与已有题目重复（题目标题和所有选项都必须完全相同）
const isDuplicateQuestion = (newQuestion: any, existingQuestions: any[]) => {
  if (!newQuestion) return false
  
  for (const existing of existingQuestions) {
    // 1. 首先检查题目标题是否相同（忽略空格和标点）
    const newTitle = newQuestion.title?.trim().replace(/[。？！，、；：""''（）\s]/g, '')
    const existingTitle = existing.title?.trim().replace(/[。？！，、；：""''（）\s]/g, '')
    
    // 如果标题不同，直接跳过
    if (!newTitle || !existingTitle || newTitle !== existingTitle) {
      continue
    }
    
    // 2. 标题相同，继续检查选项
    const newOptions = newQuestion.options || []
    const existingOptions = existing.options || []
    
    // 如果选项数量不同，则不是重复
    if (newOptions.length !== existingOptions.length) {
      continue
    }
    
    // 3. 如果都没有选项（填空题），标题相同即为重复
    if (newOptions.length === 0 && existingOptions.length === 0) {
      return true
    }
    
    // 4. 如果有选项，检查所有选项是否完全一致
    const normalizedNewOptions = newOptions.map((o: string) => o.trim().replace(/\s/g, '')).sort()
    const normalizedExistingOptions = existingOptions.map((o: string) => o.trim().replace(/\s/g, '')).sort()
    
    const optionsMatch = normalizedNewOptions.every((opt: string, idx: number) => 
      opt === normalizedExistingOptions[idx]
    )
    
    // 5. 标题和选项都相同才算重复
    if (optionsMatch) {
      return true
    }
  }
  
  return false
}

// 提交活动2-2
const submitActivity2_2 = async () => {
  if (isSubmitting2_2.value || activity2_2Submitted.value) return
  
  const result = activity.ac2_2_stuDesignResult
  if (!result) {
    ElMessage.warning('没有可提交的数据')
    return
  }
  
  // 验证是否有设计的题目
  if (!result.designQuestion) {
    ElMessage.warning('请先设计一道题目')
    return
  }
  
  // 验证是否选择了挑战级别
  if (!selectedChallenge.value) {
    ElMessage.warning('请先选择挑战级别')
    return
  }
  
  // 检查是否与已提交的题目重复
  const existingQuestions = Object.values(activity.ac2_2_allDesignResult)
    .filter(r => r?.designQuestion)
    .map(r => r.designQuestion)
  
  const isDuplicate = isDuplicateQuestion(result.designQuestion, existingQuestions)
  
  // 根据选择的挑战级别设置评分
  const rating = result.rating || []
  
  // 先重置所有分数
  rating.forEach(r => r.score = 0)
  
  // 根据挑战级别设置对应的分数
  let score = 0
  if (selectedChallenge.value === 'three') {
    // 挑战题：index=1, score=2
    const ratingItem = rating.find(r => r.index === 1)
    if (ratingItem) {
      ratingItem.score = 2
      score = 2
    }
  } else if (selectedChallenge.value === 'two') {
    // 基础题：index=2, score=1
    const ratingItem = rating.find(r => r.index === 2)
    if (ratingItem) {
      ratingItem.score = 1
      score = 1
    }
  }
  
  isSubmitting2_2.value = true
  
  try {
    // 更新提交时间
    result.submittedAt = Date.now()
    
    const groupNo = status.userStatus?.groupNo || ''
    
    // 1. 发送给教师（无论是否重复都要发送）
    socket.submit({
      mode: status.mode,
      eventType: EventType.SUBMIT,
      messageType: 'activity2_2_submit',
      activityIndex: '2-2',
      data: {
        designQuestion: result.designQuestion,
        rating: result.rating,
        great: result.great,
        submittedAt: result.submittedAt,
        challengeLevel: selectedChallenge.value // 添加挑战级别信息
      },
      from: {
        id: `${status.userStatus?.studentNo}_${groupNo}`,
        groupNo: groupNo,
        studentNo: status.userStatus?.studentNo,
        studentRole: status.userStatus?.studentRole
      },
      to: null
    })
    
    // 2. 只有不重复的题目才广播给所有学生并加入 ac2_2_allDesignResult
    if (!isDuplicate) {
      // 广播给所有学生
      socket.discuss({
        mode: status.mode,
        eventType: EventType.DISCUSS,
        messageType: 'activity2_2_discuss',
        activityIndex: '2-2',
        data: {
          groupNo: groupNo,
          designQuestion: result.designQuestion,
          rating: result.rating,
          great: result.great,
          submittedAt: result.submittedAt,
          challengeLevel: selectedChallenge.value // 添加挑战级别信息
        },
        from: {
          id: `${status.userStatus?.studentNo}_${groupNo}`,
          groupNo: groupNo,
          studentNo: status.userStatus?.studentNo,
          studentRole: status.userStatus?.studentRole
        },
        to: {} // 发送给所有学生
      })
      
      // 更新本地的 ac2_2_allDesignResult
      if (groupNo) {
        activity.ac2_2_allDesignResult[groupNo] = {
          designQuestion: result.designQuestion,
          rating: result.rating,
          great: result.great,
          submittedAt: result.submittedAt,
          challengeLevel: selectedChallenge.value // 添加挑战级别信息
        }
      }
    }
    
    activity2_2Submitted.value = true
    // 同步更新小组得分
    status.groupScores.activity2_2 = score
    
    // 根据是否重复显示不同的提示信息
    if (isDuplicate) {
      ElMessage.success(`提交成功！获得 ${score} 分（题目与其他小组重复，不在展示区显示）`)
    } else {
      ElMessage.success(`提交成功！获得 ${score} 分`)
    }
    
    // 提交成功后显示展示面板并自动滚动到展示区域
    showDesignPanel.value = true
    
    // 等待 DOM 更新后滚动到展示面板
    await nextTick()
    setTimeout(() => {
      const designShowEl = document.querySelector('.design-show-container')
      if (designShowEl) {
        designShowEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  } catch (error) {
    console.error('[Activity 2-2] 提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    isSubmitting2_2.value = false
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

.score-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  font-size: 16px;
  animation: starAppear 0.5s ease;
}

@keyframes starAppear {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.preview-panel, .design-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 15px;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.challenge-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.challenge-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0ea5e9;
  margin: 0 0 8px 0;
}

.challenge-card p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 15px 0;
}

.challenge-buttons {
  display: flex;
  justify-content: left;
  gap: 12px;
  margin-bottom: 15px;
}

.challenge-btn .btn-content {
  display: flex;
  align-items: center;
}

.challenge-btn .star-text {
  font-size: 12px;
}

.challenge-btn .btn-label {
  font-size: 14px;
  font-weight: 800;
}

.challenge-btn.three-star {
  background: #fef3c7 !important;
  border-color: #fbbf24 !important;
  color: #78350f !important;
}

.challenge-btn.three-star:hover,
.challenge-btn.three-star.is-plain:hover {
  background: #fde68a !important;
  border-color: #d97706 !important;
}

.challenge-btn.two-star {
  background: #dbeafe !important;
  border-color: #60a5fa !important;
  color: #1e3a8a !important;
}

.challenge-btn.two-star:hover,
.challenge-btn.two-star.is-plain:hover {
  background: #bfdbfe !important;
  border-color: #2563eb !important;
}

.challenge-description {
  padding: 15px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.desc-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.desc-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  height: calc(14px * 1.6 * 2);
  min-height: calc(14px * 1.6 * 2);
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .challenge-buttons {
    flex-direction: column;
  }
}

.challenge-card h3 {
font-size: 18px;
  font-weight: 800;
  color: #0ea5e9;
  margin-bottom: 10px;
  line-height: 1.4;
}

.help-card {
  position: sticky;
  top: 20px;
  height: 560px;
  z-index: 100;
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
</style>
