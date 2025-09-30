/**
 * 认证相关类型定义
 */

import type { EntityMode } from './event.js'

/**
 * 用户角色
 */
export type UserRole = 'student' | 'teacher'

/**
 * 学生认证信息
 */
export interface StudentAuth {
  type: 'student'
  classNo?: string
  studentNo: string
  groupNo: string
  pin4?: string
  mode?: EntityMode
  studentRole?: string
}

/**
 * 教师认证信息
 */
export interface TeacherAuth {
  type: 'teacher'
  username?: string
  password?: string
}

/**
 * 统一认证信息类型
 */
export type AuthInfo = StudentAuth | TeacherAuth

/**
 * 用户信息
 */
export interface User {
  type: UserRole
  classNo?: string
  studentNo?: string
  groupNo?: string
  username?: string
  realName?: string
  entityId?: string
}

/**
 * Socket 连接状态
 */
export interface ConnectionStatus {
  connected: boolean
  authenticated: boolean
  reconnecting: boolean
  error?: string
}
