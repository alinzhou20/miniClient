<template>
  <div class="survey-monitor">

    <div class="grid">
      <el-empty v-if="!cards.length" description="等待学生提交问卷…" />
      <el-card v-for="card in cards" :key="card.key" class="t-card" shadow="hover">
        <div class="sel-head">
          <div class="t-actions">
            <el-button text size="small" @click="exportCard(card)">导出</el-button>
          </div>
          <div class="pv-title">调查问卷 - 第{{ card.from.groupNo }}小组</div>
          <div class="pv-desc">请勾选左侧卡片以构成本次问卷，预览实时更新。</div>
        </div>

        <div class="t-body">
          <div class="q-item" v-for="(q, qi) in card.data.questions" :key="(q as any).id || qi">
            <div class="q-head">
              <span class="q-text">{{ (q as any).text || '（未命名题目）' }}</span>
              <span class="q-type">{{ typeTag((q as any).type) }}</span>
            </div>
            <div v-if="Array.isArray((q as any).options)" class="q-opts">
              <div class="q-opt" v-for="(opt, oi) in ((q as any).options || [])" :key="oi">{{ letter(oi) }}. {{ opt }}</div>
            </div>
            <div v-else class="q-blank" />
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'

type QSingle = { id: string; type: 'single'; text: string; options: string[]; index?: number; createdAt?: number }
type QMulti = { id: string; type: 'multi'; text: string; options: string[]; index?: number; createdAt?: number }
type QText = { id: string; type: 'text'; text: string; index?: number; createdAt?: number }
interface SurveyPayload {
  type: 'survey'
  from: { groupNo: string; studentNo: string }
  data: {
    title: string;
    description?: string;
    version?: number;
    author?: { groupNo: string; studentNo: string };
    topic?: string;
    formattedText?: string;
    questions: Array<QSingle | QMulti | QText>;
  }
  at: number
}

const store = reactive(new Map<string, SurveyPayload>())
const cards = computed(() => {
  const latest = new Map<string, SurveyPayload>()
  Array.from(store.values()).forEach(p => {
    const key = `${p.from.groupNo}-${p.from.studentNo}`
    const prev = latest.get(key)
    if (!prev || (p.at || 0) > (prev.at || 0)) latest.set(key, p)
  })
  return Array.from(latest.values())
    .sort((a,b) => (b.at || 0) - (a.at || 0))
    .map(p => ({ ...p, key: `${p.from.groupNo}-${p.from.studentNo}` }))
})

function letter(i: number): string { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[i] || '?' }
function typeTag(t: string) { return t === 'single' ? '[单选题]' : (t === 'multi' ? '[多选题]' : '[填空题]') }

function exportCard(card: any) {
  if (!card || !card.data) return
  const lines: string[] = []
  if (card.data.title) lines.push(String(card.data.title))
  if (card.data.description) lines.push(String(card.data.description))
  const qs = Array.isArray(card.data.questions) ? card.data.questions : []
  qs.forEach((q: any, idx: number) => {
    lines.push(`${idx + 1}. ${q.text || ''} ${typeTag(q.type)}`.trim())
    if (Array.isArray(q.options)) {
      q.options.forEach((opt: string, oi: number) => {
        lines.push(`${letter(oi)}.${opt || ''}`)
      })
    }
    lines.push('')
  })
  copyFormatted(lines.join('\n'))
}

function copyFormatted(text: string) {
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

function onSubmit(payload: any) {
  if (!payload || String(payload.type) !== 'survey') return
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo || !from.studentNo) return
  const key = `${from.groupNo}-${from.studentNo}`
  store.set(key, {
    type: 'survey',
    from: { groupNo: String(from.groupNo), studentNo: String(from.studentNo) },
    data,
    at: payload.at || Date.now()
  })
}

onMounted(() => {
  console.log('[Teacher] onMounted, listen submit, status=', socketService.getConnectionStatus?.())
  socketService.on('submit', (payload: any) => {
    console.log('[Teacher] submit event received:', payload)
    onSubmit(payload)
  })
})

onBeforeUnmount(() => {
  socketService.off('submit')
})
</script>

<style scoped>
.survey-monitor { padding: 12px; max-width: 1280px; margin: 0 auto; }
.header { margin-bottom: 10px; }
.header h3 { margin: 0 0 4px; }
.header .sub { color: #666; font-size: 12px; }

.grid { display: grid; grid-template-columns: repeat(3, 400px); gap: 12px; align-items: start; justify-content: start; }
.t-card { display: flex; flex-direction: column; min-height: 0; width: 400px; height: 400px; }
.t-card :deep(.el-card__body) { display: flex; flex-direction: column; gap: 8px; flex: 1 1 auto; overflow: auto; }
.sel-head { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
.t-actions { display: flex; justify-content: flex-end; }
.t-meta { display: flex; gap: 6px; align-items: center; }
.t-time { color: #888; font-size: 12px; margin-left: auto; }

/* 参考学生端标题与说明样式 */
.pv-title { font-size: 24px; font-weight: 900; color: #1677ff; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px; }
.pv-desc { font-size: 14px; color: #444; text-align: left; }

.t-body { display: flex; flex-direction: column; gap: 8px; overflow: auto; }
.q-item { padding: 6px 8px; background: #fafafa; border: 1px dashed #eee; border-radius: 6px; }
.q-head { display: flex; align-items: baseline; gap: 0; }
.q-text { font-weight: 600; color: #222; flex: 1 1 auto; }
.q-type { font-size: 12px; color: #999; margin-left: 0; }
.q-opts { display: grid; grid-template-columns: 1fr; gap: 4px; margin-left: 0; color: #444; }
.q-opt { padding-left: 2px; }
.q-blank { height: 18px; border-bottom: 2px solid #666; width: 60%; margin-top: 8px; }
</style>