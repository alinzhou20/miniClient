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

// 与文档一致的统一消息载荷
export interface MessagePayload {
  type: string
  from?: {
    groupNo?: string
    studentNo?: string
  }
  to?: {
    groupNo?: string[]
    studentNo?: string[]
  }
  data: any
  at: number
}

// ACK 返回结构
export interface AckResult {
  code: number
  message: string
  data?: any
  at: number
}

// Socket连接状态
export interface ConnectionStatus {
  connected: boolean
  authenticated: boolean
  reconnecting: boolean
  error?: string
}

// 在线/离线事件载荷（与文档一致）
export interface OnlineEvent {
  studentNo: number
  groupNo: number
  at: number
}
