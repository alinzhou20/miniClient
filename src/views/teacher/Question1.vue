<template>
  <div class="page">
    <h2 class="title">提交查看</h2>
    <div v-if="drawings.length" class="thumb-list">
      <div class="thumb-item" v-for="(d, idx) in drawings" :key="d.at" @click="openPreview(idx)">
        <div class="thumb-wrap">
          <img :src="questionImg" class="thumb-img" :ref="el => setThumbImgRef(el as HTMLImageElement, idx)" @load="onThumbImgLoad(idx)" />
          <canvas class="thumb-canvas" :ref="el => setThumbCanvasRef(el as HTMLCanvasElement, idx)"></canvas>
        </div>
        <div class="thumb-meta">第{{ d.groupNo }}组 / 学号 {{ d.studentNo }} · {{ new Date(d.at).toLocaleTimeString() }}</div>
      </div>
    </div>
    <div v-else class="empty">暂无学生提交</div>

    <!-- 预览大图弹窗 -->
    <el-dialog v-model="previewVisible" title="圈画预览" width="60%" :close-on-click-modal="true" @closed="closePreview">
      <div class="big-wrap">
        <img :src="questionImg" ref="bigImgRef" class="big-img" @load="onBigImgLoad" />
        <canvas ref="bigCanvasRef" class="big-canvas"></canvas>
      </div>
    </el-dialog>
  </div>
  
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { socketService } from '@/services/socket'
import questionImg from '@/public/question.png'

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
  if (drawings.length > 50) drawings.splice(50)
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
  const srcW = entry.width || img.naturalWidth || 0
  const srcH = entry.height || img.naturalHeight || 0
  const targetW = Math.max(1, Math.round(srcW / 4))
  const targetH = Math.max(1, Math.round(srcH / 4))
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

// 预览
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

function handleMessage(message: any) {
  if (!message || message.type !== 'submit') return
  const from = message.from || {}
  const data = message.data || {}
  if (!from.groupNo || !from.studentNo) return
  if (String(data.title || '') === 'question' && Array.isArray((data as any).strokes)) {
    const strokes = (data as any).strokes
    const w = Number((data as any).width) || 0
    const h = Number((data as any).height) || 0
    const g = String(from.groupNo)
    const s = String(from.studentNo)
    pushDrawing(g, s, strokes, w, h)
  }
}

onMounted(() => {
  socketService.on('message', handleMessage)
})
onBeforeUnmount(() => {
  socketService.off('message', handleMessage)
})
</script>

<style scoped>
.page { padding: 8px; }
.title { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 8px; }
.empty { color: #666; font-size: 12px; }
.thumb-list { display: flex; flex-wrap: wrap; gap: 8px; }
.thumb-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; background: #fff; cursor: pointer; }
.thumb-wrap { position: relative; display: inline-block; }
.thumb-img { display: block; }
.thumb-canvas { position: absolute; left: 0; top: 0; }
.thumb-meta { font-size: 11px; color: #666; margin-top: 4px; }
.big-wrap { position: relative; }
.big-img { display: block; width: 100%; height: auto; }
.big-canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
</style>
