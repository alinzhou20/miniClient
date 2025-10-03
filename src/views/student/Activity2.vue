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
          :class="{ 'completed': rating.score === 1 }"
        >
          <span>{{ rating.criteria }}</span>
          <span v-if="rating.score === 1">⭐</span>
        </div>
      </div>
    </div>

    <!-- 左右分栏 -->
    <div class="content-grid">
      <!-- 问卷预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>{{ showChallengeMode ? '2. 为"使用用途"设计调查问题。你可以挑战不同难度。' : '1. 为"使用时长"和"使用影响"选择合适的调查问题，并说明你的理由。' }}</h3>
          <el-button 
            :type="showChallengeMode ? 'primary' : 'danger'" 
            @click="toggleChallengeMode"
          >
            {{ showChallengeMode ? '活动2-1' : '活动2-2' }}
          </el-button>
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
import QuestionBankCard from '../components/QuestionBankCard.vue'
import QuestionnairePreview from '../components/QuestionnairePreviewCard.vue'
import ThreeStarChallenge from '../components/DesignCard.vue'
import TwoStarChallenge from '../components/AITwoCard.vue'
import OneStarChallenge from '../components/AIOneCard.vue'

const activity = useActivity()
const showChallengeMode = ref(false)
const selectedChallenge = ref<'one' | 'two' | 'three' | null>(null)

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
  return showChallengeMode.value 
    ? activity.ac2_2_stuDesignResult?.rating || []
    : activity.ac2_1_stuSelectResult?.rating || []
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
