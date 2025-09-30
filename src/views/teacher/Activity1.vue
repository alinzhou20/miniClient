<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">🗳️ Activity 5: 快速投票活动</h2>
      <div class="activity-description">发起投票并实时查看学生选择情况</div>
    </div>

    <!-- 投票控制区域 -->
    <div class="control-section">
      <div class="control-panel">
        <div class="control-info">
          <div v-if="!voteStarted" class="start-hint">
            <el-icon class="hint-icon"><ChatDotRound /></el-icon>
            <span>点击下方按钮开始投票，学生可以随时拍照投票</span>
          </div>
          <div v-else class="vote-info">
            <div class="status-display">
              <el-icon class="status-icon"><CircleCheck /></el-icon>
              <span class="status-text">投票进行中...</span>
            </div>
          </div>
        </div>
        
        <div class="control-buttons">
          <el-button 
            v-if="!voteStarted"
            type="primary" 
            size="large"
            @click="startVote"
            class="start-vote-button"
          >
            <el-icon><VideoPlay /></el-icon>
            开始投票
          </el-button>
          
          <el-button 
            v-if="voteStarted"
            type="danger" 
            size="large"
            @click="endVote"
            class="end-vote-button"
          >
            <el-icon><VideoPause /></el-icon>
            结束投票
          </el-button>
          
          <el-button 
            v-if="!voteStarted && votes.size > 0"
            type="success" 
            size="large"
            @click="resetVote"
            class="reset-vote-button"
          >
            <el-icon><Refresh /></el-icon>
            重新投票
          </el-button>
        </div>
      </div>
    </div>

    <!-- 投票统计区域 -->
    <div class="stats-section">
      <div class="stats-header">
        <h3 class="stats-title">投票统计</h3>
        <div class="participation-info">
          <span class="participated">已投票: {{ votes.size }}组</span>
          <span class="separator">|</span>
          <span class="total">总计: 25组</span>
        </div>
      </div>

      <!-- 投票对战界面 -->
      <div class="battle-arena">
        <div class="option-section option-a">
          <div class="option-header">
            <div class="option-label">观点A：使用数字设备利大于弊</div>
            <div class="option-count">{{ optionACount }}组</div>
          </div>
          <div class="option-bar">
            <div 
              class="option-fill option-a-fill" 
              :style="{ width: optionAPercentage + '%' }"
            ></div>
          </div>
          <div class="option-percentage">{{ optionAPercentage }}%</div>
          
          <!-- 选择A的小组列表 -->
          <div class="group-list">
            <span 
              v-for="group in optionAGroups" 
              :key="group"
              class="group-tag option-a-tag"
            >
              第{{ group }}组
            </span>
          </div>
        </div>

        <div class="vs-divider">
          <div class="vs-text">VS</div>
        </div>

        <div class="option-section option-b">
          <div class="option-header">
            <div class="option-label">观点B：使用数字设备弊大于利</div>
            <div class="option-count">{{ optionBCount }}组</div>
          </div>
          <div class="option-bar">
            <div 
              class="option-fill option-b-fill" 
              :style="{ width: optionBPercentage + '%' }"
            ></div>
          </div>
          <div class="option-percentage">{{ optionBPercentage }}%</div>
          
          <!-- 选择B的小组列表 -->
          <div class="group-list">
            <span 
              v-for="group in optionBGroups" 
              :key="group"
              class="group-tag option-b-tag"
            >
              第{{ group }}组
            </span>
          </div>
        </div>
      </div>

      <!-- 未投票小组 -->
      <div v-if="unvotedGroups.length > 0" class="unvoted-section">
        <div class="unvoted-header">未投票小组 ({{ unvotedGroups.length }}组)</div>
        <div class="unvoted-list">
          <span 
            v-for="group in unvotedGroups" 
            :key="group"
            class="group-tag unvoted-tag"
          >
            第{{ group }}组
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useSocket } from '@/utils/socket'
import { ElMessage } from 'element-plus'
import { ChatDotRound, CircleCheck, VideoPlay, VideoPause, Refresh } from '@element-plus/icons-vue'

console.log('[Activity1 Teacher] 🟢 组件脚本开始执行')

// Store
const socket = useSocket()

// 投票状态
const voteStarted = ref(false)

// 投票数据：Map<groupNo, {choice: 'A'|'B', timestamp: number}>
const votes = reactive(new Map<string, {choice: 'A' | 'B', timestamp: number}>())

// 计算属性
const optionAGroups = computed(() => {
  const groups: string[] = []
  votes.forEach((vote, groupNo) => {
    if (vote.choice === 'A') {
      groups.push(groupNo)
    }
  })
  return groups.sort((a, b) => parseInt(a) - parseInt(b))
})

const optionBGroups = computed(() => {
  const groups: string[] = []
  votes.forEach((vote, groupNo) => {
    if (vote.choice === 'B') {
      groups.push(groupNo)
    }
  })
  return groups.sort((a, b) => parseInt(a) - parseInt(b))
})

const optionACount = computed(() => optionAGroups.value.length)
const optionBCount = computed(() => optionBGroups.value.length)

const totalVotes = computed(() => optionACount.value + optionBCount.value)

const optionAPercentage = computed(() => {
  if (totalVotes.value === 0) return 0
  return Math.round((optionACount.value / totalVotes.value) * 100)
})

const optionBPercentage = computed(() => {
  if (totalVotes.value === 0) return 0
  return Math.round((optionBCount.value / totalVotes.value) * 100)
})

const unvotedGroups = computed(() => {
  const allGroups = Array.from({length: 25}, (_, i) => String(i + 1))
  const votedGroups = new Set(Array.from(votes.keys()))
  return allGroups.filter(group => !votedGroups.has(group))
})

// 开始投票
const startVote = async () => {
  try {
    // 重置投票数据
    votes.clear()
    voteStarted.value = true
    
    // 发送投票开始消息给所有学生
    const payload = {
      type: 'start_vote',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: {},
      at: Date.now()
    }
    
    await socket.distribute(payload as any)
    
    ElMessage.success('投票已开始！学生可以随时拍照投票')
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity5 Teacher] 开始投票失败:', error)
    ElMessage.error('开始投票失败，请重试')
  }
}

// 结束投票
const endVote = () => {
  voteStarted.value = false
  
  ElMessage.warning(`投票结束！共收到${votes.size}组投票`)
  saveToLocalStorage()
}

// 重新投票
const resetVote = () => {
  votes.clear()
  voteStarted.value = false
  
  ElMessage.info('投票已重置，可以重新开始')
  saveToLocalStorage()
}

// 处理学生投票结果
const handleVoteSubmit = (payload: any) => {
  if (!payload || payload.type !== 'activity5_vote') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  const groupNo = String(from.groupNo ?? '').trim()
  const output0 = data.output0  // 获取原始的output0值
  
  if (!groupNo || output0 === undefined || output0 === null) return
  
  console.log(`[Activity5 Teacher] 收到第${groupNo}组的原始分析结果:`, output0)
  
  // 解析output0值并转换为A/B
  let choice: 'A' | 'B' = 'A' // 默认值
  
  const outputStr = String(output0).toUpperCase()
  if (outputStr.includes('A') || outputStr === 'A') {
    choice = 'A'
  } else if (outputStr.includes('B') || outputStr === 'B') {
    choice = 'B'
  } else {
    // 如果output0不包含明确的A或B，使用字符串特征判断
    choice = outputStr.charCodeAt(0) % 2 === 0 ? 'A' : 'B'
  }
  
  // 记录投票（同一小组以最新的为准）
  votes.set(groupNo, {
    choice: choice,
    timestamp: data.timestamp || Date.now()
  })
  
  console.log(`[Activity5 Teacher] 第${groupNo}组分析结果转换: "${output0}" -> 观点${choice}`)
  ElMessage.success(`第${groupNo}组投票: 观点${choice}`)
  
  saveToLocalStorage()
}

// 本地存储
const saveToLocalStorage = () => {
  try {
    const data = {
      votes: Array.from(votes.entries()),
      voteStarted: voteStarted.value,
      timestamp: Date.now()
    }
    localStorage.setItem('teacher_activity5_votes', JSON.stringify(data))
  } catch (error) {
    console.warn('保存Activity5数据失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('teacher_activity5_votes')
    if (stored) {
      const data = JSON.parse(stored)
      
      if (Array.isArray(data.votes)) {
        votes.clear()
        data.votes.forEach(([groupNo, vote]: [string, any]) => {
          votes.set(groupNo, vote)
        })
      }
      
      // 页面刷新时重置投票状态
      voteStarted.value = false
      
      console.log('Activity5 教师端数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity5数据失败:', error)
  }
}

// 组件生命周期
onMounted(() => {
  loadFromLocalStorage()
  socket.on('submit', handleVoteSubmit)
  console.log('[Activity5 Teacher] 开始监听学生投票')
})

onUnmounted(() => {
  socket.off('submit', handleVoteSubmit)
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

/* 控制区域 */
.control-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.control-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.control-info {
  text-align: center;
}

.start-hint {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 16px;
}

.hint-icon {
  font-size: 24px;
  color: #3b82f6;
}

.vote-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #059669;
  font-size: 18px;
  font-weight: 600;
}

.status-icon {
  font-size: 24px;
  color: #10b981;
}

.control-buttons {
  display: flex;
  gap: 16px;
}

.start-vote-button,
.end-vote-button,
.reset-vote-button {
  min-width: 160px;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.start-vote-button {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.start-vote-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
}

.end-vote-button {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
}

.reset-vote-button {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

/* 统计区域 */
.stats-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.participation-info {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
}

.participated {
  color: #059669;
  font-weight: 600;
}

.separator {
  color: #d1d5db;
}

.total {
  color: #6b7280;
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
  font-size: 20px;
  font-weight: 700;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
}

.option-a .option-label {
  background: #ef4444;
}

.option-b .option-label {
  background: #3b82f6;
}

.option-count {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.option-bar {
  height: 24px;
  background: #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.option-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.5s ease;
  position: relative;
  overflow: hidden;
}

.option-a-fill {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.option-b-fill {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.option-percentage {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #374151;
}

.vs-divider {
  display: flex;
  justify-content: center;
  align-items: center;
}

.vs-text {
  font-size: 32px;
  font-weight: 900;
  color: #6b7280;
  background: white;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 小组列表 */
.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.group-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-align: center;
}

.option-a-tag {
  background: #ef4444;
}

.option-b-tag {
  background: #3b82f6;
}

.unvoted-tag {
  background: #9ca3af;
}

/* 未投票区域 */
.unvoted-section {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.unvoted-header {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.unvoted-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  
  .vs-text {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .control-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .stats-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
