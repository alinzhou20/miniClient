<template>
  <div class="page">
    <h1 class="title">课堂看板</h1>

    <div class="layout">
      <div class="main">
        <div class="groups">
          <div
            v-for="g in 18"
            :key="g"
            class="group-card"
          >
            <div class="group-head">第{{ g }}组</div>
            <div class="group-body">
              <div class="student-slot">
                <span class="dot" :class="{ on: !!groups[g-1].left }"></span>
                <span class="stu-no">{{ groups[g-1].left || '空' }}</span>
                <span v-if="groups[g-1].left && drawCount(String(g), groups[g-1].left) > 0" class="badge">{{ drawCount(String(g), groups[g-1].left) }}</span>
              </div>
              <span class="v-sep"></span>
              <div class="student-slot">
                <span class="dot" :class="{ on: !!groups[g-1].right }"></span>
                <span class="stu-no">{{ groups[g-1].right || '空' }}</span>
                <span v-if="groups[g-1].right && drawCount(String(g), groups[g-1].right) > 0" class="badge">{{ drawCount(String(g), groups[g-1].right) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交查看：显示已提交的圈画缩略图 -->
        <div class="review" v-if="drawings.length">
          <div class="review-title">提交查看</div>
          <div class="thumb-list">
            <div class="thumb-item" v-for="(d, idx) in drawings" :key="d.at" @click="openPreview(idx)">
              <div class="thumb-wrap">
                <img :src="questionImg" class="thumb-img" :ref="el => setThumbImgRef(el as HTMLImageElement, idx)" @load="onThumbImgLoad(idx)" />
                <canvas class="thumb-canvas" :ref="el => setThumbCanvasRef(el as HTMLCanvasElement, idx)"></canvas>
              </div>
              <div class="thumb-meta">第{{ d.groupNo }}组 / 学号 {{ d.studentNo }} · {{ new Date(d.at).toLocaleTimeString() }}</div>
            </div>
          </div>
        </div>
      </div>
      <aside class="aside">
        <div class="overview-card">
          <div class="ov-title">总览</div>
          <div class="ov-item">
            <span class="ov-label">已登录</span>
            <span class="ov-value">{{ loggedInCount }} / 36</span>
          </div>
          <div class="ov-progress">
            <div class="bar">
              <div class="bar-inner" :style="{ width: percent + '%' }"></div>
            </div>
            <div class="ov-percent">{{ percent }}%</div>
          </div>
        </div>

        <!-- 完成情况表 -->
        <div class="overview-card activity-card">
          <div class="ov-title">完成情况</div>
          <div class="ov-item" v-for="a in activities" :key="a.key">
            <span class="ov-label">{{ a.title }}</span>
            <span class="ov-value">{{ activityCount[a.key] }} / 36</span>
          </div>
          <div class="ov-progress" v-for="a in activities" :key="a.key + '-bar'">
            <div class="bar">
              <div class="bar-inner" :style="{ width: activityPercent[a.key] + '%' }"></div>
            </div>
            <div class="ov-percent">{{ activityPercent[a.key] }}%</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 预览大图弹窗：点击缩略图打开 -->
    <el-dialog v-model="previewVisible" title="圈画预览" width="60%" :close-on-click-modal="true" @closed="closePreview">
      <div class="big-wrap">
        <img :src="questionImg" ref="bigImgRef" class="big-img" @load="onBigImgLoad" />
        <canvas ref="bigCanvasRef" class="big-canvas"></canvas>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { socketService } from '@/services/socket'
import questionImg from '@/public/question.png'

// 18个小组，每组2个位置：left/right；值为学号字符串，空为 ''
const groups = reactive(Array.from({ length: 18 }, () => ({ left: '', right: '' })))

// 活动定义与完成集（以 学生唯一键 group-student 记录）
type ActivityKey = 'a1' | 'a2' | 'a3'
const activities: Array<{ key: ActivityKey; title: string }> = [
  { key: 'a1', title: '算法有穷性' },
  { key: 'a2', title: '算法确定性' },
  { key: 'a3', title: '算法有输出' }
];

// 预览大图弹窗
const previewVisible = ref(false)
const previewIdx = ref<number | null>(null)
const bigImgRef = ref<HTMLImageElement | null>(null)
const bigCanvasRef = ref<HTMLCanvasElement | null>(null)
function openPreview(idx: number) { previewIdx.value = idx; previewVisible.value = true; nextTick(() => tryDrawBig()) }
function closePreview() { previewVisible.value = false; previewIdx.value = null }
function onBigImgLoad() { tryDrawBig() }
function tryDrawBig() {
  if (previewIdx.value == null) return
  const entry = drawings[previewIdx.value]
  const img = bigImgRef.value
  const canvas = bigCanvasRef.value
  if (!entry || !img || !canvas) return
  // 大图按容器显示尺寸绘制，保持与图片像素对齐
  const rect = img.getBoundingClientRect()
  const srcW = entry.width || img.naturalWidth || rect.width
  const srcH = entry.height || img.naturalHeight || rect.height
  canvas.width = Math.round(rect.width)
  canvas.height = Math.round(rect.height)
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e53935'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const scaleX = canvas.width / (srcW || canvas.width)
  const scaleY = canvas.height / (srcH || canvas.height)
  for (const s of entry.strokes || []) {
    if (!Array.isArray(s) || s.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(s[0].x * scaleX, s[0].y * scaleY)
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x * scaleX, s[i].y * scaleY)
    ctx.stroke()
  }
}
const doneSets = reactive<Record<ActivityKey, Set<string>>>(
  {
    a1: new Set<string>(),
    a2: new Set<string>(),
    a3: new Set<string>()
  }
)
const studentKey = (groupNo: string, studentNo: string) => `${groupNo}-${studentNo}`

// 学生圈画数据存储：key=group-student，仅保留最新一次提交
type LatestDrawing = { strokes: any[]; width: number; height: number; at: number }
const drawStore = reactive(new Map<string, LatestDrawing>())
function recordDrawing(groupNo: string, studentNo: string, payload: { strokes: any[]; width?: number; height?: number }) {
  const key = studentKey(groupNo, studentNo)
  drawStore.set(key, {
    strokes: payload.strokes || [],
    width: Number(payload.width) || 0,
    height: Number(payload.height) || 0,
    at: Date.now()
  })
}
function drawCount(groupNo: string, studentNo: string): number {
  const key = studentKey(groupNo, studentNo)
  return drawStore.has(key) ? 1 : 0
}

// 提交查看区：保留最近 N 条圈画提交（含源尺寸，便于缩放绘制）
type DrawingEntry = { groupNo: string; studentNo: string; strokes: any[]; width: number; height: number; at: number }
const drawings = reactive<DrawingEntry[]>([])
const thumbImgRefs = ref<HTMLImageElement[]>([])
const thumbCanvasRefs = ref<HTMLCanvasElement[]>([])
function setThumbImgRef(el: HTMLImageElement | null, idx: number) { if (el) thumbImgRefs.value[idx] = el }
function setThumbCanvasRef(el: HTMLCanvasElement | null, idx: number) { if (el) thumbCanvasRefs.value[idx] = el }

function pushDrawing(groupNo: string, studentNo: string, strokes: any[], width = 0, height = 0) {
  const at = Date.now()
  // 若已存在同一组同一学号，替换为最新并移至顶部
  const idx = drawings.findIndex(d => d.groupNo === groupNo && d.studentNo === studentNo)
  if (idx >= 0) drawings.splice(idx, 1)
  drawings.unshift({ groupNo, studentNo, strokes, width, height, at })
  // 仅保留最近50条
  if (drawings.length > 50) drawings.splice(50)
  // 等待DOM后尝试绘制（onload也会触发）
  nextTick(() => {
    drawings.forEach((_, i) => tryDrawThumb(i))
  })
}

function onThumbImgLoad(idx: number) { tryDrawThumb(idx) }
function tryDrawThumb(idx: number) {
  const img = thumbImgRefs.value[idx]
  const canvas = thumbCanvasRefs.value[idx]
  const entry = drawings[idx]
  if (!img || !canvas || !entry) return
  // 目标缩放：统一缩小为原始尺寸的 1/4
  const srcW = entry.width || img.naturalWidth || 0
  const srcH = entry.height || img.naturalHeight || 0
  // 按 1/4 等比缩放
  const targetW = Math.max(1, Math.round(srcW / 4))
  const targetH = Math.max(1, Math.round(srcH / 4))
  // 设置缩略图显示尺寸（图片与画布一致）
  img.style.width = `${targetW}px`
  img.style.height = `${targetH}px`
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e53935'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const scaleX = targetW / (srcW || targetW)
  const scaleY = targetH / (srcH || targetH)
  for (const s of entry.strokes || []) {
    if (!Array.isArray(s) || s.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(s[0].x * scaleX, s[0].y * scaleY)
    for (let i = 1; i < s.length; i++) {
      ctx.lineTo(s[i].x * scaleX, s[i].y * scaleY)
    }
    ctx.stroke()
  }
}

function placeStudent(groupNo: string, studentNo: string) {
  let g = parseInt(groupNo, 10)
  if (!Number.isFinite(g) || g < 1) g = 1
  if (g > 18) g = 18
  const s = String(studentNo)

  const grp = groups[g - 1]
  if (!grp.left && !grp.right) {
    grp.left = s
    return
  }
  if (grp.left && !grp.right) {
    const l = parseInt(grp.left, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns < l) {
      grp.right = grp.left
      grp.left = s
    } else if (ns !== l) {
      grp.right = s
    }
    return
  }
  if (!grp.left && grp.right) {
    const r = parseInt(grp.right, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns < r) {
      grp.left = s
    } else if (ns !== r) {
      grp.left = grp.right
      grp.right = s
    }
    return
  }
  if (grp.left && grp.right) {
    const l = parseInt(grp.left, 10) || 0
    const r = parseInt(grp.right, 10) || 0
    const ns = parseInt(s, 10) || 0
    if (ns === l || ns === r) return
    if (ns < l) {
      groups[g - 1] = { left: s, right: grp.left }
    } else if (ns > r) {
      groups[g - 1].right = s
    } else if (ns > l && ns < r) {
      groups[g - 1].right = s
    }
  }
}

function handleMessage(message: any) {
  if (!message || message.type !== 'submit') return
  const from = message.from || {}
  const data = message.data || {}
  if (!from.groupNo || !from.studentNo) return
  if (data.title === '登录') {
    placeStudent(String(from.groupNo), String(from.studentNo))
  }
  // 圈画题：记录学生提交的圈画数据
  if (String(data.title || '') === 'question' && Array.isArray((data as any).strokes)) {
    const strokes = (data as any).strokes
    const w = Number((data as any).width) || 0
    const h = Number((data as any).height) || 0
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    recordDrawing(g, s, { strokes, width: w, height: h })
    pushDrawing(g, s, strokes, w, h)
  }
  // 记录活动完成：根据 data.title 匹配三项活动
  const title = String(data.title || '')
  const key: ActivityKey | '' = title === '数据我看看' ? 'a1' : title === '维数据我用用' ? 'a2' : title === '维数据我编编' ? 'a3' : ''
  if (key !== '') {
    const sk = studentKey(String(from.groupNo), String(from.studentNo))
    doneSets[key].add(sk)
  }
}

onMounted(() => {
  socketService.on('message', handleMessage)
})

onBeforeUnmount(() => {
  socketService.off('message', handleMessage)
})

// 统计：已登录人数与百分比
const loggedInCount = computed(() =>
  groups.reduce((acc, g) => acc + (g.left ? 1 : 0) + (g.right ? 1 : 0), 0)
)
const percent = computed(() => Math.round((loggedInCount.value / 36) * 100))

// 活动完成统计与百分比
const activityCount = computed<Record<ActivityKey, number>>(() => ({
  a1: doneSets.a1.size,
  a2: doneSets.a2.size,
  a3: doneSets.a3.size
}))
const activityPercent = computed<Record<ActivityKey, number>>(() => ({
  a1: Math.round((doneSets.a1.size / 36) * 100),
  a2: Math.round((doneSets.a2.size / 36) * 100),
  a3: Math.round((doneSets.a3.size / 36) * 100)
}))
</script>

<style scoped>
.page {
  max-width: 840px; /* 收窄但留出侧栏空间 */
  margin: 0 auto;
  padding: 8px 6px;
}
.title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 200px; /* 主区 + 右侧总览 */
  gap: 8px;
}
.main { min-width: 0; }
.groups {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 每行3组，共6行=18组 */
  gap: 6px; /* 更紧凑 */
}
.group-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 8px;
  background: #fff;
}
.group-head {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}
.group-body {
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* 左学生 | 竖线 | 右学生 */
  align-items: center;
  gap: 6px;
}
.student-slot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: transparent;
}
.dot.on {
  background: #67c23a;
  border-color: #67c23a;
}
.stu-no {
  font-size: 11px;
  color: #333;
  line-height: 1;
}
.v-sep {
  width: 1px;
  height: 14px;
  background: #e5e7eb;
  display: inline-block;
}

/* 右侧总览样式 */
.aside { min-width: 0; }
.overview-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 8px;
}
.overview-card + .overview-card { margin-top: 8px; }
.ov-title {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}
.ov-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  margin-bottom: 8px;
}
.ov-label { color: #666; }
.ov-value { color: #111; font-weight: 700; }
.ov-progress { display: flex; align-items: center; gap: 8px; }
.bar {
  position: relative;
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.bar-inner {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #67c23a;
  border-radius: 999px;
}
.ov-percent { font-size: 12px; color: #333; width: 40px; text-align: right; }

/* 提交查看缩略图样式 */
.review { margin-top: 10px; }
.review-title { font-size: 12px; font-weight: 700; color: #333; margin: 6px 0; }
.thumb-list { display: flex; flex-wrap: wrap; gap: 8px; }
.thumb-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; background: #fff; }
.thumb-wrap { position: relative; display: inline-block; }
.thumb-img { display: block; }
.thumb-canvas { position: absolute; left: 0; top: 0; }
.thumb-meta { font-size: 11px; color: #666; margin-top: 4px; }
</style>
