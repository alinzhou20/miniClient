<template>
  <div class="watch-container">
    <!-- 图例 -->
    <div class="legend-card">
      <div class="legend-title">活动</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-color" style="background: #3b82f6;"></span>
          <span class="legend-text">活动一（1星）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #8b5cf6;"></span>
          <span class="legend-text">活动二（2星）</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #10b981;"></span>
          <span class="legend-text">活动三（2星）</span>
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
            <div 
              v-if="group.totalScore > 0" 
              class="total-score"
              :class="{ 'full-score': group.totalScore === 6 }"
            >
              {{ group.totalScore }}
            </div>
            
            <div class="bar-stack" :style="{ height: getBarHeight(group.totalScore) }">
              <!-- 活动1（最上面） -->
              <div 
                v-if="group.scores.activity1 > 0"
                class="bar-segment activity1"
                :style="{ height: getSegmentHeight(group.scores.activity1, group.totalScore) }"
                :title="`活动一: ${group.scores.activity1}/1分`"
              >
                <span class="segment-label">{{ group.scores.activity1 }}</span>
              </div>
              <!-- 活动2 -->
              <div 
                v-if="group.scores.activity2 > 0"
                class="bar-segment activity2"
                :style="{ height: getSegmentHeight(group.scores.activity2, group.totalScore) }"
                :title="`活动二: ${group.scores.activity2}/2分`"
              >
                <span class="segment-label">{{ group.scores.activity2 }}</span>
              </div>
              <!-- 活动3 -->
              <div 
                v-if="group.scores.activity3 > 0"
                class="bar-segment activity3"
                :style="{ height: getSegmentHeight(group.scores.activity3, group.totalScore) }"
                :title="`活动三: ${group.scores.activity3}/2分`"
              >
                <span class="segment-label">{{ group.scores.activity3 }}</span>
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
import { computed } from 'vue'
import { useStatus } from '@/store/status'

const status = useStatus()

// 小组列表（实时计算总分并排序）
const groupsList = computed(() => {
  return Object.values(status.groupStatus)
    .map(group => ({
      ...group,
      totalScore: group.scores.activity1 + group.scores.activity2 + group.scores.activity3
    }))
    .sort((a, b) => parseInt(a.groupNo) - parseInt(b.groupNo))
})

// 计算柱状图高度
function getBarHeight(score: number): string {
  if (score === 0) return '0px'
  return `${Math.max((score / 6) * 360, 60)}px`
}

// 计算分段高度
function getSegmentHeight(segmentScore: number, totalScore: number): string {
  if (totalScore === 0 || segmentScore === 0) return '0%'
  return `${(segmentScore / totalScore) * 100}%`
}
</script>

<style scoped>
.watch-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 图例卡片 */
.legend-card {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-right: 24px;
}

.legend-items {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-text {
  font-size: 13px;
  color: #6b7280;
}

/* 柱状图卡片 */
.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 12px;
  padding: 40px 20px;
  min-height: 450px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s;
  min-height: 60px;
}

.bar-stack:hover {
  transform: translateY(-2px);
}

.bar-segment {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
}

.bar-segment.activity1 {
  background: #3b82f6;
}

.bar-segment.activity2 {
  background: #8b5cf6;
}

.bar-segment.activity3 {
  background: #10b981;
}

.segment-label {
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.total-score {
  font-size: 14px;
  font-weight: 700;
  color: #dc2626;
  background: #fee2e2;
  padding: 3px 10px;
  border-radius: 8px;
}

.total-score.full-score {
  color: #047857;
  background: #d1fae5;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #9ca3af;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f3f4f6;
}

.group-label.online {
  color: #047857;
  background: #d1fae5;
}

@media (max-width: 1024px) {
  .bar-group {
    max-width: 60px;
  }
}

@media (max-width: 768px) {
  .legend-items {
    gap: 12px;
  }
  
  .chart-container {
    flex-wrap: wrap;
  }
  
  .bar-group {
    max-width: 70px;
  }
}
</style>
