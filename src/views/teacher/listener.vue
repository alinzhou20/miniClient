<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useSocket, useStatus } from '@/store'
import { teaAc1 } from '@/store/activity/activity1'
import { teaAc2 } from '@/store/activity/activity2'
import { teaAc3 } from '@/store/activity/activity3'

const socket = useSocket()
const status = useStatus()
const ac1 = teaAc1()
const ac2 = teaAc2()
const ac3 = teaAc3()

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
  
  // 存储格式：{ groupNo: { photo1: '...', photo2: '...' } }
  ac1.stuPhoto[groupNo] = {
    photo1: data.photo1,
    photo2: data.photo2,
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

// 统一的 submit 事件处理
function handleSubmit(payload: any) {
  if (!payload || !payload.messageType) return
  
  const { messageType } = payload

  // 根据不同的消息类型处理
  switch (messageType) {
    case 'activity1_photo_submit':
      onActivity1PhotoSubmit(payload)
      break
    case 'activity2_1_submit':
      onActivity2ScreenshotSubmit(payload)
      break
    case 'activity2_2_submit':
      onActivity3ScreenshotSubmit(payload)
      break
    default:
      // console.log('[Teacher Listener] 未知的消息类型:', messageType)
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

