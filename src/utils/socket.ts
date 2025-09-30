/**
 * Socket.IO 工具函数
 */

import { computed } from 'vue'
import { io } from 'socket.io-client'
import { useStatus } from '@/store/status'
import { EventType, EntityMode } from '@/types'
import { encode, decode } from '@msgpack/msgpack'
import type { SubmitMessage, DispatchMessage, DiscussMessage, RequestMessage } from '@/types'

/**
 * 序列化数据（用于发送）
 */
function serializeData(data: any): Uint8Array {
  return encode(data)
}

/**
 * 反序列化数据（用于接收）
 */
function deserializeData(data: Uint8Array | ArrayBuffer): any {
  return decode(data as Uint8Array)
}

/**
 * 判断是否为 MessagePack 数据
 */
function isMessagePackData(data: any): boolean {
  return data instanceof Uint8Array || data instanceof ArrayBuffer
}

/**
 * Socket.IO 工具函数
 */
export function useSocket() {
  // 获取全局状态管理（socket 实例和事件处理器存储在这里）
  const status = useStatus()
  
  /**
   * Socket 是否就绪（已连接且实例存在）
   * 用于在发送消息前检查连接状态
   */
  const isReady = computed(() => 
    status.socketStatus.isConnected && status.socketStatus.socket !== null
  )

  /**
   * 连接到 Socket.IO 服务器
   * 
   * @param authInfo - 认证信息
   * 
   * @example
   * // 学生登录
   * await socket.connect({
   *   type: 'student',
   *   mode: EntityMode.GROUP,
   *   groupNo: '1'
   * })
   */
  const connect = (authInfo: {
    type: 'student' | 'teacher'
    mode?: EntityMode.GROUP
    studentNo?: string
    groupNo?: string
    studentRole?: string
  }): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 避免重复连接
      if (status.socketStatus.socket?.connected) {
        resolve()
        return
      }

      // 更新连接状态为正在连接
      status.socketStatus.isConnecting = true
      status.socketStatus.error = ''

      try {
        // 获取 Socket.IO 服务器地址（从环境变量）
        const baseUrl = import.meta.env.VITE_SOCKET_URL

        // 创建 Socket.IO 客户端实例
        // 连接到 /classroom namespace
        status.socketStatus.socket = io(`${baseUrl}/classroom`, {
          auth: authInfo,  // 认证信息会在连接时发送给服务器
          transports: ['websocket', 'polling']  // 优先 WebSocket，回退到轮询
        })

        const socket = status.socketStatus.socket

        // 监听连接成功事件
        socket.on('connect', () => {
          status.socketStatus.isConnected = true
          status.socketStatus.isConnecting = false
          resolve()
        })

        // 监听断开连接事件
        socket.on('disconnect', (reason) => {
          status.socketStatus.isConnected = false
          trigger('disconnect', reason)
        })

        // 监听业务事件（接收时反序列化 data 字段）
        socket.on('off_line', (data) => trigger('off_line', data))
        socket.on('error', (error) => trigger('error', error))
        
        socket.on('submit', (payload) => {
          if (payload.data && isMessagePackData(payload.data)) {
            payload.data = deserializeData(payload.data)
          }
          trigger('submit', payload)
        })
        
        socket.on('dispatch', (payload) => {
          if (payload.data && isMessagePackData(payload.data)) {
            payload.data = deserializeData(payload.data)
          }
          trigger('dispatch', payload)
        })
        
        socket.on('discuss', (payload) => {
          if (payload.data && isMessagePackData(payload.data)) {
            payload.data = deserializeData(payload.data)
          }
          trigger('discuss', payload)
        })
        
        socket.on('request', (payload) => {
          if (payload.data && isMessagePackData(payload.data)) {
            payload.data = deserializeData(payload.data)
          }
          trigger('request', payload)
        })

      } catch (error: any) {
        status.socketStatus.error = error.message
        status.socketStatus.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开 Socket.IO 连接并清理所有状态
   */
  const disconnect = () => {
    if (status.socketStatus.socket) {
      status.socketStatus.socket.disconnect()
      status.socketStatus.socket = null
    }
    status.socketStatus.isConnected = false
    status.socketStatus.isConnecting = false
    status.socketStatus.error = ''
    status.socketStatus.eventHandlers.clear()
  }

  /**
   * 发送 submit 消息（学生提交数据给教师）
   * data 字段会自动序列化为 MessagePack 格式
   * 
   * @param message - 消息对象（eventType 会自动添加，data 会自动序列化）
   * @throws Socket 未连接时抛出错误
   * 
   * @example
   * socket.submit({
   *   mode: EntityMode.GROUP,
   *   type: 'survey',
   *   data: { answers: ['A', 'B', 'C'] },
   *   from: null,
   *   to: {}
   * })
   */
  const submit = (message: Omit<SubmitMessage, 'eventType'>) => {
    if (!isReady.value || !status.socketStatus.socket) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? serializeData(message.data) : null,
      eventType: EventType.SUBMIT
    }
    status.socketStatus.socket.emit('submit', payload)
  }

  /**
   * 发送 dispatch 消息（教师广播消息给所有学生）
   * data 字段会自动序列化为 MessagePack 格式
   * 
   * @param message - 消息对象（eventType 会自动添加，data 会自动序列化）
   * @throws Socket 未连接时抛出错误
   * 
   * @example
   * // 广播投票结果
   * socket.dispatch({
   *   mode: EntityMode.GROUP,
   *   messageType: 'vote_A_B',
   *   activityIndex: '0',
   *   data: {
   *     result: 'A',
   *     countA: 15,
   *     countB: 10,
   *     photo: 'base64...',
   *     timestamp: Date.now()
   *   },
   *   from: null,
   *   to: {}
   * })
   */
  const dispatch = (message: Omit<DispatchMessage, 'eventType'>) => {
    if (!isReady.value || !status.socketStatus.socket) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? serializeData(message.data) : null,
      eventType: EventType.DISPATCH
    }
    status.socketStatus.socket.emit('dispatch', payload)
  }

  /**
   * 发送 discuss 消息（小组内讨论）
   * data 字段会自动序列化为 MessagePack 格式
   * 
   * @param message - 消息对象（eventType 会自动添加，data 会自动序列化）
   * @throws Socket 未连接时抛出错误
   * 
   * @example
   * socket.discuss({
   *   mode: EntityMode.GROUP,
   *   messageType: 'group_chat',
   *   data: { text: 'Hello!' },
   *   from: null,
   *   to: {}
   * })
   */
  const discuss = (message: Omit<DiscussMessage, 'eventType'>) => {
    if (!isReady.value || !status.socketStatus.socket) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? serializeData(message.data) : null,
      eventType: EventType.DISCUSS
    }
    status.socketStatus.socket.emit('discuss', payload)
  }

  /**
   * 发送 request 消息（请求数据）
   * data 字段会自动序列化为 MessagePack 格式
   * 
   * @param message - 消息对象（eventType 会自动添加，data 会自动序列化）
   * @throws Socket 未连接时抛出错误
   * 
   * @example
   * socket.request({
   *   mode: EntityMode.GROUP,
   *   messageType: 'get_stu_status',
   *   activityIndex: '0',
   *   data: null
   * })
   */
  const request = (message: Omit<RequestMessage, 'eventType'>) => {
    if (!isReady.value || !status.socketStatus.socket) throw new Error('Socket 未连接')
    const payload = {
      ...message,
      data: message.data ? serializeData(message.data) : null,
      eventType: EventType.REQUEST
    }
    status.socketStatus.socket.emit('request', payload)
  }

  /**
   * 注册事件监听器
   * 
   * @param event - 事件名称（如 'dispatch', 'submit', 'online', 'offline' 等）
   * @param handler - 事件处理函数
   * 
   * @example
   * const handleDispatch = (payload) => {
   *   console.log('收到广播:', payload)
   * }
   * socket.on('dispatch', handleDispatch)
   * 
   * @example
   * // 监听教师广播的活动切换
   * socket.on('dispatch', (payload) => {
   *   if (payload.messageType === 'change_activity') {
   *     const activityStatus = payload.data.activityStatus
   *     status.activityStatus.now = activityStatus.now
   *     router.push(`/student/activity${activityStatus.now}`)
   *   }
   * })
   */
  const on = <T = any>(event: string, handler: (data: T) => void) => {
    const handlers = status.socketStatus.eventHandlers
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
  }

  /**
   * 取消事件监听器
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数（可选）
   *   - 提供 handler：只移除该处理器
   *   - 不提供 handler：移除该事件的所有处理器
   * 
   * @example
   * // 移除特定处理器
   * socket.off('dispatch', handleDispatch)
   * 
   * @example
   * // 移除所有处理器
   * socket.off('dispatch')
   * 
   * 最佳实践：在组件卸载时取消监听
   * @example
   * onMounted(() => {
   *   socket.on('dispatch', handleDispatch)
   * })
   * 
   * onBeforeUnmount(() => {
   *   socket.off('dispatch', handleDispatch)
   * })
   */
  const off = (event: string, handler?: Function) => {
    const handlers = status.socketStatus.eventHandlers
    if (!handler) {
      handlers.delete(event)
      return
    }
    const eventSet = handlers.get(event)
    if (eventSet) {
      eventSet.delete(handler)
      if (eventSet.size === 0) handlers.delete(event)
    }
  }

  /**
   * 触发事件处理器（内部使用）
   * 
   * 当 Socket.IO 收到消息时调用，触发所有注册的处理器
   * 每个处理器都用 try-catch 包裹，单个处理器出错不影响其他处理器
   * 
   * @param event - 事件名称
   * @param data - 事件数据
   */
  const trigger = (event: string, data?: any) => {
    const handlers = status.socketStatus.eventHandlers.get(event)
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

  // 返回工具函数集合
  return {
    isReady,    // 计算属性：是否就绪
    connect,    // 连接到服务器
    disconnect, // 断开连接
    submit,     // 发送 submit 消息（学生 → 教师）
    dispatch,   // 发送 dispatch 消息（教师 → 学生）
    discuss,    // 发送 discuss 消息（小组内）
    request,    // 发送 request 消息（请求数据）
    on,         // 注册事件监听器
    off         // 取消事件监听器
  }
}