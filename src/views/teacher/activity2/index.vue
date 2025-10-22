<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📊 问卷设计，精研问题</h2>
      </div>

      <!-- 截图展示区域 -->
      <div v-if="ac2.stuScreenshot && Object.keys(ac2.stuScreenshot).length > 0" class="photos-section">
        <div class="section-header">
          <h3 class="section-title">📸 小组截图</h3>
          <div class="photos-count">{{ submittedScreenshotsCount }}/24 小组</div>
        </div>
        <div class="photos-grid">
          <div v-for="(screenshot, groupNo) in ac2.stuScreenshot" :key="groupNo" class="screenshot-item">
            <div class="group-label">第{{ groupNo }}组</div>
            <img :src="screenshot" alt="小组截图" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { teaAc2 } from '@/store/activity/activity2'

const ac2 = teaAc2()

// 计算已提交截图的小组数量
const submittedScreenshotsCount = computed(() => {
  if (!ac2.stuScreenshot) return 0
  return Object.keys(ac2.stuScreenshot).length
})

// Note: Activity2的设计提交处理已移至 listener.vue 统一管理

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

/* 截图展示区域 */
.photos-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.photos-count {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 16px;
  border-radius: 20px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.screenshot-item {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.screenshot-item:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.group-label {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
  background: #d1fae5;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  text-align: center;
}

.screenshot-item img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

/* 响应式设计 */
@media (max-width: 1240px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }
}
</style>
