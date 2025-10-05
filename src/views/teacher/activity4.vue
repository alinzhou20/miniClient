<template>
  <div class="activity-monitor">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">🔍 数据获取方法多</h2>
    </div>

    <!-- 场景统计卡片 -->
    <div class="scenarios-grid">
      <div 
        v-for="element in elements" 
        :key="element.id" 
        class="scenario-card"
        :class="{ 'has-data': totalParticipantsOf(element.id) > 0 }"
        @click="totalParticipantsOf(element.id) > 0 && openDetailDialog(element.id)"
      >
        <div class="card-header">
          <div class="card-title">{{ element.title }}</div>
          <div class="participant-badge">
            {{ totalParticipantsOf(element.id) }}人参与
          </div>
        </div>
        
        <div class="card-body">
          <div v-if="totalParticipantsOf(element.id) > 0" class="methods-stats">
            <!-- A: 现场记录 -->
            <div class="method-row">
              <span class="method-name name-A">{{ boxLabels['A'] }}</span>
              <div class="progress-wrapper">
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill fill-A" 
                    :style="{ width: percentByBoxOf(element.id)['A'] + '%' }"
                  ></div>
                </div>
                <span class="method-count">{{ countByBoxOf(element.id)['A'] }}人</span>
              </div>
            </div>
            
            <!-- B: 问卷调查 -->
            <div class="method-row">
              <span class="method-name name-B">{{ boxLabels['B'] }}</span>
              <div class="progress-wrapper">
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill fill-B" 
                    :style="{ width: percentByBoxOf(element.id)['B'] + '%' }"
                  ></div>
                </div>
                <span class="method-count">{{ countByBoxOf(element.id)['B'] }}人</span>
              </div>
            </div>
            
            <!-- C: 网络获取 -->
            <div class="method-row">
              <span class="method-name name-C">{{ boxLabels['C'] }}</span>
              <div class="progress-wrapper">
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill fill-C" 
                    :style="{ width: percentByBoxOf(element.id)['C'] + '%' }"
                  ></div>
                </div>
                <span class="method-count">{{ countByBoxOf(element.id)['C'] }}人</span>
              </div>
            </div>
            
            <!-- D: 设备采集 -->
            <div class="method-row">
              <span class="method-name name-D">{{ boxLabels['D'] }}</span>
              <div class="progress-wrapper">
                <div class="progress-bar-container">
                  <div 
                    class="progress-bar-fill fill-D" 
                    :style="{ width: percentByBoxOf(element.id)['D'] + '%' }"
                  ></div>
                </div>
                <span class="method-count">{{ countByBoxOf(element.id)['D'] }}人</span>
              </div>
            </div>
          </div>
          
          <div v-else class="no-data">暂无数据</div>
        </div>
      </div>
    </div>

    <!-- 详细统计弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :before-close="closeDetailDialog"
    >
      <div class="detail-content">
        <div class="detail-summary">
          <div class="summary-item">
            <span class="summary-label">总参与人数：</span>
            <span class="summary-value">{{ selectedElementTotal }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">正确答案：</span>
            <span class="summary-value correct">{{ getCorrectAnswer(selectedElementId) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">正确率：</span>
            <span class="summary-value" :class="correctRateClass">
              {{ correctRate }}%
            </span>
          </div>
        </div>

        <div class="detail-sections">
          <div 
            v-for="choice in getAllChoicesDetail(selectedElementId)" 
            :key="choice.id" 
            class="detail-section"
          >
            <div class="detail-header">
              <span class="detail-label" :class="'bg-' + choice.id">
                {{ boxLabels[choice.id] }}
              </span>
              <span class="detail-count">{{ choice.count }}人 ({{ choice.percent }}%)</span>
              <span 
                v-if="isCorrectChoice(selectedElementId, choice.id)" 
                class="correct-badge"
              >
                ✓ 正确
              </span>
            </div>
            <div class="detail-students">
              <span 
                v-for="student in choice.students" 
                :key="student.key" 
                class="student-tag"
              >
                第{{ student.groupNo }}组-{{ student.studentNo }}号
              </span>
            </div>
          </div>
          
          <div v-if="getAllChoicesDetail(selectedElementId).length === 0" class="no-detail">
            暂无学生选择数据
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSocket } from '@/store/socket'
// import { ElMessage } from 'element-plus'
import type { BoxId, ElementId } from '@/store/activity'

const socket = useSocket()

// 区域定义
const boxLabels: Record<BoxId, string> = {
  A: '现场记录',
  B: '问卷调查',
  C: '网络获取',
  D: '设备采集'
}

// 元素定义
const elements = [
  { id: 'get_viewpoints' as ElementId, title: '获取正反方观点' },
  { id: 'ai_organize' as ElementId, title: '借助智能体梳理理由' },
  { id: 'get_group_reasons' as ElementId, title: '获取各小组理由' },
  { id: 'survey_devices' as ElementId, title: '获取学生数字设备使用情况' },
] as const

// 正确答案映射（参考答案）
const correctAnswers: Record<ElementId, BoxId> = {
  get_viewpoints: 'A',      // 获取正反方观点 -> 现场记录
  ai_organize: 'C',         // 借助智能体梳理理由 -> 网络获取
  get_group_reasons: 'A',   // 获取各小组理由 -> 现场记录
  survey_devices: 'B'       // 获取学生数字设备使用情况 -> 问卷调查
}

// 每个 elementId 对应一个 Map<studentKey, BoxId[]>（学生可以为每个场景选择多个方式）
const selectionByElement = reactive(new Map<ElementId, Map<string, BoxId[]>>())
elements.forEach(e => selectionByElement.set(e.id, new Map<string, BoxId[]>()))

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedElementId = ref<ElementId | null>(null)

// 计算属性

const dialogTitle = computed(() => {
  if (!selectedElementId.value) return ''
  const element = elements.find(e => e.id === selectedElementId.value)
  return element ? `${element.title} - 详细统计` : ''
})

const selectedElementTotal = computed(() => {
  if (!selectedElementId.value) return 0
  return totalParticipantsOf(selectedElementId.value)
})

const correctRate = computed(() => {
  if (!selectedElementId.value || selectedElementTotal.value === 0) return 0
  const correctAnswer = correctAnswers[selectedElementId.value]
  const m = selectionByElement.get(selectedElementId.value)
  if (!m) return 0
  
  let correctCount = 0
  m.forEach((boxIds) => {
    // 只要学生的选择中包含正确答案，就算正确
    if (boxIds.includes(correctAnswer)) correctCount++
  })
  
  return Math.round((correctCount / selectedElementTotal.value) * 100)
})

const correctRateClass = computed(() => {
  const rate = correctRate.value
  if (rate >= 80) return 'high'
  if (rate >= 60) return 'medium'
  return 'low'
})

// 工具函数
function studentKey(groupNo: string, studentNo: string) {
  return `${groupNo}-${studentNo}`
}

function parseStudentKey(key: string): { groupNo: string; studentNo: string } {
  const [groupNo, studentNo] = key.split('-')
  return { groupNo: groupNo || '', studentNo: studentNo || '' }
}

function totalParticipantsOf(elementId: ElementId): number {
  const m = selectionByElement.get(elementId)
  return m ? m.size : 0
}

function countByBoxOf(elementId: ElementId): Record<BoxId, number> {
  const acc: Record<BoxId, number> = { A: 0, B: 0, C: 0, D: 0 }
  const m = selectionByElement.get(elementId)
  if (!m) return acc
  // 遍历所有学生的选择，累加每个方式的选择次数
  m.forEach((boxIds) => {
    boxIds.forEach(boxId => {
      acc[boxId] += 1
    })
  })
  return acc
}

function percentByBoxOf(elementId: ElementId): Record<BoxId, number> {
  const total = totalParticipantsOf(elementId)
  const raw: Record<BoxId, number> = { A: 0, B: 0, C: 0, D: 0 }
  if (total === 0) return raw
  const c = countByBoxOf(elementId)
  return {
    A: Math.round((c.A / total) * 100),
    B: Math.round((c.B / total) * 100),
    C: Math.round((c.C / total) * 100),
    D: Math.round((c.D / total) * 100)
  }
}

// 获取所有选择的详细信息
function getAllChoicesDetail(elementId: ElementId | null): Array<{
  id: BoxId
  count: number
  percent: number
  students: Array<{ key: string; groupNo: string; studentNo: string }>
}> {
  if (!elementId) return []
  
  const m = selectionByElement.get(elementId)
  if (!m) return []
  
  const result: Record<BoxId, Array<{ key: string; groupNo: string; studentNo: string }>> = {
    A: [], B: [], C: [], D: []
  }
  
  m.forEach((boxIds, studentKey) => {
    const { groupNo, studentNo } = parseStudentKey(studentKey)
    // 一个学生可能为同一个场景选择多个方式
    boxIds.forEach(boxId => {
      result[boxId].push({ key: studentKey, groupNo, studentNo })
    })
  })
  
  const percents = percentByBoxOf(elementId)
  
  return (['A', 'B', 'C', 'D'] as BoxId[])
    .map(boxId => ({
      id: boxId,
      count: result[boxId].length,
      percent: percents[boxId],
      students: result[boxId].sort((a, b) => {
        const groupDiff = parseInt(a.groupNo) - parseInt(b.groupNo)
        if (groupDiff !== 0) return groupDiff
        return parseInt(a.studentNo) - parseInt(b.studentNo)
      })
    }))
    .filter(choice => choice.count > 0)
    .sort((a, b) => b.count - a.count)
}

// 获取正确答案文本
function getCorrectAnswer(elementId: ElementId | null): string {
  if (!elementId) return ''
  return boxLabels[correctAnswers[elementId]]
}

// 判断是否为正确选择
function isCorrectChoice(elementId: ElementId | null, boxId: BoxId): boolean {
  if (!elementId) return false
  return correctAnswers[elementId] === boxId
}

// 打开详细统计弹窗
function openDetailDialog(elementId: ElementId) {
  selectedElementId.value = elementId
  dialogVisible.value = true
}

// 关闭详细统计弹窗
function closeDetailDialog() {
  dialogVisible.value = false
  selectedElementId.value = null
}

// Socket 事件处理
function handleSubmit(payload: any) {
  if (!payload || String(payload.messageType || '') !== 'activity4_submit') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  const selections = data.selections || {}
  const g = String(from.groupNo ?? '')
  const s = String(from.studentNo ?? '')
  
  if (!g || !s) return
  
  // 更新所有选择
  elements.forEach(element => {
    const elementId = element.id
    const boxIds = selections[elementId] // 这是一个 BoxId[] 数组
    
    if (Array.isArray(boxIds) && boxIds.length > 0) {
      const store = selectionByElement.get(elementId)
      if (store) {
        // 过滤出有效的选择
        const validBoxIds = boxIds.filter(id => ['A', 'B', 'C', 'D'].includes(id)) as BoxId[]
        if (validBoxIds.length > 0) {
          store.set(studentKey(g, s), validBoxIds)
        }
      }
    }
  })
  
  // console.log(`[Activity4 Teacher] 收到提交: 第${g}组-${s}号`)
  // ElMessage.success(`第${g}组-${s}号 提交了场景分类`)
}

// 生命周期
onMounted(() => {
  // console.log('[Activity4 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  socket.on('submit', handleSubmit)
})

onBeforeUnmount(() => {
  // console.log('[Activity4 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleSubmit)
})
</script>

<style scoped>
/* 页面布局 */
.activity-monitor {
  padding: 40px 0;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 活动标题 */
.activity-header {
  text-align: center;
  margin-bottom: 32px;
}

.activity-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 场景卡片网格 */
.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.scenario-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.scenario-card.has-data {
  cursor: pointer;
}

.scenario-card.has-data:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
}

.participant-badge {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.methods-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.method-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.method-row:hover {
  background: #f3f4f6;
}

.method-row:nth-child(1) { border-left-color: #16a34a; }
.method-row:nth-child(2) { border-left-color: #d97706; }
.method-row:nth-child(3) { border-left-color: #2563eb; }
.method-row:nth-child(4) { border-left-color: #dc2626; }

.method-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  min-width: 64px;
  flex-shrink: 0;
}

.name-A { color: #16a34a; }
.name-B { color: #d97706; }
.name-C { color: #2563eb; }
.name-D { color: #dc2626; }

.progress-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-count {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.fill-A {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.fill-B {
  background: linear-gradient(90deg, #d97706, #f59e0b);
}

.fill-C {
  background: linear-gradient(90deg, #2563eb, #3b82f6);
}

.fill-D {
  background: linear-gradient(90deg, #dc2626, #ef4444);
}

.no-data {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 40px 0;
  font-style: italic;
  grid-column: 1 / -1;
}

/* 弹窗样式 */
.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.summary-value.correct {
  color: #3b82f6;
}

.summary-value.high {
  color: #10b981;
}

.summary-value.medium {
  color: #f59e0b;
}

.summary-value.low {
  color: #ef4444;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
}

.bg-A { background: #16a34a; }
.bg-B { background: #f59e0b; }
.bg-C { background: #3b82f6; }
.bg-D { background: #ef4444; }

.detail-count {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
  flex: 1;
}

.correct-badge {
  font-size: 12px;
  font-weight: 600;
  color: #10b981;
  background: #d1fae5;
  padding: 4px 10px;
  border-radius: 12px;
}

.detail-students {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
}

.student-tag {
  font-size: 12px;
  background: #f3f4f6;
  color: #374151;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.no-detail {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 40px 0;
}

/* 响应式 */
@media (max-width: 1240px) {
  .activity-monitor {
    width: 100%;
    padding: 40px 16px;
  }
}

@media (max-width: 1024px) {
  .detail-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }
  
  .scenarios-grid {
    grid-template-columns: 1fr;
  }
}
</style>
