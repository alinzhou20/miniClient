<template>
  <div class="student-view">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="user-info">
        <el-tag type="success" size="large">
          <el-icon><User /></el-icon>
          学生 - {{ currentUser?.classNo }}班 {{ currentUser?.studentNo }}号 ({{ currentUser?.groupNo }}组)
        </el-tag>
      </div>
      <div class="connection-info">
        <el-tag :type="connectionStatusType" size="small">
          {{ connectionStatusText }}
        </el-tag>
        <el-button @click="handleLogout" size="small" type="danger" plain>
          退出登录
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：作业提交区 -->
      <div class="homework-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><EditPen /></el-icon>
              <span>作业提交</span>
            </div>
          </template>
          
          <el-form @submit.prevent="submitHomework">
            <el-form-item label="作业内容">
              <el-input
                v-model="homeworkContent"
                type="textarea"
                :rows="6"
                placeholder="请输入作业内容..."
                :disabled="isSending"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="isSending"
                @click="submitHomework"
                :disabled="!homeworkContent.trim()"
              >
                {{ isSending ? '提交中...' : '提交作业' }}
              </el-button>
              <el-button @click="clearHomework" :disabled="isSending">
                清空
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 右侧：消息区域 -->
      <div class="message-section">
        <!-- 消息显示 -->
        <el-card class="message-display">
          <template #header>
            <div class="card-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>消息 ({{ unreadCount }})</span>
              <el-button @click="markAsRead" size="small" type="primary" plain v-if="unreadCount > 0">
                标记已读
              </el-button>
            </div>
          </template>
          
          <div class="message-list" ref="messageListRef">
            <div
              v-for="message in recentMessages"
              :key="message.at"
              :class="['message-item', getMessageClass(message)]"
            >
              <div class="message-header">
                <span class="sender">{{ getSenderName(message) }}</span>
                <span class="time">{{ formatTime(message.at) }}</span>
              </div>
              <div class="message-content">
                <el-tag :type="getMessageTypeTag(message.data.type)" size="small">
                  {{ getMessageTypeText(message.data.type) }}
                </el-tag>
                <p>{{ message.data.content }}</p>
              </div>
            </div>
            
            <div v-if="recentMessages.length === 0" class="empty-message">
              暂无消息
            </div>
          </div>
        </el-card>

        <!-- 快速回复 -->
        <el-card class="quick-reply">
          <template #header>
            <div class="card-header">
              <el-icon><ChatLineRound /></el-icon>
              <span>快速回复</span>
            </div>
          </template>
          
          <el-form @submit.prevent="sendQuickReply">
            <el-form-item>
              <el-input
                v-model="quickReplyContent"
                placeholder="输入消息..."
                :disabled="isSending"
              >
                <template #append>
                  <el-button
                    type="primary"
                    :loading="isSending"
                    @click="sendQuickReply"
                    :disabled="!quickReplyContent.trim()"
                  >
                    发送
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>

    <!-- 在线用户列表 -->
    <div class="online-users">
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>在线用户 ({{ onlineUsers.length }})</span>
          </div>
        </template>
        
        <div class="user-list">
          <div v-for="user in onlineUsers" :key="`${user.user.classNo}-${user.user.studentNo}`" class="user-item">
            <el-tag :type="user.user.role === 'teacher' ? 'danger' : 'primary'" size="small">
              {{ user.user.role === 'teacher' ? '教师' : `${user.user.studentNo}号` }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, EditPen, ChatDotRound, ChatLineRound } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { useMessageStore } from '@/stores/message'
import type { Message } from '@/types'

// Router
const router = useRouter()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()
const messageStore = useMessageStore()

// 响应式数据
const homeworkContent = ref('')
const quickReplyContent = ref('')
const messageListRef = ref<HTMLElement>()

// 计算属性
const currentUser = computed(() => authStore.currentUser)
const isSending = computed(() => messageStore.isSending)
const recentMessages = computed(() => messageStore.recentMessages)
const unreadCount = computed(() => messageStore.unreadCount)
const onlineUsers = computed(() => socketStore.onlineUsers)

const connectionStatusType = computed(() => {
  if (socketStore.isReady) return 'success'
  if (socketStore.isReconnecting) return 'warning'
  return 'danger'
})

const connectionStatusText = computed(() => {
  if (socketStore.isReady) return '已连接'
  if (socketStore.isReconnecting) return '重连中...'
  if (socketStore.connectionError) return `连接错误: ${socketStore.connectionError}`
  return '未连接'
})

// 方法
const submitHomework = async () => {
  if (!homeworkContent.value.trim()) {
    ElMessage.warning('请输入作业内容')
    return
  }

  try {
    await messageStore.sendHomework(homeworkContent.value.trim())
    ElMessage.success('作业提交成功')
    homeworkContent.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  }
}

const clearHomework = () => {
  homeworkContent.value = ''
}

const sendQuickReply = async () => {
  if (!quickReplyContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  try {
    // 发送给教师
    await messageStore.sendMessage(
      { groupNo: 0, studentNo: 0 },
      { type: 'message', content: quickReplyContent.value.trim() }
    )
    ElMessage.success('消息发送成功')
    quickReplyContent.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  }
}

const markAsRead = () => {
  messageStore.markAsRead()
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  // 登出后立即跳转到登录页面
  router.push('/login')
}

const getSenderName = (message: Message): string => {
  if (message.from.groupNo === 0 && message.from.studentNo === 0) {
    return '教师'
  }
  if (message.from.studentNo === currentUser.value?.studentNo) {
    return '我'
  }
  return `${message.from.studentNo}号同学`
}

const getMessageClass = (message: Message): string => {
  if (message.from.studentNo === currentUser.value?.studentNo) {
    return 'message-sent'
  }
  if (message.from.groupNo === 0 && message.from.studentNo === 0) {
    return 'message-teacher'
  }
  return 'message-received'
}

const getMessageTypeTag = (type: string): string => {
  switch (type) {
    case 'homework': return 'success'
    case 'announcement': return 'danger'
    case 'message': return 'primary'
    default: return 'info'
  }
}

const getMessageTypeText = (type: string): string => {
  switch (type) {
    case 'homework': return '作业'
    case 'announcement': return '公告'
    case 'message': return '消息'
    default: return '其他'
  }
}

const formatTime = (timestamp?: number): string => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动到底部
watch(recentMessages, () => {
  scrollToBottom()
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化消息监听
  messageStore.initMessageListener()
  scrollToBottom()
})
</script>

<style scoped>
.student-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-info, .connection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
}

.homework-section, .message-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.message-display {
  flex: 1;
  min-height: 0;
}

.message-list {
  height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.message-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #dcdfe6;
}

.message-item.message-sent {
  background-color: #e1f3d8;
  border-left-color: #67c23a;
}

.message-item.message-teacher {
  background-color: #fef0f0;
  border-left-color: #f56c6c;
}

.message-item.message-received {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.sender {
  font-weight: 500;
}

.message-content p {
  margin: 8px 0 0 0;
  line-height: 1.5;
}

.empty-message {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.online-users {
  position: fixed;
  top: 100px;
  right: 24px;
  width: 200px;
  z-index: 100;
}

.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.quick-reply {
  margin-top: auto;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
