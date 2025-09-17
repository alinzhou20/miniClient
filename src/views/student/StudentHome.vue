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

const router = useRouter()
const route = useRoute()

const currentActivity = computed<'activity1' | 'activity2'>(() => {
  const p = String(route.path || '')
  return p.includes('activity2') ? 'activity2' : 'activity1'
})

const learnTitle = computed(() => currentActivity.value === 'activity2' ? '活动二' : '活动一')
const learnItems = computed<string[]>(() =>
  currentActivity.value === 'activity2'
    ? ['问卷调查巧设计']
    : ['认识数据获取的多种方法', '将元素拖入对应方法区域完成分类']
)

function onDistribute(payload: any) {
  if (!payload) return
  const type = String(payload.type || '')
  const data = payload.data || {}
  if (type === 'navigate' && String((data as any).route || '') === 'activity2') {
    router.push('/student/activity2')
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
