<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket } from '@/store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const socket = useSocket()
const status = useStatus()

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
  ElMessage.info(`教师已切换到${activityTitle}`)
}

// 监听教师拍摄的活动照片
function onTakePhoto(payload: any) {
  if (!payload || payload.messageType !== 'take_photo') return
  
  const photo = payload.data?.photo
  if (!photo) return
}

onMounted(() => {
  socket.on('dispatch', onChangeActivity)
})

onBeforeUnmount(() => {
  socket.off('dispatch', onChangeActivity)
})
</script>