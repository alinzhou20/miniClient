<template>
  <div class="teacher-view">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="user-info">
        <el-tag type="danger" size="large">
          <el-icon><UserFilled /></el-icon>
          教师 - {{ currentUser?.username }}
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
      <!-- 左侧：消息广播区 -->
      <div class="broadcast-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Promotion /></el-icon>
              <span>消息广播</span>
            </div>
          </template>
          
          <el-form @submit.prevent="broadcastMessage">
            <el-form-item label="消息类型">
              <el-select v-model="broadcastType" placeholder="选择消息类型" style="width: 100%">
                <el-option label="公告" value="announcement" />
                <el-option label="通知" value="notification" />
                <el-option label="提醒" value="reminder" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="广播内容">
              <el-input
                v-model="broadcastContent"
                type="textarea"
                :rows="4"
                placeholder="请输入要广播的内容..."
                :disabled="isSending"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="isSending"
                @click="broadcastMessage"
                :disabled="!broadcastContent.trim()"
              >
                {{ isSending ? '发送中...' : '广播给所有学生' }}
              </el-button>
              <el-button @click="clearBroadcast" :disabled="isSending">
                清空
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 定向发送 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Message /></el-icon>
              <span>定向发送</span>
            </div>
          </template>
          
          <el-form @submit.prevent="sendDirectMessage">
            <el-form-item label="发送目标">
              <el-radio-group v-model="targetType">
                <el-radio label="student">特定学生</el-radio>
                <el-radio label="group">特定小组</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item :label="targetType === 'student' ? '学生学号' : '小组号'">
              <el-input-number
                v-model="targetNumber"
                :min="1"
                :max="targetType === 'student' ? 99999 : 20"
                :placeholder="targetType === 'student' ? '请输入学号' : '请输入小组号'"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="消息内容">
              <el-input
                v-model="directContent"
                type="textarea"
                :rows="3"
                placeholder="请输入消息内容..."
                :disabled="isSending"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="success"
                :loading="isSending"
                @click="sendDirectMessage"
                :disabled="!directContent.trim() || !targetNumber"
              >
                {{ isSending ? '发送中...' : '发送消息' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 右侧：学生作业和消息 -->
      <div class="message-section">
        <el-card class="message-display">
          <template #header>
            <div class="card-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>学生消息 ({{ unreadCount }})</span>
              <div class="header-actions">
                <el-button @click="markAsRead" size="small" type="primary" plain v-if="unreadCount > 0">
                  标记已读
                </el-button>
                <el-button @click="clearAllMessages" size="small" type="danger" plain>
                  清空消息
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="message-list" ref="messageListRef">
            <div
              v-for="message in recentMessages"
              :key="message.at"
              :class="['message-item', getMessageClass(message)]"
            >
              <div class="message-header">
                <div class="sender-info">
                  <span class="sender">{{ getSenderName(message) }}</span>
                  <el-tag :type="getMessageTypeTag(message.data.type)" size="small">
                    {{ getMessageTypeText(message.data.type) }}
                  </el-tag>
                </div>
                <span class="time">{{ formatTime(message.at) }}</span>
              </div>
              <div class="message-content">
                <p>{{ message.data.content }}</p>
                <div class="message-actions" v-if="message.data.type === 'homework'">
                  <el-button size="small" type="success" plain>
                    已收到
                  </el-button>
                  <el-button size="small" type="primary" plain @click="replyToStudent(message)">
                    回复
                  </el-button>
                </div>
              </div>
            </div>
            
            <div v-if="recentMessages.length === 0" class="empty-message">
              暂无学生消息
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 在线学生统计 -->
    <div class="student-stats">
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>在线学生统计</span>
          </div>
        </template>
        
        <div class="stats-content">
          <div class="stat-item">
            <div class="stat-number">{{ onlineStudents.length }}</div>
            <div class="stat-label">在线学生</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ getGroupCount() }}</div>
            <div class="stat-label">活跃小组</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ getHomeworkCount() }}</div>
            <div class="stat-label">收到作业</div>
          </div>
        </div>
        
        <div class="student-list">
          <div class="group-section" v-for="group in getStudentsByGroup()" :key="group.groupNo">
            <div class="group-header">
              <el-tag type="info" size="small">第{{ group.groupNo }}组 ({{ group.students.length }}人)</el-tag>
            </div>
            <div class="group-students">
              <el-tag
                v-for="student in group.students"
                :key="student.user.studentNo"
                :type="student.status === 'online' ? 'success' : 'info'"
                size="small"
              >
                {{ student.user.studentNo }}号
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复学生" width="400px">
      <el-form>
        <el-form-item label="回复给">
          <el-tag>{{ replyTarget?.from.studentNo }}号学生</el-tag>
        </el-form-item>
        <el-form-item label="回复内容">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendReply" :loading="isSending">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  UserFilled, 
  Promotion, 
  Delete, 
  ChatDotRound, 
  DataAnalysis 
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { useMessageStore } from '@/stores/message'
import type { Message as MessageType, OnlineUser } from '@/types'

// Router
const router = useRouter()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()
const messageStore = useMessageStore()

// 响应式数据
const broadcastContent = ref('')
const broadcastType = ref('announcement')
const directContent = ref('')
const targetType = ref<'student' | 'group'>('student')
const targetNumber = ref<number>(1)
const messageListRef = ref<HTMLElement>()
const replyDialogVisible = ref(false)
const replyContent = ref('')
const replyTarget = ref<MessageType | null>(null)

// 计算属性
const currentUser = computed(() => authStore.currentUser)
const isSending = computed(() => messageStore.isSending)
const recentMessages = computed(() => messageStore.recentMessages)
const unreadCount = computed(() => messageStore.unreadCount)
const onlineStudents = computed(() => socketStore.onlineStudents)

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
const broadcastMessage = async () => {
  if (!broadcastContent.value.trim()) {
    ElMessage.warning('请输入广播内容')
    return
  }

  try {
    await messageStore.broadcastToStudents(broadcastContent.value.trim(), broadcastType.value)
    ElMessage.success('广播发送成功')
    broadcastContent.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  }
}

const clearBroadcast = () => {
  broadcastContent.value = ''
}

const sendDirectMessage = async () => {
  if (!directContent.value.trim() || !targetNumber.value) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    if (targetType.value === 'student') {
      await messageStore.sendToStudent(targetNumber.value, directContent.value.trim())
    } else {
      await messageStore.sendToGroup(targetNumber.value, directContent.value.trim())
    }
    ElMessage.success('消息发送成功')
    directContent.value = ''
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  }
}

const replyToStudent = (message: MessageType) => {
  replyTarget.value = message
  replyContent.value = ''
  replyDialogVisible.value = true
}

const sendReply = async () => {
  if (!replyContent.value.trim() || !replyTarget.value) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    const studentNo = replyTarget.value.from.studentNo
    if (studentNo) {
      await messageStore.sendToStudent(studentNo, replyContent.value.trim())
      ElMessage.success('回复发送成功')
      replyDialogVisible.value = false
      replyContent.value = ''
      replyTarget.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.message || '回复失败')
  }
}

const markAsRead = () => {
  messageStore.markAsRead()
}

const clearAllMessages = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有消息吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    messageStore.clearMessages()
    ElMessage.success('消息已清空')
  } catch {
    // 用户取消操作
  }
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  // 登出后立即跳转到登录页面
  router.push('/login')
}

const getSenderName = (message: MessageType): string => {
  if (message.from.groupNo === 0 && message.from.studentNo === 0) {
    return '我'
  }
  return `${message.from.classNo}班 ${message.from.studentNo}号 (${message.from.groupNo}组)`
}

const getMessageClass = (message: MessageType): string => {
  if (message.from.groupNo === 0 && message.from.studentNo === 0) {
    return 'message-sent'
  }
  return message.data.type === 'homework' ? 'message-homework' : 'message-received'
}

const getMessageTypeTag = (type: string): string => {
  switch (type) {
    case 'homework': return 'warning'
    case 'message': return 'primary'
    default: return 'info'
  }
}

const getMessageTypeText = (type: string): string => {
  switch (type) {
    case 'homework': return '作业'
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

const getGroupCount = (): number => {
  const groups = new Set(onlineStudents.value.map(s => s.user.groupNo))
  return groups.size
}

const getHomeworkCount = (): number => {
  return recentMessages.value.filter(m => m.data.type === 'homework').length
}

const getStudentsByGroup = () => {
  const groups: { [key: number]: OnlineUser[] } = {}
  
  onlineStudents.value.forEach(student => {
    const groupNo = student.user.groupNo || 0
    if (!groups[groupNo]) {
      groups[groupNo] = []
    }
    groups[groupNo].push(student)
  })
  
  return Object.keys(groups)
    .map(key => ({
      groupNo: parseInt(key),
      students: groups[parseInt(key)]
    }))
    .sort((a, b) => a.groupNo - b.groupNo)
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
.teacher-view {
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

.broadcast-section, .message-section {
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

.message-item.message-homework {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
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
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender {
  font-weight: 500;
  color: #303133;
}

.time {
  color: #909399;
}

.message-content p {
  margin: 8px 0;
  line-height: 1.5;
}

.message-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.empty-message {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.student-stats {
  position: fixed;
  top: 100px;
  right: 24px;
  width: 280px;
  z-index: 100;
}

.stats-content {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.student-list {
  max-height: 300px;
  overflow-y: auto;
}

.group-section {
  margin-bottom: 12px;
}

.group-header {
  margin-bottom: 8px;
}

.group-students {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
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
