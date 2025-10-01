/**
 * 全局消息处理器 - 业务逻辑层
 * 负责处理 Socket.IO 的 4 种事件：submit、dispatch、discuss、request
 */

import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'


const router = useRouter()
const {on} = useSocket()

export function initMessageHandlers() {
  import { useSocket, useStatus, useActivity } from '@/store'
  on('change_activity', onChangeActivity)
}

// 监听活动切换
function onChangeActivity(payload: any) {
  if (!payload || payload.messageType !== 'change_activity') return

  const activityStatus = payload.data?.activityStatus
  if (!activityStatus) return

  // 更新活动状态
  activityStatus.value = activityStatus

  // 同步路由
  router.push(`/student/activity${activityStatus.now}`)

  // 提示消息
  const activityTitle = activityStatus.value.all.find((a: any) => a.id === activityStatus.value.now)?.title || '活动'
  ElMessage.info(`教师已切换到${activityTitle}`)
}

export function initMessageHandlers() {
  on('change_activity', onChangeActivity)
}

