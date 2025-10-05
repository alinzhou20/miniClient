<template>
  <div class="sleep-page">
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket, useActivity } from '@/store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const socket = useSocket()
const activity = useActivity()

// 监听教师发送的问卷
function onSyncQuestionnaire(payload: any) {
  if (!payload || payload.messageType !== 'sync_questionnaire') return
  
  const questionnaire = payload.data?.questionnaire
  if (!questionnaire) return
  
  // 更新本地问卷
  activity.questionnaire = questionnaire
  
  // 提示消息
  ElMessage.success('已收到教师发送的问卷，即将跳转')
  
  // 跳转到活动3
  setTimeout(() => {
    router.push('/student/activity3')
  }, 500)
}

// 统一的 dispatch 事件处理
function handleDispatch(payload: any) {
  if (!payload) return
  
  // 根据消息类型分发到不同的处理函数
  switch (payload.messageType) {
    case 'sync_questionnaire':
      onSyncQuestionnaire(payload)
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

<style scoped>
.sleep-page {
  width: 100vw;
  height: 100vh;
  background: #ffffff;
}
</style>

