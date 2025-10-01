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
        // 获取 Socket.IO 服务器地址（从环境变量）
        const baseUrl = import.meta.env.VITE_SOCKET_URL

        // 创建 Socket.IO 客户端实例
        socket.value = io(`${baseUrl}/classroom`, {
          auth: authInfo,
          transports: ['websocket', 'polling']
        })

        const socketInstance = socket.value

        // 监听连接成功事件
        socketInstance.on('connect', () => {
          resolve()
        })

        // 监听断开连接事件
        socketInstance.on('disconnect', (reason) => {
          trigger('disconnect', reason)
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

