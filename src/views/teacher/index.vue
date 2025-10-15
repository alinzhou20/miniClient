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
            v-for="activity in teacherActivities" 
            :key="activity.id"
            class="activity-btn"
            :class="{ active: currentActivityId === activity.id }"
            @click="selectActivity(activity.id)"
          >
            {{ activity.title }}
          </button>
          
          <!-- 看板按钮 -->
          <button 
            class="activity-btn watch-btn"
            :class="{ active: isWatchPage }"
            @click="goToWatch"
          >
            <el-icon><Monitor /></el-icon>
            看板
          </button>
        </div>
        
        <div class="spacer"></div>
        
        <!-- 连接状态指示器 -->
        <div class="connection-status" @click="handleReconnect" :title="isConnected ? 'Socket 已连接' : 'Socket 未连接，点击重新连接'">
          <div class="connection-indicator" :class="{ connected: isConnected }">
            <div class="indicator-dot"></div>
          </div>
          <span class="status-text">{{ isConnected ? '已连接' : '未连接' }}</span>
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
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket, useActivity} from '@/store'
import { ElMessage } from 'element-plus'
import { Fold, Monitor } from '@element-plus/icons-vue'
import { EventType } from '@/types'
import type { Activity } from '@/store/status'
import Listener from './listener.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// 教师端活动列表：包含 activity0-4（投票 + 活动一到活动四）
const teacherActivities = computed<Activity[]>(() => {
  return status.activityStatus.all.filter(a => a.id >= 0 && a.id <= 4)
})

// 是否在看板页面
const isWatchPage = computed(() => {
  return router.currentRoute.value.path.includes('/teacher/watch')
})

// 当前活动 ID（根据路由判断）
const currentActivityId = computed(() => {
  // 如果在看板页面，返回 -1 避免激活任何活动按钮
  if (isWatchPage.value) {
    return -1
  }
  const match = router.currentRoute.value.path.match(/activity(\d+)/)
  return match ? parseInt(match[1]) : 0
})

// 更新活动状态（根据活动ID）
const updateActivityStatus = (id: number) => {
  // 更新当前活动和所有活动的激活状态
  status.activityStatus.now = id
  status.activityStatus.all.forEach(a => {
    a.isActive = (a.id === id)
  })
}

const selectActivity = (id: number) => {
  // 更新活动状态
  updateActivityStatus(id)
  
  // 同步路由
  router.push(`/teacher/activity${id}`)
  
  // 广播给学生（activity0 是教师专用，不广播）
  if (id > 0) {
    socket.dispatch({
      mode: status.mode,
      eventType: EventType.DISPATCH,
      messageType: 'change_activity',
      activityIndex: '-1',
      data: { activityStatus: status.activityStatus },
      from: null,
      to: {}
    })
  }
}

// 监听路由变化，自动更新活动状态
watch(() => router.currentRoute.value.path, (newPath) => {
  const match = newPath.match(/\/teacher\/activity(\d+)/)
  if (match) {
    const activityId = parseInt(match[1])
    // 如果活动状态与当前路由不一致，更新状态
    if (status.activityStatus.now !== activityId) {
      updateActivityStatus(activityId)
    }
  }
}, { immediate: true })

// 跳转到看板
const goToWatch = () => {
  router.push('/teacher/watch')
}

// 使用 socket store 中的响应式连接状态
const isConnected = computed(() => socket.isConnected)

// 处理重新连接
const handleReconnect = async () => {
  if (isConnected.value) {
    ElMessage.info('Socket 已连接')
    return
  }
  
  if (!status.userStatus) {
    ElMessage.error('无法重新连接：用户信息缺失')
    return
  }
  
  try {
    ElMessage.info('正在重新连接...')
    
    // 先断开现有连接
    socket.disconnect()
    
    // 使用保存的用户信息重新连接
    await socket.connect({
      type: status.userStatus.type,
      mode: status.userStatus.mode,
      studentNo: status.userStatus.studentNo,
      groupNo: status.userStatus.groupNo,
      studentRole: status.userStatus.studentRole
    })
    
    ElMessage.success('重新连接成功！')
  } catch (error) {
    console.error('重新连接失败:', error)
    ElMessage.error('重新连接失败，请稍后重试')
  }
}

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
  min-height: 100vh;
  padding: 10px;
  max-width: 1880px;
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
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
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

.activity-btn.watch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spacer {
  flex: 1;
}

/* 连接状态显示 */
.connection-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid white;
  border-radius: 16px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.connection-status:hover {
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

.status-text {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  white-space: nowrap;
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