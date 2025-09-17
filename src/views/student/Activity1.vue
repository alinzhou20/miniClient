<template>
  <div class="page">
    <!-- 操作要求模块 -->

    <div class="content">
      <div class="left">
        <div class="task-block">
      <div class="op-title">1.了解数据获取方式及场景</div>
      <div class="op-text">打开“近视率”网页，找一找2024年全国儿童青少年总体近视率是</div>
      <a
        class="op-link"
        href="https://mp.weixin.qq.com/s/wy7cgUqfgRBDsUoCXyAcGw?click_id=2"
        target="_blank"
        rel="noopener noreferrer"
      >https://mp.weixin.qq.com/s/wy7cgUqfgRBDsUoCXyAcGw?click_id=2</a>
    </div>
      </div>
      <div class="right">
        <div class="task-block">
      <div class="op-title">2.试一试</div>
      <div class="op-text">选一选，不同场景下可以采取哪种数据获取方式</div>

      <div class="elements">
          <div
            v-for="e in availableElements"
            :key="e.id"
            class="draggable"
            :class="{ dragging: isDragging && draggingElement === e.id }"
            title="按住拖动到右侧任一区域"
            @mousedown="onMouseDown(e.id, $event)"
          >
            {{ e.title }}
          </div>
        </div>
        <button class="btn" @click="onResetAll">重置全部</button>
    </div>
        <div class="grid" ref="gridRef">
          <div
            v-for="b in boxes"
            :key="b"
            class="box"
            :class="['tone-' + b, { pulse: pulseBox === b }]"
            :ref="el => setBoxRef(b, el as HTMLDivElement | null)"
          >
            <div class="box-items">
              <span
                v-for="itm in elementsInBox(b)"
                :key="itm.id"
                class="tag"
              >{{ itm.title }}</span>
            </div>
            <div class="box-title">{{ boxLabels[b] }}</div>
          </div>
        </div>
        <!-- 拖动中的浮动元素 -->
        <div
          v-if="isDragging"
          class="floating"
          :class="{ snapping }"
          :style="{ left: (snapping ? snapPos.x : dragPos.x) + 'px', top: (snapping ? snapPos.y : dragPos.y) + 'px' }"
        >
          {{ elementTitle(draggingElement) }}
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { socketService } from '@/services/socket'

const boxes = ['A','B','C','D'] as const
type BoxId = typeof boxes[number]
// 区域中文标签
const boxLabels: Record<BoxId, string> = {
  A: '现场记录',
  B: '问卷调查',
  C: '网络获取',
  D: '设备采集'
}

// 元素定义（七个）
type ElementId =
  | 'check_vision'
  | 'register_vision'
  | 'bad_habits'
  | 'usage_duration'
  | 'common_devices'
  | 'survey_all_devices'
type ElementItem = { id: ElementId; title: string }
const elements: Readonly<ElementItem[]> = [
  { id: 'check_vision', title: '测量新生身高数据' },
  { id: 'register_vision', title: '获取保护视力的方法' },
  { id: 'survey_all_devices', title: '调查全校学生数字设备使用情况' },
  { id: 'bad_habits', title: '记录课堂重点知识' },
  { id: 'usage_duration', title: '了解当天天气数据' },
  { id: 'common_devices', title: '2024年全国出生人口' },
] as const

const isDragging = ref(false)
const draggingElement = ref<ElementId | ''>('')
const hasSubmittedAll = ref(false)
const selections = ref<Record<ElementId, BoxId | ''>>({
  check_vision: '',
  register_vision: '',
  bad_habits: '',
  usage_duration: '',
  common_devices: '',
  survey_all_devices: ''
})

// 左侧仅展示尚未放置到任何区域的元素
const availableElements = computed(() => elements.filter(it => !selections.value[it.id]))

// 拖拽渲染与命中检测
const dragPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const snapping = ref(false)
const snapPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const pulseBox = ref<BoxId | ''>('')
const gridRef = ref<HTMLDivElement | null>(null)
const boxRefs = ref<Record<BoxId, HTMLDivElement | null>>({ A: null, B: null, C: null, D: null })
function setBoxRef(b: BoxId, el: HTMLDivElement | null) {
  boxRefs.value[b] = el
}

const auth = useAuthStore()
const groupNo = computed(() => String(auth.currentUser?.groupNo ?? ''))
const studentNo = computed(() => String(auth.currentUser?.studentNo ?? ''))

function onMouseDown(e: ElementId, ev: MouseEvent) {
  ev.preventDefault()
  draggingElement.value = e
  isDragging.value = true
  dragPos.value = { x: ev.clientX, y: ev.clientY }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(ev: MouseEvent) {
  if (!isDragging.value) return
  dragPos.value = { x: ev.clientX, y: ev.clientY }
}

async function onMouseUp(ev: MouseEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  const hit = hitTest(ev.clientX, ev.clientY)
  const e = draggingElement.value as ElementId
  if (!hit) {
    draggingElement.value = ''
    return
  }
  // 计算目标中心点，执行吸附动画
  const target = boxRefs.value[hit]
  if (target) {
    const rect = target.getBoundingClientRect()
    snapPos.value = { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
    snapping.value = true
    pulseBox.value = hit
  }
  // 动画结束后提交
  setTimeout(async () => {
    selections.value[e] = hit
    // 如果全部元素都已放置，则一次性批量发送所有映射
    const allPlaced = elements.every(it => selections.value[it.id] !== '')
    const g = groupNo.value
    const s = studentNo.value
    if (allPlaced && g && s && !hasSubmittedAll.value) {
      try {
        for (const it of elements) {
          const box = selections.value[it.id] as BoxId
          const payload = {
            type: 'activity1_drag',
            from: { groupNo: g, studentNo: s },
            data: { elementId: it.id, boxId: box, action: 'select' },
            at: Date.now()
          }
          await socketService.submit(payload as any)
        }
        hasSubmittedAll.value = true
      } catch {}
    }
    draggingElement.value = ''
    snapping.value = false
    // 结束脉冲效果
    setTimeout(() => { if (pulseBox.value === hit) pulseBox.value = '' }, 250)
  }, 180)
}

function hitTest(cx: number, cy: number): BoxId | '' {
  const entries: Array<[BoxId, HTMLDivElement | null]> = [
    ['A', boxRefs.value.A],
    ['B', boxRefs.value.B],
    ['C', boxRefs.value.C],
    ['D', boxRefs.value.D]
  ]
  for (const [id, el] of entries) {
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
      return id
    }
  }
  return ''
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})

function elementsInBox(b: BoxId): ElementItem[] {
  return elements.filter(it => selections.value[it.id] === b)
}

function elementTitle(id: ElementId | ''): string {
  const it = elements.find(x => x.id === id)
  return it ? it.title : ''
}

async function onResetAll() {
  const g = groupNo.value
  const s = studentNo.value
  const had = (id: ElementId) => selections.value[id] !== ''
  // 先本地清空
  for (const it of elements) selections.value[it.id] = ''
  hasSubmittedAll.value = false
  if (!g || !s) return
  // 分别通知服务端
  for (const { id } of elements) {
    if (!had(id)) continue
    const payload = {
      type: 'activity1_drag',
      from: { groupNo: g, studentNo: s },
      data: { elementId: id, action: 'reset' },
      at: Date.now()
    }
    try { await socketService.submit(payload as any) } catch {}
  }
}
</script>

<style scoped>
.page { padding: 16px; }
.task-block { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; }
.op-title { font-weight: 700; margin-bottom: 6px; color: #111827; }
.op-text { color: #374151; font-size: 14px; margin-bottom: 6px; }
.op-link { color: #1d4ed8; text-decoration: underline; word-break: break-all; }

.title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
.content { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
.left { display: grid; gap: 10px; }
.elements { display: flex; flex-wrap: wrap; gap: 8px; }
.draggable {
  user-select: none;
  width: 160px;
  padding: 12px 8px;
  text-align: center;
  background: #f5f7ff;
  color: #3a57e8;
  border: 1px dashed #9aa5ff;
  border-radius: 10px;
  transition: transform .15s ease;
  font-size: 13px;
}
.draggable.dragging { opacity: .85; transform: scale(0.98); }
.tip { font-size: 12px; color: #555; }
.sel { margin-left: 6px; }
.btn { margin-top: 4px; padding: 6px 10px; background: #91e89a; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 8px; cursor: pointer; }
.op-drag-tip { font-size: 14px; color: #334155; margin-bottom: 8px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 10px; }

.grid { display: grid; grid-template-columns: repeat(2, minmax(160px, 1fr)); gap: 10px; }
.box {
  min-height: 96px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #333;
  background: #fafafa;
  flex-direction: column;
}
.box-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
.box-items { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; padding: 2px; }
.tag { background: #eef2ff; border: 1px solid #c7d2fe; color: #1e3a8a; border-radius: 999px; padding: 2px 6px; font-size: 11px; }
.box.pulse { box-shadow: 0 0 0 0 rgba(48,97,255,0.35); animation: pulse 0.8s ease-out 1; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(48,97,255,0.45); }
  100% { box-shadow: 0 0 0 14px rgba(48,97,255,0); }
}

/* 与教师端统一的区域配色（A绿、B橙、C蓝、D红） */
.tone-A { border-color: #16a34a; background: #f0fdf4; }
.tone-B { border-color: #f59e0b; background: #fffbeb; }
.tone-C { border-color: #3b82f6; background: #eff6ff; }
.tone-D { border-color: #ef4444; background: #fef2f2; }

.floating {
  position: fixed;
  left: 0; top: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
  padding: 8px 10px;
  background: #eef2ff;
  color: #2f3fb0;
  border: 1px dashed #9aa5ff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}
.floating.snapping { transition: left .18s ease, top .18s ease; }
</style>
