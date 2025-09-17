<template>
  <section class="question-card">
    <div class="img-wrap draw-wrap">
      <img :src="questionImg" alt="question" ref="imgRef" @load="syncCanvasSize" />
      <canvas
        ref="canvasRef"
        class="draw-layer"
        @mousedown="onPointerDown"
        @mousemove="onPointerMove"
        @mouseup="onPointerUp"
        @mouseleave="onPointerUp"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      ></canvas>
    </div>
    <div class="draw-actions">
      <el-button size="small" @click="toggleDraw" :type="isDrawing ? 'warning' : 'info'">
        {{ isDrawing ? '正在圈画（红笔）' : '开始圈画' }}
      </el-button>
      <el-button size="small" @click="clearStrokes" :disabled="!strokes.length" type="default">清除圈画</el-button>
      <el-button size="small" type="danger" @click="submitDrawing" :disabled="!strokes.length">提交圈画</el-button>
    </div>
    <p class="prompt">你认为在该小票中有哪些数据？</p>
    <el-input v-model="answer" type="textarea" :rows="4" placeholder="请输入你的答案..." />
    <div class="actions">
      <el-button type="primary" :loading="sending" @click="submitAnswer">提交答案</el-button>
      <el-button type="success" plain @click="goChat" style="margin-left: 8px">进入 AI 对话</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import questionImg from '@/public/question.png'
import { useAuthStore } from '@/stores/auth'
import { socketService } from '@/services/socket'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const answer = ref('')
const sending = ref(false)
const router = useRouter()

// 圈画数据结构：每个笔画由一组点组成，每点为 {x, y}
type Point = { x: number; y: number }
const strokes = ref<Point[][]>([])
const currentStroke = ref<Point[] | null>(null)
const isDrawing = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

function syncCanvasSize() {
  nextTick(() => {
    const img = imgRef.value
    const canvas = canvasRef.value
    if (!img || !canvas) return
    const rect = img.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
  })
}

function getCanvasPos(e: MouseEvent | Touch) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const x = ('clientX' in e ? e.clientX : 0) - rect.left
  const y = ('clientY' in e ? e.clientY : 0) - rect.top
  return { x, y }
}

function redraw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e53935'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (const s of strokes.value) {
    if (s.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(s[0].x, s[0].y)
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y)
    ctx.stroke()
  }
  if (currentStroke.value && currentStroke.value.length > 1) {
    const s = currentStroke.value
    ctx.beginPath()
    ctx.moveTo(s[0].x, s[0].y)
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y)
    ctx.stroke()
  }
}

function onPointerDown(e: MouseEvent) {
  if (!isDrawing.value) return
  currentStroke.value = []
  const p = getCanvasPos(e)
  currentStroke.value.push(p)
}
function onPointerMove(e: MouseEvent) {
  if (!isDrawing.value || !currentStroke.value) return
  const p = getCanvasPos(e)
  currentStroke.value.push(p)
  redraw()
}
function onPointerUp() {
  if (!isDrawing.value || !currentStroke.value) return
  if (currentStroke.value.length > 1) strokes.value.push(currentStroke.value)
  currentStroke.value = null
  redraw()
}

function onTouchStart(e: TouchEvent) {
  if (!isDrawing.value) return
  const t = e.touches[0]
  currentStroke.value = [getCanvasPos(t)]
}
function onTouchMove(e: TouchEvent) {
  if (!isDrawing.value || !currentStroke.value) return
  const t = e.touches[0]
  currentStroke.value.push(getCanvasPos(t))
  redraw()
}
function onTouchEnd() {
  if (!isDrawing.value || !currentStroke.value) return
  if (currentStroke.value.length > 1) strokes.value.push(currentStroke.value)
  currentStroke.value = null
  redraw()
}

function toggleDraw() { isDrawing.value = !isDrawing.value }
function clearStrokes() { strokes.value = []; redraw() }

function submitDrawing() {
  if (!auth.currentUser) { ElMessage.error('未登录'); return }
  if (!strokes.value.length) { ElMessage.warning('请先圈画'); return }
  try {
    const payload = {
      type: 'question',
      from: {
        groupNo: toStr(auth.currentUser.groupNo),
        studentNo: toStr(auth.currentUser.studentNo)
      },
      data: {
        title: 'question',
        strokes: strokes.value,
        width: canvasRef.value?.width || 0,
        height: canvasRef.value?.height || 0
      },
      at: Date.now()
    } as any
    socketService.submit(payload)
    ElMessage.success('圈画已提交')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  }
}

const toStr = (v: any) => (v != null ? String(v) : '')

const submitAnswer = async () => {
  if (!auth.currentUser) { ElMessage.error('未登录，无法提交'); return }
  if (!answer.value.trim()) { ElMessage.warning('请先填写答案'); return }
  sending.value = true
  try {
    const payload = {
      type: 'answer',
      from: {
        groupNo: toStr(auth.currentUser.groupNo),
        studentNo: toStr(auth.currentUser.studentNo)
      },
      data: { title: '前测', content: answer.value.trim() },
      at: Date.now()
    } as any
    await socketService.submit(payload)
    ElMessage.success('已提交')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    sending.value = false
  }
}

function goChat() { router.push('/student/chat') }
</script>

<style scoped>
.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.img-wrap { width: 100%; margin-bottom: 12px; display: flex; justify-content: center; }
.img-wrap img { max-width: 420px; border-radius: 8px; }
.draw-wrap { position: relative; }
.draw-layer {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  pointer-events: auto;
}
.draw-actions { display: flex; gap: 8px; margin: 6px 0 10px; }
.prompt { margin: 8px 0 12px; color: #333; }
.actions { margin-top: 8px; }
</style>
