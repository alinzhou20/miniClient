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

function onDispatch(payload: any) {
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

onMounted(() => {
  socket.on('dispatch', onDispatch)
})

onBeforeUnmount(() => {
  socket.off('dispatch', onDispatch)
})
</script>