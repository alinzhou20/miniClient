/**
 * Socket.IO 状态管理 - Pinia Store
 * 负责 WebSocket 连接管理、事件分发和消息序列化
 */

import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { encode, decode } from '@msgpack/msgpack'
import { ref } from 'vue'
import type { 
  User,
  SubmitEvent, 
  DispatchEvent, 
  DiscussEvent, 
  ReqEvent 
} from '@/type'

// 连接管理
export const useSocket = defineStore('socket', () => {
  
  // Socket 实例
  let socket: Socket | null = null
  
  // 响应式连接状态
  const connected = ref(false)
  
  // 事件处理器集合
  const handlers = new Map<string, Set<Function>>()

  
  // 触发事件处理器
  function trigger(event: string, data?: any): void {
    handlers.get(event)?.forEach(fn => {
      try {
        fn(data)
      } catch (err) {
        console.error(`[Socket] 事件处理失败 (${event}):`, err)
      }
    })
  }
  
  /**
   * 连接到 Socket.IO 服务器
   */
  const connect = (authInfo: User): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 避免重复连接
      if (socket) return resolve()
      
      // 标记首次连接结果是否已处理（防止重连时多次 resolve/reject）
      let isSettled = false

      const isDev = import.meta.env.DEV
      const baseUrl = isDev ? '' : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000')

      try {
        // 创建 Socket.IO 客户端
        socket = io(`${baseUrl}/classroom`, {
          auth: authInfo,
          transports: ['websocket', 'polling'],
          timeout: 10000,
        })

        // 连接成功
        socket.on('connect', () => {
          console.log('[Socket] ✅ 连接成功')
          connected.value = true
          trigger('connect')
          if (!isSettled) {
            isSettled = true
            resolve()
          }
        })

        // 连接失败
        socket.on('connect_error', (err) => {
          console.error('[Socket] ❌ 连接失败:', err.message)
          connected.value = false
          trigger('connect_error', err)
          if (!isSettled) {
            isSettled = true
            reject(err)
          }
        })

        // 断开连接
        socket.on('disconnect', (reason) => {
          console.log('[Socket] 🔌 断开连接:', reason)
          connected.value = false
          trigger('disconnect', reason)
        })

        // 注册业务事件（自动反序列化 MessagePack）
        const events = ['submit', 'dispatch', 'discuss', 'request']
        events.forEach(event => {
          socket!.on(event, (payload) => {
            // 反序列化 data 字段
            const decodedPayload = {
              ...payload,
              data: payload.data ? decode(payload.data) : null
            }
            trigger(event, decodedPayload)
          })
        })

      } catch (err) {
        socket = null
        reject(err)
      }
    })
  }

  /**
   * 断开连接并清理所有状态
   */
  const disconnect = (): void => {
    if (socket) {
      console.log('[Socket] 断开连接并清理')
      socket.disconnect()
      socket = null
    }
    connected.value = false
    handlers.clear()
  }

  /**
   * 发送消息（自动序列化 data 字段）
   */
  function emit(
    event: string, 
    message: SubmitEvent | DispatchEvent | DiscussEvent | ReqEvent
  ): void {
    if (!socket) throw new Error('Socket 未连接')
    socket.emit(event, {
      ...message,
      data: message.data ? encode(message.data) : null
    })
  }
 
  /**
   * 注册事件监听器
   */
  function on<T = any>(event: string, handler: (data: T) => void): void {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
  }

  /**
   * 取消事件监听器
   */
  function off(event: string, handler?: Function): void {
    if (!handler) {
      handlers.delete(event)
      return
    }
    const set = handlers.get(event)
    if (set) {
      set.delete(handler)
      if (set.size === 0) handlers.delete(event)
    }
  }
    
  return {
    // 响应式状态
    connected,
    
    // 连接管理
    connect,
    disconnect,
    emit,
    on,
    off,
  }
})

