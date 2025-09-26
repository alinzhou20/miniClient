<template>
  <div class="page">
    <!-- 顶部标题横幅（参考课本风格） -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">数据获取</h1>
      </div>
    </div>

    <!-- 你将学习（参考书本风格的浅色框） -->
    <section class="learn-box">
      <div class="learn-title">{{ learnTitle }}</div>
      <ol class="learn-list">
        <li v-for="(it, i) in learnItems" :key="i">{{ it }}</li>
      </ol>
    </section>

    <!-- 学生内容区：通过子路由切换（question1/activity1/chat） -->
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { socketService } from '@/services/socket'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const currentActivity = computed<'activity1' | 'activity2' | 'activity3' | 'activity4' | 'activity5' | 'activity6' | 'activity7'>(() => {
  const p = String(route.path || '')
  if (p.includes('activity7')) return 'activity7'
  if (p.includes('activity6')) return 'activity6'
  if (p.includes('activity5')) return 'activity5'
  if (p.includes('activity4')) return 'activity4'
  if (p.includes('activity3')) return 'activity3'
  if (p.includes('activity2')) return 'activity2'
  return 'activity1'
})

const learnTitle = computed(() => {
  if (currentActivity.value === 'activity7') return '活动七'
  if (currentActivity.value === 'activity6') return '活动六'
  if (currentActivity.value === 'activity5') return '活动五'
  if (currentActivity.value === 'activity4') return '活动四'
  if (currentActivity.value === 'activity3') return '活动三'
  if (currentActivity.value === 'activity2') return '活动二'
  return '活动一'
})
const learnItems = computed<string[]>(() => {
  if (currentActivity.value === 'activity7') return ['智能问题设计活动']
  if (currentActivity.value === 'activity6') return ['AI学习助手活动']
  if (currentActivity.value === 'activity5') return ['快速投票活动']
  if (currentActivity.value === 'activity4') return ['摄像头拍照记录']
  if (currentActivity.value === 'activity3') return ['协作问卷设计']
  if (currentActivity.value === 'activity2') return ['问卷调查巧设计']
  return ['数据获取方法多']
})

function onDistribute(payload: any) {
  if (!payload) return
  const type = String(payload.type || '')
  const data = payload.data || {}
  
  if (type === 'navigate') {
    const targetRoute = String((data as any).route || '')
    if (targetRoute === 'activity1') {
      router.push('/student/activity1')
      ElMessage.info('教师已通知前往活动一')
      console.log('收到教师端导航指令：前往活动一')
    } else if (targetRoute === 'activity2') {
      router.push('/student/activity2')
      ElMessage.info('教师已通知前往活动二')
      console.log('收到教师端导航指令：前往活动二')
    } else if (targetRoute === 'activity3') {
      router.push('/student/activity3')
      ElMessage.info('教师已通知前往活动三')
      console.log('收到教师端导航指令：前往活动三')
    } else if (targetRoute === 'activity4') {
      router.push('/student/activity4')
      ElMessage.info('教师已通知前往活动四')
      console.log('收到教师端导航指令：前往活动四')
    } else if (targetRoute === 'activity5') {
      router.push('/student/activity5')
      ElMessage.info('教师已通知前往活动五')
      console.log('收到教师端导航指令：前往活动五')
    } else if (targetRoute === 'activity6') {
      router.push('/student/activity6')
      ElMessage.info('教师已通知前往活动六')
      console.log('收到教师端导航指令：前往活动六')
    } else if (targetRoute === 'activity7') {
      router.push('/student/activity7')
      ElMessage.info('教师已通知前往活动七')
      console.log('收到教师端导航指令：前往活动七')
    }
  }
}

onMounted(() => {
  socketService.on('distribute', onDistribute)
})

onBeforeUnmount(() => {
  socketService.off('distribute', onDistribute)
})
</script>

<style scoped>
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 8px 6px;
}
.banner {
  background: linear-gradient(180deg, #4ea3f9 0%, #6cc2ff 60%, #e9f6ff 100%);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  margin-bottom: 16px;
  color: #0b3a6d;
}
.banner-inner { display: flex; align-items: center; gap: 14px; }
.banner-badge {
  background: #fff;
  color: #2d6cb3;
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.title {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
  margin: 0;
  color: #F5F7FA;
}
.learn-box {
  background: #f7fbff;
  border: 1px dashed #cfe8ff;
  border-radius: 12px;
  padding: 10px 12px;
  margin: 16px 0 12px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.learn-title {
  display: inline-block;
  background: #e9f6ff;
  border-radius: 10px;
  padding: 4px 10px;
  color: #2b6aa6;
  font-weight: 700;
  margin: 0; /* 横向布局去掉底部外边距 */
  white-space: nowrap;
}
.learn-list {
  margin: 0; /* 横向布局，取消默认缩进 */
  padding: 0;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #2b2b2b;
}
.learn-list li { margin: 0; }
@media (max-width: 640px) {
  .learn-box { flex-direction: column; align-items: flex-start; }
  .learn-list { flex-direction: column; align-items: flex-start; gap: 6px; }
}
.section-title {
  margin: 10px 0 8px;
  color: #2b6aa6;
  font-weight: 700;
}
.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.img-wrap {
  width: 100%;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}
.img-wrap img {
  max-width: 420px; /* 缩小图片尺寸 */
  border-radius: 8px;
}
.draw-wrap { position: relative; }
.draw-layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  /* 宽高在syncCanvasSize里动态设置，与图片一致 */
  pointer-events: auto;
}
.draw-actions { display: flex; gap: 8px; margin: 6px 0 10px; }
.prompt {
  margin: 8px 0 12px;
  color: #333;
}
.actions { margin-top: 8px; }
</style>
