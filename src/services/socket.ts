import { io, Socket } from 'socket.io-client'
import type { AuthInfo, MessagePayload, AckResult, ConnectionStatus } from '@/types'
import { getSocketConfig } from '@/config/socket'

export class SocketService {
  private socket: Socket | null = null
  private connectionStatus: ConnectionStatus = {
    connected: false,
    authenticated: false,
    reconnecting: false
  }
  private eventCallbacks: Map<string, Function[]> = new Map()

  constructor() {
    this.initEventCallbacks()
  }

  private initEventCallbacks() {
    // 初始化事件回调映射（严格对齐文档事件）
    const events = [
      'connect', 'disconnect', 'authenticated', 'connect_error',
      'online', 'offline',
      'submit', 'distribute', 'discuss',
      'pong'
    ]
    events.forEach(event => {
      this.eventCallbacks.set(event, [])
    })
  }

  // 连接到服务器
  connect(authInfo: AuthInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const config = getSocketConfig()
        
        // 准备请求头参数
        const extraHeaders: Record<string, string> = {
          role: authInfo.role
        }
        
        // 根据角色添加相应的认证参数到请求头
        if (authInfo.role === 'student') {
          extraHeaders.class_no = authInfo.classNo
          extraHeaders.student_no = authInfo.studentNo.toString()
          extraHeaders.group_no = authInfo.groupNo.toString()
          extraHeaders.pin4 = authInfo.pin4
        } else {
          extraHeaders.username = authInfo.username
          extraHeaders.password = authInfo.password
        }
        
        // 使用完整 URL + 命名空间建立连接
        this.socket = io(`${config.url}${config.namespace}`, {
          extraHeaders
        })

        // 连接成功
        this.socket.on('connect', () => {
          this.connectionStatus.connected = true
          this.connectionStatus.reconnecting = false
          this.connectionStatus.error = undefined
          this.connectionStatus.authenticated = true // 连接成功即认为认证成功
          this.triggerCallbacks('connect')
          this.triggerCallbacks('authenticated')
          resolve() // 立即resolve，不等待额外的authenticated事件
        })

        // 认证成功（保留兼容性，如果后端发送此事件）
        this.socket.on('authenticated', (data) => {
          this.connectionStatus.authenticated = true
          this.triggerCallbacks('authenticated', data)
        })

        // 连接错误
        this.socket.on('connect_error', (error) => {
          this.connectionStatus.error = error.message
          this.connectionStatus.authenticated = false
          this.triggerCallbacks('connect_error', error)
          reject(error)
        })

        // 断开连接
        this.socket.on('disconnect', (reason) => {
          this.connectionStatus.connected = false
          this.connectionStatus.authenticated = false
          if (reason === 'io server disconnect') {
            // 服务器主动断开，需要重新连接
            this.socket?.connect()
          }
          this.triggerCallbacks('disconnect', reason)
        })

        // 重连中
        this.socket.on('reconnect_attempt', () => {
          this.connectionStatus.reconnecting = true
        })

        // 学生上线/下线（与文档一致）
        this.socket.on('online', (data) => {
          this.triggerCallbacks('online', data)
        })

        this.socket.on('offline', (data) => {
          this.triggerCallbacks('offline', data)
        })

        // 业务消息转发（可用于全局监听日志或调试）
        this.socket.on('submit', (payload: MessagePayload) => {
          this.triggerCallbacks('submit', payload)
        })
        this.socket.on('distribute', (payload: MessagePayload) => {
          this.triggerCallbacks('distribute', payload)
        })
        this.socket.on('discuss', (payload: MessagePayload) => {
          this.triggerCallbacks('discuss', payload)
        })

        // 心跳响应（兼容保留）
        this.socket.on('pong', (data) => {
          this.triggerCallbacks('pong', data)
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.connectionStatus = {
      connected: false,
      authenticated: false,
      reconnecting: false
    }
  }

  // 通用带 ACK 的发送
  emitWithAck<T extends AckResult = AckResult>(event: 'submit' | 'distribute' | 'discuss' | 'request', payload: MessagePayload, timeout = 8000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.socket || !this.connectionStatus.connected) {
        reject(new Error('Socket未连接'))
        return
      }

      let timer: any = null
      const ackHandler = (ack: T) => {
        if (timer) clearTimeout(timer)
        resolve(ack)
      }

      try {
        // 发送并等待 ACK
        ;(this.socket as Socket).emit(event, payload, ackHandler)
        // 超时处理
        timer = setTimeout(() => {
          reject(new Error(`ACK 超时: ${event}`))
        }, timeout)
      } catch (e) {
        if (timer) clearTimeout(timer)
        reject(e)
      }
    })
  }

  // 业务封装方法（均基于 ACK）
  submit(payload: MessagePayload, timeout?: number) {
    return this.emitWithAck('submit', payload, timeout)
  }
  distribute(payload: MessagePayload, timeout?: number) {
    return this.emitWithAck('distribute', payload, timeout)
  }
  discuss(payload: MessagePayload, timeout?: number) {
    return this.emitWithAck('discuss', payload, timeout)
  }
  request(payload: MessagePayload, timeout?: number) {
    return this.emitWithAck('request', payload, timeout)
  }

  // 发送心跳
  ping() {
    if (this.socket && this.connectionStatus.connected) {
      this.socket.emit('ping')
    }
  }

  // 注册事件监听器
  on(event: string, callback: Function) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event)?.push(callback)
  }

  // 移除事件监听器
  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventCallbacks.set(event, [])
      return
    }
    
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 触发回调函数
  private triggerCallbacks(event: string, data?: any) {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // 获取连接状态
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  // 检查是否已连接并认证
  isReady(): boolean {
    return this.connectionStatus.connected && this.connectionStatus.authenticated
  }
}

// 导出单例实例
export const socketService = new SocketService()
