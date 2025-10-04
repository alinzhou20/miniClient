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

    <!-- 底部区域：左右分栏 -->
    <div class="bottom-section">
      <!-- 左侧任务区 -->
      <div class="left-panel">
        <!-- 任务说明卡片 -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">1. 了解数据获取方式及场景</h3>
          </div>
          <div class="task-content">
            <p class="task-text">
              打开<span class="highlight">"近视率"</span>网页，<span class="highlight">找一找</span>2024年全国儿童青少年总体近视率是多少？
            </p>
            <a
              class="task-link"
              href="https://mp.weixin.qq.com/s/wy7cgUqfgRBDsUoCXyAcGw?click_id=2"
              target="_blank"
              rel="noopener noreferrer"
            >
              📌 点击访问近视率数据网页
            </a>
          </div>
        </div>

        <!-- 拖拽任务卡片 -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">2. 试一试</h3>
            <el-button type="danger" size="small" @click="onResetAll" :disabled="!hasAnySelection">
              <el-icon><RefreshLeft /></el-icon> 重置全部
            </el-button>
          </div>
          <div class="task-content">
            <p class="task-text">
              <span class="highlight">拖动</span>不同场景，放入对应的数据获取方式中
            </p>
            
            <!-- 待拖拽元素 -->
            <div class="draggable-area">
              <div class="area-label">待分类场景</div>
              <div class="elements-container">
                <div
                  v-for="e in availableElements"
                  :key="e.id"
                  class="draggable-item"
                  :class="{ 'dragging': isDragging && draggingElement === e.id }"
                  @mousedown="onMouseDown(e.id, $event)"
                >
                  {{ e.title }}
                </div>
                <div v-if="availableElements.length === 0" class="empty-hint">
                  🎉 所有场景都已分类！
                </div>
              </div>
            </div>

            <!-- 拖放区域 -->
            <div class="drop-zones">
              <div
                v-for="b in boxes"
                :key="b"
                class="drop-box"
                :class="['tone-' + b, { pulse: pulseBox === b }]"
                :ref="el => setBoxRef(b, el as HTMLDivElement | null)"
              >
                <div class="box-header">{{ boxLabels[b] }}</div>
                <div class="box-items">
                  <span
                    v-for="itm in elementsInBox(b)"
                    :key="itm.id"
                    class="item-tag"
                  >
                    {{ itm.title }}
                  </span>
                  <div v-if="elementsInBox(b).length === 0" class="box-empty">
                    拖动到此处
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧AI助手 -->
      <div class="right-panel">
        <AIChatCard />
      </div>
    </div>

    <!-- 拖动中的浮动元素 -->
    <div
      v-if="isDragging"
      class="floating-element"
      :class="{ 'snapping': snapping }"
      :style="{ 
        left: (snapping ? snapPos.x : dragPos.x) + 'px', 
        top: (snapping ? snapPos.y : dragPos.y) + 'px' 
      }"
    >
      {{ elementTitle(draggingElement) }}
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
import AIChatCard from '../components/AIChatCard.vue'
import { EntityMode, EventType } from '@/types'

const activity = useActivity()
const status = useStatus()
const socket = useSocket()

// 区域定义
const boxes = ['A', 'B', 'C', 'D'] as const
const boxLabels: Record<BoxId, string> = {
  A: '现场记录',
  B: '问卷调查',
  C: '网络获取',
  D: '设备采集'
}

// 元素定义
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
const draggingElement = ref<ElementId | ''>('')
const dragPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const snapping = ref(false)
const snapPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const pulseBox = ref<BoxId | ''>('')
const boxRefs = ref<Record<BoxId, HTMLDivElement | null>>({ A: null, B: null, C: null, D: null })

// 设置 box 引用
function setBoxRef(b: BoxId, el: HTMLDivElement | null) {
  boxRefs.value[b] = el
}

// 获取当前选择状态
const selections = computed(() => activity.ac4_stuResult?.selections || {})

// 尚未放置的元素
const availableElements = computed(() => 
  elements.filter(it => !selections.value[it.id])
)

// 是否有任何选择
const hasAnySelection = computed(() => 
  elements.some(it => selections.value[it.id])
)

// 获取在指定 box 中的元素
function elementsInBox(b: BoxId): ElementItem[] {
  return elements.filter(it => selections.value[it.id] === b)
}

// 获取元素标题
function elementTitle(id: ElementId | ''): string {
  const it = elements.find(x => x.id === id)
  return it ? it.title : ''
}

// 鼠标按下
function onMouseDown(e: ElementId, ev: MouseEvent) {
  ev.preventDefault()
  draggingElement.value = e
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
  const e = draggingElement.value as ElementId
  
  if (!hit) {
    draggingElement.value = ''
    return
  }

  // 计算目标中心点，执行吸附动画
  const target = boxRefs.value[hit]
  if (target) {
    const rect = target.getBoundingClientRect()
    snapPos.value = { 
      x: Math.round(rect.left + rect.width / 2), 
      y: Math.round(rect.top + rect.height / 2) 
    }
    snapping.value = true
    pulseBox.value = hit
  }

  // 动画结束后更新状态
  setTimeout(async () => {
    if (activity.ac4_stuResult) {
      activity.ac4_stuResult.selections[e] = hit
      
      // 检查是否全部完成
      const allPlaced = elements.every(it => activity.ac4_stuResult!.selections[it.id] !== '')
      
      if (allPlaced && !activity.ac4_stuResult.hasSubmittedAll) {
        // 自动打分并提交
        autoScore()
        submitResult()
      }
    }
    
    draggingElement.value = ''
    snapping.value = false
    setTimeout(() => { if (pulseBox.value === hit) pulseBox.value = '' }, 250)
  }, 180)
}

// 命中测试
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

// 自动打分
const autoScore = () => {
  if (!activity.ac4_stuResult) return
  
  // 正确答案映射
  const correctAnswers: Record<ElementId, BoxId> = {
    check_vision: 'A',      // 测量新生身高数据 -> 现场记录
    register_vision: 'C',   // 获取保护视力的方法 -> 网络获取
    survey_all_devices: 'B', // 调查全校学生数字设备使用情况 -> 问卷调查
    bad_habits: 'A',        // 记录课堂重点知识 -> 现场记录
    usage_duration: 'C',    // 了解当天天气数据 -> 网络获取
    common_devices: 'C'     // 2024年全国出生人口 -> 网络获取
  }
  
  let correctCount = 0
  elements.forEach(({ id }) => {
    if (activity.ac4_stuResult!.selections[id] === correctAnswers[id]) {
      correctCount++
    }
  })
  
  // 根据正确数量打分
  if (correctCount >= 4) {
    activity.ac4_stuResult.rating[0].score = 1
  }
  if (correctCount === 6) {
    activity.ac4_stuResult.rating[1].score = 1
  }
}

// 提交结果
const submitResult = () => {
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
    
    ElMessage.success('所有场景分类提交成功！')
  } catch (error: any) {
    console.error('[Activity4] 提交失败:', error)
    ElMessage.error(`提交失败: ${error.message}`)
  }
}

// 重置全部
async function onResetAll() {
  if (!activity.ac4_stuResult) return
  
  // 重置状态
  elements.forEach(({ id }) => {
    activity.ac4_stuResult!.selections[id] = ''
  })
  activity.ac4_stuResult.hasSubmittedAll = false
  activity.ac4_stuResult.rating[0].score = 0
  activity.ac4_stuResult.rating[1].score = 0
  
  ElMessage.success('已重置所有分类！')
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
  gap: 24px;
}

.bottom-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  height: 600px;
  overflow-y: auto;
}

/* 卡片样式 */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.evaluation-card {
  background: linear-gradient(135deg, #fff7ed, #fef3c7);
  border: 2px solid #fbbf24;
  padding: 10px 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

/* 任务内容 */
.task-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.task-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border: 1px solid #60a5fa;
  border-radius: 8px;
  color: #1e3a8a;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.task-link:hover {
  background: linear-gradient(135deg, #bfdbfe, #93c5fd);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 拖拽区域 */
.draggable-area {
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

.elements-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 60px;
  align-items: center;
}

.draggable-item {
  user-select: none;
  cursor: grab;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  color: #0c4a6e;
  border: 2px solid #7dd3fc;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.draggable-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.draggable-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing;
}

.empty-hint {
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #059669;
  font-size: 16px;
  font-weight: 600;
}

/* 拖放区域 */
.drop-zones {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.drop-box {
  min-height: 120px;
  border: 3px dashed;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;
}

.box-header {
  font-weight: 700;
  font-size: 15px;
  text-align: center;
  padding: 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
}

.box-items {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  min-height: 60px;
}

.item-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

.box-empty {
  width: 100%;
  text-align: center;
  color: rgba(0, 0, 0, 0.3);
  font-size: 12px;
  padding: 20px 0;
}

/* 区域配色 */
.tone-A { 
  border-color: #16a34a; 
  background: #f0fdf4; 
}
.tone-A .box-header { color: #15803d; }

.tone-B { 
  border-color: #f59e0b; 
  background: #fffbeb; 
}
.tone-B .box-header { color: #d97706; }

.tone-C { 
  border-color: #3b82f6; 
  background: #eff6ff; 
}
.tone-C .box-header { color: #1e40af; }

.tone-D { 
  border-color: #ef4444; 
  background: #fef2f2; 
}
.tone-D .box-header { color: #b91c1c; }

/* 脉冲动画 */
.drop-box.pulse {
  animation: pulse 0.8s ease-out 1;
}

@keyframes pulse {
  0% { 
    box-shadow: 0 0 0 0 currentColor; 
    opacity: 0.7;
  }
  100% { 
    box-shadow: 0 0 0 20px transparent; 
    opacity: 1;
  }
}

/* 浮动元素 */
.floating-element {
  position: fixed;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
  padding: 10px 16px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e3a8a;
  border: 2px solid #3b82f6;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  z-index: 9999;
}

.floating-element.snapping {
  transition: left 0.18s ease, top 0.18s ease;
}

/* 评价标准 */
.evaluation-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.evaluation-header .card-title {
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

.criteria-grid {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.criterion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.criterion-item.completed {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
}

.criterion-item .star {
  font-size: 14px;
  flex-shrink: 0;
}

.criterion-item .criterion-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  white-space: nowrap;
}

.criterion-item.completed .criterion-text {
  color: #78350f;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 1024px) {
  .bottom-section {
    grid-template-columns: 1fr;
  }
  
  .drop-zones {
    grid-template-columns: 1fr;
  }
  
  .right-panel {
    height: 400px;
  }
}
</style>
