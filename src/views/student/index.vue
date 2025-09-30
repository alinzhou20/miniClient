<template>
  <div class="page">
    <!-- 顶部标题横幅 + 活动按钮 -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">数据获取</h1>
        
        <!-- 活动按钮区 -->
        <div class="activity-btns">
          <button 
            v-for="activity in activities" 
            :key="activity.id"
            class="activity-btn"
            :class="{ active: currentActivity === activity.id.toString() }"
            @click="selectActivity(activity.id)"
          >
            {{ activity.name }}
          </button>
        </div>
        
        <div class="spacer"></div>
        
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
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStatus } from '@/store/status'
import { useSocket } from '@/utils/socket'
import { ElMessage } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const socket = useSocket()
const status = useStatus()

// 根据激活状态过滤活动列表
const activities = computed(() => {
  const allActivities = [
    { id: 0, name: '投票' },
    { id: 1, name: '活动一' },
    { id: 2, name: '活动二' },
    { id: 3, name: '活动三' }
  ]
  // 只显示已激活的活动
  return allActivities.filter(activity => (status.activityStatus as any)[activity.id])
})

const currentActivity = computed(() => {
  const p = String(route.path || '')
  if (p.includes('activity3')) return '3'
  if (p.includes('activity2')) return '2'
  if (p.includes('activity1')) return '1'
  if (p.includes('activity0')) return '0'
  return '0'
})

const selectActivity = (id: number) => {
  router.push(`/student/activity${id}`)
}

const handleLogout = () => {
  socket.disconnect()
  status.userStatus = null
  localStorage.removeItem('user')
  router.push('/login')
  ElMessage.success('已退出登录')
}

function onDispatch(payload: any) {
  if (!payload) return
  const messageType = String(payload.messageType || '')
  const data = payload.data || {}
  
  // 处理活动状态变更
  if (messageType === 'change_activity') {
    const activityStatus = data.activityStatus
    if (!activityStatus) return
    
    console.log('[Student] 收到活动状态:', activityStatus)
    
    // 更新活动状态
    status.activityStatus.now = activityStatus.now
    ;(status.activityStatus as any)[0] = activityStatus[0]
    ;(status.activityStatus as any)[1] = activityStatus[1]
    ;(status.activityStatus as any)[2] = activityStatus[2]
    ;(status.activityStatus as any)[3] = activityStatus[3]
    
    // 跳转到教师指定的活动
    const targetActivity = activityStatus.now
    router.push(`/student/activity${targetActivity}`)
    
    const activityName = targetActivity === 0 ? '投票' : targetActivity === 1 ? '活动一' : targetActivity === 2 ? '活动二' : '活动三'
    ElMessage.info(`教师已切换到${activityName}`)
  }
  
  // 保留原有的导航功能（兼容）
  if (messageType === 'navigate') {
    const targetRoute = String((data as any).route || '')
    if (['activity1', 'activity2', 'activity3'].includes(targetRoute)) {
      router.push(`/student/${targetRoute}`)
      ElMessage.info(`教师已通知前往${targetRoute === 'activity1' ? '活动一' : targetRoute === 'activity2' ? '活动二' : '活动三'}`)
    }
  }
}

onMounted(() => {
  socket.on('dispatch', onDispatch)
})

onBeforeUnmount(() => {
  socket.off('dispatch', onDispatch)
})
</script>

<style scoped>
.page {
  min-height: 100vh;
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

.spacer {
  flex: 1;
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