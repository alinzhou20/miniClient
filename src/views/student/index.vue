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
        </div>
        
        <div class="spacer"></div>
        
        <!-- 总星数显示 -->
        <div class="total-stars" :title="isConnected ? 'Socket 已连接' : 'Socket 未连接，点击重新连接'">
          <!-- 连接状态指示灯 -->
          <div class="connection-indicator" :class="{ connected: isConnected }">
            <div class="indicator-dot"></div>
          </div>
          <span class="total-label">第 {{ status.user!.groupNo }} 组共获得</span>
          <span class="total-count">todo / 8 </span>
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
import { useStatus, useSocket } from '@/store'
import { ElMessage } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'
import Listener from './listener.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()

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

// 获取每个活动的最大星数
const getActivityMaxStars = (activityId: number): number => {
  if (activityId === 1) return 1
  if (activityId === 2) return 2 
  if (activityId === 3) return 2 
  if (activityId === 4) return 1
  return 0
}

// 使用 socket store 中的响应式连接状态
const isConnected = computed(() => socket.connected)

const handleLogout = () => {
  socket.disconnect()
  status.reset()
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
  font-size: 18px;
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
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 100px;
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
  font-size: 15px;
  font-weight: 900;
}

.btn-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.star-icon {
  width: 20px;
  height: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(255, 255, 255, 0.7);
  stroke: currentColor;
}

/* 未点亮的星星 - 空心描边样式 */
.star-icon:not(.filled) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
}

/* 按钮激活时，未点亮的星星颜色 */
.activity-btn.active .star-icon:not(.filled) {
  color: rgba(25, 118, 210, 0.4);
}

/* 点亮的星星 - 渐变填充 */
.star-icon.filled {
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2));
}

/* 悬停效果 */
.activity-btn:hover .star-icon {
  transform: scale(1.1);
}

.activity-btn:hover .star-icon.filled {
  transform: scale(1.15) rotate(5deg);
}

.spacer {
  flex: 1;
}

/* 总星数显示 */
.total-stars {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid white;
  border-radius: 16px;
  padding: 12px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.total-stars:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 连接状态指示灯 */
.connection-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  position: relative;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ef4444;
  box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
  transition: all 0.3s ease;
}

/* 未连接状态：红色闪烁 */
.connection-indicator:not(.connected) .indicator-dot {
  animation: blink-red 2s ease-in-out infinite;
}

/* 已连接状态：绿色常亮 */
.connection-indicator.connected .indicator-dot {
  background-color: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

@keyframes blink-red {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.9);
  }
}

.group-label {
  font-size: 14px;
  font-weight: 700;
  color: #1976d2;
  white-space: nowrap;
  padding: 4px 12px;
  background: #e3f2fd;
  border-radius: 12px;
}

.total-label {
  font-size: 15px;
  font-weight: 900;
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