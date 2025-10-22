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
import { useStatus, useSocket} from '@/store'
import { Fold, Monitor } from '@element-plus/icons-vue'
import Listener from './listener.vue'

const router = useRouter()
const socket = useSocket()
const status = useStatus()

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