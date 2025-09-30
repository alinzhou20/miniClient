/**
 * 全局状态管理 - 只提供状态变量
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Socket } from 'socket.io-client'

/**
 * 用户认证状态
 */
export const useStatus = defineStore('status', () => {

  // 用户状态
  const userStatus = ref<{
    type: 'student' | 'teacher'
    groupNo?: string
    studentNo?: string
    studentRole?: string
  } | null>(null)

  // Socket 连接状态
  const socketStatus = ref({
    // Socket 客户端实例
    socket: null as Socket | null,
    eventHandlers: new Map<string, Set<Function>>(),
    isConnected: false,
    isConnecting: false,
    error: ''
  })

  // 活动状态
  const activityStatus = ref({
    now: 0,
    0: true,
    1: false,
    2: false,
    3: false
  })

  return {
    userStatus,
    activityStatus,
    socketStatus
  }
})