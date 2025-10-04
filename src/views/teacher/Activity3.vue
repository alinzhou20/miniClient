<template>
  <div class="activity7-monitor">
    <!-- 小组完成进度 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Activity7 - 智能问题设计</span>
        <span class="progress-count">设计题目: {{ designItems.length }} | 完成小组: {{ completedGroups.size }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- 功能按钮区域 -->
    <div class="action-section">
      <el-button 
        type="primary" 
        size="large"
        :icon="Download"
        @click="exportAllQuestions"
        :disabled="!designItems.length"
      >
        导出所有问题
      </el-button>
      <el-button 
        type="success" 
        size="large"
        :icon="Document"
        @click="exportByDirection"
        :disabled="!designItems.length"
      >
        按方向导出
      </el-button>
      <el-button 
        type="warning" 
        size="large"
        :icon="Refresh"
        @click="clearData"
      >
        清空数据
      </el-button>
    </div>

    <!-- 问题展示区域 -->
    <div class="questions-layout">
      <!-- 按设计方向分组展示 -->
      <div class="direction-panel" v-for="direction in directions" :key="direction">
        <div class="direction-header">
          <h3 class="direction-title">{{ direction }}</h3>
          <span class="direction-count">{{ getDirectionQuestions(direction).length }} 个问题</span>
        </div>
        
        <div class="questions-grid">
          <el-empty v-if="!getDirectionQuestions(direction).length" :description="`暂无${direction}相关问题`" />
          <el-card 
            v-for="item in getDirectionQuestions(direction)" 
            :key="item.key" 
            class="question-card" 
            shadow="hover"
          >
            <!-- 左上角标签 -->
            <div class="card-tags">
              <span class="type-tag group-tag">第{{ item.from.groupNo }}组</span>
              <span class="source-tag">{{ item.from.studentNo }}号</span>
              <span class="direction-tag">{{ item.data.direction }}</span>
            </div>

            <div class="card-content">
              <div class="question-content">
                <div class="question-text">
                  {{ item.data.question.text || '（未命名题目）' }}
                </div>
                
                <div class="question-meta">
                  <span class="question-type">{{ typeTag(item.data.question.type) }}</span>
                  <span class="question-time">{{ formatTime(item.at) }}</span>
                </div>

                <!-- 显示选项 -->
                <div v-if="Array.isArray(item.data.question.options)" class="question-options">
                  <div class="option-item" v-for="(opt, oi) in item.data.question.options" :key="oi">
                    {{ letter(oi) }}. {{ opt }}
                  </div>
                </div>
                <div v-else-if="item.data.question.type === 'text'" class="question-blank">
                  ________________
                </div>
              </div>
            </div>
            
            <div class="card-actions">
              <el-button size="small" type="primary" @click="exportSingleQuestion(item)">
                导出问题
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useSocket } from '@/store/socket'
import { ElMessage } from 'element-plus'
import { Download, Document, Refresh } from '@element-plus/icons-vue'

// Store
const socket = useSocket()

// 问题类型定义
interface DesignPayload {
  type: 'activity7_design'
  from: { groupNo: string; studentNo: string }
  data: {
    direction: string
    question: {
      id: string
      type: 'single' | 'multi' | 'text'
      text: string
      options?: string[]
      createdAt: number
    }
  }
  at: number
}

const designStore = reactive(new Map<string, DesignPayload>())

// 设计方向列表
const directions = ['设备类型', '使用时长', '使用用途', '监管情况']

// 问题数据
const designItems = computed(() => {
  return Array.from(designStore.values())
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .map(p => ({ ...p, key: p.from.groupNo }))
})

// 完成小组统计
const completedGroups = computed(() => {
  const groups = new Set<string>()
  designItems.value.forEach(item => {
    groups.add(item.from.groupNo)
  })
  return groups
})

// 进度百分比
const progressPercentage = computed(() => {
  return Math.round((completedGroups.value.size / 25) * 100)
})

// 根据方向获取问题
function getDirectionQuestions(direction: string) {
  return designItems.value.filter(item => item.data.direction === direction)
}

// 工具函数
function letter(i: number): string { 
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[i] || '?' 
}

function typeTag(type: string): string {
  return type === 'single' ? '[单选题]' : 
         type === 'multi' ? '[多选题]' : '[填空题]'
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour12: false })
}

// 导出功能（参考Activity3格式）
function exportSingleQuestion(item: DesignPayload) {
  const lines: string[] = []
  const question = item.data.question
  
  // 参考Activity3的导出格式
  lines.push(`智能问题设计 - 第${item.from.groupNo}组`)
  lines.push(`设计方向：${item.data.direction}`)
  lines.push(`设计学生：${item.from.studentNo}号`)
  lines.push(`提交时间：${new Date(item.at).toLocaleString('zh-CN', { hour12: false })}`)
  lines.push('')
  
  lines.push('问题内容：')
  lines.push(`${question.text} ${typeTag(question.type)}`)
  lines.push('')
  
  if (Array.isArray(question.options) && question.options.length > 0) {
    lines.push('选项内容：')
    question.options.forEach((opt, oi) => {
      lines.push(`${letter(oi)}. ${opt}`)
    })
    lines.push('')
  }
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('问题已复制到剪贴板')
}

function exportAllQuestions() {
  if (!designItems.value.length) return
  
  const lines: string[] = []
  lines.push('--- Activity7 智能问题设计 - 全部问题汇总 ---')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`共收到 ${designItems.value.length} 个小组的问题设计`)
  lines.push('')
  
  designItems.value.forEach((item, index) => {
    const question = item.data.question
    lines.push(`--- 问题 ${index + 1} ---`)
    lines.push(`小组: 第${item.from.groupNo}组, 学生: ${item.from.studentNo}号`)
    lines.push(`设计方向: ${item.data.direction}`)
    lines.push(`问题类型: ${typeTag(question.type)}`)
    lines.push(`问题内容: ${question.text}`)
    
    if (Array.isArray(question.options) && question.options.length > 0) {
      question.options.forEach((opt, oi) => {
        lines.push(`  ${letter(oi)}. ${opt}`)
      })
    }
    lines.push(`提交时间: ${new Date(item.at).toLocaleString('zh-CN', { hour12: false })}`)
    lines.push('')
  })
  
  lines.push(`统计信息:`)
  lines.push(`总问题数: ${designItems.value.length}`)
  lines.push(`参与小组数: ${completedGroups.value.size}`)
  lines.push(`完成率: ${progressPercentage.value}%`)
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success(`已导出 ${designItems.value.length} 个问题到剪贴板`)
}

function exportByDirection() {
  if (!designItems.value.length) return
  
  const lines: string[] = []
  lines.push('--- Activity7 智能问题设计 - 按方向分类导出 ---')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push('')
  
  directions.forEach(direction => {
    const directionQuestions = getDirectionQuestions(direction)
    lines.push(`=== ${direction} ===（${directionQuestions.length} 个问题）`)
    lines.push('')
    
    if (directionQuestions.length === 0) {
      lines.push('暂无问题设计')
      lines.push('')
    } else {
      directionQuestions.forEach((item, index) => {
        const question = item.data.question
        lines.push(`${index + 1}. ${question.text} ${typeTag(question.type)}`)
        lines.push(`   设计小组: 第${item.from.groupNo}组-${item.from.studentNo}号`)
        lines.push(`   提交时间: ${new Date(item.at).toLocaleString('zh-CN', { hour12: false })}`)
        
        if (Array.isArray(question.options) && question.options.length > 0) {
          question.options.forEach((opt, oi) => {
            lines.push(`   ${letter(oi)}. ${opt}`)
          })
        }
        lines.push('')
      })
    }
    lines.push('----------------------------------------')
    lines.push('')
  })
  
  lines.push(`按方向统计:`)
  directions.forEach(direction => {
    const count = getDirectionQuestions(direction).length
    lines.push(`${direction}: ${count} 个问题`)
  })
  lines.push(`总计: ${designItems.value.length} 个问题`)
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('已按方向导出所有问题到剪贴板')
}

function clearData() {
  designStore.clear()
  ElMessage.warning('数据已清空')
}

function copyToClipboard(text: string) {
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

// Socket事件处理
function handleDesignSubmission(payload: any) {
  if (!payload || String(payload.type) !== 'activity7_design') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo || !from.studentNo) return
  
  const groupNo = String(from.groupNo)
  const studentNo = String(from.studentNo)
  // 同一小组只保留最新的设计，使用组号作为key实现覆盖
  const key = `${groupNo}` 
  
  // 检查是否为该小组的首次提交
  const isFirstSubmission = !designStore.has(key)
  
  designStore.set(key, {
    type: 'activity7_design',
    from: { groupNo, studentNo },
    data: {
      direction: data.direction || '未知方向',
      question: {
        id: data.question?.id || 'unknown',
        type: data.question?.type || 'text',
        text: data.question?.text || '未命名题目',
        options: data.question?.options || undefined,
        createdAt: data.question?.createdAt || Date.now()
      }
    },
    at: payload.at || Date.now()
  })
  
  if (isFirstSubmission) {
    // console.log(`[Activity7 Teacher] 收到问题设计: 第${groupNo}组-${studentNo}号 (首次提交)`)
    ElMessage.success(`第${groupNo}组提交了问题设计`)
  } else {
    // console.log(`[Activity7 Teacher] 更新问题设计: 第${groupNo}组-${studentNo}号 (覆盖之前的设计)`)
    ElMessage.info(`第${groupNo}组更新了问题设计`)
  }
}

// 本地存储

onMounted(() => {
  // console.log('[Activity3 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  
  // 监听submit事件
  socket.on('submit', handleDesignSubmission)
})

onBeforeUnmount(() => {
  // console.log('[Activity3 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleDesignSubmission)
})
</script>

<style scoped>
.activity7-monitor {
  padding: 12px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
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

/* 功能按钮区域 */
.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

/* 问题展示布局 */
.questions-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.direction-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.direction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.direction-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.direction-count {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 问题网格 */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.question-card {
  width: 100%;
  height: 280px;
  position: relative;
}

.question-card :deep(.el-card__body) {
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
  flex-wrap: wrap;
}

.type-tag, .source-tag, .direction-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.group-tag {
  background: #dbeafe;
  color: #1e40af;
}

.source-tag {
  background: #e0e7ff;
  color: #3730a3;
}

.direction-tag {
  background: #fef3c7;
  color: #92400e;
}

/* 卡片内容样式 */
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  min-height: 0;
  margin-top: 32px; /* 为标签留空间 */
}

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
</style>
