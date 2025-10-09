<template>
  <div class="design-show-container">
    <div class="show-header">
      <h2>为各个小组投票</h2>
      <div class="vote-info">
        <span class="vote-remaining">剩余票数：</span>
        <span class="vote-count" :class="{ 'vote-warning': remainingVotes <= 2 }">
          {{ remainingVotes }} / {{ MAX_VOTES }}
        </span>
      </div>
    </div>
    
    <div class="groups-grid">
      <div 
        v-for="group in groups" 
        :key="group.id"
        class="group-card"
        :class="{ 
          'has-design': group.hasDesign,
          'is-current': group.id === currentGroupNo
        }"
      >
        <div class="group-header">
          <span class="group-number">{{ group.id }}组</span>
          <div class="header-right">
            <span v-if="group.taskType === 'challenge'" class="task-badge challenge">挑战任务</span>
            <span v-else-if="group.taskType === 'basic'" class="task-badge basic">基础任务</span>
            <span v-if="group.hasDesign" class="status-badge">已提交</span>
            <span v-else class="status-badge pending">未提交</span>
          </div>
        </div>
        
        <div v-if="group.hasDesign && group.question" class="group-content">
          <div class="question-type">{{ getQuestionTypeText(group.question.type) }}</div>
          <div class="question-title">{{ group.question.title }}</div>
          
          <div v-if="group.question.options && group.question.options.length > 0" class="question-options">
            <div 
              v-for="(opt, idx) in group.question.options" 
              :key="idx"
              class="option-item"
            >
              {{ String.fromCharCode(65 + idx) }}. {{ opt }}
            </div>
          </div>
          
          <!-- 点赞区域 -->
          <div class="like-section">
            <button 
              class="like-btn"
              :class="{ 'is-current-group': group.id === currentGroupNo }"
              :disabled="group.id === currentGroupNo"
              @click="handleLike(group.id)"
            >
              <span class="like-icon">👍</span>
              <span class="like-count">{{ group.great }}</span>
            </button>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <span class="empty-icon">📝</span>
          <span class="empty-text">等待设计中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStatus } from '@/store/status'
import { useActivity } from '@/store/activity'
import { useSocket } from '@/store/socket'
import { EventType } from '@/types'
import { ElMessage } from 'element-plus'

const status = useStatus()
const activity = useActivity()
const socket = useSocket()

// 当前小组编号
const currentGroupNo = computed(() => status.userStatus?.groupNo || '')

// 当前小组已投票数
const votedCount = ref(0)

// 最大投票数限制
const MAX_VOTES = 5

// 剩余可投票数
const remainingVotes = computed(() => MAX_VOTES - votedCount.value)

// 生成12个小组的数据 - 从 activity store 读取
const groups = computed(() => {
  const groupsList = []
  for (let i = 1; i <= 12; i++) {
    const groupId = `${i}`
    const designResult = activity.ac2_2_allDesignResult[groupId]
    
    // 根据rating或challengeLevel判断任务类型
    let taskType = ''
    
    // 优先使用challengeLevel判断
    if (designResult?.challengeLevel) {
      if (designResult.challengeLevel === 'three') {
        taskType = 'challenge' // 挑战任务
      } else if (designResult.challengeLevel === 'two') {
        taskType = 'basic' // 基础任务
      }
    } 
    // 如果没有challengeLevel，使用rating判断
    else if (designResult?.rating) {
      const challengeItem = designResult.rating.find(r => r.index === 1 && r.score === 2)
      const basicItem = designResult.rating.find(r => r.index === 2 && r.score === 1)
      
      if (challengeItem) {
        taskType = 'challenge' // 挑战任务
      } else if (basicItem) {
        taskType = 'basic' // 基础任务
      }
    }
    
    // 计算得分
    let score = 0
    if (designResult?.rating) {
      designResult.rating.forEach(r => {
        if (r.score > 0) score = r.score
      })
    }
    
    groupsList.push({
      id: groupId,
      hasDesign: !!designResult?.designQuestion,
      question: designResult?.designQuestion || null,
      great: designResult?.great || 0,
      submittedAt: designResult?.submittedAt || 0,
      rating: designResult?.rating || [],
      taskType: taskType,
      score: score
    })
  }
  return groupsList
})

// 获取题型文本
const getQuestionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'fill': '填空题',
    'single': '单选题',
    'multiple': '多选题'
  }
  return typeMap[type] || '未知题型'
}

// 点赞功能
const handleLike = (groupId: string) => {
  // 不能给自己点赞
  if (groupId === currentGroupNo.value) {
    ElMessage.warning('不能给自己的设计点赞哦~')
    return
  }
  
  // 检查是否已达到投票上限
  if (votedCount.value >= MAX_VOTES) {
    ElMessage.warning(`每个小组最多只能投 ${MAX_VOTES} 票哦~`)
    return
  }
  
  const designResult = activity.ac2_2_allDesignResult[groupId]
  if (!designResult) {
    ElMessage.warning('该小组暂未提交设计')
    return
  }
  
  // 增加投票计数
  votedCount.value++
  
  // 增加点赞数
  designResult.great = (designResult.great || 0) + 1
  
  // 1. 发送给教师
  socket.submit({
    mode: status.mode,
    eventType: EventType.SUBMIT,
    messageType: 'activity2_2_like_submit',
    activityIndex: '2-2',
    data: {
      groupNo: groupId,
      great: designResult.great
    },
    from: {
      id: `${status.userStatus?.studentNo}_${status.userStatus?.groupNo}`,
      groupNo: status.userStatus?.groupNo,
      studentNo: status.userStatus?.studentNo,
      studentRole: status.userStatus?.studentRole
    },
    to: null
  })
  
  // 2. 广播给所有学生
  socket.discuss({
    mode: status.mode,
    eventType: EventType.DISCUSS,
    messageType: 'activity2_2_like_discuss',
    activityIndex: '2-2',
    data: {
      groupNo: groupId,
      great: designResult.great
    },
    from: {
      id: `${status.userStatus?.studentNo}_${status.userStatus?.groupNo}`,
      groupNo: status.userStatus?.groupNo,
      studentNo: status.userStatus?.studentNo,
      studentRole: status.userStatus?.studentRole
    },
    to: {}
  })
  
  ElMessage.success(`已为第${groupId}组投票！剩余 ${remainingVotes.value} 票`)
}
</script>

<style scoped>
.design-show-container {
  width: 1240px;
  max-width: 100%;
  margin: 20px auto;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.show-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.show-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.show-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 投票信息 */
.vote-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #93c5fd;
  border-radius: 20px;
  margin: 0 auto;
  width: fit-content;
}

.vote-remaining {
  font-size: 15px;
  font-weight: 600;
  color: #1e40af;
}

.vote-count {
  font-size: 18px;
  font-weight: 800;
  color: #2563eb;
  padding: 2px 12px;
  background: white;
  border-radius: 12px;
  min-width: 60px;
  text-align: center;
}

.vote-count.vote-warning {
  color: #dc2626;
  background: #fee2e2;
  animation: votePulse 1s ease-in-out infinite;
}

@keyframes votePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* 网格布局：4列3行 */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* 小组卡片 */
.group-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.group-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.group-card.has-design {
  background: #f0f9ff;
  border-color: #bae6fd;
}

.group-card.is-current {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 小组头部 */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-number {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: #10b981;
  color: white;
}

.status-badge.pending {
  background: #94a3b8;
}

/* 任务类型徽章 */
.task-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  margin-right: 4px;
}

.task-badge.challenge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  color: #92400e;
}

.task-badge.basic {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #60a5fa;
  color: #1e40af;
}

/* 内容区 */
.group-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-type {
  font-size: 12px;
  font-weight: 600;
  color: #0ea5e9;
  padding: 4px 8px;
  background: #e0f2fe;
  border-radius: 4px;
  width: fit-content;
}

.question-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.option-item {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.3;
  padding-left: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 点赞区域 */
.like-section {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: center;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fbbf24;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
}

.like-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  border-color: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.like-btn:active:not(:disabled) {
  transform: translateY(0);
}

.like-btn.is-current-group {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.like-icon {
  font-size: 16px;
  line-height: 1;
}

.like-count {
  font-size: 14px;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.3;
}

.empty-text {
  font-size: 12px;
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 1280px) {
  .design-show-container {
    width: 100%;
  }
  
  .groups-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .groups-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>
