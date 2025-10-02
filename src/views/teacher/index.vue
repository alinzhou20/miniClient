<template>
  <div class="page">
    <Listener />
    <!-- 顶部标题横幅 + 活动按钮 -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">数据获取</h1>
        
        <!-- 活动按钮区 -->
        <div class="activity-btns">
          <button 
            v-for="activity in status.activityStatus.all" 
            :key="activity.id"
            class="activity-btn"
            :class="{ active: status.activityStatus.now === activity.id }"
            @click="selectActivity(activity.id)"
          >
            {{ activity.title }}
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
import { useRouter } from 'vue-router'
import { useStatus, useSocket, useActivity} from '@/store'
import { ElMessage } from 'element-plus'
import { Fold } from '@element-plus/icons-vue'
import { EventType } from '@/types'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

const selectActivity = (id: number) => {
  // 更新 status
  status.activityStatus.now = id
  status.activityStatus.all.forEach(a => {
    if (a.id === id) a.isActive = true
  })
  
  console.log('selectActivity', id)
  // 同步路由
  router.push(`/teacher/activity${id}`)
  
  // 广播给学生
  socket.dispatch({
    mode: status.mode,
    eventType: EventType.DISPATCH,
    messageType: 'change_activity',
    activityIndex: '-1',
    data: { activityStatus: status.activityStatus },
    from: null,
    to: {}
  })

  ElMessage.success(`已切换到${status.activityStatus.all.find(a => a.id === id)?.title || '活动'}`)
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