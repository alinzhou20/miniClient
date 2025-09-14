import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, MessageData, MessageTarget } from '@/types'
import { socketService } from '@/services/socket'
import { useAuthStore } from './auth'

export const useMessageStore = defineStore('message', () => {
  // 状态
  const messages = ref<Message[]>([])
  const unreadCount = ref(0)
  const isSending = ref(false)
  const sendError = ref<string>('')

  // 计算属性
  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => (a.at || 0) - (b.at || 0))
  })

  const recentMessages = computed(() => {
    return sortedMessages.value.slice(-50) // 只保留最近50条消息
  })

  // 初始化消息监听
  const initMessageListener = () => {
    socketService.on('message', (message: Message) => {
      addMessage(message)
      unreadCount.value++
    })
  }

  // 添加消息
  const addMessage = (message: Message) => {
    // 添加时间戳
    if (!message.at) {
      message.at = Date.now()
    }
    
    messages.value.push(message)
    
    // 限制消息数量，避免内存溢出
    if (messages.value.length > 100) {
      messages.value = messages.value.slice(-100)
    }
  }

  // 发送消息
  const sendMessage = async (to: MessageTarget, data: MessageData): Promise<void> => {
    const authStore = useAuthStore()
    
    if (!authStore.currentUser) {
      throw new Error('用户未登录')
    }

    isSending.value = true
    sendError.value = ''

    try {
      // 构建发送者信息
      let from: MessageTarget
      if (authStore.isStudent) {
        from = {
          classNo: authStore.currentUser.classNo,
          groupNo: authStore.currentUser.groupNo,
          studentNo: authStore.currentUser.studentNo
        }
      } else {
        from = {
          groupNo: 0,
          studentNo: 0
        }
      }

      // 构建消息
      const message: Message = {
        from,
        to,
        data: {
          ...data,
          timestamp: Date.now()
        }
      }

      // 发送消息
      socketService.sendMessage(message)
      
      // 添加到本地消息列表（发送的消息）
      addMessage({
        ...message,
        code: 200,
        at: Date.now()
      })

    } catch (error: any) {
      sendError.value = error.message || '发送失败'
      throw error
    } finally {
      isSending.value = false
    }
  }

  // 学生发送作业给教师
  const sendHomework = async (content: string): Promise<void> => {
    await sendMessage(
      { groupNo: 0, studentNo: 0 }, // 发给教师
      { type: 'homework', content }
    )
  }

  // 教师广播消息给所有学生
  const broadcastToStudents = async (content: string, type: string = 'announcement'): Promise<void> => {
    await sendMessage(
      { broadcast: true }, // 广播给所有学生
      { type, content }
    )
  }

  // 教师发送消息给特定学生
  const sendToStudent = async (studentNo: number, content: string, type: string = 'message'): Promise<void> => {
    await sendMessage(
      { studentNo },
      { type, content }
    )
  }

  // 教师发送消息给特定小组
  const sendToGroup = async (groupNo: number, content: string, type: string = 'message'): Promise<void> => {
    await sendMessage(
      { groupNo },
      { type, content }
    )
  }

  // 学生发送消息给其他学生
  const sendToOtherStudent = async (studentNo: number, content: string): Promise<void> => {
    await sendMessage(
      { studentNo },
      { type: 'message', content }
    )
  }

  // 学生发送消息给小组
  const sendToMyGroup = async (content: string): Promise<void> => {
    const authStore = useAuthStore()
    if (authStore.currentUser?.groupNo) {
      await sendMessage(
        { groupNo: authStore.currentUser.groupNo },
        { type: 'message', content }
      )
    }
  }

  // 标记消息为已读
  const markAsRead = () => {
    unreadCount.value = 0
  }

  // 清除所有消息
  const clearMessages = () => {
    messages.value = []
    unreadCount.value = 0
    sendError.value = ''
  }

  // 清除发送错误
  const clearSendError = () => {
    sendError.value = ''
  }

  // 获取与特定用户的对话
  const getConversationWith = (target: MessageTarget) => {
    return messages.value.filter(msg => {
      // 检查是否是与目标用户的对话
      const isFromTarget = (
        msg.from.studentNo === target.studentNo &&
        msg.from.groupNo === target.groupNo &&
        msg.from.classNo === target.classNo
      )
      const isToTarget = (
        msg.to.studentNo === target.studentNo &&
        msg.to.groupNo === target.groupNo &&
        msg.to.classNo === target.classNo
      )
      return isFromTarget || isToTarget
    })
  }

  return {
    // 状态
    messages,
    unreadCount,
    isSending,
    sendError,
    
    // 计算属性
    sortedMessages,
    recentMessages,
    
    // 方法
    initMessageListener,
    addMessage,
    sendMessage,
    sendHomework,
    broadcastToStudents,
    sendToStudent,
    sendToGroup,
    sendToOtherStudent,
    sendToMyGroup,
    markAsRead,
    clearMessages,
    clearSendError,
    getConversationWith
  }
})
