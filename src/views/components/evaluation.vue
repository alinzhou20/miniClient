<template>
  <div class="evaluation-card">
    <h3>评价标准</h3>
    <div class="criteria-grid">
      <div 
        v-for="criterion in currentCriteria" 
        :key="criterion.id" 
        class="criterion-item"
        :class="{ 'completed': criterion.score > 0 }"
      >
        <span class="criterion-text">{{ criterion.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStuStatus, ACTIVITY_CONFIG } from '@/store/status'

const status = useStuStatus()

// 根据 current 自动获取当前活动的评价标准，并关联评分数据
const currentCriteria = computed(() => {
  if (!status.current) return []
  
  const currentActivity = ACTIVITY_CONFIG.find(act => act.name === status.current)
  if (!currentActivity) return []

  // 获取当前活动的评分数据
  const scoreMap = status[`${status.current}Score` as 'activity1Score' | 'activity2Score' | 'activity3Score']
  
  // 将评价标准与评分数据合并
  return currentActivity.criteria.map(criterion => ({
    ...criterion,
    score: scoreMap?.[criterion.id as keyof typeof scoreMap] || 0
  }))
})
</script>

<style scoped>
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

.criterion-item .criterion-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.criterion-item.completed .criterion-text {
  color: #374151;
  font-weight: 600;
}
</style>
