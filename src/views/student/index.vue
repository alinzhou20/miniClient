<template>
  <Listener />
  <div class="page">
    <!-- 顶部标题横幅 + 活动按钮 -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">数据获取</h1>
        
        <!-- 活动按钮区 -->
        <div class="activity-btns">
          <button 
            v-for="act in studentActivities" 
            :key="act.id"
            class="activity-btn"
            :class="{ active: currentActivityId === act.id }"
            @click="selectActivity(act.id)"
          >
            <span class="btn-text">{{ act.title }}</span>
            <span class="btn-stars">{{ getActivityStars(act.id) }}</span>
          </button>
        </div>
        
        <div class="spacer"></div>
        
        <!-- 总星数显示 -->
        <div class="total-stars">
          <span class="total-label">总星数</span>
          <span class="total-count">{{ totalStars }}</span>
        </div>
        
        <el-button @click="handleLogout" class="logout-btn">
          <el-icon :size="20"><Fold /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 统一内容区 -->
    <div class="content-box">
      <!-- 子路由内容 -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket, useActivity } from '@/store'
import { ElMessage } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'
import Listener from './listener.vue'
import type { Activity } from '@/store/status'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// 学生端活动列表：只包含 activity1-3（过滤掉 activity0 和 activity4）
const studentActivities = computed<Activity[]>(() => {
  return status.activityStatus.all.filter(a => a.id >= 1 && a.id <= 3)
})

// 当前活动 ID（根据路由判断）
const currentActivityId = computed(() => {
  const match = router.currentRoute.value.path.match(/activity(\d+)/)
  return match ? parseInt(match[1]) : 1
})

const selectActivity = (id: number) => {
  // 学生端只能跳转到 activity1-4
  if (id >= 1 && id <= 4) {
    router.push(`/student/activity${id}`)
  }
}

// 获取每个活动的星星数显示
const getActivityStars = (activityId: number): string => {
  if (activityId === 1) {
    const stars = status.groupScores.activity1
    return stars > 0 ? '⭐'.repeat(stars) : ''
  } else if (activityId === 2) {
    // 活动2：计算2-1和2-2的总和
    const total = status.groupScores.activity2_1 + status.groupScores.activity2_2
    return total > 0 ? '⭐'.repeat(total) : ''
  } else if (activityId === 3) {
    const stars = status.groupScores.activity3
    return stars > 0 ? '⭐'.repeat(stars) : ''
  } else if (activityId === 4) {
    const stars = status.groupScores.activity4
    return stars > 0 ? '⭐'.repeat(stars) : ''
  }
  return ''
}

// 计算总星数
const totalStars = computed(() => {
  return status.groupScores.activity1 + 
         status.groupScores.activity2_1 + 
         status.groupScores.activity2_2 + 
         status.groupScores.activity3 + 
         status.groupScores.activity4
})

const handleLogout = () => {
  socket.disconnect()
  status.reset()
  activity.reset()
  router.push('/login')
  ElMessage.success('已退出登录')
}
</script>

<style scoped>
.page {
  padding: 10px;
  max-width: 1280px;
  margin: 0 auto;
}

/* 顶部横幅 - 横向渐变 */
.banner {
  background: linear-gradient(90deg, #4ea3f9 0%, #6cc2ff 50%, #e9f6ff 100%);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.banner-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-badge {
  background: white;
  color: #2d6cb3;
  border-radius: 20px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 14px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: #F5F7FA;
  margin: 0;
}

/* 活动按钮区 */
.activity-btns {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.activity-btn {
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 90px;
}

.activity-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

.activity-btn.active {
  background: white;
  color: #1976d2;
  border-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-text {
  font-size: 14px;
  font-weight: 600;
}

.btn-stars {
  font-size: 12px;
  min-height: 16px;
  line-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spacer {
  flex: 1;
}

/* 总星数显示 */
.total-stars {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid white;
  border-radius: 16px;
  padding: 8px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.total-label {
  font-size: 12px;
  font-weight: 600;
  color: #1976d2;
  white-space: nowrap;
}

.total-count {
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  min-height: 20px;
  line-height: 20px;
}

.logout-btn {
  padding: 8px 12px !important;
  background: rgba(255, 255, 255, 0.25) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  color: #1976d2 !important;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
  transform: scale(1.05);
}

/* 统一内容区 */
.content-box {
  background: #F5F5F0;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .banner-inner {
    flex-wrap: wrap;
  }
  
  .activity-btns {
    order: 3;
    width: 100%;
    margin-top: 12px;
    margin-left: 0;
  }
  
  .spacer {
    display: none;
  }
}
</style>