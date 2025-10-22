<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📝 观点交锋，方法初探</h2>
      </div>

      <!-- 图片展示区域 -->
      <div v-if="ac1.stuPhoto && Object.keys(ac1.stuPhoto).length > 0" class="photos-section">
        <div class="section-header">
          <h3 class="section-title">📸 学生拍摄照片</h3>
          <div class="photos-count">{{ submittedPhotosCount }}/24 小组 (共 {{ totalPhotosCount }} 张)</div>
        </div>
        <div class="photos-grid">
          <div v-for="(photos, groupNo) in ac1.stuPhoto" :key="groupNo" class="group-photos">
            <div class="group-label">第{{ groupNo }}组</div>
            <div class="photos-pair">
              <div v-if="photos.photo1" class="photo-item">
                <img :src="photos.photo1" alt="第一次拍摄" />
                <div class="photo-label">第一次</div>
              </div>
              <div v-if="photos.photo2" class="photo-item">
                <img :src="photos.photo2" alt="第二次拍摄" />
                <div class="photo-label">第二次</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { teaAc1 } from '@/store/activity/activity1'

const ac1 = teaAc1()

// 计算已提交图片的小组数量
const submittedPhotosCount = computed(() => {
  if (!ac1.stuPhoto) return 0
  return Object.keys(ac1.stuPhoto).length
})

// 计算总图片数（24个小组 x 2张 = 48张）
const totalPhotosCount = computed(() => {
  if (!ac1.stuPhoto) return 0
  return Object.values(ac1.stuPhoto).reduce((sum, group) => {
    return sum + (group.photo1 ? 1 : 0) + (group.photo2 ? 1 : 0)
  }, 0)
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
  padding: 40px 0 20px 0;
}

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

/* 图片展示区域 */
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.group-photos {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
}

.group-photos:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.group-label {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #dbeafe;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  text-align: center;
}

.photos-pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.photo-item {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/4;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 6px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
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
