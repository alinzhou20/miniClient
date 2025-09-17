<template>
  <div class="survey-monitor">
    <div class="header">
      <h3>问卷实时监控</h3>
      <div class="sub">学生端发布/更新的问卷会在此实时出现（按学生维度保留最新一份）</div>
    </div>

    <el-table :data="rows" size="small" border style="width: 100%">
      <el-table-column label="小组" prop="groupNo" width="70" />
      <el-table-column label="学号" prop="studentNo" width="90" />
      <el-table-column label="标题" prop="title" />
      <el-table-column label="题目数" prop="qCount" width="90" />
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ new Date(row.at).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row, $index }">
          <el-button size="small" @click="openDetail($index)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="detail?.data?.title || '问卷'" width="60%">
      <div v-if="detail" class="detail">
        <div class="desc" v-if="detail.data?.description">{{ detail.data.description }}</div>
        <div v-if="detail.data?.formattedText" class="fmt-wrap">
          <div class="fmt-head">
            <div class="fmt-title">文本格式（可复制）</div>
            <el-button size="small" @click="copyFormatted(detail.data.formattedText)">复制</el-button>
          </div>
          <el-input type="textarea" :rows="8" :model-value="detail.data.formattedText" readonly />
        </div>
        <div class="pv-item" v-for="(q, i) in (detail.data?.questions || [])" :key="q.id">
          <div class="pv-q"><span class="pv-index">{{ (((q as any).index) || i+1) + '.' }}</span> {{ q.text }}</div>
          <template v-if="q.type === 'single'">
            <el-radio-group>
              <el-radio v-for="(opt, oi) in (q.options || [])" :key="oi" :label="oi" disabled>{{ opt || `选项${oi+1}` }}</el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-input disabled placeholder="（填空）" />
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'

type QSingle = { id: string; type: 'single'; text: string; options: string[]; index?: number; createdAt?: number }
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
    questions: Array<QSingle | QText>;
  }
  at: number
}

const store = reactive(new Map<string, SurveyPayload>())
const rows = computed(() => {
  return Array.from(store.values()).map(p => ({
    groupNo: String(p.from.groupNo),
    studentNo: String(p.from.studentNo),
    title: p.data?.title || '',
    qCount: p.data?.questions?.length || 0,
    at: p.at || Date.now(),
  })).sort((a,b) => b.at - a.at)
})

const visible = ref(false)
const detail = ref<SurveyPayload | null>(null)
function openDetail(index: number) {
  const list = Array.from(store.values()).sort((a,b) => (b.at||0)-(a.at||0))
  detail.value = list[index] || null
  visible.value = !!detail.value
}

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
.survey-monitor { padding: 8px; }
.header { margin-bottom: 8px; }
.header h3 { margin: 0 0 4px; }
.header .sub { color: #666; font-size: 12px; }
.detail { padding: 6px 2px; }
.desc { color: #555; margin-bottom: 8px; }
.fmt-wrap { margin: 8px 0 12px; }
.fmt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.fmt-title { font-weight: 700; color: #333; }
.q { padding: 8px 0; border-bottom: 1px solid #eee; }
.q-text { font-weight: 700; margin-bottom: 6px; }
.opts { margin: 0; padding-left: 18px; color: #333; }
.pv-item { margin-bottom: 10px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
.pv-q { margin-bottom: 6px; font-weight: 600; }
.pv-index { margin-right: 6px; color: #2b6aa6; }
</style>
