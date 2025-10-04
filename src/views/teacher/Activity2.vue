<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📊 问卷设计，精研问题</h2>
      </div>

      <!-- 题库统计区域 - 单列布局 -->
      <div class="question-bank-section">
        <!-- 使用时长题库 -->
        <div class="bank-container">
          <div class="bank-header">
            <span class="bank-icon">⏱️</span>
            <span class="bank-title">使用时长</span>
          </div>
          <div class="question-list">
            <div 
              v-for="question in durationQuestions" 
              :key="question.id"
              class="question-card"
            >
              <!-- 左侧：题目信息 -->
              <div class="question-info">
                <div class="question-header">
                  <span class="question-number">题目{{ question.id }}</span>
                  <span class="question-count">{{ getQuestionCount('duration', question.id) }}组</span>
                </div>
                <div class="question-text">{{ question.title }}</div>
                <div v-if="question.options" class="question-options">
                  <div v-for="(opt, idx) in question.options" :key="idx" class="option-item">
                    {{ opt }}
                  </div>
                </div>
              </div>
              
              <!-- 右侧：选择的小组 -->
              <div class="groups-section">
                <div class="groups-label">选择此题的小组</div>
                <div v-if="getGroupsByQuestion('duration', question.id).length > 0" class="groups-grid">
                  <div 
                    v-for="group in getGroupsByQuestion('duration', question.id)" 
                    :key="group" 
                    class="group-badge"
                  >
                    {{ group }}
                  </div>
                </div>
                <div v-else class="no-groups">暂无小组选择</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用影响题库 -->
        <div class="bank-container">
          <div class="bank-header">
            <span class="bank-icon">💡</span>
            <span class="bank-title">使用影响</span>
          </div>
          <div class="question-list">
            <div 
              v-for="question in impactQuestions" 
              :key="question.id"
              class="question-card"
            >
              <!-- 左侧：题目信息 -->
              <div class="question-info">
                <div class="question-header">
                  <span class="question-number">题目{{ question.id }}</span>
                  <span class="question-count">{{ getQuestionCount('impact', question.id) }}组</span>
                </div>
                <div class="question-text">{{ question.title }}</div>
                <div v-if="question.options" class="question-options">
                  <div v-for="(opt, idx) in question.options" :key="idx" class="option-item">
                    {{ opt }}
                  </div>
                </div>
              </div>
              
              <!-- 右侧：选择的小组 -->
              <div class="groups-section">
                <div class="groups-label">选择此题的小组</div>
                <div v-if="getGroupsByQuestion('impact', question.id).length > 0" class="groups-grid">
                  <div 
                    v-for="group in getGroupsByQuestion('impact', question.id)" 
                    :key="group" 
                    class="group-badge"
                  >
                    {{ group }}
                  </div>
                </div>
                <div v-else class="no-groups">暂无小组选择</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSocket } from '@/store/socket'
import { ElMessage } from 'element-plus'
import { bank } from '@/store/activity'

const socket = useSocket()

// 问卷设计数据结构
interface DesignPayload {
  type: 'activity2_design'
  from: { groupNo: string }
  data: {
  groupNo: string
    groupType: string
    purpose: string
    description: string
    selectedQuestion: number
    selectedQuestionText: string
    reason: string
    questionOptions: Array<{text: string, options: string}>
  }
  at: number
  key?: string
}

const designStore = reactive(new Map<string, DesignPayload>())

// 题库数据
const durationQuestions = bank.durationQuestions
const impactQuestions = bank.impactQuestions

// 问卷数据
const designItems = computed(() => {
  return Array.from(designStore.values())
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .map(p => ({ ...p, key: p.from.groupNo }))
})

// 获取选择某题目的小组数量
function getQuestionCount(type: 'duration' | 'impact', questionId: number): number {
  return designItems.value.filter(item => {
    const selectedQ = item.data.selectedQuestion
    if (type === 'duration') {
      // 使用时长题目 ID 范围：1-4
      return selectedQ === questionId && questionId >= 1 && questionId <= 4
    } else {
      // 使用影响题目 ID 范围：1-4
      return selectedQ === questionId && questionId >= 1 && questionId <= 4
    }
  }).length
}

// 获取选择某题目的小组列表
function getGroupsByQuestion(type: 'duration' | 'impact', questionId: number): string[] {
  const groups = designItems.value
    .filter(item => {
      const selectedQ = item.data.selectedQuestion
      if (type === 'duration') {
        return selectedQ === questionId && questionId >= 1 && questionId <= 4
      } else {
        return selectedQ === questionId && questionId >= 1 && questionId <= 4
      }
    })
    .map(item => item.from.groupNo)
    .sort((a, b) => parseInt(a) - parseInt(b))
  
  return groups
}

// Socket事件处理
function handleDesignSubmission(payload: any) {
  if (!payload || String(payload.type) !== 'activity2_design') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo) return
  
  const groupNo = String(from.groupNo)
  const key = groupNo
  
  const isFirstSubmission = !designStore.has(key)
  
  designStore.set(key, {
    type: 'activity2_design',
    from: { groupNo },
    data: {
      groupNo: data.groupNo || groupNo,
      groupType: data.groupType || '未知组别',
      purpose: data.purpose || '',
      description: data.description || '',
      selectedQuestion: data.selectedQuestion || 1,
      selectedQuestionText: data.selectedQuestionText || '',
      reason: data.reason || '',
      questionOptions: data.questionOptions || []
    },
    at: payload.at || Date.now()
  })
  
  if (isFirstSubmission) {
    // console.log(`[Activity2 Teacher] 收到问卷设计: 第${groupNo}组 (首次提交)`)
    ElMessage.success(`第${groupNo}组提交了问卷设计`)
  } else {
    // console.log(`[Activity2 Teacher] 更新问卷设计: 第${groupNo}组 (覆盖之前的设计)`)
    ElMessage.info(`第${groupNo}组更新了问卷设计`)
  }
}

onMounted(() => {
  // console.log('[Activity2 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  socket.on('submit', handleDesignSubmission)
})

onBeforeUnmount(() => {
  // console.log('[Activity2 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleDesignSubmission)
})
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

/* 题库统计区域 - 单列布局 */
.question-bank-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* 题库容器 */
.bank-container {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 题库头部 */
.bank-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 3px solid #f3f4f6;
}

.bank-icon {
  font-size: 28px;
}

.bank-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

/* 题目列表 */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 题目卡片 - 横向布局 */
.question-card {
  display: flex;
  align-items: stretch;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  gap: 24px;
  transition: all 0.3s ease;
}

.question-card:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 左侧：题目信息 */
.question-info {
  flex: 0 0 540px;
  min-width: 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 4px 12px;
  border-radius: 8px;
}

.question-count {
  font-size: 18px;
  font-weight: 900;
  color: #10b981;
  background: #d1fae5;
  padding: 4px 12px;
  border-radius: 8px;
}

.question-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
  line-height: 1.5;
}

/* 题目选项 - 横向排布 */
.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.option-item:hover {
  background: #e5e7eb;
}

.option-item::before {
  content: '';
  width: 8px;
  height: 8px;
  border: 2px solid #9ca3af;
  border-radius: 50%;
  flex-shrink: 0;
  background: white;
}

/* 右侧：小组区域 */
.groups-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-left: 2px solid #e5e7eb;
  padding-left: 24px;
  min-width: 0;
}

.groups-label {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.groups-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 32px;
  padding: 0 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #93c5fd;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1e40af;
  transition: all 0.2s ease;
  cursor: pointer;
}

.group-badge:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #1d4ed8;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.no-groups {
  text-align: center;
  padding: 20px 12px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1240px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 1024px) {
  .question-card {
    flex-direction: column;
    gap: 16px;
  }
  
  .question-info {
    flex: 1 1 auto;
  }
  
  .groups-section {
    flex: 1 1 auto;
    border-left: none;
    border-top: 2px solid #e5e7eb;
    padding-left: 0;
    padding-top: 16px;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }
  
  .bank-title {
    font-size: 18px;
  }
  
  .bank-container {
    padding: 20px;
  }
  
  .question-card {
    padding: 16px;
  }
}
</style>
