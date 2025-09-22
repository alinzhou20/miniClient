<template>
  <div class="survey-monitor">
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

    <div class="grid">
      <el-empty v-if="!cards.length" description="等待学生提交问卷…" />
      <el-card v-for="card in cards" :key="card.key" class="t-card" shadow="hover">
        <!-- 左上角组别标签 -->
        <div class="card-tags">
          <span class="type-tag group-tag">第{{ card.from.groupNo }}组</span>
        </div>

        <div class="card-content">
          <div class="card-title">{{ card.data.title || '未命名问卷' }}</div>
          
          <!-- 显示说明部分 -->
          <div v-if="card.data.descriptions && card.data.descriptions.length > 0" class="desc-section">
            <div v-for="(desc, di) in card.data.descriptions" :key="(desc as any).id || di" class="desc-item">
              {{ (desc as any).text }}
            </div>
          </div>

          <!-- 显示问题列表 -->
          <div v-if="card.data.questions && card.data.questions.length > 0" class="questions-list">
            <div class="q-item" v-for="(q, qi) in card.data.questions" :key="(q as any).id || qi">
              <div class="q-head">
                <span class="q-index">{{ qi + 1 }}.</span>
                <span class="q-text">{{ (q as any).text || '（未命名题目）' }}</span>
                <span class="q-type">{{ typeTag((q as any).type) }}</span>
              </div>

              <div v-if="Array.isArray((q as any).options)" class="q-opts">
                <div class="q-opt" v-for="(opt, oi) in ((q as any).options || [])" :key="oi">{{ letter(oi) }}. {{ opt }}</div>
              </div>
              <div v-else class="q-blank" />
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="(!card.data.questions || card.data.questions.length === 0) && (!card.data.descriptions || card.data.descriptions.length === 0)" class="empty-state">
            该问卷暂无内容
          </div>
        </div>
        
        <div class="card-actions">
          <el-button size="default" type="primary" @click="exportCard(card)">文本导出</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'
import { saveActivity2Data, loadActivity2Data } from '@/utils/localStorage'

type QSingle = { id: string; type: 'single'; text: string; options: string[]; index?: number; createdAt?: number; source?: number }
type QMulti = { id: string; type: 'multi'; text: string; options: string[]; index?: number; createdAt?: number; source?: number }
type QText = { id: string; type: 'text'; text: string; index?: number; createdAt?: number; source?: number }
type QDescription = { id: string; type: 'description'; text: string; index?: number; createdAt?: number; source?: number }
interface SurveyPayload {
  type: 'survey'
  from: { groupNo: string; studentNo: string }
  data: {
    title: string;
    version?: number;
    author?: { groupNo: string; studentNo: string };
    topic?: string;
    formattedText?: string;
    descriptions: Array<QDescription>;
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

// 小组完成统计
const completedGroups = reactive(new Set<string>())
const progressPercentage = computed(() => {
  return Math.round((completedGroups.size / 25) * 100)
})

function letter(i: number): string { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[i] || '?' }
function typeTag(t: string) { return t === 'single' ? '[单选题]' : (t === 'multi' ? '[多选题]' : '[填空题]') }

function exportCard(card: any) {
  if (!card || !card.data) return
  const lines: string[] = []
  
  // 添加标题
  if (card.data.title) lines.push(String(card.data.title))
  lines.push(`第${card.from.groupNo}小组`)
  lines.push('')
  
  // 添加说明部分
  if (card.data.descriptions && Array.isArray(card.data.descriptions)) {
    lines.push('问卷说明：')
    card.data.descriptions.forEach((desc: any) => {
      if (desc.text) lines.push(String(desc.text))
    })
    lines.push('')
  }
  
  // 添加问题列表
  if (card.data.questions && Array.isArray(card.data.questions)) {
    lines.push('问题列表：')
    card.data.questions.forEach((q: any, idx: number) => {
      lines.push(`${idx + 1}. ${q.text || ''} ${typeTag(q.type)}`.trim())
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: string, oi: number) => {
          lines.push(`${letter(oi)}.${opt || ''}`)
        })
      }
      lines.push('')
    })
  }
  
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
  const groupNo = String(from.groupNo)
  const key = groupNo
  
  // 检查小组是否首次提交
  const wasGroupCompleted = completedGroups.has(groupNo)
  
  store.set(key, {
    type: 'survey',
    from: { groupNo: String(from.groupNo), studentNo: String(from.studentNo) },
    data,
    at: payload.at || Date.now()
  })
  
  // 首次提交时添加到完成统计
  if (!wasGroupCompleted) {
    completedGroups.add(groupNo)
  }
  
  // 保存到本地存储
  saveActivity2Data(store)
}

onMounted(() => {
  // 恢复本地存储的数据
  const savedData = loadActivity2Data()
  if (savedData) {
    const groupsSet = new Set<string>()
    savedData.forEach((payload, key) => {
      store.set(key, payload)
      // 提取组号用于统计
      const groupNo = String(payload.from?.groupNo || '')
      if (groupNo) {
        groupsSet.add(groupNo)
      }
    })
    // 恢复小组完成统计
    groupsSet.forEach(groupNo => completedGroups.add(groupNo))
    console.log('[Activity2] 已恢复本地存储数据，共', savedData.size, '条记录，完成小组数:', completedGroups.size)
  }
  
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
.survey-monitor { padding: 12px; max-width: 1280px; margin: 0 0; }

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

.header { margin-bottom: 10px; }
.header h3 { margin: 0 0 4px; }
.header .sub { color: #666; font-size: 12px; }

.grid { display: grid; grid-template-columns: repeat(3, 380px); gap: 12px; align-items: start; justify-content: start; }
.t-card { 
  display: flex; 
  flex-direction: column; 
  width: 380px; 
  height: 400px; /* 固定高度 */
  position: relative;
}
.t-card :deep(.el-card__body) { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  padding: 8px 10px; 
  position: relative;
}

/* 左上角标签样式 - 参考学生端 */
.card-tags { 
  display: flex; 
  width: 100%;
  background: #FFFFFF;
  gap: 6px; 
  margin-bottom: 8px; 
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 10;
}
.source-tag { 
  font-size: 11px; 
  background: #e0e7ff; 
  color: #3730a3; 
  padding: 2px 8px; 
  border-radius: 10px; 
  font-weight: 500; 
}
.type-tag { 
  font-size: 11px; 
  padding: 2px 8px; 
  border-radius: 10px; 
  font-weight: 500; 
}
.group-tag { 
  background: #dbeafe; 
  color: #1e40af; 
}

/* 标题样式 */
.card-title { 
  font-size: 16px; 
  font-weight: 700; 
  color: #1677ff; 
  margin-bottom: 8px; 
  text-align: center; 
  letter-spacing: 0.5px;
  margin-top: 28px; /* 为左上角标签留出足够空间 */
  padding: 0 4px; /* 避免与标签重叠 */
}

/* 说明部分样式 */
.desc-section {
  margin-bottom: 12px;
  padding: 0 4px; /* 与标题保持一致的padding */
}
.desc-item { 
  font-size: 13px; 
  color: #444; 
  text-align: left; 
  line-height: 1.5;
  text-indent: 2em;
  background: #f9fafb;
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid #fbbf24;
  margin-bottom: 6px;
}

/* 卡片内容区域 */
.card-content { 
  display: flex; 
  flex-direction: column;
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
}

/* 问题列表样式 */
.questions-list {
  /* 移除单独的滚动，让整个内容一起滚动 */
  padding: 0 4px 12px; /* 与标题和描述保持一致的padding，底部留出空间 */
}

.q-item { 
  padding: 6px 8px; 
  background: #fafafa; 
  border: 1px dashed #eee; 
  border-radius: 6px; 
  margin-bottom: 6px;
}
.q-head { display: flex; align-items: baseline; gap: 0; }
.q-index { margin-right: 6px; color: #2b6aa6; font-weight: 600; }
.q-text { font-weight: 600; color: #222; flex: 1 1 auto; }
.q-type { 
  font-size: 12px; 
  color: #999; 
  margin-left: 6px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}
.q-opts { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 2px; 
  margin-left: 16px; 
  margin-top: 4px;
  color: #666; 
}
.q-opt { 
  padding-left: 2px; 
  font-size: 13px;
  color: #666;
}
.q-blank { 
  height: 18px; 
  border-bottom: 2px solid #bbb; 
  width: 60%; 
  margin-top: 8px; 
  margin-left: 16px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  padding: 20px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px dashed #d1d5db;
  margin: 20px 0;
}

/* 卡片操作区域 */
.card-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 4px;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
  flex-shrink: 0;
}

/* 滚动条样式 */
.card-content::-webkit-scrollbar {
  width: 6px;
}
.card-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}
.card-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.card-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>