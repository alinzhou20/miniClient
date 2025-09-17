<template>
  <div class="survey-page">
    <el-card class="survey-card">
      <template #header>
        <div class="card-header">
          <span>简易问卷设计（单选/多选/填空）</span>
          <div class="spacer"></div>
          <el-button size="small" type="primary" @click="publish" :loading="publishing">发布/更新</el-button>
        </div>
      </template>

      <!-- 按需简化：不需要标题与说明，只保留题目设计 -->

      <div class="q-list">
        <div class="q-item" v-for="(q, qi) in questions" :key="q.id">
          <div class="q-head">
            <div class="q-index">{{ qi + 1 }}.</div>
            <el-input v-model="q.text" placeholder="题目内容" />
            <el-tag size="small" type="info" style="margin-left: 6px">{{ q.type === 'single' ? '单选' : (q.type === 'multi' ? '多选' : '填空') }}</el-tag>
            <el-button text type="danger" @click="removeQuestion(qi)">删除题目</el-button>
          </div>
          <template v-if="q.type === 'single'">
            <div class="opt-list">
              <div class="opt-item" v-for="(_opt, oi) in (q as any).options" :key="oi">
                <span class="opt-letter">{{ letter(oi) }}.</span>
                <el-input v-model="(q as any).options[oi]" :placeholder="`选项内容`" />
                <el-button text type="danger" @click="removeOption(qi, oi)">删除</el-button>
              </div>
              <el-button text type="primary" @click="addOption(qi)">+ 添加选项</el-button>
            </div>
          </template>
          <template v-else-if="q.type === 'multi'">
            <div class="opt-list">
              <div class="opt-item" v-for="(_opt, oi) in (q as any).options" :key="oi">
                <span class="opt-letter">{{ letter(oi) }}.</span>
                <el-input v-model="(q as any).options[oi]" :placeholder="`选项内容`" />
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
          <el-button type="warning" plain @click="addMultiQuestion">+ 新增多选题</el-button>
          <el-button type="primary" plain @click="addTextQuestion">+ 新增填空题</el-button>
        </div>
      </div>

      <div class="preview">
        <div class="pv-title">实时预览</div>
        <div class="pv-item" v-for="(q, qi) in questions" :key="q.id">
          <div class="pv-q"><span class="pv-index">{{ qi+1 }}.</span> {{ q.text || '（未命名题目）' }}</div>
          <template v-if="q.type === 'single'">
            <div class="pv-opts">
              <el-radio-group>
                <el-radio v-for="(opt, oi) in (q as any).options" :key="oi" :label="oi" disabled>{{ opt || `${letter(oi)}. 选项` }}</el-radio>
              </el-radio-group>
            </div>
          </template>
          <template v-else-if="q.type === 'multi'">
            <div class="pv-opts">
              <el-checkbox-group>
                <el-checkbox v-for="(opt, oi) in (q as any).options" :key="oi" :label="oi" disabled>{{ opt || `${letter(oi)}. 选项` }}</el-checkbox>
              </el-checkbox-group>
            </div>
          </template>
          <template v-else>
            <div class="pv-blank" aria-hidden="true"></div>
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
interface QMulti {
  id: string
  type: 'multi'
  text: string
  options: string[]
}
interface QText {
  id: string
  type: 'text'
  text: string
}

// 移除标题与说明，仅保留题目设计
const questions = reactive<Array<QSingle | QMulti | QText>>([])
const publishing = ref(false)

function uid() { return Math.random().toString(36).slice(2, 10) }

function addQuestion() {
  questions.push({ id: uid(), type: 'single', text: '', options: ['', ''] })
}
function addMultiQuestion() {
  questions.push({ id: uid(), type: 'multi', text: '', options: ['', ''] })
}
function addTextQuestion() {
  questions.push({ id: uid(), type: 'text', text: '' })
}
function removeQuestion(idx: number) {
  questions.splice(idx, 1)
}
function addOption(qIdx: number) {
  const q = questions[qIdx] as QSingle | QMulti
  if (q.type !== 'single' && q.type !== 'multi') return
  q.options.push('')
}
function removeOption(qIdx: number, oIdx: number) {
  const q = questions[qIdx] as QSingle | QMulti
  if (q.type !== 'single' && q.type !== 'multi') return
  q.options.splice(oIdx, 1)
}

async function publish() {
  const auth = useAuthStore()
  if (!auth.currentUser) { ElMessage.error('未登录'); return }
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
        title: '',
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
  questions.forEach((q, idx) => {
    const no = `${idx + 1}.`
    const tag = q.type === 'single' ? ' [单选题]' : (q.type === 'multi' ? ' [多选题]' : ' [填空题]')
    // 题干
    lines.push(`${no}${q.text || ''}${tag}`.trim())
    if ((q as any).options && Array.isArray((q as any).options)) {
      const opts = (q as any).options as string[]
      opts.forEach((opt, oi) => {
        lines.push(`${letter(oi)}.${opt || ''}`)
      })
    }
    lines.push('')
  })
  return lines.join('\n')
}

function letter(i: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[i] || '?'
}
</script>

<style scoped>
.survey-page { max-width: 960px; margin: 0 auto; padding: 12px; }
.card-header { display: flex; align-items: center; gap: 8px; }
.spacer { flex: 1; }
.q-list { margin-top: 8px; }
.q-item { padding: 8px 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; }
.q-head { display: flex; gap: 8px; align-items: center; }
.q-index { width: 22px; text-align: right; color: #666; }
.opt-list { margin: 8px 0; display: flex; flex-direction: column; gap: 6px; }
.opt-item { display: flex; gap: 8px; align-items: center; margin-left: 30px; }
.opt-letter { width: 18px; color: #888; text-align: right; }
.add-actions { display: flex; gap: 8px; margin-top: 8px; }
.preview { margin-top: 12px; background: #fafafa; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
.pv-title { font-weight: 700; margin-bottom: 8px; }
.pv-item { margin-bottom: 10px; padding: 10px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
.pv-q { margin-bottom: 6px; font-weight: 600; }
.pv-index { margin-right: 6px; color: #2b6aa6; }
.pv-blank { height: 20px; border-bottom: 2px solid #333; width: 60%; margin-top: 6px; }
</style>
