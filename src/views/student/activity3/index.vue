<template>
  <div class="main-content">
    <!-- 评价标准 - 提交后隐藏 -->
    <div v-if="!showDesignPanel" class="evaluation-card">
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

    <!-- 左右分栏 - 提交后隐藏 -->
    <div v-if="!showDesignPanel" class="content-grid">
      <!-- 左侧：设计区 -->
      <div class="design-panel">
        <DesignCard @challenge-selected="handleChallengeSelected" />
      </div>

      <!-- 右侧：问卷预览 -->
      <div class="preview-panel">
        <QuestionnairePreview 
          @submit="submitActivity" 
          :is-submitting="isSubmitting"
          :submitted="submitted"
        />
      </div>
    </div>

    <!-- 各小组设计展示面板 - 提交后显示 -->
    <DesignShow v-if="showDesignPanel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useActivity } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { EventType } from '@/types'
import { ElMessage } from 'element-plus'
import QuestionnairePreview from './preview.vue'
import DesignCard from './design.vue'
import DesignShow from './show.vue'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

const selectedChallenge = ref<'one' | 'two' | null>(null)
const isSubmitting = ref(false)
const submitted = ref(false)

// 根据点赞开放状态控制显示面板
const showDesignPanel = computed(() => activity.ac3_likeEnabled)

// 处理难度选择
const handleChallengeSelected = (level: 'one' | 'two' | null) => {
  selectedChallenge.value = level
}

// 当前评分
const currentRating = computed(() => {
  const result = activity.ac3_stuResult
  if (!result) return []
  
  const previewRating = (result.rating || []).map(r => ({ ...r, score: 0 }))
  
  if (selectedChallenge.value && result.designQuestion) {
    const item = previewRating.find(r => 
      r.index === (selectedChallenge.value === 'two' ? 1 : 2)
    )
    if (item) item.score = selectedChallenge.value === 'two' ? 2 : 1
  }
  
  return previewRating
})

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

// 提交活动
const submitActivity = async () => {
  if (isSubmitting.value || submitted.value) return
  
  const result = activity.ac3_stuResult
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
  const existingQuestions = Object.values(activity.ac3_allResult)
    .filter(r => r?.designQuestion)
    .map(r => r.designQuestion)
  const isDuplicate = isDuplicateQuestion(result.designQuestion, existingQuestions)
  
  // 设置评分
  const rating = result.rating || []
  rating.forEach(r => r.score = 0)
  
  const score = selectedChallenge.value === 'two' ? 2 : 1
  const ratingItem = rating.find(r => r.index === (selectedChallenge.value === 'two' ? 1 : 2))
  if (ratingItem) ratingItem.score = score
  
  isSubmitting.value = true
  
  try {
    result.submittedAt = Date.now()
    const groupNo = status.userStatus?.groupNo || ''
    
    const submitData = {
      designQuestion: result.designQuestion,
      rating: result.rating,
      great: result.great,
      submittedAt: result.submittedAt,
      challengeLevel: selectedChallenge.value
    }
    
    const fromInfo = {
      id: `${status.userStatus?.studentNo}_${groupNo}`,
      groupNo,
      studentNo: status.userStatus?.studentNo,
      studentRole: status.userStatus?.studentRole
    }
    
    // 发送给教师
    socket.submit({
      mode: status.mode,
      eventType: EventType.SUBMIT,
      messageType: 'activity2_2_submit',
      activityIndex: '2-2',
      data: submitData,
      from: fromInfo,
      to: null
    })
    
    // 只有不重复的题目才广播给所有学生
    if (!isDuplicate) {
      socket.discuss({
        mode: status.mode,
        eventType: EventType.DISCUSS,
        messageType: 'activity2_2_discuss',
        activityIndex: '2-2',
        data: { ...submitData, groupNo },
        from: fromInfo,
        to: {}
      })
      
      if (groupNo) activity.ac3_allResult[groupNo] = submitData
    }
    
    submitted.value = true
    status.groupScores.activity3 = score
    
    const message = isDuplicate 
      ? `提交成功！获得 ${score} 分（题目与其他小组重复，不在展示区显示）`
      : `提交成功！获得 ${score} 分`
    ElMessage.success(message)
  } catch (error) {
    console.error('[Activity 3] 提交失败:', error)
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
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* 全局飞行动画 */
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
