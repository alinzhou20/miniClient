<template>
  <div class="design-show-container">
    <div class="show-header">
      <h2>题目展示</h2>
    </div>
    
    <div v-if="groups.length > 0" class="groups-grid">
      <div 
        v-for="group in groups" 
        :key="group.id"
        class="group-card has-design"
        :class="{ 
          'is-current': group.groupNo === currentGroupNo
        }"
      >
        <div class="group-content">
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
          <div class="like-section" v-if="activity.ac2_2_likeEnabled">
            <button 
              class="like-btn"
              :class="{ 
                'already-liked': hasLiked(group.groupNo),
                'limit-reached': !hasLiked(group.groupNo) && likedGroups.size >= 2
              }"
              :disabled="hasLiked(group.groupNo) || likedGroups.size >= 2"
              @click="handleLike(group.groupNo)"
            >
              <span class="like-icon">👍</span>
              <span class="like-count">{{ group.great }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-designs">
      <span class="empty-icon">📝</span>
      <span class="empty-text">还没有小组提交设计...</span>
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

// 记录当前组已经点赞过的题目（按groupNo记录）
const likedGroups = ref<Set<string>>(new Set())

// 按时间顺序生成设计列表（已在提交时去重）
const groups = computed(() => {
  const allDesigns: any[] = []
  
  // 收集所有有效的设计
  Object.entries(activity.ac2_2_allDesignResult).forEach(([groupId, designResult]: [string, any]) => {
    if (designResult?.designQuestion && designResult.submittedAt > 0) {
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
        const challengeItem = designResult.rating.find((r: any) => r.index === 1 && r.score === 2)
        const basicItem = designResult.rating.find((r: any) => r.index === 2 && r.score === 1)
        
        if (challengeItem) {
          taskType = 'challenge' // 挑战任务
        } else if (basicItem) {
          taskType = 'basic' // 基础任务
        }
      }
      
      // 计算得分
      let score = 0
      if (designResult?.rating) {
        designResult.rating.forEach((r: any) => {
          if (r.score > 0) score = r.score
        })
      }
      
      allDesigns.push({
        id: groupId,
        groupNo: groupId,
        hasDesign: true,
        question: designResult.designQuestion,
        great: designResult.great || 0,
        submittedAt: designResult.submittedAt,
        rating: designResult.rating || [],
        taskType: taskType,
        score: score
      })
    }
  })
  
  // 按提交时间排序（早提交的在前）
  allDesigns.sort((a, b) => a.submittedAt - b.submittedAt)
  
  // 添加显示顺序
  return allDesigns.map((design, index) => ({
    ...design,
    displayOrder: index + 1
  }))
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

// 检查是否已经给某个题目点赞
const hasLiked = (groupId: string) => {
  return likedGroups.value.has(groupId)
}

// 点赞功能
const handleLike = (groupId: string) => {
  // 检查教师是否开放了点赞
  if (!activity.ac2_2_likeEnabled) {
    ElMessage.warning('教师还未开放点赞')
    return
  }
  
  // 检查是否已经点赞过这道题
  if (hasLiked(groupId)) {
    ElMessage.warning('已经给这道题点过赞了')
    return
  }
  
  // 检查点赞数量是否已达上限
  if (likedGroups.value.size >= 2) {
    ElMessage.warning('最多只能点赞2个题目')
    return
  }
  
  const designResult = activity.ac2_2_allDesignResult[groupId]
  if (!designResult) {
    ElMessage.warning('该小组暂未提交设计')
    return
  }
  
  // 记录已点赞
  likedGroups.value.add(groupId)
  
  // 增加点赞数
  designResult.great = (designResult.great || 0) + 1
  
  // 记录点赞的小组
  if (!designResult.likedByGroups) {
    designResult.likedByGroups = []
  }
  if (currentGroupNo.value && !designResult.likedByGroups.includes(currentGroupNo.value)) {
    designResult.likedByGroups.push(currentGroupNo.value)
  }
  
  // 1. 发送给教师
  socket.submit({
    mode: status.mode,
    eventType: EventType.SUBMIT,
    messageType: 'activity2_2_like_submit',
    activityIndex: '2-2',
    data: {
      targetGroupNo: groupId,
      fromGroupNo: currentGroupNo.value,
      great: designResult.great,
      likedByGroups: designResult.likedByGroups
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
      targetGroupNo: groupId,
      fromGroupNo: currentGroupNo.value,
      great: designResult.great,
      likedByGroups: designResult.likedByGroups
    },
    from: {
      id: `${status.userStatus?.studentNo}_${status.userStatus?.groupNo}`,
      groupNo: status.userStatus?.groupNo,
      studentNo: status.userStatus?.studentNo,
      studentRole: status.userStatus?.studentRole
    },
    to: {}
  })
  
  ElMessage.success(`已为第${groupId}组点赞！`)
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

.like-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fbbf24;
  border-radius: 20px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.like-tip {
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
}

.like-remaining {
  font-size: 16px;
  font-weight: 700;
  color: #f59e0b;
  padding: 2px 10px;
  background: white;
  border-radius: 12px;
  min-width: 60px;
  text-align: center;
}

.show-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0 0;
}

/* 无设计状态 */
.no-designs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

/* 投票信息 */
.vote-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #6ee7b7;
  border-radius: 20px;
  margin: 0 auto;
  width: fit-content;
}

.vote-info.locked {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid #cbd5e1;
}

.vote-status {
  font-size: 15px;
  font-weight: 600;
  color: #065f46;
}

.vote-info.locked .vote-status {
  color: #6b7280;
}

/* 网格布局：自适应列数 */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

/* 小组标签 */
.group-label {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: #6b7280;
  color: white;
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

.like-btn:disabled,
.like-btn.already-liked {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.like-btn.limit-reached {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
  cursor: not-allowed;
  opacity: 0.7;
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
