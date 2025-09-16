<template>
  <div class="page">
    <!-- 顶部标题横幅（参考课本风格） -->
    <div class="banner">
      <div class="banner-inner">
        <div class="banner-badge">第 5 课</div>
        <h1 class="title">算法中的数据</h1>
      </div>
    </div>

    <!-- 你将学习（参考书本风格的浅色框） -->
    <section class="learn-box">
      <div class="learn-title">你将学习</div>
      <ol class="learn-list">
        <li>算法的有穷性。</li>
        <li>算法的确定性。</li>
        <li>算法要有输出。</li>
      </ol>
    </section>

    <div class="section-title">讨论</div>

    <section class="question-card">
      <div class="img-wrap draw-wrap">
        <img :src="questionImg" alt="question" ref="imgRef" @load="syncCanvasSize" />
        <canvas ref="canvasRef"
                class="draw-layer"
                @mousedown="onPointerDown"
                @mousemove="onPointerMove"
                @mouseup="onPointerUp"
                @mouseleave="onPointerUp"
                @touchstart.prevent="onTouchStart"
                @touchmove.prevent="onTouchMove"
                @touchend.prevent="onTouchEnd"></canvas>
      </div>
      <div class="draw-actions">
        <el-button size="small" @click="toggleDraw" :type="isDrawing ? 'warning' : 'info'">
          {{ isDrawing ? '正在圈画（红笔）' : '开始圈画' }}
        </el-button>
        <el-button size="small" @click="clearStrokes" :disabled="!strokes.length" type="default">清除圈画</el-button>
        <el-button size="small" type="danger" @click="submitDrawing" :disabled="!strokes.length">提交圈画</el-button>
      </div>
      <p class="prompt">你认为在该小票中有哪些数据？</p>
      <el-input
        v-model="answer"
        type="textarea"
        :rows="4"
        placeholder="请输入你的答案..."
      />
      <div class="actions">
        <el-button type="primary" :loading="sending" @click="submitAnswer">提交答案</el-button>
        <el-button type="success" plain @click="goChat" style="margin-left: 8px">进入 AI 对话</el-button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import questionImg from '@/public/question.png'
import { useAuthStore } from '@/stores/auth'
import { socketService } from '@/services/socket'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const answer = ref('')
const sending = ref(false)
let hasSentLogin = false
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
    // 让 canvas 叠加在图片上
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
  // 绘制当前笔画
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
    const msg = {
      type: 'submit',
      from: {
        groupNo: toStr(auth.currentUser.groupNo),
        studentNo: toStr(auth.currentUser.studentNo)
      },
      to: teacherTarget,
      data: { 
        title: 'question', 
        strokes: strokes.value,
        width: canvasRef.value?.width || 0,
        height: canvasRef.value?.height || 0
      }
    }
    socketService.sendMessage(msg as any)
    ElMessage.success('圈画已提交')
    // 可选择清空
    // clearStrokes()
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  }
}

// 构建教师目标（字符串数组）
const teacherTarget = {
  groupNo: ['0'],
  studentNo: ['0']
}

// 将数字转字符串，保证严格按字符串发送
const toStr = (v: any) => (v != null ? String(v) : '')

const sendLoginMessage = () => {
  if (!auth.currentUser || hasSentLogin) return
  if (auth.currentUser.role !== 'student') return
  try {
    const msg = {
      type: 'submit',
      from: {
        groupNo: toStr(auth.currentUser.groupNo),
        studentNo: toStr(auth.currentUser.studentNo)
      },
      to: teacherTarget,
      data: { title: '登录' }
    }
    socketService.sendMessage(msg as any)
    hasSentLogin = true
  } catch (e: any) {
    // 仅提示，不中断
    ElMessage.error(e?.message || '发送登录消息失败')
  }
}

const submitAnswer = async () => {
  if (!auth.currentUser) {
    ElMessage.error('未登录，无法提交')
    return
  }
  if (!answer.value.trim()) {
    ElMessage.warning('请先填写答案')
    return
  }
  sending.value = true
  try {
    const msg = {
      type: 'submit',
      from: {
        groupNo: toStr(auth.currentUser.groupNo),
        studentNo: toStr(auth.currentUser.studentNo)
      },
      to: teacherTarget,
      data: { title: '前测', content: answer.value.trim() }
    }
    socketService.sendMessage(msg as any)
    ElMessage.success('已提交')
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  // 进入页面即发送登录消息
  sendLoginMessage()
})

function goChat() {
  router.push('/student/chat')
}
</script>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
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
}
.learn-box {
  background: #f7fbff;
  border: 1px dashed #cfe8ff;
  border-radius: 12px;
  padding: 14px 16px;
  margin: 16px 0 12px;
}
.learn-title {
  display: inline-block;
  background: #e9f6ff;
  border-radius: 10px;
  padding: 4px 10px;
  color: #2b6aa6;
  font-weight: 700;
  margin-bottom: 8px;
}
.learn-list { margin: 8px 0 0 18px; color: #2b2b2b; }
.learn-list li { margin: 4px 0; }
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
