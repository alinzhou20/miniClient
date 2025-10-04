<template>
  <div class="watch-container">
    <!-- 图例 -->
    <div class="legend-card">
      <div class="legend-title">活动得分</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color" style="background: #3b82f6;"></span>
          <span class="legend-text">活动一</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #a78bfa;"></span>
          <span class="legend-text">活动二</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #7c3aed;"></span>
          <span class="legend-text">活动二</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #10b981;"></span>
          <span class="legend-text">活动三</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f59e0b;"></span>
          <span class="legend-text">活动四</span>
        </div>
      </div>
    </div>

    <!-- 柱状图区域 -->
    <div class="chart-card">
      <div class="chart-container">
        <div 
          v-for="group in groupsList" 
          :key="group.groupNo"
          class="bar-group"
          :class="{ 'offline': !group.isOnline }"
        >
          <!-- 柱状图 -->
          <div class="bar-wrapper">
            <!-- 总分标签（放在柱子上方） -->
            <div v-if="group.totalScore > 0" class="total-score">{{ group.totalScore }}</div>
            
            <div class="bar-stack" :style="{ height: getBarHeight(group.totalScore) }">
              <!-- 活动1（最上面） -->
              <div 
                v-if="group.scores.activity1 > 0"
                class="bar-segment activity1"
                :style="{ height: getSegmentHeight(group.scores.activity1, group.totalScore) }"
                :title="`活动一: ${group.scores.activity1}分`"
              >
                <span class="segment-label">{{ group.scores.activity1 }}</span>
              </div>
              <!-- 活动2.1 -->
              <div 
                v-if="group.scores.activity2_1 > 0"
                class="bar-segment activity2_1"
                :style="{ height: getSegmentHeight(group.scores.activity2_1, group.totalScore) }"
                :title="`活动二-选择: ${group.scores.activity2_1}分`"
              >
                <span class="segment-label">{{ group.scores.activity2_1 }}</span>
              </div>
              <!-- 活动2.2 -->
              <div 
                v-if="group.scores.activity2_2 > 0"
                class="bar-segment activity2_2"
                :style="{ height: getSegmentHeight(group.scores.activity2_2, group.totalScore) }"
                :title="`活动二-设计: ${group.scores.activity2_2}分`"
              >
                <span class="segment-label">{{ group.scores.activity2_2 }}</span>
              </div>
              <!-- 活动3 -->
              <div 
                v-if="group.scores.activity3 > 0"
                class="bar-segment activity3"
                :style="{ height: getSegmentHeight(group.scores.activity3, group.totalScore) }"
                :title="`活动三: ${group.scores.activity3}分`"
              >
                <span class="segment-label">{{ group.scores.activity3 }}</span>
              </div>
              <!-- 活动4（最下面） -->
              <div 
                v-if="group.scores.activity4 > 0"
                class="bar-segment activity4"
                :style="{ height: getSegmentHeight(group.scores.activity4, group.totalScore) }"
                :title="`活动四: ${group.scores.activity4}分`"
              >
                <span class="segment-label">{{ group.scores.activity4 }}</span>
              </div>
            </div>
          </div>
          
          <!-- 小组标签 -->
          <div class="group-label" :class="{ 'online': group.isOnline }">
            {{ group.groupNo }}组
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStatus } from '@/store/status'
import { ElMessage } from 'element-plus'

const status = useStatus()

// 刷新所有小组的总分
function refreshScores() {
  // console.log('[Watch] 手动刷新，重新计算所有小组总分')
  let updatedCount = 0
  
  Object.values(status.groupStatus).forEach(group => {
    const calculatedTotal = 
      group.scores.activity1 + 
      group.scores.activity2_1 + 
      group.scores.activity2_2 + 
      group.scores.activity3 + 
      group.scores.activity4
    
    if (group.totalScore !== calculatedTotal) {
      // console.log(`[Watch] 修正${group.groupNo}组总分: ${group.totalScore} -> ${calculatedTotal}`, group.scores)
      group.totalScore = calculatedTotal
      updatedCount++
    }
  })
  
  if (updatedCount > 0) {
    ElMessage.success(`已更新 ${updatedCount} 个小组的总分`)
  } else {
    ElMessage.info('所有数据已是最新')
  }
}

// 初始化：重新计算所有小组的总分（修复持久化数据问题）
onMounted(() => {
  refreshScores()
})

// 小组列表（使用新的 groupStatus，并实时计算总分）
const groupsList = computed(() => {
  return Object.values(status.groupStatus).map(group => {
    // 实时计算总分，确保数据准确
    const calculatedTotal = 
      group.scores.activity1 + 
      group.scores.activity2_1 + 
      group.scores.activity2_2 + 
      group.scores.activity3 + 
      group.scores.activity4
    
    return {
      ...group,
      totalScore: calculatedTotal
    }
  }).sort((a, b) => 
    parseInt(a.groupNo) - parseInt(b.groupNo)
  )
})

// 最高得分
const maxScore = computed(() => {
  return Math.max(...groupsList.value.map(g => g.totalScore), 0)
})

// 计算柱状图高度（基于最大分数）
function getBarHeight(score: number): string {
  if (score === 0) return '0px'
  const maxHeight = 300 // 最大高度（像素）
  const minHeight = 80  // 最小高度，确保可见
  
  // 如果没有最高分或最高分太低，使用固定高度
  if (maxScore.value === 0 || maxScore.value < 2) {
    // 按实际分数等比例显示
    return `${Math.max(score * 40, minHeight)}px`
  }
  
  // 计算高度，但保证最小可见高度
  const calculatedHeight = (score / maxScore.value) * maxHeight
  return `${Math.max(calculatedHeight, minHeight)}px`
}

// 计算分段高度（百分比）
function getSegmentHeight(segmentScore: number, totalScore: number): string {
  if (totalScore === 0 || segmentScore === 0) return '0%'
  const percentage = (segmentScore / totalScore) * 100
  // 确保每个分段至少有一定的最小高度显示
  return `${Math.max(percentage, 15)}%`
}
</script>

<style scoped>
.watch-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 标题卡片 */
.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px 32px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.main-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
}

.stats-row {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

/* 图例卡片 */
.legend-card {
  display: flex;
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.legend-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-right: 36px;
}

.legend-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  font-size: 14px;
  color: #6b7280;
}

/* 柱状图卡片 */
.chart-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 12px;
  padding: 40px 20px;
  min-height: 450px;
  background: linear-gradient(to top, #f9fafb 0%, #ffffff 100%);
  border-radius: 8px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 80px;
}

.bar-group.offline {
  opacity: 0.4;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.bar-stack {
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  background: #f3f4f6;
  border-radius: 8px 8px 4px 4px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-height: 60px;
  border: 2px solid #e5e7eb;
}

.bar-stack:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.bar-segment {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  min-height: 30px;
  padding: 4px 0;
}

.bar-segment:hover {
  filter: brightness(1.1);
}

.bar-segment.activity1 {
  background: #3b82f6;
}

.bar-segment.activity2_1 {
  background: #a78bfa;
}

.bar-segment.activity2_2 {
  background: #7c3aed;
}

.bar-segment.activity3 {
  background: #10b981;
}

.bar-segment.activity4 {
  background: #f59e0b;
}

.segment-label {
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

.total-score {
  font-size: 16px;
  font-weight: 700;
  color: #dc2626;
  background: #fee2e2;
  padding: 4px 12px;
  border-radius: 12px;
  border: 2px solid #fca5a5;
}

.group-label {
  font-size: 14px;
  font-weight: 600;
  color: #9ca3af;
  padding: 6px 12px;
  border-radius: 12px;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.group-label.online {
  color: #047857;
  background: #d1fae5;
  border-color: #10b981;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
}

/* 详细表格卡片 */
.detail-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.table-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 分数控制 */
.score-control {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.score-value {
  font-size: 18px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .chart-container {
    gap: 8px;
  }
  
  .bar-group {
    max-width: 60px;
  }
}

@media (max-width: 768px) {
  .stats-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 12px;
  }
  
  .chart-container {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .bar-group {
    max-width: 70px;
  }
}
</style>
