<template>
  <div class="page">
    <h2 class="title">活动一：数据获取方法多</h2>
    
    <!-- 小组完成进度 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">小组完成进度</span>
        <span class="progress-count">{{ completedGroups.size }}/25</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>
    
    <div class="rows">
      <div v-for="e in elements" :key="e.id" class="row" @click="openDetailDialog(e.id)">
        <div class="row-header">
          <div class="row-title">{{ e.title }}</div>
          <div class="row-sub">参与人数：<strong>{{ totalParticipantsOf(e.id) }}</strong></div>
        </div>
        <div class="row-stats">
          <div v-if="totalParticipantsOf(e.id) > 0" class="top-choices">
            <div v-for="(choice, index) in getTopTwoChoices(e.id)" :key="choice.id" class="choice-item">
              <span class="choice-rank">{{ index + 1 }}.</span>
              <span class="choice-label" :class="'c-' + choice.id">{{ boxLabels[choice.id] }}</span>
              <span class="choice-count">{{ choice.count }}人</span>
            </div>
          </div>
          <div v-else class="no-data">暂无数据</div>
        </div>
        <div class="row-indicator">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 详细统计弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="closeDetailDialog"
    >
      <div class="detail-content">
        <div v-for="choice in getAllChoicesDetail(selectedElementId)" :key="choice.id" class="detail-section">
          <div class="detail-header">
            <span class="detail-label" :class="'bg-' + choice.id">{{ boxLabels[choice.id] }}</span>
            <span class="detail-count">{{ choice.count }}人</span>
          </div>
          <div class="detail-students">
            <span v-for="student in choice.students" :key="student.key" class="student-tag">
              第{{ student.groupNo }}组-{{ student.studentNo }}号
            </span>
          </div>
        </div>
        <div v-if="getAllChoicesDetail(selectedElementId).length === 0" class="no-detail">
          暂无学生选择数据
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'
import { saveActivity1Data, loadActivity1Data } from '@/utils/localStorage'
import { ArrowRight } from '@element-plus/icons-vue'

type BoxId = 'A' | 'B' | 'C' | 'D'
const boxLabels: Record<BoxId, string> = { A: '现场记录', B: '问卷调查', C: '网络获取', D: '设备采集' }
const elements = [
  { id: 'check_vision', title: '测量新生身高数据' },
  { id: 'register_vision', title: '获取保护视力的方法' },
  { id: 'survey_all_devices', title: '调查全校学生数字设备使用情况' },
  { id: 'bad_habits', title: '记录课堂重点知识' },
  { id: 'usage_duration', title: '了解当天天气数据' },
  { id: 'common_devices', title: '2024年全国出生人口' },
] as const
type ElementId = typeof elements[number]['id']

// 每个 elementId 对应一个 Map<studentKey, BoxId>
const selectionByElement = reactive(new Map<ElementId, Map<string, BoxId>>())
elements.forEach(e => selectionByElement.set(e.id, new Map<string, BoxId>()))

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedElementId = ref<ElementId | null>(null)

const dialogTitle = computed(() => {
  if (!selectedElementId.value) return ''
  const element = elements.find(e => e.id === selectedElementId.value)
  return element ? `${element.title} - 详细统计` : ''
})

// 小组完成统计
const completedGroups = reactive(new Set<string>())
const progressPercentage = computed(() => {
  return Math.round((completedGroups.size / 25) * 100)
})

function studentKey(groupNo: string, studentNo: string) {
  return `${groupNo}-${studentNo}`
}

// 解析学生key获取组号和学号
function parseStudentKey(key: string): { groupNo: string; studentNo: string } {
  const [groupNo, studentNo] = key.split('-')
  return { groupNo: groupNo || '', studentNo: studentNo || '' }
}

function handleSubmit(payload: any) {
  if (!payload || String(payload.type || '') !== 'activity1_drag') return
  const from = payload.from || {}
  const data = payload.data || {}
  const g = String(from.groupNo ?? '')
  const s = String(from.studentNo ?? '')
  const e = String(data.elementId ?? '') as ElementId
  const action = String(data.action ?? 'select')
  if (!g || !s || !e) return
  if (!selectionByElement.has(e)) return
  const store = selectionByElement.get(e) as Map<string, BoxId>
  
  // 检查小组是否首次提交（用于进度统计）
  const wasGroupCompleted = completedGroups.has(g)
  
  if (action === 'reset') {
    store.delete(studentKey(g, s))
    // 重置时检查该小组是否还有其他数据，如果没有则从完成列表中移除
    const hasOtherData = Array.from(store.keys()).some(key => key.startsWith(g + '-'))
    if (!hasOtherData) {
      completedGroups.delete(g)
    }
  } else {
    const b = String(data.boxId ?? '') as BoxId
    if (!['A','B','C','D'].includes(b)) return
    store.set(studentKey(g, s), b)
    
    // 首次提交时添加到完成统计
    if (!wasGroupCompleted) {
      completedGroups.add(g)
    }
  }
  
  // 保存到本地存储
  saveActivity1Data(selectionByElement)
}

onMounted(() => {
  // 恢复本地存储的数据
  const savedData = loadActivity1Data()
  if (savedData) {
    const groupsSet = new Set<string>()
    savedData.forEach((studentMap, elementId) => {
      if (selectionByElement.has(elementId as ElementId)) {
        const currentMap = selectionByElement.get(elementId as ElementId)!
        studentMap.forEach((boxId, studentKey) => {
          currentMap.set(studentKey, boxId as BoxId)
          // 提取组号用于统计
          const { groupNo } = parseStudentKey(studentKey)
          if (groupNo) {
            groupsSet.add(groupNo)
          }
        })
      }
    })
    // 恢复小组完成统计
    groupsSet.forEach(groupNo => completedGroups.add(groupNo))
    console.log('[Activity1] 已恢复本地存储数据，完成小组数:', completedGroups.size)
  }
  
  socketService.on('submit', handleSubmit)
})

onBeforeUnmount(() => {
  socketService.off('submit', handleSubmit)
})

function totalParticipantsOf(e: ElementId): number {
  const m = selectionByElement.get(e) as Map<string, BoxId>
  return m ? m.size : 0
}
function countByBoxOf(e: ElementId): Record<BoxId, number> {
  const acc: Record<BoxId, number> = { A: 0, B: 0, C: 0, D: 0 }
  const m = selectionByElement.get(e) as Map<string, BoxId>
  if (!m) return acc
  m.forEach((b) => { acc[b] += 1 })
  return acc
}
function percentByBoxOf(e: ElementId): Record<BoxId, number> {
  const total = totalParticipantsOf(e)
  const raw: Record<BoxId, number> = { A: 0, B: 0, C: 0, D: 0 }
  if (total === 0) return raw
  const c = countByBoxOf(e)
  return {
    A: Math.round((c.A / total) * 100),
    B: Math.round((c.B / total) * 100),
    C: Math.round((c.C / total) * 100),
    D: Math.round((c.D / total) * 100)
  }
}
function majorityOf(e: ElementId): { id: BoxId; percent: number } | null {
  const p = percentByBoxOf(e)
  const entries: Array<{ id: BoxId; percent: number }> = [
    { id: 'D', percent: p.D },
    { id: 'A', percent: p.A },
    { id: 'B', percent: p.B },
    { id: 'C', percent: p.C }
  ]
  const best = entries.reduce((acc, cur) => (cur.percent > acc.percent ? cur : acc), { id: 'A' as BoxId, percent: -1 })
  return best.percent > 0 ? best : null
}

// 获取前两位选择类型
function getTopTwoChoices(e: ElementId): Array<{ id: BoxId; count: number }> {
  const counts = countByBoxOf(e)
  const entries: Array<{ id: BoxId; count: number }> = [
    { id: 'A', count: counts.A },
    { id: 'B', count: counts.B },
    { id: 'C', count: counts.C },
    { id: 'D', count: counts.D }
  ]
  return entries
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
}

// 获取所有选择的详细信息
function getAllChoicesDetail(elementId: ElementId | null): Array<{
  id: BoxId;
  count: number;
  students: Array<{ key: string; groupNo: string; studentNo: string }>
}> {
  if (!elementId) return []
  
  const m = selectionByElement.get(elementId) as Map<string, BoxId>
  if (!m) return []
  
  const result: Record<BoxId, Array<{ key: string; groupNo: string; studentNo: string }>> = {
    A: [], B: [], C: [], D: []
  }
  
  m.forEach((boxId, studentKey) => {
    const { groupNo, studentNo } = parseStudentKey(studentKey)
    result[boxId].push({ key: studentKey, groupNo, studentNo })
  })
  
  return (['A', 'B', 'C', 'D'] as BoxId[])
    .map(boxId => ({
      id: boxId,
      count: result[boxId].length,
      students: result[boxId].sort((a, b) => {
        const groupDiff = parseInt(a.groupNo) - parseInt(b.groupNo)
        if (groupDiff !== 0) return groupDiff
        return parseInt(a.studentNo) - parseInt(b.studentNo)
      })
    }))
    .filter(choice => choice.count > 0)
    .sort((a, b) => b.count - a.count)
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
</script>

<style scoped>
.page { padding: 12px 0; }
.title { font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #1f2937; }

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
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.progress-count {
  font-size: 14px;
  font-weight: 700;
  color: #059669;
}
.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.rows { display: grid; grid-template-columns: repeat(3, minmax(280px, 1fr)); gap: 16px; }

/* 卡片样式 */
.row { 
  border: 1px solid #e5e7eb; 
  border-radius: 12px; 
  background: #fff; 
  padding: 16px; 
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.row:hover { 
  border-color: #3b82f6; 
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

/* 卡片头部 */
.row-header { display: flex; flex-direction: column; gap: 4px; }
.row-title { font-size: 14px; font-weight: 700; color: #1f2937; line-height: 1.4; }
.row-sub { font-size: 12px; color: #6b7280; }

/* 统计区域 */
.row-stats { flex: 1; }
.top-choices { display: flex; flex-direction: column; gap: 8px; }
.choice-item { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid transparent;
}
.choice-item:first-child { border-left-color: #3b82f6; }
.choice-item:nth-child(2) { border-left-color: #10b981; }

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
.choice-count { 
  font-size: 12px; 
  font-weight: 700; 
  color: #374151;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 12px;
}

.no-data { 
  color: #9ca3af; 
  font-size: 13px; 
  text-align: center;
  padding: 20px 0;
  font-style: italic;
}

/* 指示器 */
.row-indicator { 
  display: flex; 
  justify-content: flex-end; 
  align-items: center;
  color: #9ca3af;
  font-size: 14px;
}

/* 区域配色 */
.bg-A { background: #16a34a; color: white; } /* 现场记录 - 绿 */
.bg-B { background: #f59e0b; color: white; } /* 问卷调查 - 橙 */
.bg-C { background: #3b82f6; color: white; } /* 网络获取 - 蓝 */
.bg-D { background: #ef4444; color: white; } /* 设备采集 - 红 */
.c-A { color: #16a34a; }
.c-B { color: #d97706; }
.c-C { color: #2563eb; }
.c-D { color: #dc2626; }

/* 弹窗样式 */
.detail-content { max-height: 500px; overflow-y: auto; }
.detail-section { margin-bottom: 20px; }
.detail-section:last-child { margin-bottom: 0; }

.detail-header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-label { 
  font-size: 13px; 
  font-weight: 600; 
  padding: 4px 12px;
  border-radius: 16px;
  color: white;
}
.detail-count { 
  font-size: 12px; 
  color: #6b7280;
  font-weight: 600;
}

.detail-students { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px;
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

@media (max-width: 1200px) {
  .rows { grid-template-columns: repeat(2, minmax(280px, 1fr)); }
}
@media (max-width: 780px) {
  .rows { grid-template-columns: 1fr; }
  .row { padding: 12px; }
}
</style>
