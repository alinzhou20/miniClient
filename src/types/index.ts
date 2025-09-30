/**
 * 统一类型定义入口
 */

// 事件和消息类型
export {
  EventType,
  EntityMode,
} from './event.js'

export type { 
  BaseMessage,
  SubmitMessage,
  DispatchMessage,
  DiscussMessage,
  RequestMessage,
  EntityRestoreMessages,
  TeacherRestoreMessages,
} from './event.js'

// 数据模型
export type { EntityModel, MessageModel } from './model.js'

// 认证类型
export type {
  UserRole,
  StudentAuth,
  TeacherAuth,
  AuthInfo,
  User,
  ConnectionStatus,
} from './auth.js'