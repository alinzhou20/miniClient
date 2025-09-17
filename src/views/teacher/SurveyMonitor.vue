<template>
  <div class="survey-monitor">
    <div class="header">
      <h3>问卷实时监控</h3>
      <div class="sub">学生端发布/更新的问卷会在此实时出现（按学生维度保留最新一份）</div>
    </div>

    <!-- 两栏布局：左侧筛选+网格；右侧选中预览侧栏 -->
    <div class="layout">
      <div class="main">
        <!-- 工具栏：筛选与搜索 -->
        <div class="toolbar">
          <el-select v-model="filter.group" placeholder="按小组筛选" clearable class="tb-item" style="width: 140px">
            <el-option v-for="g in groups" :key="g" :label="`第${g}组`" :value="g" />
          </el-select>
          <el-select v-model="filter.student" placeholder="按学号筛选" clearable class="tb-item" style="width: 140px">
            <el-option v-for="s in students" :key="s" :label="`${s}号`" :value="s" />
          </el-select>
          <el-input v-model="filter.keyword" placeholder="搜索标题/题干" clearable class="tb-item" style="max-width: 240px" />
          <el-switch v-model="showFormatted" active-text="显示文本格式" inactive-text="隐藏文本格式" class="tb-item" />
        </div>

        <!-- 卡片网格（响应式） -->
        <div class="card-grid">
          <el-card v-for="row in filtered" :key="row.key" class="survey-card" shadow="hover">
            <div class="card-head">
              <div class="meta">
                <el-tag type="info" size="small">第{{ row.groupNo }}组</el-tag>
                <el-tag type="success" size="small">{{ row.studentNo }}号</el-tag>
                <span class="time">{{ new Date(row.at).toLocaleString() }}</span>
              </div>
              <div class="title" v-if="row.title">{{ row.title }}</div>
            </div>
            <div class="pv-list">
              <div class="pv-item" v-for="(q, i) in (getByKey(row.key)?.data?.questions || [])" :key="(q as any).id || i">
                <div class="pv-q">
                  <span class="pv-index">{{ (((q as any).index) || i+1) + '.' }}</span>
                  {{ (q as any).text || '（未命名题目）' }}
                </div>
                <div class="pv-controls">
                  <el-checkbox :model-value="isSelected(row.key, (q as any).id)" @change="() => toggleSelect(row.key, (q as any).id)">选中</el-checkbox>
                </div>
                <template v-if="(q as any).type === 'single'">
                  <el-radio-group>
                    <el-radio v-for="(opt, oi) in ((q as any).options || [])" :key="oi" :label="oi" disabled>
                      {{ opt || `${letter(oi)}. 选项` }}
                    </el-radio>
                  </el-radio-group>
                </template>
                <template v-else-if="(q as any).type === 'multi'">
                  <el-checkbox-group>
                    <el-checkbox v-for="(opt, oi) in ((q as any).options || [])" :key="oi" :label="oi" disabled>
                      {{ opt || `${letter(oi)}. 选项` }}
                    </el-checkbox>
                  </el-checkbox-group>
                </template>
                <template v-else>
                  <div class="pv-blank" aria-hidden="true"></div>
                </template>
              </div>
            </div>

            <div v-if="showFormatted && getByKey(row.key)?.data?.formattedText" class="fmt-wrap">
              <div class="fmt-head">
                <div class="fmt-title">文本格式（可复制）</div>
                <el-button type="primary" size="small" @click="copyFormatted(getByKey(row.key)!.data!.formattedText!)">复制</el-button>
              </div>
              <el-input type="textarea" :rows="6" :model-value="getByKey(row.key)!.data!.formattedText!" readonly />
            </div>

            <div class="card-actions">
              <span class="sel-hint" v-if="uiGet(row.key).selected.length">该组已选 {{ uiGet(row.key).selected.length }} 题</span>
            </div>
          </el-card>
        </div>
      </div>

      <aside class="side">
        <!-- 选中题目渲染卡片（右侧侧栏） -->
        <el-card class="selected-card" shadow="never">
          <template #header>
            <div class="sel-head">
              <span>已选题目预览（共 {{ selectedList.length }} 题）</span>
              <div class="sel-actions">
                <el-button size="small" type="primary" :disabled="!selectedList.length" @click="exportSelectedGlobal">复制导出</el-button>
                <el-button size="small" :disabled="!selectedList.length" @click="clearSelected">清空</el-button>
              </div>
            </div>
          </template>
          <div class="sel-body">
            <div class="sel-item" v-for="(item, idx) in selectedList" :key="item.key + '-' + item.qid">
              <div class="sel-q">
                <span class="sel-index">{{ idx + 1 }}.</span>
                <span class="sel-text">{{ item.q.text || '（未命名题目）' }}</span>
                <span class="sel-tag">{{ typeTag(item.q.type) }}</span>
                <el-tag size="small" class="sel-meta">第{{ item.key }}组</el-tag>
              </div>
              <div v-if="Array.isArray((item.q as any).options)" class="sel-opts">
                <div class="sel-opt" v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi">{{ letter(oi) }}. {{ opt }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
    formattedText?: string;
    questions: Array<QSingle | QMulti | QText>;
  }
  at: number
}

const store = reactive(new Map<string, SurveyPayload>())
// 行聚合：同一小组仅保留最新一份（覆盖）
const rows = computed(() => {
  const latestByGroup = new Map<string, SurveyPayload>()
  Array.from(store.values()).forEach(p => {
    const g = String(p.from.groupNo)
    const prev = latestByGroup.get(g)
    if (!prev || (p.at || 0) > (prev.at || 0)) {
      latestByGroup.set(g, p)
    }
  })
  return Array.from(latestByGroup.values()).map(p => ({
    groupNo: String(p.from.groupNo),
    studentNo: String(p.from.studentNo),
    title: p.data?.title || '',
    qCount: p.data?.questions?.length || 0,
    at: p.at || Date.now(),
    key: `${p.from.groupNo}` // 以小组作为 key
  })).sort((a,b) => b.at - a.at)
})

// 工具栏过滤
const filter = reactive({ group: '', student: '', keyword: '' })
const groups = computed(() => Array.from(new Set(rows.value.map(r => r.groupNo))))
const students = computed(() => Array.from(new Set(rows.value.map(r => r.studentNo))))
const filtered = computed(() => {
  const kw = filter.keyword.trim().toLowerCase()
  return rows.value.filter(r => {
    const matchGroup = !filter.group || r.groupNo === filter.group
    const matchStu = !filter.student || r.studentNo === filter.student
    let matchKw = true
    if (kw) {
      const payload = getByKey(r.key)
      const inTitle = (r.title || '').toLowerCase().includes(kw)
      const inQuestions = !!payload?.data?.questions?.some(q => (q.text || '').toLowerCase().includes(kw))
      matchKw = inTitle || inQuestions
    }
    return matchGroup && matchStu && matchKw
  })
})

// 卡片内选项字母与访问器
function getByKey(key: string): SurveyPayload | null {
  // 按小组作为 key，需从 latestByGroup 视角获取；此处简单遍历 store 中同组最新一条
  let latest: SurveyPayload | null = null
  Array.from(store.values()).forEach(p => {
    if (String(p.from.groupNo) !== String(key)) return
    if (!latest || (p.at || 0) > (latest.at || 0)) latest = p
  })
  return latest
}
function letter(i: number): string { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[i] || '?' }
const showFormatted = ref(false)

// 选中（按卡片-小组维度）
type UIState = { selected: string[] }
const ui = reactive(new Map<string, UIState>())
function uiGet(key: string): UIState {
  if (!ui.has(key)) ui.set(key, { selected: [] })
  return ui.get(key)!
}
function isSelected(key: string, qid: string): boolean {
  const s = uiGet(key).selected
  return s.includes(qid)
}
// 全局选择顺序（跨小组）
const selectedGlobal = reactive<Array<{ key: string; qid: string }>>([])
function toggleSelect(key: string, qid: string) {
  const s = uiGet(key).selected
  const i = s.indexOf(qid)
  if (i >= 0) s.splice(i, 1)
  else s.push(qid)
  // 维护全局顺序
  const gi = selectedGlobal.findIndex(v => v.key === key && v.qid === qid)
  if (gi >= 0) {
    selectedGlobal.splice(gi, 1)
  } else {
    selectedGlobal.push({ key, qid })
  }
}

// 计算已选题目（全局，按选择顺序）
const selectedList = computed(() => {
  const out: Array<{ key: string; qid: string; q: any }> = []
  selectedGlobal.forEach(it => {
    const payload = getByKey(it.key)
    const q = payload?.data?.questions?.find((qq: any) => qq.id === it.qid)
    if (q) out.push({ key: it.key, qid: it.qid, q })
  })
  return out
})

function typeTag(t: string) {
  return t === 'single' ? '[单选题]' : (t === 'multi' ? '[多选题]' : '[填空题]')
}

function exportSelectedGlobal() {
  if (!selectedList.value.length) return
  const lines: string[] = []
  selectedList.value.forEach((item, idx) => {
    const q: any = item.q
    lines.push(`${idx + 1}. ${q.text || ''} ${typeTag(q.type)}`.trim())
    if (Array.isArray(q.options)) {
      (q.options as string[]).forEach((opt: string, oi: number) => {
        lines.push(`${letter(oi)}.${opt || ''}`)
      })
    }
    lines.push('')
  })
  copyFormatted(lines.join('\n'))
}

function clearSelected() {
  selectedGlobal.splice(0, selectedGlobal.length)
  ui.forEach(state => state.selected.splice(0, state.selected.length))
}

// 复制文本

function copyFormatted(text: string) {
  if (!text) return
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
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
  socketService.on('submit', onSubmit)
})

onBeforeUnmount(() => {
  socketService.off('submit', onSubmit)
})
</script>

<style scoped>
.survey-monitor { padding: 8px; max-width: 1268px; margin: 0 0; }
.header { margin-bottom: 8px; }
.header h3 { margin: 0 0 4px; }
.header .sub { color: #666; font-size: 12px; }
.layout { display: grid; grid-template-columns: 800px 400px; column-gap: 68px; align-items: start; }
.main { min-width: 0; }
.side { min-width: 0; position: sticky; top: 8px; align-self: start; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0 12px; }
.tb-item { margin-right: 4px; }
.card-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
.survey-card { border-radius: 10px; }
.survey-card { height: 380px; display: flex; flex-direction: column; }
.survey-card :deep(.el-card__body) { height: 100%; display: flex; flex-direction: column; min-height: 0; }
.card-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.meta { display: flex; gap: 6px; align-items: center; }
.meta .time { color: #888; font-size: 12px; margin-left: auto; }
.title { font-weight: 700; color: #333; }
.pv-list { display: flex; flex-direction: column; gap: 8px; overflow: auto; padding-right: 6px; flex: 1 1 auto; min-height: 0; }
.pv-item { padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
.pv-q { margin-bottom: 6px; font-weight: 600; }
.pv-index { margin-right: 6px; color: #2b6aa6; }
.pv-blank { height: 18px; border-bottom: 2px dashed #666; width: 60%; margin-top: 4px; }
.fmt-wrap { margin-top: 10px; }
.fmt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.fmt-title { font-weight: 700; color: #333; }

/* 选中预览卡片滚动 */
.selected-card { width: 100%; }
.sel-head { display: flex; align-items: center; justify-content: space-between; }
.sel-actions { display: flex; gap: 6px; }
.sel-body { max-height: 180px; overflow: auto; padding-right: 6px; }
.sel-item { padding: 6px 0; border-bottom: 1px dashed #eee; }
.sel-q { display: flex; align-items: center; gap: 8px; }
.sel-index { color: #2b6aa6; }
.sel-text { font-weight: 600; }
.sel-tag { color: #666; font-size: 12px; }
.sel-meta { margin-left: auto; }
</style>
