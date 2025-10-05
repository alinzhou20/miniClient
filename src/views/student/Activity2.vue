<template>
  <div class="main-content">
    <!-- 评价标准 -->
    <div class="evaluation-card">
      <div class="evaluation-header">
        <h3>评价标准</h3>
        <span class="live-preview-badge">实时预览</span>
      </div>
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
    <div class="content-grid">
      <!-- 问卷预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>{{ showChallengeMode ? '2. 为"使用用途"设计调查问题。你可以挑战不同难度。' : '1. 为"使用时长"和"使用影响"选择合适的调查问题，并说明你的理由。' }}</h3>
          <div class="header-actions">
            <!-- 活动2-1提交按钮 -->
            <el-button 
              v-if="!showChallengeMode"
              type="success"
              :disabled="!canSubmitActivity2_1"
              :loading="isSubmitting2_1"
              @click="submitActivity2_1"
            >
              {{ activity2_1Submitted ? '已提交 ✓' : '提交选择' }}
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
            title="使用时长题库"
            description="以下是关于使用时长的调查问题，请选择一种合适的表述，并说明理由。"
            :questions="QUESTION_BANK.durationQuestions"
            type="duration"
          />
          <QuestionBankCard
            title="使用影响题库"
            description="以下是关于使用影响的调查问题，请选择一种合适的表述，并说明理由。"
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
                size="small"
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
          <OneStarChallenge v-if="selectedChallenge === 'one'" />
        </div>
        </template>
      </div>
    </div>
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
import OneStarChallenge from '../components/AIOneCard.vue'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

const showChallengeMode = ref(false)
const selectedChallenge = ref<'one' | 'two' | 'three' | null>(null)

// 活动2-1提交状态
const isSubmitting2_1 = ref(false)
const activity2_1Submitted = ref(false)

// 活动2-2提交状态
const isSubmitting2_2 = ref(false)
const activity2_2Submitted = ref(false)

// 题库常量（传递给子组件）
const QUESTION_BANK = bank

const challengeItems: Array<{ level: 'one' | 'two' | 'three', stars: string, name: string }> = [
  { level: 'three', stars: '⭐⭐⭐', name: '三星挑战' },
  { level: 'two', stars: '⭐⭐', name: '二星挑战' },
  { level: 'one', stars: '⭐', name: '一星挑战' },
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
        // 三星挑战：index=1, score=3
        const item = previewRating.find(r => r.index === 1)
        if (item) item.score = 3
      } else if (selectedChallenge.value === 'two') {
        // 二星挑战：index=2, score=2
        const item = previewRating.find(r => r.index === 2)
        if (item) item.score = 2
      } else if (selectedChallenge.value === 'one') {
        // 一星挑战：index=3, score=1
        const item = previewRating.find(r => r.index === 3)
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
    
    // 预览：如果有时长题目和理由，显示第一项得分
    const hasDuration = result.selectedDurationQuestion !== null && 
                        result.durationReason && 
                        result.durationReason.trim()
    const durationItem = previewRating.find(r => r.index === 1)
    if (durationItem) {
      durationItem.score = hasDuration ? 1 : 0
    }
    
    // 预览：如果有影响题目和理由，显示第二项得分
    const hasImpact = result.selectedImpactQuestion !== null && 
                      result.impactReason && 
                      result.impactReason.trim()
    const impactItem = previewRating.find(r => r.index === 2)
    if (impactItem) {
      impactItem.score = hasImpact ? 1 : 0
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

// 提交活动2-1
const submitActivity2_1 = async () => {
  if (isSubmitting2_1.value || activity2_1Submitted.value) return
  
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
  
  // 计算评分
  let score = 0
  const rating = result.rating || []
  
  // 先重置所有分数
  rating.forEach(r => r.score = 0)
  
  // 如果选择了时长题目且有理由内容，第一项得分
  if (result.selectedDurationQuestion !== null && result.durationReason && result.durationReason.trim()) {
    const ratingItem = rating.find(r => r.index === 1)
    if (ratingItem) {
      ratingItem.score = 1
      score++
    }
  }
  
  // 如果选择了影响题目且有理由内容，第二项得分
  if (result.selectedImpactQuestion !== null && result.impactReason && result.impactReason.trim()) {
    const ratingItem = rating.find(r => r.index === 2)
    if (ratingItem) {
      ratingItem.score = 1
      score++
    }
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
    
    activity2_1Submitted.value = true
    ElMessage.success(`提交成功！获得 ${score} 分`)
  } catch (error) {
    console.error('[Activity 2-1] 提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    isSubmitting2_1.value = false
  }
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
  
  // 根据选择的挑战级别设置评分
  const rating = result.rating || []
  
  // 先重置所有分数
  rating.forEach(r => r.score = 0)
  
  // 根据挑战级别设置对应的分数
  let score = 0
  if (selectedChallenge.value === 'three') {
    // 三星挑战：index=1, score=3
    const ratingItem = rating.find(r => r.index === 1)
    if (ratingItem) {
      ratingItem.score = 3
      score = 3
    }
  } else if (selectedChallenge.value === 'two') {
    // 二星挑战：index=2, score=2
    const ratingItem = rating.find(r => r.index === 2)
    if (ratingItem) {
      ratingItem.score = 2
      score = 2
    }
  } else if (selectedChallenge.value === 'one') {
    // 一星挑战：index=3, score=1
    const ratingItem = rating.find(r => r.index === 3)
    if (ratingItem) {
      ratingItem.score = 1
      score = 1
    }
  }
  
  isSubmitting2_2.value = true
  
  try {
    // 更新提交时间
    result.submittedAt = Date.now()
    
    // 发送 socket 消息
    socket.submit({
      mode: status.mode,
      eventType: EventType.SUBMIT,
      messageType: 'activity2_2_submit',
      activityIndex: '2-2',
      data: {
        designQuestion: result.designQuestion,
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
    
    activity2_2Submitted.value = true
    ElMessage.success(`提交成功！获得 ${score} 分`)
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
}

.evaluation-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.evaluation-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.live-preview-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
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
  justify-content: space-between;
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

.challenge-btn.one-star {
  background: #d1fae5 !important;
  border-color: #34d399 !important;
  color: #064e3b !important;
}

.challenge-btn.one-star:hover,
.challenge-btn.one-star.is-plain:hover {
  background: #a7f3d0 !important;
  border-color: #059669 !important;
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
</style>
