<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket, useActivity } from '@/store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

// 监听教师切换活动
function onChangeActivity(payload: any) {
  if (!payload || payload.messageType !== 'change_activity') return
  
  const activityStatus = payload.data?.activityStatus
  if (!activityStatus) return
  
  // 更新活动状态
  status.activityStatus = activityStatus
  
  // 同步路由
  router.push(`/student/activity${activityStatus.now}`)
  
  // 提示消息
  const activityTitle = status.activityStatus.all.find(a => a.id === activityStatus.now)?.title || '活动'
  // ElMessage.info(`教师已切换到${activityTitle}`)
}

// 监听教师发送的问卷
function onSyncQuestionnaire(payload: any) {
  if (!payload || payload.messageType !== 'sync_questionnaire') return
  
  const questionnaire = payload.data?.questionnaire
  if (!questionnaire) return
  
  // 更新本地问卷
  activity.questionnaire = questionnaire
  
  // 提示消息
  ElMessage.success('已收到教师发送的问卷')
}

// 监听教师拍摄的活动照片
function onTakePhoto(payload: any) {
  if (!payload || payload.messageType !== 'take_photo') return
  
  const photo = payload.data?.photo
  if (!photo) return
}

// 统一的 dispatch 事件处理
function handleDispatch(payload: any) {
  if (!payload) return
  
  // 根据消息类型分发到不同的处理函数
  switch (payload.messageType) {
    case 'change_activity':
      onChangeActivity(payload)
      break
    case 'sync_questionnaire':
      onSyncQuestionnaire(payload)
      break
    case 'take_photo':
      onTakePhoto(payload)
      break
  }
}

onMounted(() => {
  socket.on('dispatch', handleDispatch)
})

onBeforeUnmount(() => {
  socket.off('dispatch', handleDispatch)
})
</script>