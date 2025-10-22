<template>
  <div class="evaluation-card">
    <h3>评价标准</h3>
    <div class="criteria-grid">
      <div 
        v-for="(rating, key) in currentRatings" 
        :key="key" 
        class="criterion-item"
        :class="{ 'completed': rating.score > 0 }"
      >
        <span class="criterion-text">{{ rating.criteria }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStatus } from '@/store/status'

const status = useStatus()

// 根据 current 自动获取当前活动的评价标准
const currentRatings = computed(() => {
  if (!status.current || !status.activity) {
    return {}
  }
  
  const currentActivity = status.activity[status.current]
  return currentActivity?.rating || {}
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
