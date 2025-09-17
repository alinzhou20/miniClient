<template>
  <div class="survey-page">
    <el-card class="survey-card">
      <template #header>
        <div class="card-header">
          <span>简易问卷设计（单选）</span>
          <div class="spacer"></div>
          <el-button size="small" type="primary" @click="publish" :loading="publishing">发布/更新</el-button>
        </div>
      </template>

      <el-form label-width="80px" class="meta-form">
        <el-form-item label="标题">
          <el-input v-model="title" placeholder="请输入问卷标题" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="desc" placeholder="可填写问卷说明" />
        </el-form-item>
      </el-form>

      <div class="q-list">
        <div class="q-item" v-for="(q, qi) in questions" :key="q.id">
          <div class="q-head">
            <div class="q-index">{{ qi + 1 }}.</div>
            <el-input v-model="q.text" placeholder="题目内容" />
            <el-tag size="small" type="info" style="margin-left: 6px">{{ q.type === 'single' ? '单选' : '填空' }}</el-tag>
            <el-button text type="danger" @click="removeQuestion(qi)">删除题目</el-button>
          </div>
          <template v-if="q.type === 'single'">
            <div class="opt-list">
              <div class="opt-item" v-for="(opt, oi) in (q as any).options" :key="oi">
                <el-input v-model="(q as any).options[oi]" :placeholder="`选项 ${oi+1}`" />
                <el-button text type="danger" @click="removeOption(qi, oi)">删除</el-button>
              </div>
              <el-button text type="primary" @click="addOption(qi)">+ 添加选项</el-button>
            </div>
          </template>
          <template v-else>
            <div class="opt-list">
              <el-input disabled placeholder="填空题（学生填写）" />
            </div>
          </template>
          <el-divider />
        </div>
        <div class="add-actions">
          <el-button type="success" plain @click="addQuestion">+ 新增单选题</el-button>
          <el-button type="primary" plain @click="addTextQuestion">+ 新增填空题</el-button>
        </div>
      </div>

      <div class="preview">
        <div class="pv-title">实时预览</div>
        <div class="pv-item" v-for="(q, qi) in questions" :key="q.id">
          <div class="pv-q"><span class="pv-index">{{ qi+1 }}.</span> {{ q.text || '（未命名题目）' }}</div>
          <template v-if="q.type === 'single'">
            <el-radio-group>
              <el-radio v-for="(opt, oi) in (q as any).options" :key="oi" :label="oi" disabled>{{ opt || `选项${oi+1}` }}</el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-input disabled placeholder="（填空）" />
          </template>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { socketService } from '@/services/socket'
import { useAuthStore } from '@/stores/auth'

interface QSingle {
  id: string
  type: 'single'
  text: string
  options: string[]
}
interface QText {
  id: string
  type: 'text'
  text: string
}

const title = ref('')
const desc = ref('')
const questions = reactive<Array<QSingle | QText>>([])
const publishing = ref(false)

function uid() { return Math.random().toString(36).slice(2, 10) }

function addQuestion() {
  questions.push({ id: uid(), type: 'single', text: '', options: ['选项1', '选项2'] })
}
function addTextQuestion() {
  questions.push({ id: uid(), type: 'text', text: '' })
}
function removeQuestion(idx: number) {
  questions.splice(idx, 1)
}
function addOption(qIdx: number) {
  const q = questions[qIdx] as QSingle
  if (q.type !== 'single') return
  q.options.push(`选项${q.options.length + 1}`)
}
function removeOption(qIdx: number, oIdx: number) {
  const q = questions[qIdx] as QSingle
  if (q.type !== 'single') return
  q.options.splice(oIdx, 1)
}

async function publish() {
  const auth = useAuthStore()
  if (!auth.currentUser) { ElMessage.error('未登录'); return }
  if (!title.value.trim()) { ElMessage.warning('请填写问卷标题'); return }
  if (questions.length === 0) { ElMessage.warning('请至少添加一题'); return }
  publishing.value = true
  try {
    const formattedText = buildFormattedText()
    const payload: any = {
      type: 'survey',
      from: {
        groupNo: String(auth.currentUser.groupNo),
        studentNo: String(auth.currentUser.studentNo)
      },
      data: {
        title: title.value.trim(),
        description: desc.value.trim(),
        version: 1,
        author: { groupNo: String(auth.currentUser.groupNo), studentNo: String(auth.currentUser.studentNo) },
        questions: questions.map((q, idx) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          options: (q as any).options,
          index: idx + 1,
          createdAt: Date.now()
        })),
        formattedText
      },
      at: Date.now()
    }
    await socketService.submit(payload)
    ElMessage.success('问卷已发布/更新')
  } catch (e: any) {
    ElMessage.error(e?.message || '发布失败')
  } finally {
    publishing.value = false
  }
}

function buildFormattedText(): string {
  const lines: string[] = []
  lines.push('格式说明：查看详细说明')
  lines.push('题号：题目最好有数字题号，如无题号需在题目之前增加空白换行。')
  lines.push('题型标注：推荐用[单选题]、[多选题]、[量表题]、[矩阵题]来标注题型，如无标注会智能识别。')
  lines.push('如识别有问题请联系客服')
  lines.push('')
  questions.forEach((q, idx) => {
    const no = `${idx + 1}.`
    const tag = q.type === 'single' ? ' [单选题]' : ' [简答题]'
    // 题干
    lines.push(`${no}${q.text || ''}${tag}`.trim())
    if ((q as any).options && Array.isArray((q as any).options)) {
      const opts = (q as any).options as string[]
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      opts.forEach((opt, oi) => {
        const prefix = `${letters[oi] || '?'}.`
        lines.push(`${prefix}${opt || ''}`)
      })
    }
    lines.push('')
  })
  return lines.join('\n')
}
</script>

<style scoped>
.survey-page { max-width: 960px; margin: 0 auto; padding: 12px; }
.card-header { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.meta-form { margin-bottom: 10px; }
.q-list { margin-top: 8px; }
.q-item { padding: 8px 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }
.q-head { display: flex; gap: 8px; align-items: center; }
.q-index { width: 22px; text-align: right; color: #666; }
.opt-list { margin: 8px 0; display: flex; flex-direction: column; gap: 6px; }
.opt-item { display: flex; gap: 8px; }
.add-actions { display: flex; gap: 8px; margin-top: 8px; }
.preview { margin-top: 12px; background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
.pv-title { font-weight: 700; margin-bottom: 8px; }
.pv-item { margin-bottom: 10px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
.pv-q { margin-bottom: 6px; font-weight: 600; }
.pv-index { margin-right: 6px; color: #2b6aa6; }
</style>
