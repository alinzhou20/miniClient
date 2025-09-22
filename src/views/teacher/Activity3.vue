<template>
  <div class="activity3-monitor">
    <!-- 小组完成进度 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Activity3 - 协作问卷设计</span>
        <span class="progress-count">设计题目: {{ designItems.length }} | 完成问卷: {{ surveyCards.length }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- 两栏布局：左侧学生设计的题目，右侧学生设计的问卷 -->
    <div class="main-layout">
      <!-- 左侧：学生设计的题目 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3 class="panel-title">学生设计的题目</h3>
          <span class="item-count">{{ designItems.length }} 个题目</span>
        </div>
        
        <div class="design-grid">
          <el-empty v-if="!designItems.length" description="等待学生设计题目…" />
          <el-card v-for="item in designItems" :key="item.key" class="design-card" shadow="hover">
            <!-- 左上角标签 -->
            <div class="card-tags">
              <span class="type-tag group-tag">第{{ item.from.groupNo }}组</span>
              <span class="source-tag">{{ item.from.studentNo }}号</span>
            </div>

            <div class="card-content">
              <div class="question-content">
                <div class="question-text">
                  {{ item.data.text || '（未命名题目）' }}
                </div>
                
                <div class="question-meta">
                  <span class="question-type">{{ typeTag(item.data.type) }}</span>
                  <span class="question-time">{{ formatTime(item.at) }}</span>
                </div>

                <!-- 显示选项 -->
                <div v-if="Array.isArray((item.data as any).options)" class="question-options">
                  <div class="option-item" v-for="(opt, oi) in ((item.data as any).options || [])" :key="oi">
                    {{ letter(oi) }}. {{ opt }}
                  </div>
                </div>
                <div v-else-if="item.data.type === 'text'" class="question-blank">
                  ________________
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 右侧：学生设计的问卷 -->
      <div class="right-panel">
        <div class="panel-header">
          <h3 class="panel-title">学生设计的问卷</h3>
          <span class="item-count">{{ surveyCards.length }} 个问卷</span>
        </div>
        
        <div class="survey-grid">
          <el-empty v-if="!surveyCards.length" description="等待学生提交问卷…" />
          <el-card v-for="card in surveyCards" :key="card.key" class="survey-card" shadow="hover">
            <!-- 左上角标签 -->
            <div class="card-tags">
              <span class="type-tag group-tag">第{{ card.from.groupNo }}组</span>
              <span class="source-tag">{{ card.from.studentNo }}号</span>
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
              <el-button size="small" type="primary" @click="exportSurveyCard(card)">导出问卷</el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'
import { saveActivity3Data, loadActivity3Data } from '@/utils/localStorage'
import { ElMessage } from 'element-plus'

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

interface DesignPayload {
  type: 'design'
  from: { groupNo: string; studentNo: string }
  data: QSingle | QMulti | QText | QDescription
  at: number
}

const surveyStore = reactive(new Map<string, SurveyPayload>())
const designStore = reactive(new Map<string, DesignPayload>())

// 问卷卡片数据
const surveyCards = computed(() => {
  const latest = new Map<string, SurveyPayload>()
  Array.from(surveyStore.values()).forEach(p => {
    const key = `${p.from.groupNo}-${p.from.studentNo}`
    const prev = latest.get(key)
    if (!prev || (p.at || 0) > (prev.at || 0)) latest.set(key, p)
  })
  return Array.from(latest.values())
    .sort((a,b) => (b.at || 0) - (a.at || 0))
    .map(p => ({ ...p, key: `${p.from.groupNo}-${p.from.studentNo}` }))
})

// 设计题目数据（每组仅保留最新的一道题目）
const designItems = computed(() => {
  const latestByGroup = new Map<string, any>()
  Array.from(designStore.values()).forEach(p => {
    const groupKey = p.from.groupNo
    const existing = latestByGroup.get(groupKey)
    if (!existing || (p.at || 0) > (existing.at || 0)) {
      latestByGroup.set(groupKey, p)
    }
  })
  return Array.from(latestByGroup.values())
    .sort((a,b) => (b.at || 0) - (a.at || 0))
    .map(p => ({ ...p, key: `${p.from.groupNo}-${p.from.studentNo}-${p.at}` }))
})

// 小组完成统计
const completedGroups = reactive(new Set<string>())
const progressPercentage = computed(() => {
  const surveyGroups = new Set(surveyCards.value.map(c => c.from.groupNo))
  const designGroups = new Set(designItems.value.map(c => c.from.groupNo))
  const totalGroups = new Set([...surveyGroups, ...designGroups])
  return Math.round((totalGroups.size / 25) * 100)
})

function letter(i: number): string { const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return letters[i] || '?' }
function typeTag(t: string) { 
  return t === 'single' ? '[单选题]' : 
         t === 'multi' ? '[多选题]' : 
         t === 'text' ? '[填空题]' : 
         t === 'description' ? '[说明]' : '[未知]'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

function exportSurveyCard(card: any) {
  if (!card || !card.data) return
  const lines: string[] = []
  
  // 添加标题
  if (card.data.title) lines.push(String(card.data.title))
  lines.push(`第${card.from.groupNo}组 - ${card.from.studentNo}号学生设计`)
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
  ElMessage.success('问卷已复制到剪贴板')
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

function onSurveySubmit(payload: any) {
  if (!payload || String(payload.type) !== 'survey') return
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo || !from.studentNo) return
  
  const groupNo = String(from.groupNo)
  const studentNo = String(from.studentNo)
  const key = `${groupNo}-${studentNo}`
  
  // 检查小组是否首次提交
  const wasGroupCompleted = completedGroups.has(groupNo)
  
  surveyStore.set(key, {
    type: 'survey',
    from: { groupNo, studentNo },
    data: {
      ...data,
      descriptions: Array.isArray(data.descriptions) ? data.descriptions : [],
      questions: Array.isArray(data.questions) ? data.questions : []
    },
    at: payload.at || Date.now()
  })
  
  // 首次提交时添加到完成统计
  if (!wasGroupCompleted) {
    completedGroups.add(groupNo)
  }
  
  // 保存到本地存储
  saveActivity3Data({ surveys: surveyStore, designs: designStore })
  
  console.log(`[Activity3 Teacher] 收到问卷: 第${groupNo}组-${studentNo}号`)
  ElMessage.success(`收到第${groupNo}组的问卷设计`)
}

function onDesignSubmit(payload: any) {
  if (!payload || String(payload.type) !== 'design') return
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo || !from.studentNo) return
  
  const groupNo = String(from.groupNo)
  const studentNo = String(from.studentNo)
  const key = `${groupNo}-${studentNo}-${payload.at}`
  
  designStore.set(key, {
    type: 'design',
    from: { groupNo, studentNo },
    data: {
      ...data,
      createdAt: payload.at || Date.now()
    },
    at: payload.at || Date.now()
  })
  
  // 保存到本地存储
  saveActivity3Data({ surveys: surveyStore, designs: designStore })
  
  console.log(`[Activity3 Teacher] 收到设计题目: 第${groupNo}组-${studentNo}号`)
  ElMessage.info(`第${groupNo}组设计了新题目`)
}

onMounted(() => {
  // 恢复本地存储的数据
  const savedData = loadActivity3Data()
  if (savedData) {
    if (savedData.surveys) {
      savedData.surveys.forEach((payload, key) => {
        surveyStore.set(key, payload)
        // 提取组号用于统计
        const groupNo = String(payload.from?.groupNo || '')
        if (groupNo) {
          completedGroups.add(groupNo)
        }
      })
    }
    
    if (savedData.designs) {
      savedData.designs.forEach((payload, key) => {
        designStore.set(key, payload)
      })
    }
    
    console.log('[Activity3 Teacher] 已恢复本地存储数据')
  }
  
  console.log('[Activity3 Teacher] onMounted, listen submit and discuss, status=', socketService.getConnectionStatus?.())
  
  // 监听submit事件
  socketService.on('submit', (payload: any) => {
    console.log('[Activity3 Teacher] submit event received:', payload)
    onSurveySubmit(payload)
    onDesignSubmit(payload)
  })
  
  // 监听discuss事件
  socketService.on('discuss', (payload: any) => {
    console.log('[Activity3 Teacher] discuss event received:', payload)
    onDesignSubmit(payload)
  })
})

onBeforeUnmount(() => {
  socketService.off('submit')
  socketService.off('discuss')
})
</script>

<style scoped>
.activity3-monitor { 
  padding: 12px; 
  max-width: 1400px; 
  margin: 0 auto; 
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
  font-weight: 600;
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

/* 两栏布局 */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f1f5f9;
  border-radius: 8px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.item-count {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

/* 设计题目网格 */
.design-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  flex: 1;
}

.design-card {
  width: 100%;
  height: 200px;
  position: relative;
}

.design-card :deep(.el-card__body) {
  height: 100%;
  padding: 8px 10px;
  position: relative;
}

/* 问卷网格 */
.survey-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  flex: 1;
}

.survey-card {
  width: 100%;
  height: 400px;
  position: relative;
}

.survey-card :deep(.el-card__body) {
  height: 100%;
  padding: 8px 10px;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 左上角标签样式 */
.card-tags {
  display: flex;
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

/* 卡片内容样式 */
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
  margin-top: 24px; /* 为标签留空间 */
}

/* 设计题目内容样式 */
.question-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
  word-wrap: break-word;
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.question-type {
  font-size: 12px;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.question-time {
  font-size: 12px;
  color: #6b7280;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.option-item {
  font-size: 13px;
  color: #374151;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #d1d5db;
}

.question-blank {
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px dashed #d1d5db;
}

/* 问卷内容样式 */
.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1677ff;
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: 0.5px;
}

.desc-section {
  margin-bottom: 12px;
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

.questions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 2px;
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
.q-text { font-weight: 600; color: #222; flex: 1 1 auto; font-size: 13px; }
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
  font-size: 12px;
  color: #666;
}
.q-blank {
  height: 18px;
  border-bottom: 2px solid #bbb;
  width: 60%;
  margin-top: 8px;
  margin-left: 16px;
}

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

.card-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
  flex-shrink: 0;
}

/* 滚动条样式 */
.card-content::-webkit-scrollbar {
  width: 4px;
}
.card-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}
.card-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
.card-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.questions-list::-webkit-scrollbar {
  width: 3px;
}
.questions-list::-webkit-scrollbar-track {
  background: transparent;
}
.questions-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}
</style>
