<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useStuStatus, useSocket } from '@/store'

const router = useRouter()
const socket = useSocket()
const status = useStuStatus()

// 监听教师切换活动
function onChangeActivity(payload: any) {
  if (!payload || payload.messageType !== 'change_activity') return
  
  const activityStatus = payload.data?.activityStatus
  if (!activityStatus) return
  
  // 更新活动状态
  status.current = activityStatus.now
  
  // 同步路由
  router.push(`/student/activity${activityStatus.now}`)
}

onMounted(() => {
  socket.on('dispatch', onChangeActivity)
})

onBeforeUnmount(() => {
  socket.off('dispatch', onChangeActivity)
})
</script>