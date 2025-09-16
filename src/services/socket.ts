import { io, Socket } from 'socket.io-client'
import type { AuthInfo, Message, ConnectionStatus } from '@/types'
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
    // 初始化事件回调映射
    const events = ['connect', 'disconnect', 'authenticated', 'connect_error', 'user_online', 'user_offline', 'message', 'pong']
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
        
        // 创建socket连接 - 同源自动推断（不手写URL），仅指定命名空间
        // 学生端在浏览器访问教师机IP:端口时，将自动连接到相同来源（教师机IP:端口）
        this.socket = io(config.namespace, {
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

        // 用户上线/下线
        this.socket.on('user_online', (data) => {
          this.triggerCallbacks('user_online', data)
        })

        this.socket.on('user_offline', (data) => {
          this.triggerCallbacks('user_offline', data)
        })

        // 接收消息
        this.socket.on('message', (message: Message) => {
          this.triggerCallbacks('message', message)
        })

        // 心跳响应
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

  // 发送消息
  sendMessage(message: Message) {
    if (this.socket && this.connectionStatus.authenticated) {
      this.socket.emit('message', message)
    } else {
      throw new Error('Socket未连接或未认证')
    }
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
