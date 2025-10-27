<template>
  <div class="main-content">
    <!-- 评价标准 -->
    <Evaluation />

    <!-- 主内容区 -->
    <div class="content-layout">
      <!-- 代码平台按钮 -->
      <div class="platform-section">
        <div class="section-card">
          <div class="section-icon">🚀</div>
          <h3 class="section-title">代码平台</h3>
          <p class="section-desc">点击按钮进入代码平台完成活动二任务</p>
          <el-button 
            type="primary" 
            size="large"
            @click="openCodePlatform"
            class="platform-button"
          >
            🚀 进入代码平台
          </el-button>
        </div>
      </div>

      <!-- 自我评分区域 -->
      <div class="rating-section">
        <div class="section-card">
          <div class="section-icon">⭐</div>
          <h3 class="section-title">自我评分</h3>
          <p class="section-desc">完成任务后，根据完成情况为自己打分</p>
          
          <div class="rating-items">
            <!-- 评分项1 -->
            <div class="rating-item">
              <div class="rating-label">
                <span class="rating-number">3.</span>
                <span class="rating-text">能利用代码得到图片中RGB通道数值</span>
              </div>
              <div class="rating-stars">
                <el-rate 
                  v-model="status.activity2Score[1]"
                  :max="3"
                  size="large"
                  @change="handleScoreChange"
                  show-score
                  :score-template="`{value}/3分`"
                />
              </div>
            </div>

            <!-- 评分项2 -->
            <div class="rating-item">
              <div class="rating-label">
                <span class="rating-number">4.</span>
                <span class="rating-text">能理解"R"通道与"G"通道数值代表的含义</span>
              </div>
              <div class="rating-stars">
                <el-rate 
                  v-model="status.activity2Score[2]"
                  :max="2"
                  size="large"
                  @change="handleScoreChange"
                  show-score
                  :score-template="`{value}/2分`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStuStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { ElMessage } from 'element-plus'
import { EventType } from '@/type/event'
import Evaluation from '../../components/evaluation.vue'

const status = useStuStatus()
const socket = useSocket()

// 打开代码平台
const openCodePlatform = () => {
  const url = 'https://www.openinnolab.org.cn/pjlab/project?id=68f62ac5b13c8c610064ddb9&backpath=/pjedu/userprofile?slideKey=project#public'
  window.open(url, '_blank')
  ElMessage.success('已在新标签页打开代码平台')
}

// 评分变化时自动提交
const handleScoreChange = () => {
  // 延迟提交，避免频繁发送
  setTimeout(() => {
    submitScoresToTeacher()
  }, 300)
}

// 提交评分到教师端
const submitScoresToTeacher = () => {
  if (!status.user?.studentNo) return
  
  const activityScores = {
    activity1: Object.values(status.activity1Score).reduce((sum, score) => sum + score, 0),
    activity2: Object.values(status.activity2Score).reduce((sum, score) => sum + score, 0),
    activity3: Object.values(status.activity3Score).reduce((sum, score) => sum + score, 0)
  }
  
  socket.emit('submit', {
    eventType: EventType.SUBMIT,
    messageType: 'activity-update',
    from: { 
      studentNo: status.user.studentNo!, 
      groupNo: status.user.groupNo!, 
      studentRole: status.user.studentRole! 
    },
    data: activityScores
  })
}
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 40px);
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  height: 100%;
}

.section-icon {
  font-size: 64px;
  opacity: 0.9;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.section-desc {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

/* 代码平台按钮 */
.platform-button {
  width: 100%;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.platform-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 评分区域 */
.rating-section {
  display: flex;
  flex-direction: column;
}

.rating-items {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
  flex: 1;
}

.rating-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.rating-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.rating-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.rating-number {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
  flex-shrink: 0;
}

.rating-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
  font-weight: 500;
}

.rating-stars {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.rating-stars :deep(.el-rate) {
  height: auto;
}

.rating-stars :deep(.el-rate__icon) {
  font-size: 28px;
}

.rating-stars :deep(.el-rate__text) {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
  margin-left: 8px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
</style>
