<template>
  <div class="main-content">
    <!-- 顶部区域：评价标准 -->
    <div class="card evaluation-card">
      <div class="evaluation-header">
        <h3 class="card-title">评价标准</h3>
        <div class="criteria-grid">
          <div 
            v-for="rating in activity.ac4_stuResult?.rating" 
            :key="rating.index" 
            class="criterion-item"
            :class="{ 'completed': rating.score === 1 }"
          >
            <span class="criterion-text">{{ rating.criteria }}</span>
            <span class="star">{{ rating.score === 1 ? '⭐' : '' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务区域 -->
    <div class="task-section">
      <div class="section-header">
        <h3>试一试</h3>
        <el-button type="success" @click="onResetAll" :disabled="!hasAnySelection">
          <el-icon><RefreshLeft /></el-icon> 重置全部
        </el-button>
      </div>
      
      <div class="task-content">
        <p class="task-text">
          <span class="highlight">拖动</span>数据获取方式，放入对应的场景中（每个场景可以放入多个方式）
        </p>
        
        <!-- 数据获取方式（可拖拽） -->
        <div class="methods-area">
          <div class="area-label">数据获取方式</div>
          <div class="methods-container">
            <div
              v-for="b in boxes"
              :key="b"
              class="method-item"
              :class="['method-' + b, { 'dragging': isDragging && draggingBox === b }]"
              @mousedown="onMouseDown(b, $event)"
            >
              {{ boxLabels[b] }}
            </div>
          </div>
        </div>

        <!-- 场景卡片（拖放区域） -->
        <div class="scenarios-grid">
          <div
            v-for="element in elements"
            :key="element.id"
            class="scenario-card"
            :class="{ 'pulse': pulseElement === element.id }"
            :ref="el => setElementRef(element.id, el as HTMLDivElement | null)"
          >
            <div class="scenario-header">{{ element.title }}</div>
            <div class="scenario-body">
              <div v-if="getBoxesInElement(element.id).length > 0" class="selected-methods">
                <span
                  v-for="boxId in getBoxesInElement(element.id)"
                  :key="boxId"
                  class="method-tag"
                  :class="['tag-' + boxId, { 'dragging': isDragging && draggingBox === boxId && draggingFrom === element.id }]"
                  @mousedown="onMouseDownFromTag(boxId, element.id, $event)"
                >
                  {{ boxLabels[boxId] }}
                </span>
              </div>
              <div v-else class="scenario-empty">
                拖动数据获取方式到此处
              </div>
            </div>
          </div>
        </div>
        
        <div class="submit-area">
          <el-button 
            type="primary" 
            size="large" 
            @click="submitResult" 
            :disabled="!canSubmit"
          >
            提交分类结果
          </el-button>
        </div>
      </div>
    </div>

    <!-- 拖动中的浮动元素 -->
    <div
      v-if="isDragging"
      class="floating-element"
      :class="['floating-' + draggingBox, { 'snapping': snapping }]"
      :style="{ 
        left: (snapping ? snapPos.x : dragPos.x) + 'px', 
        top: (snapping ? snapPos.y : dragPos.y) + 'px' 
      }"
    >
      {{ draggingBox ? boxLabels[draggingBox] : '' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useActivity, type BoxId, type ElementId } from '@/store/activity'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { ElMessage } from 'element-plus'
import { RefreshLeft } from '@element-plus/icons-vue'
import { EntityMode, EventType } from '@/types'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

// 数据获取方式（可拖拽）
const boxes = ['A', 'B', 'C', 'D'] as const
const boxLabels: Record<BoxId, string> = {
  A: '现场记录',
  B: '问卷调查',
  C: '网络获取',
  D: '设备采集'
}

// 场景定义（拖放区域）
type ElementItem = { id: ElementId; title: string }
const elements: Readonly<ElementItem[]> = [
  { id: 'check_vision', title: '测量新生身高数据' },
  { id: 'register_vision', title: '获取保护视力的方法' },
  { id: 'survey_all_devices', title: '调查全校学生数字设备使用情况' },
  { id: 'bad_habits', title: '记录课堂重点知识' },
  { id: 'usage_duration', title: '了解当天天气数据' },
  { id: 'common_devices', title: '2024年全国出生人口' },
] as const

// 拖拽状态
const isDragging = ref(false)
const draggingBox = ref<BoxId | ''>('')
const draggingFrom = ref<ElementId | ''>('')  // 记录拖动来源场景
const dragPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const snapping = ref(false)
const snapPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const pulseElement = ref<ElementId | ''>('')
const elementRefs = ref<Record<ElementId, HTMLDivElement | null>>({
  check_vision: null,
  register_vision: null,
  bad_habits: null,
  usage_duration: null,
  common_devices: null,
  survey_all_devices: null
})

// 设置元素引用
function setElementRef(elementId: ElementId, el: HTMLDivElement | null) {
  elementRefs.value[elementId] = el
}

// 获取当前选择状态
const selections = computed(() => activity.ac4_stuResult?.selections || {})

// 是否有任何选择
const hasAnySelection = computed(() => 
  elements.some(el => selections.value[el.id]?.length > 0)
)

// 是否可以提交
const canSubmit = computed(() => 
  elements.every(el => selections.value[el.id]?.length > 0)
)

// 获取场景中的方块
function getBoxesInElement(elementId: ElementId): BoxId[] {
  return selections.value[elementId] || []
}

// 鼠标按下（从数据获取方式区域）
function onMouseDown(boxId: BoxId, ev: MouseEvent) {
  ev.preventDefault()
  draggingBox.value = boxId
  draggingFrom.value = ''  // 从方式区域拖动，没有来源场景
  isDragging.value = true
  dragPos.value = { x: ev.clientX, y: ev.clientY }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 鼠标按下（从场景标签）
function onMouseDownFromTag(boxId: BoxId, fromElementId: ElementId, ev: MouseEvent) {
  ev.preventDefault()
  ev.stopPropagation()  // 阻止事件冒泡
  draggingBox.value = boxId
  draggingFrom.value = fromElementId  // 记录来源场景
  isDragging.value = true
  dragPos.value = { x: ev.clientX, y: ev.clientY }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 鼠标移动
function onMouseMove(ev: MouseEvent) {
  if (!isDragging.value) return
  dragPos.value = { x: ev.clientX, y: ev.clientY }
}

// 鼠标松开
async function onMouseUp(ev: MouseEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  
  const hit = hitTest(ev.clientX, ev.clientY)
  const boxId = draggingBox.value as BoxId
  const fromElementId = draggingFrom.value
  
  // 情况1: 没有命中任何场景
  if (!hit) {
    // 如果是从某个场景拖出来的，则从该场景移除
    if (fromElementId && activity.ac4_stuResult) {
      const currentBoxes = activity.ac4_stuResult.selections[fromElementId] || []
      activity.ac4_stuResult.selections[fromElementId] = currentBoxes.filter(b => b !== boxId)
    }
    draggingBox.value = ''
    draggingFrom.value = ''
    return
  }

  // 情况2: 命中了某个场景
  // 计算目标中心点，执行吸附动画
  const target = elementRefs.value[hit]
  if (target) {
    const rect = target.getBoundingClientRect()
    snapPos.value = { 
      x: Math.round(rect.left + rect.width / 2), 
      y: Math.round(rect.top + rect.height / 2) 
    }
    snapping.value = true
    pulseElement.value = hit
  }

  // 动画结束后更新状态
  setTimeout(() => {
    if (activity.ac4_stuResult) {
      const currentBoxes = activity.ac4_stuResult.selections[hit] || []
      
      // 如果有来源场景且与目标场景不同，先从来源场景移除
      if (fromElementId && fromElementId !== hit) {
        const sourceBoxes = activity.ac4_stuResult.selections[fromElementId] || []
        activity.ac4_stuResult.selections[fromElementId] = sourceBoxes.filter(b => b !== boxId)
      }
      
      // 如果目标场景还没有这个分类，才添加
      if (!currentBoxes.includes(boxId)) {
        activity.ac4_stuResult.selections[hit] = [...currentBoxes, boxId]
      }
    }
    
    draggingBox.value = ''
    draggingFrom.value = ''
    snapping.value = false
    setTimeout(() => { if (pulseElement.value === hit) pulseElement.value = '' }, 250)
  }, 180)
}

// 命中测试
function hitTest(cx: number, cy: number): ElementId | '' {
  const entries: Array<[ElementId, HTMLDivElement | null]> = elements.map(
    el => [el.id, elementRefs.value[el.id]]
  )
  
  for (const [id, el] of entries) {
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
      return id
    }
  }
  return ''
}

// 自动打分
const autoScore = () => {
  if (!activity.ac4_stuResult) return
  
  // 正确答案映射
  const correctAnswers: Record<ElementId, BoxId[]> = {
    check_vision: ['A'],          // 测量新生身高数据 -> 现场记录
    register_vision: ['C'],        // 获取保护视力的方法 -> 网络获取
    survey_all_devices: ['B'],     // 调查全校学生数字设备使用情况 -> 问卷调查
    bad_habits: ['A'],             // 记录课堂重点知识 -> 现场记录
    usage_duration: ['C'],         // 了解当天天气数据 -> 网络获取
    common_devices: ['C']          // 2024年全国出生人口 -> 网络获取
  }
  
  // 计算有多少个场景有选择
  const scenariosWithSelection = elements.filter(
    el => selections.value[el.id]?.length > 0
  ).length
  
  // 计算有多少个场景完全正确
  let correctCount = 0
  elements.forEach(({ id }) => {
    const selected = selections.value[id] || []
    const correct = correctAnswers[id]
    // 检查是否完全匹配（数量相同且包含所有正确答案）
    if (selected.length === correct.length && 
        correct.every(box => selected.includes(box))) {
      correctCount++
    }
  })
  
  // 根据标准打分
  if (scenariosWithSelection >= 4) {
    activity.ac4_stuResult.rating[0].score = 1
  }
  if (correctCount === 6) {
    activity.ac4_stuResult.rating[1].score = 1
  }
}

// 提交结果
const submitResult = () => {
  autoScore()
  try {
    const user = status.userStatus
    socket.submit({
      mode: user?.mode || EntityMode.STUDENT,
      eventType: EventType.SUBMIT,
      messageType: 'activity4_submit',
      activityIndex: '4',
      data: {
        selections: activity.ac4_stuResult?.selections,
        rating: activity.ac4_stuResult?.rating,
        submittedAt: Date.now()
      },
      from: {
        id: `${user?.studentNo || ''}_${user?.groupNo || ''}`,
        studentNo: user?.studentNo,
        groupNo: user?.groupNo,
        studentRole: user?.studentRole
      },
      to: null
    })
    
    if (activity.ac4_stuResult) {
      activity.ac4_stuResult.hasSubmittedAll = true
    }
    
    // ElMessage.success('分类结果提交成功！')
  } catch (error: any) {
    console.error('[Activity4] 提交失败:', error)
    // ElMessage.error(`提交失败: ${error.message}`)
  }
}

// 重置全部
async function onResetAll() {
  if (!activity.ac4_stuResult) return
  
  // 重置状态
  elements.forEach(({ id }) => {
    activity.ac4_stuResult!.selections[id] = []
  })
  activity.ac4_stuResult.hasSubmittedAll = false
  activity.ac4_stuResult.rating[0].score = 0
  activity.ac4_stuResult.rating[1].score = 0
  
  // ElMessage.success('已重置所有分类！')
}

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
/* 页面布局 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 评价标准卡片 */
.evaluation-card {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 任务区域 */
.task-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  /* 保持与 activity3 相同的宽度比例（2/3），并居中显示 */
  width: 66.67%;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

/* 任务内容 */
.task-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-text {
  margin: 0;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
  text-indent: 2em;
}

.highlight {
  font-weight: 700;
  color: #dc2626;
}

/* 数据获取方式区域 */
.methods-area {
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 16px;
}

.area-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.methods-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.method-item {
  user-select: none;
  cursor: grab;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.method-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.method-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing;
}

/* 方式配色 */
.method-A { 
  background: #f0fdfa;
  color: #047857;
  border: 2px solid #d1fae5;
}

.method-B { 
  background: #fff7ed;
  color: #92400e;
  border: 2px solid #fed7aa;
}

.method-C { 
  background: #eff6ff;
  color: #1e40af;
  border: 2px solid #dbeafe;
}

.method-D { 
  background: #fef2f2;
  color: #991b1b;
  border: 2px solid #fecaca;
}

/* 场景卡片网格 */
.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.scenario-card {
  min-height: 120px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
}

.scenario-card:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.scenario-card.pulse {
  animation: pulse 0.8s ease-out 1;
}

@keyframes pulse {
  0% { 
    box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3); 
    border-color: #60a5fa;
  }
  100% { 
    box-shadow: 0 0 0 20px rgba(96, 165, 250, 0); 
    border-color: #e5e7eb;
  }
}

.scenario-header {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
}

.scenario-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
  min-height: 60px;
}

.selected-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.method-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
}

.method-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.method-tag.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing;
}

.tag-A { 
  background: #d1fae5; 
  color: #047857;
  border: 1px solid #10b981;
}
.tag-B { 
  background: #fed7aa; 
  color: #92400e;
  border: 1px solid #f97316;
}
.tag-C { 
  background: #dbeafe; 
  color: #1e40af;
  border: 1px solid #3b82f6;
}
.tag-D { 
  background: #fecaca; 
  color: #991b1b;
  border: 1px solid #ef4444;
}

.scenario-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  font-style: italic;
}

/* 提交区域 */
.submit-area {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

/* 浮动元素 */
.floating-element {
  position: fixed;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  border: 2px solid;
}

.floating-element.snapping {
  transition: left 0.18s ease, top 0.18s ease;
}

.floating-A { 
  background: #f0fdfa;
  color: #047857;
  border-color: #d1fae5;
}

.floating-B { 
  background: #fff7ed;
  color: #92400e;
  border-color: #fed7aa;
}

.floating-C { 
  background: #eff6ff;
  color: #1e40af;
  border-color: #dbeafe;
}

.floating-D { 
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

/* 评价标准 */
.evaluation-header {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.evaluation-header .card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.criteria-grid {
  display: flex;
  gap: 15px;
  flex: 1;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.criterion-item.completed {
  background: #fef3c7;
  border-color: #fbbf24;
  font-weight: 600;
}

.criterion-item .star {
  font-size: 14px;
}

.criterion-item .criterion-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.criterion-item.completed .criterion-text {
  color: #92400e;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 1024px) {
  .task-section {
    max-width: 100%;
  }
  
  .scenarios-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-header h3 {
    width: 100%;
  }
}
</style>
