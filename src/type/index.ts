/**
 * 统一类型定义入口
 */

// 事件和消息类型
export {
  EventType,
} from './event.js'

export type { 
  BaseEvent,
  SubmitEvent,
  DispatchEvent,
  DiscussEvent,
  ReqEvent,
} from './event.js'

// 数据模型
export type { UserModel, MessageModel } from './model.js'

// 状态类型
export type {
  User,
  Activity,
  Rating,
} from './status.js'
