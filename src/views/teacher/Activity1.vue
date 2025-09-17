<template>
  <div class="page">
    <h2 class="title">活动一：数据获取方法多（统计看板）</h2>
    <div class="rows">
      <div v-for="e in elements" :key="e.id" class="row">
        <div class="row-left">
          <div class="row-title">{{ e.title }}</div>
          <div class="row-sub">参与人数：<strong>{{ totalParticipantsOf(e.id) }}</strong></div>
        </div>
        <div class="row-right">
          <div class="major">
            大部分人认为：
            <span v-if="majorityOf(e.id)" class="major-label" :class="'c-' + majorityOf(e.id)!.id">
              {{ boxLabels[majorityOf(e.id)!.id] }}
            </span>
            <span v-else class="major-label none">暂无数据</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'

type BoxId = 'A' | 'B' | 'C' | 'D'
const boxLabels: Record<BoxId, string> = { A: '现场记录', B: '问卷调查', C: '网络获取', D: '设备采集' }
const elements = [
  { id: 'check_vision', title: '检测学生视力' },
  { id: 'know_device_usage', title: '了解学生数字设备使用情况' },
  { id: 'register_vision', title: '登记视力' },
  { id: 'bad_habits', title: '使用电子设备的不良习惯' },
  { id: 'protect_eyes', title: '保护视力的方法' },
  { id: 'usage_duration', title: '了解数字设备使用时长' },
  { id: 'common_devices', title: '常用的数字设备有哪些' },
  { id: 'check_vision_alt', title: '检查学生视力' },
  { id: 'survey_all_devices', title: '调查全校学生数字设备使用情况' }
] as const
type ElementId = typeof elements[number]['id']

// 每个 elementId 对应一个 Map<studentKey, BoxId>
const selectionByElement = reactive(new Map<ElementId, Map<string, BoxId>>())
elements.forEach(e => selectionByElement.set(e.id, new Map<string, BoxId>()))

function studentKey(groupNo: string, studentNo: string) {
  return `${groupNo}-${studentNo}`
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
  if (action === 'reset') {
    store.delete(studentKey(g, s))
    return
  }
  const b = String(data.boxId ?? '') as BoxId
  if (!['A','B','C','D'].includes(b)) return
  store.set(studentKey(g, s), b)
}

onMounted(() => {
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
</script>

<style scoped>
.page { padding: 8px 0; }
.title { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.rows { display: grid; grid-template-columns: repeat(3, minmax(260px, 1fr)); gap: 10px; }
.row { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; padding: 10px; display: block; }
.row-title { font-size: 13px; font-weight: 700; color: #111; }
.row-sub { font-size: 12px; color: #555; margin-top: 4px; }
.row-left { margin-bottom: 8px; }
.row-right { display: grid; gap: 6px; align-content: start; }
.major { font-size: 12px; color: #444; }
.major-label { font-weight: 700; margin-left: 6px; }
.major-label.none { color: #999; font-weight: 400; }
/* 区域配色 */
.bg-A { background: #16a34a; } /* 现场记录 - 绿 */
.bg-B { background: #f59e0b; } /* 问卷调查 - 橙 */
.bg-C { background: #3b82f6; } /* 网络获取 - 蓝 */
.bg-D { background: #ef4444; } /* 设备采集 - 红 */
.c-A { color: #16a34a; }
.c-B { color: #d97706; }
.c-C { color: #2563eb; }
.c-D { color: #dc2626; }
@media (max-width: 1200px) {
  .rows { grid-template-columns: repeat(2, minmax(260px, 1fr)); }
}
@media (max-width: 780px) {
  .rows { grid-template-columns: 1fr; }
}
</style>
