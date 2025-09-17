<template>
    <div class="survey-monitor">
      <!-- 两栏布局：左侧筛选+网格；右侧选中预览侧栏 -->
      <div class="layout">
        <div class="main">
          <!-- 卡片网格（每卡片仅展示一道题目） -->
          <div class="card-grid">
            <el-card
              v-for="item in filteredQuestions"
              :key="item.key + '-' + ((item.q as any).id || item.idx)"
              class="survey-card"
              shadow="hover"
            >
              <div class="pv-item" :class="{ selected: isSelected(item.key, (item.q as any).id) }">
                <div class="pv-row">
                  <div class="pv-content">
                    <div class="pv-q">
                      {{ (item.q as any).text || '（未命名题目）' }}
                    </div>
                    <template v-if="(item.q as any).type === 'single'">
                      <el-radio-group>
                        <el-radio v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi" :label="oi" disabled>
                          {{ opt || `${letter(oi)}. 选项` }}
                        </el-radio>
                      </el-radio-group>
                    </template>
                    <template v-else-if="(item.q as any).type === 'multi'">
                      <el-checkbox-group>
                        <el-checkbox v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi" :label="oi" disabled>
                          {{ opt || `${letter(oi)}. 选项` }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </template>
                    <template v-else>
                      <div class="pv-blank" aria-hidden="true"></div>
                    </template>
                  </div>
                  <div class="pv-check">
                    <el-checkbox
                      size="large"
                      :model-value="isSelected(item.key, (item.q as any).id)"
                      @change="() => toggleSelect(item.key, (item.q as any).id)"
                    />
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <aside class="side">
          <!-- 选中题目渲染卡片（右侧侧栏） -->
          <el-card class="selected-card" shadow="never">
             <el-button size="small" type="success" :disabled="!selectedList.length" @click="sendSelectedToTeacher">发送</el-button>
            <el-button size="small" :disabled="!selectedList.length" @click="clearSelected">清空</el-button>
            <template #header>
              <div class="sel-head">
                <div class="pv-title">全校学生数字设备使用情况调查</div>
                <div class="pv-desc">为全面了解全校学生的近视情况，以及大家日常使用电脑、平板、手机等数字设备的时长、频率等实际情况，特开展本次调查。后续我们会结合调查数据，分析数字设备使用与近视之间是否存在关联，请大家根据自身真实情况填写问卷，感谢您的配合！</div>
              </div>
            </template>
            <div class="sel-body">
              <div class="sel-item" v-for="(item, idx) in selectedList" :key="item.key + '-' + item.qid">
                <div class="q-block">
                  <div class="q-head">
                    <span class="q-index">{{ idx + 1 }}.</span>
                    <span class="q-text">{{ item.q.text || '（未命名题目）' }}</span>
                    <span class="q-type">{{ typeTag(item.q.type) }}</span>
                  </div>
                  <div v-if="Array.isArray((item.q as any).options)" class="q-opts">
                    <div class="q-opt" v-for="(opt, oi) in ((item.q as any).options || [])" :key="oi">{{ letter(oi) }}. {{ opt }}</div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </aside>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, computed, onMounted } from 'vue'
  import { socketService } from '@/services/socket'
  import { useAuthStore } from '@/stores/auth'
  
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
  const filter = reactive({ group: '', student: '', keyword: '', topic: '' })
  const groups = computed(() => Array.from(new Set(rows.value.map(r => r.groupNo))))
  const students = computed(() => Array.from(new Set(rows.value.map(r => r.studentNo))))
  const topics = computed(() => {
    const set = new Set<string>()
    Array.from(store.values()).forEach(p => {
      const t = (p.data as any)?.topic
      if (t) set.add(String(t))
    })
    return Array.from(set)
  })
  const filtered = computed(() => {
    const kw = filter.keyword.trim().toLowerCase()
    return rows.value.filter(r => {
      const matchGroup = !filter.group || r.groupNo === filter.group
      const matchStu = !filter.student || r.studentNo === filter.student
      const topicVal = (getByKey(r.key)?.data as any)?.topic || ''
      const matchTopic = !filter.topic || String(topicVal) === String(filter.topic)
      let matchKw = true
      if (kw) {
        const payload = getByKey(r.key)
        const inTitle = (r.title || '').toLowerCase().includes(kw)
        const inQuestions = !!payload?.data?.questions?.some(q => (q.text || '').toLowerCase().includes(kw))
        matchKw = inTitle || inQuestions
      }
      return matchGroup && matchStu && matchTopic && matchKw
    })
  })

  // 将小组维度的 filtered 行展开为题目维度，且仅保留 填空(text)/单选(single)/多选(multi)，排除量表/矩阵/排序等
  const filteredQuestions = computed(() => {
    const out: Array<{ key: string; q: any; idx: number }> = []
    const banMarkers = ['[量表题]', '[矩阵题]', '[排序题]']
    filtered.value.forEach(row => {
      const payload = getByKey(row.key)
      const qs = payload?.data?.questions || []
      qs.forEach((q: any, i: number) => {
        const t = (q?.type || '').toLowerCase()
        const text = String(q?.text || '')
        const allowType = t === 'single' || t === 'multi' || t === 'text'
        const hasBanMarker = banMarkers.some(m => text.includes(m))
        if (allowType && !hasBanMarker) {
          out.push({ key: row.key, q, idx: i })
        }
      })
    })
    return out
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
  
  // 已移除复制导出按钮：导出函数不再需要
  
  function clearSelected() {
    selectedGlobal.splice(0, selectedGlobal.length)
    ui.forEach(state => state.selected.splice(0, state.selected.length))
  }

  // ---------- 静态题库初始化与发送 ----------
  const authStore = useAuthStore()

  function rid(prefix = 'q'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
  }

  // 将所选题目生成文本格式，供复制与发送中的 formattedText 复用
  function buildFormattedFromSelected(): string {
    if (!selectedList.value.length) return ''
    const lines: string[] = []
    selectedList.value.forEach((item) => {
      const q: any = item.q
      const topic = (getByKey(item.key) as any)?.data?.topic || ''
      const topicTag = topic ? ` [主题:${topic}]` : ''
      lines.push(`${q.text || ''} ${typeTag(q.type)}${topicTag}`.trim())
      if (Array.isArray(q.options)) {
        (q.options as string[]).forEach((opt: string, oi: number) => {
          lines.push(`${letter(oi)}.${opt || ''}`)
        })
      }
      lines.push('')
    })
    return lines.join('\n')
  }

  async function sendSelectedToTeacher() {
    if (!selectedList.value.length) return
    const user = authStore.currentUser
    if (!user || !user.groupNo || !user.studentNo) {
      console.warn('未获取到学生身份，无法发送')
      return
    }

    // 组合题目（按选择顺序）
    const questions = selectedList.value.map((item, idx) => {
      const src: any = item.q
      return {
        id: src.id || rid('sel'),
        type: src.type,
        text: src.text,
        options: Array.isArray(src.options) ? [...src.options] : undefined,
        index: idx + 1,
        createdAt: Date.now()
      }
    })

    const payload = {
      type: 'survey',
      from: {
        groupNo: String(user.groupNo!),
        studentNo: String(user.studentNo!)
      },
      data: {
        title: '全校学生数字设备使用情况调查\n为全面了解全校学生的近视情况，以及大家日常使用电脑、平板、手机等数字设备的时长、频率等实际情况，特开展本次调查。后续我们会结合调查数据，分析数字设备使用与近视之间是否存在关联，请大家根据自身真实情况填写问卷，感谢您的配合！',
        topic: '课堂练习',
        formattedText: buildFormattedFromSelected(),
        questions
      },
      at: Date.now()
    }

    try {
      await socketService.submit(payload as any)
      // 保留右侧选中列表，不清空，便于继续查看与修改
    } catch (e) {
      console.error('发送失败', e)
    }
  }

  // 预置若干静态问卷模板，供左侧卡片浏览与选择题目
  function seedStaticSurveys() {
    const now = Date.now()
    const samples: SurveyPayload[] = [
      {
        type: 'survey',
        from: { groupNo: '1', studentNo: '0' },
        at: now,
        data: {
          title: '视力与用眼习惯调查',
          topic: '视力健康',
          questions: [
            { id: rid(), type: 'single', text: '你是否近视？', options: ['是','否'] },
            { id: rid(), type: 'single', text: '你的性别？', options: ['男','女'] },
            { id: rid(), type: 'text',   text: '你的年级？' },
            { id: rid(), type: 'text',   text: '你周六周日使用数字设备的时间？（分钟）' },
            { id: rid(), type: 'single', text: '你周六周日使用数字设备时间的长短？', options: ['长','短','不用'] },
            { id: rid(), type: 'single', text: '你在使用数字设备时与屏幕的距离是多少？', options: ['非常近（小于20厘米）','比较近（20-40厘米）','适中（40-60厘米）','比较远（60厘米以上）'] }
          ]
        }
      }
    ]

    samples.forEach(p => {
      const key = `${p.from.groupNo}-${p.from.studentNo}`
      store.set(key, p)
    })
  }

  onMounted(() => {
    seedStaticSurveys()
  })
</script>
  
  <style scoped>
  .survey-monitor { padding: 8px; max-width: 1268px; margin: 0 0; }
  .header { margin-bottom: 8px; }
  .header h3 { margin: 0 0 4px; }
  .header .sub { color: #666; font-size: 12px; }
  .layout { display: grid; grid-template-columns: 1fr 400px; column-gap: 24px; align-items: start; }
  .main { min-width: 0; }
  .side { min-width: 0; position: sticky; top: 8px; align-self: start; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0 12px; }
  .tb-item { margin-right: 4px; }
  .card-grid { display: grid; grid-template-columns: repeat(2, 400px); gap: 8px 8px; justify-content: start; }
  .survey-card { border-radius: 10px; width: 400px; height: 130px; }
  .survey-card :deep(.el-card__body) { height: 100%; display: flex; flex-direction: column; min-height: 0; padding: 8px 10px; }
  .pv-item { height: 100%; display: flex; }
  .pv-row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px; }
  .pv-content { overflow: hidden; flex: 1 1 auto; min-width: 0; }
  .pv-check { flex: 0 0 auto; }
  .card-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
  .meta { display: flex; gap: 6px; align-items: center; }
  .meta .time { color: #888; font-size: 12px; margin-left: auto; }
  .title { font-weight: 700; color: #333; }
  .pv-q { margin-bottom: 6px; font-weight: 600; white-space: normal; overflow: visible; text-overflow: clip; }
  .pv-index { margin-right: 6px; color: #2b6aa6; }
  .pv-blank { height: 18px; border-bottom: 2px solid #bbb; width: 60%; margin-top: 8px; }
  .fmt-wrap { margin-top: 10px; }
  .fmt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .fmt-title { font-weight: 700; color: #333; }
  
  /* 选中预览卡片固定高度并内部滚动 */
  .selected-card { width: 100%; height: 400px; display: flex; flex-direction: column; }
  .sel-head { display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 4px; }
  .sel-actions { display: flex; gap: 6px; }
  .selected-card :deep(.el-card__body) { flex: 1 1 auto; overflow: auto; padding-right: 6px; }
  .sel-body { padding-right: 2px; }
  .preview-head { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
  .pv-title { font-size: 24px; font-weight: 900; color: #1677ff; margin-bottom: 6px; text-align: center; letter-spacing: 0.5px; }
  .pv-desc { text-indent: 2em;font-size: 14px; color: #444; text-align: left; }
  .sel-footer { display: flex; gap: 8px; justify-content: center; padding-top: 8px; }
  /* 放大复选框，增强可见性 */
  :deep(.pv-check .el-checkbox .el-checkbox__inner) { transform: scale(1.4); }
  :deep(.pv-check .el-checkbox.is-checked .el-checkbox__inner) { border-color: #409EFF; background-color: #409EFF; }
  .sel-item { padding: 10px 0; border-bottom: 1px dashed #eee; }
  .q-block { display: flex; flex-direction: column; gap: 6px; }
  .q-head { display: flex; align-items: baseline; gap: 0; }
  .q-index { margin-right: 6px; color: #2b6aa6; }
  .q-text { font-weight: 600; color: #222; flex: 1 1 auto; }
  .q-type { font-size: 12px; color: #999; margin-left: 0; }
  .q-opts { display: grid; grid-template-columns: 1fr; gap: 4px; margin-left: 0; color: #444; }
  .q-opt { padding-left: 2px; }
  </style>
  