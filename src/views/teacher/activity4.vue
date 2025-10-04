<template>
  <div class="activity-monitor">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">Activity 4 - 数据获取方法多</h2>
      <p class="page-description">实时监控学生场景分类情况</p>
    </div>

    <!-- 小组完成进度 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">小组完成进度</span>
        <span class="progress-count">{{ completedGroups.size }}/25 小组</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- 功能按钮区域 -->
    <div class="action-section">
      <el-button 
        type="primary" 
        size="large"
        :icon="Download"
        @click="exportAllData"
        :disabled="totalSubmissions === 0"
      >
        导出全部数据
      </el-button>
      <el-button 
        type="success" 
        size="large"
        :icon="Document"
        @click="exportStatistics"
        :disabled="totalSubmissions === 0"
      >
        导出统计结果
      </el-button>
      <el-button 
        type="warning" 
        size="large"
        :icon="Refresh"
        @click="clearData"
      >
        清空数据
      </el-button>
    </div>

    <!-- 场景统计卡片 -->
    <div class="scenarios-grid">
      <div 
        v-for="element in elements" 
        :key="element.id" 
        class="scenario-card"
        @click="openDetailDialog(element.id)"
      >
        <div class="card-header">
          <div class="card-title">{{ element.title }}</div>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
        </div>
        
        <div class="card-body">
          <div class="participant-count">
            <span class="count-label">参与人数：</span>
            <span class="count-value">{{ totalParticipantsOf(element.id) }}</span>
          </div>
          
          <div v-if="totalParticipantsOf(element.id) > 0" class="choices-list">
            <div 
              v-for="(choice, index) in getTopChoices(element.id)" 
              :key="choice.id" 
              class="choice-item"
              :class="'choice-' + (index + 1)"
            >
              <span class="choice-rank">{{ index + 1 }}</span>
              <span class="choice-label" :class="'label-' + choice.id">
                {{ boxLabels[choice.id] }}
              </span>
              <span class="choice-count">{{ choice.count }}人</span>
              <span class="choice-percent">({{ choice.percent }}%)</span>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Download, Document, Refresh } from '@element-plus/icons-vue'
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
  { id: 'check_vision' as ElementId, title: '测量新生身高数据' },
  { id: 'register_vision' as ElementId, title: '获取保护视力的方法' },
  { id: 'survey_all_devices' as ElementId, title: '调查全校学生数字设备使用情况' },
  { id: 'bad_habits' as ElementId, title: '记录课堂重点知识' },
  { id: 'usage_duration' as ElementId, title: '了解当天天气数据' },
  { id: 'common_devices' as ElementId, title: '2024年全国出生人口' },
] as const

// 正确答案映射
const correctAnswers: Record<ElementId, BoxId> = {
  check_vision: 'A',      // 测量新生身高数据 -> 现场记录
  register_vision: 'C',   // 获取保护视力的方法 -> 网络获取
  survey_all_devices: 'B', // 调查全校学生数字设备使用情况 -> 问卷调查
  bad_habits: 'A',        // 记录课堂重点知识 -> 现场记录
  usage_duration: 'C',    // 了解当天天气数据 -> 网络获取
  common_devices: 'C'     // 2024年全国出生人口 -> 网络获取
}

// 每个 elementId 对应一个 Map<studentKey, BoxId>
const selectionByElement = reactive(new Map<ElementId, Map<string, BoxId>>())
elements.forEach(e => selectionByElement.set(e.id, new Map<string, BoxId>()))

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedElementId = ref<ElementId | null>(null)

// 完成小组统计
const completedGroups = reactive(new Set<string>())

// 计算属性
const progressPercentage = computed(() => {
  return Math.round((completedGroups.size / 25) * 100)
})

const totalSubmissions = computed(() => {
  let total = 0
  selectionByElement.forEach(map => {
    total += map.size
  })
  return total
})

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
  m.forEach((boxId) => {
    if (boxId === correctAnswer) correctCount++
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
  m.forEach((b) => { acc[b] += 1 })
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

// 获取排名靠前的选择（显示所有非零选项）
function getTopChoices(elementId: ElementId): Array<{ 
  id: BoxId
  count: number
  percent: number 
}> {
  const counts = countByBoxOf(elementId)
  const percents = percentByBoxOf(elementId)
  const entries: Array<{ id: BoxId; count: number; percent: number }> = [
    { id: 'A', count: counts.A, percent: percents.A },
    { id: 'B', count: counts.B, percent: percents.B },
    { id: 'C', count: counts.C, percent: percents.C },
    { id: 'D', count: counts.D, percent: percents.D }
  ]
  return entries
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.count - a.count)
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
  
  m.forEach((boxId, studentKey) => {
    const { groupNo, studentNo } = parseStudentKey(studentKey)
    result[boxId].push({ key: studentKey, groupNo, studentNo })
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
    const boxId = selections[elementId]
    
    if (boxId && ['A', 'B', 'C', 'D'].includes(boxId)) {
      const store = selectionByElement.get(elementId)
      if (store) {
        store.set(studentKey(g, s), boxId as BoxId)
      }
    }
  })
  
  // 添加到完成统计
  completedGroups.add(g)
  
  // console.log(`[Activity4 Teacher] 收到提交: 第${g}组-${s}号`)
  ElMessage.success(`第${g}组-${s}号 提交了场景分类`)
}

// 导出全部数据
function exportAllData() {
  const lines: string[] = []
  lines.push('=== Activity 4 - 数据获取方法多 - 全部提交数据 ===')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`总提交数: ${totalSubmissions.value}`)
  lines.push(`完成小组数: ${completedGroups.size}`)
  lines.push('')
  
  elements.forEach(element => {
    lines.push(`--- ${element.title} ---`)
    lines.push(`参与人数: ${totalParticipantsOf(element.id)}`)
    lines.push(`正确答案: ${boxLabels[correctAnswers[element.id]]}`)
    
    const details = getAllChoicesDetail(element.id)
    if (details.length > 0) {
      details.forEach(choice => {
        const isCorrect = isCorrectChoice(element.id, choice.id)
        lines.push(`  ${boxLabels[choice.id]}: ${choice.count}人 (${choice.percent}%)${isCorrect ? ' ✓' : ''}`)
        choice.students.forEach(student => {
          lines.push(`    - 第${student.groupNo}组-${student.studentNo}号`)
        })
      })
    } else {
      lines.push('  暂无数据')
    }
    lines.push('')
  })
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('已导出全部数据到剪贴板')
}

// 导出统计结果
function exportStatistics() {
  const lines: string[] = []
  lines.push('=== Activity 4 - 数据获取方法多 - 统计结果 ===')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`完成小组数: ${completedGroups.size}/25`)
  lines.push(`完成率: ${progressPercentage.value}%`)
  lines.push('')
  
  lines.push('各场景统计：')
  elements.forEach(element => {
    const total = totalParticipantsOf(element.id)
    const correctAnswer = correctAnswers[element.id]
    const choices = getAllChoicesDetail(element.id)
    
    lines.push(`\n${element.title}:`)
    lines.push(`  参与人数: ${total}`)
    lines.push(`  正确答案: ${boxLabels[correctAnswer]}`)
    
    if (total > 0) {
      // 计算正确率
      const correctChoice = choices.find(c => c.id === correctAnswer)
      const correctCount = correctChoice ? correctChoice.count : 0
      const correctRate = Math.round((correctCount / total) * 100)
      lines.push(`  正确率: ${correctRate}%`)
      
      lines.push(`  选择分布:`)
      choices.forEach(choice => {
        const isCorrect = choice.id === correctAnswer
        lines.push(`    ${boxLabels[choice.id]}: ${choice.count}人 (${choice.percent}%)${isCorrect ? ' ✓' : ''}`)
      })
    } else {
      lines.push(`  暂无数据`)
    }
  })
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('已导出统计结果到剪贴板')
}

// 清空数据
async function clearData() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    selectionByElement.forEach(map => map.clear())
    completedGroups.clear()
    ElMessage.success('数据已清空')
  } catch {
    // 用户取消
  }
}

// 复制到剪贴板
function copyToClipboard(text: string) {
  if (!text) return
  if (navigator && (navigator as any).clipboard && (navigator as any).clipboard.writeText) {
    ;(navigator as any).clipboard.writeText(text)
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
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
  padding: 12px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 进度条样式 */
.progress-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
}

.progress-count {
  font-size: 14px;
  font-weight: 700;
  color: #059669;
}

.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 5px;
  transition: width 0.3s ease;
}

/* 功能按钮区域 */
.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

/* 场景卡片网格 */
.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.scenario-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.scenario-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
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
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
}

.arrow-icon {
  color: #9ca3af;
  font-size: 16px;
  transition: transform 0.3s ease;
}

.scenario-card:hover .arrow-icon {
  transform: translateX(4px);
  color: #3b82f6;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.count-label {
  color: #6b7280;
  font-weight: 500;
}

.count-value {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.choice-item:hover {
  background: #f3f4f6;
}

.choice-1 { border-left-color: #3b82f6; }
.choice-2 { border-left-color: #10b981; }
.choice-3 { border-left-color: #f59e0b; }
.choice-4 { border-left-color: #ef4444; }

.choice-rank {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  min-width: 16px;
}

.choice-label {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
}

.label-A { color: #16a34a; }
.label-B { color: #d97706; }
.label-C { color: #2563eb; }
.label-D { color: #dc2626; }

.choice-count {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.choice-percent {
  font-size: 11px;
  color: #6b7280;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px 0;
  font-style: italic;
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
@media (max-width: 1200px) {
  .scenarios-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .activity-monitor {
    padding: 16px;
  }
  
  .scenarios-grid {
    grid-template-columns: 1fr;
  }
  
  .action-section {
    flex-direction: column;
  }
}
</style>
