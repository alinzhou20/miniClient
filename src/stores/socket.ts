import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConnectionStatus, OnlineEvent } from '@/types'
import { socketService } from '@/services/socket'

export const useSocketStore = defineStore('socket', () => {
  // 状态
  const connectionStatus = ref<ConnectionStatus>({
    connected: false,
    authenticated: false,
    reconnecting: false
  })
  const onlineUsers = ref<OnlineEvent[]>([])
  const lastPingTime = ref<number>(0)
  const pingInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // 计算属性
  const isConnected = computed(() => connectionStatus.value.connected)
  const isAuthenticated = computed(() => connectionStatus.value.authenticated)
  const isReconnecting = computed(() => connectionStatus.value.reconnecting)
  const connectionError = computed(() => connectionStatus.value.error)
  const isReady = computed(() => isConnected.value && isAuthenticated.value)

  // 严格对齐后端：仅维护学生上线/下线事件载荷
  const onlineStudents = computed(() => onlineUsers.value)
  const onlineTeachers = computed(() => [])

  // 初始化Socket事件监听
  const initSocketListeners = () => {
    // 连接状态监听
    socketService.on('connect', () => {
      updateConnectionStatus({ connected: true, reconnecting: false })
    })

    socketService.on('authenticated', () => {
      updateConnectionStatus({ authenticated: true })
      startPingInterval()
    })

    socketService.on('disconnect', () => {
      updateConnectionStatus({ connected: false, authenticated: false })
      stopPingInterval()
    })

    socketService.on('connect_error', (error: Error) => {
      updateConnectionStatus({ error: error.message })
    })

    // 学生上线/下线监听（与文档一致）
    socketService.on('online', (data: OnlineEvent) => {
      addOrUpdateUser(data)
    })

    socketService.on('offline', (data: OnlineEvent) => {
      removeUser(data)
    })

    // 心跳监听
    socketService.on('pong', (data: { timestamp: number }) => {
      lastPingTime.value = data.timestamp
    })
  }

  // 更新连接状态
  const updateConnectionStatus = (updates: Partial<ConnectionStatus>) => {
    connectionStatus.value = { ...connectionStatus.value, ...updates }
  }

  // 添加或更新在线用户
  const addOrUpdateUser = (evt: OnlineEvent) => {
    const existingIndex = onlineUsers.value.findIndex(
      u => u.studentNo === evt.studentNo
    )
    if (existingIndex >= 0) {
      onlineUsers.value[existingIndex] = evt
    } else {
      onlineUsers.value.push(evt)
    }
  }

  // 移除用户
  const removeUser = (evt: OnlineEvent) => {
    const index = onlineUsers.value.findIndex(
      u => u.studentNo === evt.studentNo
    )
    if (index >= 0) onlineUsers.value.splice(index, 1)
  }

  // 开始心跳检测
  const startPingInterval = () => {
    if (pingInterval.value) {
      clearInterval(pingInterval.value)
    }
    
    pingInterval.value = setInterval(() => {
      if (isReady.value) {
        socketService.ping()
      }
    }, 30000) // 每30秒发送一次心跳
  }

  // 停止心跳检测
  const stopPingInterval = () => {
    if (pingInterval.value) {
      clearInterval(pingInterval.value)
      pingInterval.value = null
    }
  }

  // 清除所有数据
  const clearData = () => {
    onlineUsers.value = []
    lastPingTime.value = 0
    stopPingInterval()
    connectionStatus.value = {
      connected: false,
      authenticated: false,
      reconnecting: false
    }
  }

  // 获取当前连接状态
  const getStatus = () => {
    return socketService.getConnectionStatus()
  }

  return {
    // 状态
    connectionStatus,
    onlineUsers,
    lastPingTime,
    
    // 计算属性
    isConnected,
    isAuthenticated,
    isReconnecting,
    connectionError,
    isReady,
    onlineStudents,
    onlineTeachers,
    
    // 方法
    initSocketListeners,
    updateConnectionStatus,
    addOrUpdateUser,
    removeUser,
    startPingInterval,
    stopPingInterval,
    clearData,
    getStatus
  }
})
