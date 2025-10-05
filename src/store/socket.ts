/**
 * Socket.IO 状态管理 - Pinia Store
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { EntityMode } from '@/types'
import { encode, decode } from '@msgpack/msgpack'
import type { SubmitMessage, DispatchMessage, DiscussMessage, RequestMessage } from '@/types'

// ==================== Socket Store ====================

export const useSocket = defineStore('socket', () => {
  
  // Socket 实例
  const socket = ref<Socket | null>(null)
  // 事件处理器
  const eventHandlers = ref<Map<string, Set<Function>>>(new Map())

  // 触发事件处理器
  function trigger(event: string, data?: any) {
    const handlers = eventHandlers.value.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`[Socket] 事件处理失败 (${event}):`, error)
        }
      })
    }
  }

  // 连接到 Socket.IO 服务器
  const connect = (authInfo: {
    type: 'student' | 'teacher'
    mode?: EntityMode
    studentNo?: string
    groupNo?: string
    studentRole?: string
  }): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 避免重复连接
      if (socket.value !== null) {
        resolve()
        return
      }

      try {
        // 在开发环境使用相对路径（通过 Vite 代理），生产环境使用环境变量
        const isDev = import.meta.env.DEV
        const baseUrl = isDev ? '' : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000')

        console.log(`[Socket] 正在连接到: ${baseUrl || window.location.origin}/classroom`)
        console.log(`[Socket] 模式: ${isDev ? '开发环境（使用 Vite 代理）' : '生产环境'}`)

        // 创建 Socket.IO 客户端实例
        socket.value = io(`${baseUrl}/classroom`, {
          auth: authInfo,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        })

        const socketInstance = socket.value

        // 监听连接成功事件
        socketInstance.on('connect', () => {
          console.log('[Socket] ✅ 连接成功')
          resolve()
        })

        // 监听连接错误
        socketInstance.on('connect_error', (error) => {
          console.error('[Socket] ❌ 连接失败:', error.message)
          console.error(`[Socket] 请确保服务器运行在 ${baseUrl}`)
        })

        // 监听断开连接事件
        socketInstance.on('disconnect', (reason) => {
          console.log('[Socket] 断开连接:', reason)
          trigger('disconnect', reason)
        })

        // 监听重连尝试
        socketInstance.io.on('reconnect_attempt', (attempt) => {
          console.log(`[Socket] 正在尝试重连... (第 ${attempt} 次)`)
        })

        // 监听重连成功
        socketInstance.io.on('reconnect', (attempt) => {
          console.log(`[Socket] ✅ 重连成功 (尝试了 ${attempt} 次)`)
        })

        // 监听业务事件（接收时反序列化 data 字段）
        socketInstance.on('error', (errorData) => trigger('error', errorData))
        
        socketInstance.on('submit', (payload) => {
            payload.data = decode(payload.data)
          trigger('submit', payload)
        })
        
        socketInstance.on('dispatch', (payload) => {
          payload.data = decode(payload.data)
          trigger('dispatch', payload)
        })
        
        socketInstance.on('discuss', (payload) => {
          payload.data = decode(payload.data)
          trigger('discuss', payload)
        })
        
        socketInstance.on('request', (payload) => {
          payload.data = decode(payload.data)
          trigger('request', payload)
        })

      } catch (err: any) {
        socket.value = null
        reject(err)
      }
    })
  }

  /**
   * 断开 Socket.IO 连接并清理所有状态
   */
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    eventHandlers.value.clear()
  }

  // ==================== 消息发送 ====================
  
  /**
   * 发送 submit 消息（学生提交数据给教师）
   */
  const submit = (message: SubmitMessage) => {
    if (!socket.value) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? encode(message.data) : null,
    }
    socket.value.emit('submit', payload)
  }

  /**
   * 发送 dispatch 消息（教师广播消息给所有学生）
   */
  const dispatch = (message: DispatchMessage) => {
    if (!socket.value) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? encode(message.data) : null,
    }
    socket.value.emit('dispatch', payload)
  }

  /**
   * 发送 discuss 消息（小组内讨论）
   */
  const discuss = (message: DiscussMessage) => {
    if (!socket.value) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? encode(message.data) : null,
    }
    socket.value.emit('discuss', payload)
  }

  /**
   * 发送 request 消息（请求数据）
   */
  const request = (message: RequestMessage) => {
    if (!socket.value) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? encode(message.data) : null,
    }
    socket.value.emit('request', payload)
  }

  // ==================== 事件监听管理 ====================
  
  /**
   * 注册事件监听器
   */
  const on = <T = any>(event: string, handler: (data: T) => void) => {
    if (!eventHandlers.value.has(event)) {
      eventHandlers.value.set(event, new Set())
    }
    eventHandlers.value.get(event)!.add(handler)
  }

  /**
   * 取消事件监听器
   */
  const off = (event: string, handler?: Function) => {
    if (!handler) {
      eventHandlers.value.delete(event)
      return
    }
    const eventSet = eventHandlers.value.get(event)
    if (eventSet) {
      eventSet.delete(handler)
      if (eventSet.size === 0) {
        eventHandlers.value.delete(event)
      }
    }
  }
  
  return {
    // 状态
    socket,
    eventHandlers,
    
    // 计算属性
    
    // 方法
    connect,
    disconnect,
    submit,
    dispatch,
    discuss,
    request,
    on,
    off,
  }
})

