// 用户角色类型
export type UserRole = 'student' | 'teacher'

// 学生认证信息
export interface StudentAuth {
  role: 'student'
  classNo: string
  studentNo: number
  groupNo: number
  pin4: string
}

// 教师认证信息
export interface TeacherAuth {
  role: 'teacher'
  username: string
  password: string
}

// 统一认证信息类型
export type AuthInfo = StudentAuth | TeacherAuth

// 用户信息
export interface User {
  role: UserRole
  classNo?: string
  studentNo?: number
  groupNo?: number
  username?: string
  realName?: string
}

// 消息发送者/接收者
export interface MessageTarget {
  classNo?: string
  groupNo?: number
  studentNo?: number
  broadcast?: boolean
}

// 消息数据
export interface MessageData {
  type: string
  content: string
  timestamp?: number
}

// 完整消息结构
export interface Message {
  code?: number
  from: MessageTarget
  to: MessageTarget
  data: MessageData
  at?: number
}

// Socket连接状态
export interface ConnectionStatus {
  connected: boolean
  authenticated: boolean
  reconnecting: boolean
  error?: string
}

// 在线用户状态
export interface OnlineUser {
  user: User
  status: 'online' | 'offline'
  timestamp: number
}
