<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">🎯 现场投票</h2>
      <div class="activity-description">查看投票照片和分析结果</div>
    </div>

    <!-- 等待教师拍照 -->
    <div v-if="!hasReceivedPhoto" class="waiting-section">
      <div class="waiting-card">
        <el-icon class="waiting-icon"><Clock /></el-icon>
        <h3>等待教师拍摄照片</h3>
        <p class="waiting-desc">教师拍摄照片后，将自动显示在这里</p>
      </div>
    </div>

    <!-- 照片展示卡片 -->
    <div v-if="hasReceivedPhoto && !activity0.voteResult" class="photo-section">
      <div class="photo-card">
        <div class="photo-header">
          <h3 class="photo-title">📷 教师拍摄的照片</h3>
          <div class="analyzing-badge">等待分析结果...</div>
        </div>
        <div class="photo-display">
          <img :src="photoUrl" alt="投票照片" class="captured-photo" />
        </div>
      </div>
    </div>

    <!-- 投票结果展示 -->
    <div v-if="activity0.voteResult" class="result-section">
      <div class="result-card">
        <div class="result-header">
          <h3 class="result-title">📊 教师示例投票结果</h3>
          <div class="result-info">
            <span class="result-time">{{ formatTimestamp(activity0.voteResult.timestamp) }}</span>
          </div>
        </div>

        <!-- 投票结果显示 -->
        <div class="vote-result-display">
          <div class="result-badge-container">
            <div class="result-label">投票结果:</div>
            <div class="result-badge" :class="'result-' + activity0.voteResult.result.toLowerCase()">
              观点{{ activity0.voteResult.result }}：{{ getViewpointMeaning(activity0.voteResult.result) }}
            </div>
          </div>
        </div>

        <!-- 投票对战界面 -->
        <div class="battle-arena">
          <div class="option-section option-a">
            <div class="option-header">
              <div class="option-label">观点A：使用数字设备利大于弊</div>
              <div class="option-count">{{ activity0.voteResult.countA }}</div>
            </div>
            <div class="option-bar">
              <div 
                class="option-fill option-a-fill" 
                :style="{ width: optionAPercentage + '%' }"
              ></div>
            </div>
            <div class="option-percentage">{{ optionAPercentage }}%</div>
          </div>

          <div class="vs-divider">
            <div class="vs-text">VS</div>
          </div>

          <div class="option-section option-b">
            <div class="option-header">
              <div class="option-label">观点B：使用数字设备弊大于利</div>
              <div class="option-count">{{ activity0.voteResult.countB }}</div>
            </div>
            <div class="option-bar">
              <div 
                class="option-fill option-b-fill" 
                :style="{ width: optionBPercentage + '%' }"
              ></div>
            </div>
            <div class="option-percentage">{{ optionBPercentage }}%</div>
          </div>
        </div>

        <!-- 照片展示 -->
        <div class="photo-display" style="margin-top: 24px;">
          <img :src="photoUrl" alt="投票照片" class="captured-photo" style="max-width: 100%; border-radius: 12px;" />
        </div>

        <!-- 详细信息 -->
        <div class="detail-info" style="margin-top: 24px;">
          <div class="detail-item">
            <span class="detail-label">总计数：</span>
            <span class="detail-value">{{ totalCount }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">分析时间：</span>
            <span class="detail-value">{{ formatTimestamp(activity0.voteResult.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSocket } from '@/utils/socket'
import { useActivity0 } from '@/store/activity'
import { ElMessage } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'

const socket = useSocket()
const activity0 = useActivity0()

// 接收状态
const hasReceivedPhoto = ref(false)
const photoUrl = ref<string>('')

// 计算属性
const totalCount = computed(() => {
  if (!activity0.voteResult) return 0
  return activity0.voteResult.countA + activity0.voteResult.countB
})

const optionAPercentage = computed(() => {
  if (!activity0.voteResult || totalCount.value === 0) return 0
  return Math.round((activity0.voteResult.countA / totalCount.value) * 100)
})

const optionBPercentage = computed(() => {
  if (!activity0.voteResult || totalCount.value === 0) return 0
  return Math.round((activity0.voteResult.countB / totalCount.value) * 100)
})

// 获取观点含义
const getViewpointMeaning = (choice: 'A' | 'B' | null): string => {
  if (choice === 'A') return '使用数字设备利大于弊'
  if (choice === 'B') return '使用数字设备弊大于利'
  return ''
}

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 处理教师端的消息
const handleDispatch = (payload: any) => {
  if (!payload) return
  
  const messageType = payload.messageType
  const data = payload.data || {}
  
  // 处理照片广播
  if (messageType === 'vote_photo') {
    console.log('[Activity0 Student] 收到教师拍摄的照片')
    photoUrl.value = data.photo || ''
    hasReceivedPhoto.value = true
    ElMessage.success('收到教师拍摄的照片')
  }
  
  // 处理投票结果
  if (messageType === 'vote_result') {
    console.log('[Activity0 Student] 收到投票结果:', data)
    activity0.voteResult = {
      result: data.result || 'A',
      countA: data.countA || 0,
      countB: data.countB || 0,
      timestamp: data.timestamp || Date.now()
    }
    ElMessage.success(`收到投票结果：观点${data.result}`)
  }
}


// 组件生命周期
onMounted(() => {
  console.log('[Activity0 Student] 组件已挂载，开始监听消息')
  socket.on('dispatch', handleDispatch)
})

onUnmounted(() => {
  console.log('[Activity0 Student] 组件卸载，清理监听器')
  socket.off('dispatch', handleDispatch)
})
</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 活动标题 */
.activity-header {
  margin-bottom: 24px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.activity-description {
  color: #6b7280;
  font-size: 16px;
}

/* 照片区域 */
.photo-section {
  margin-bottom: 24px;
}

.photo-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.photo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.photo-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.analyzing-badge {
  color: #3b82f6;
  font-weight: 600;
  background: #dbeafe;
  padding: 6px 16px;
  border-radius: 12px;
  animation: pulse 2s ease-in-out infinite;
}

.photo-display {
  text-align: center;
}

.captured-photo {
  max-width: 100%;
  max-height: 500px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 等待区域 */
.waiting-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.waiting-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
}

.waiting-icon {
  font-size: 64px;
  color: #3b82f6;
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.waiting-card h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.waiting-desc {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
  line-height: 1.6;
}

/* 结果区域 */
.result-section {
  margin-bottom: 24px;
}

.result-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.result-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.result-time {
  color: #6b7280;
}

/* 投票结果显示 */
.vote-result-display {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.result-badge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.result-label {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.result-badge {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.result-badge.result-a {
  background: #ef4444;
}

.result-badge.result-b {
  background: #3b82f6;
}

/* 投票对战界面 */
.battle-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.option-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-label {
  font-size: 16px;
  font-weight: 700;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
}

.option-a .option-label {
  background: #ef4444;
}

.option-b .option-label {
  background: #3b82f6;
}

.option-count {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.option-bar {
  height: 20px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.option-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.option-a-fill {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.option-b-fill {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.option-percentage {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #374151;
}

.vs-divider {
  display: flex;
  justify-content: center;
  align-items: center;
}

.vs-text {
  font-size: 24px;
  font-weight: 900;
  color: #6b7280;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 详细信息 */
.detail-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-label {
  font-weight: 600;
  color: #374151;
  min-width: 120px;
}

.detail-value {
  color: #6b7280;
  flex: 1;
  word-break: break-word;
}

.raw-result {
  font-family: monospace;
  font-size: 14px;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .battle-arena {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .vs-divider {
    order: 1;
  }
  
  .option-a {
    order: 0;
  }
  
  .option-b {
    order: 2;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .waiting-card {
    padding: 40px 20px;
  }
  
  .result-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .result-badge-container {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
