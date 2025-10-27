<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useSocket, useTeaStatus } from '@/store'
import { useTeaAc1 } from '@/store/activity/activity1'
import { useTeaAc2 } from '@/store/activity/activity2'
import { useTeaAc3 } from '@/store/activity/activity3'

const socket = useSocket()
const teaStatus = useTeaStatus()
const ac1 = useTeaAc1()
const ac2 = useTeaAc2()
const ac3 = useTeaAc3()

// 处理登录
function onLogin(payload: any) {
  const { from } = payload
  if (!from?.studentNo ) return
  teaStatus.students[from.studentNo].login = true
}

// 处理登出
function onLogout(payload: any) {
  const { from } = payload
  if (!from?.studentNo) return
  teaStatus.students[from.studentNo].login = false
}

// 处理评分更新（rating_update）
function onRatingUpdate(payload: any) {
  const { from, data } = payload
  if (!from?.studentNo || !data?.name || data?.star === undefined) return
  
  const studentNo = from.studentNo
  const name = data.name as 'activity1' | 'activity2' | 'activity3'
  const stars = data.star
  
  // 更新对应学生的活动星数
  if (teaStatus.students[studentNo] && ['activity1', 'activity2', 'activity3'].includes(name)) {
    teaStatus.students[studentNo][name] = stars
    console.log(`[Teacher] 更新学生 ${studentNo} 的 ${name}: ${stars} 星`)
  }
}

// 处理活动1照片提交（48张图片）
function onActivity1PhotoSubmit(payload: any) {
  const { data } = payload
  if (!data || !data.groupNo) return
  
  const groupNo = parseInt(data.groupNo)
  if (isNaN(groupNo)) return
  
  // 每个小组提交两张照片，共24个小组 = 48张图片
  if (!ac1.stuPhoto) {
    ac1.stuPhoto = {}
  }
  
  // 存储格式：{ groupNo: { photo1: '...', photo2: '...', label1: '...', label2: '...' } }
  ac1.stuPhoto[groupNo] = {
    photo1: data.photo1,
    photo2: data.photo2,
    label1: data.label1,
    label2: data.label2,
    submittedAt: data.submittedAt
  }
}

// 处理活动2截图提交（24张截图）
function onActivity2ScreenshotSubmit(payload: any) {
  const { data } = payload
  if (!data || !data.groupNo) return
  
  const groupNo = parseInt(data.groupNo)
  if (isNaN(groupNo)) return
  
  // 每个小组提交一张截图，共24个小组 = 24张图片
  if (!ac2.stuScreenshot) {
    ac2.stuScreenshot = {}
  }
  
  ac2.stuScreenshot[groupNo] = data.screenshot
}

// 处理活动3截图提交（24张截图）
function onActivity3ScreenshotSubmit(payload: any) {
  const { data } = payload
  if (!data || !data.groupNo) return
  
  const groupNo = parseInt(data.groupNo)
  if (isNaN(groupNo)) return
  
  // 每个小组提交一张截图，共24个小组 = 24张图片
  if (!ac3.stuScreenshot) {
    ac3.stuScreenshot = {}
  }
  
  ac3.stuScreenshot[groupNo] = data.screenshot
}



// 处理学生端活动评分更新
function onActivityUpdate(payload: any) {
  const { from, data } = payload
  if (!from?.studentNo || !data) return
  
  const studentNo = from.studentNo
  const activityScores = data as Record<string, number>
  
  // 更新学生的活动分数
  if (teaStatus.students[studentNo]) {
    if (activityScores.activity1 !== undefined) {
      teaStatus.students[studentNo].activity1 = activityScores.activity1
    }
    if (activityScores.activity2 !== undefined) {
      teaStatus.students[studentNo].activity2 = activityScores.activity2
    }
    if (activityScores.activity3 !== undefined) {
      teaStatus.students[studentNo].activity3 = activityScores.activity3
    }
    console.log(`[Teacher] 更新学生 ${studentNo} 评分:`, activityScores)
  }
}

// 统一的 submit 事件处理
function handleSubmit(payload: any) {
  if (!payload || !payload.messageType) return
  
  const { messageType } = payload

  // 根据不同的消息类型处理
  switch (messageType) {
    case 'login':
      onLogin(payload)
      break
    case 'logout':
      onLogout(payload)
      break
    case 'activity-update':
      onActivityUpdate(payload)
      break
    case 'rating_update':
      onRatingUpdate(payload)
      break
    case 'activity1_photo_submit':
      onActivity1PhotoSubmit(payload)
      break
    case 'activity1_label_update':
      onActivity1PhotoSubmit(payload)
      break
    case 'activity2_1_submit':
      onActivity2ScreenshotSubmit(payload)
      break
    case 'activity2_2_submit':
      onActivity3ScreenshotSubmit(payload)
      break
    default:
      break
  }
}

onMounted(() => {
  socket.on('submit', handleSubmit)
  // console.log('[Teacher Listener] 开始监听 submit 消息')
})

onBeforeUnmount(() => {
  socket.off('submit', handleSubmit)
  // console.log('[Teacher Listener] 停止监听 submit 消息')
})
</script>

