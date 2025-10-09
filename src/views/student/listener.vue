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

// 监听其他学生的设计提交
function onActivity2_2Discuss(payload: any) {
  if (!payload || payload.messageType !== 'activity2_2_discuss') return
  
  const data = payload.data || {}
  const groupNo = payload.from?.groupNo
  console.log(`[Student Listener] `,payload)
  
  if (!groupNo) return
  
  // 更新 ac2_2_allDesignResult（包含rating和挑战级别信息）
  activity.ac2_2_allDesignResult[groupNo] = {
    designQuestion: data.designQuestion || null,
    rating: data.rating || [],
    great: data.great || 0,
    submittedAt: data.submittedAt || Date.now(),
    challengeLevel: data.challengeLevel || null
  }
  
  // console.log(`[Student Listener] 收到第${groupNo}组的设计`)
}

// 监听点赞消息
function onActivity2_2LikeDiscuss(payload: any) {
  if (!payload || payload.messageType !== 'activity2_2_like_discuss') return
  
  const data = payload.data || {}
  const groupNo = data.groupNo
  
  if (!groupNo) return
  
  // 更新对应小组的点赞数
  const groupResult = activity.ac2_2_allDesignResult[groupNo]
  if (groupResult) {
    groupResult.great = data.great || 0
    // console.log(`[Student Listener] 第${groupNo}组点赞数更新为 ${groupResult.great}`)
  }
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

// 统一的 discuss 事件处理
function handleDiscuss(payload: any) {
  if (!payload) return
  
  // 根据消息类型分发到不同的处理函数
  switch (payload.messageType) {
    case 'activity2_2_discuss':
      onActivity2_2Discuss(payload)
      break
    case 'activity2_2_like_discuss':
      onActivity2_2LikeDiscuss(payload)
      break
  }
}

onMounted(() => {
  socket.on('dispatch', handleDispatch)
  socket.on('discuss', handleDiscuss)
  // console.log('[Student Listener] 开始监听 dispatch 和 discuss 消息')
})

onBeforeUnmount(() => {
  socket.off('dispatch', handleDispatch)
  socket.off('discuss', handleDiscuss)
  // console.log('[Student Listener] 停止监听 dispatch 和 discuss 消息')
})
</script>