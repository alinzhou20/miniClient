<template>
  <div class="activity-monitor">
    <!-- 小组完成进度 -->
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Activity2 - 问卷设计，精研问题</span>
        <span class="progress-count">提交问卷: {{ designItems.length }} | 完成小组: {{ completedGroups.size }}</span>
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
        @click="exportAllDesigns"
        :disabled="!designItems.length"
      >
        导出所有问卷
              </el-button>
              <el-button 
        type="success" 
                size="large"
        :icon="Document"
        @click="exportByGroup"
        :disabled="!designItems.length"
      >
        按组别导出
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

    <!-- 问卷展示区域 -->
    <div class="questionnaires-layout">
      <!-- 按小组类型分组展示 -->
      <div class="group-panel" v-for="groupType in groupTypes" :key="groupType.key">
        <div class="group-header">
          <h3 class="group-title">{{ groupType.name }}</h3>
          <span class="group-count">{{ getGroupDesigns(groupType.key).length }} 个小组</span>
        </div>
        
        <div class="designs-grid">
          <el-empty v-if="!getGroupDesigns(groupType.key).length" :description="`暂无${groupType.name}提交`" />
        <el-card 
            v-for="item in getGroupDesigns(groupType.key)" 
            :key="item.key" 
            class="design-card" 
          shadow="hover"
        >
            <!-- 左上角标签 -->
            <div class="card-tags">
              <span class="type-tag group-tag">第{{ item.from.groupNo }}组</span>
              <span class="type-tag">{{ item.data.groupType }}</span>
            </div>

            <div class="card-content">
              <div class="design-content">
                <div class="design-section">
                  <div class="section-title">调查目的：</div>
                  <div class="section-text">{{ item.data.purpose }}</div>
          </div>
          
                <div class="design-section">
                  <div class="section-title">调查说明：</div>
                  <div class="section-text">{{ item.data.description }}</div>
          </div>
          
                <div class="design-section highlight">
                  <div class="section-title">选择的题目：</div>
                  <div class="selected-question">
                    题目{{ item.data.selectedQuestion }}：{{ item.data.selectedQuestionText }}
          </div>
      </div>

                <div class="design-section">
                  <div class="section-title">选择理由：</div>
                  <div class="section-text">{{ item.data.reason }}</div>
        </div>
        
                <div class="design-meta">
                  <span class="meta-time">{{ formatTime(item.at) }}</span>
            </div>
            </div>
          </div>
          
            <div class="card-actions">
              <el-button size="small" type="primary" @click="exportSingleDesign(item)">
                导出问卷
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

const socket = useSocket()

// 问卷设计数据结构
interface DesignPayload {
  type: 'activity2_design'
  from: { groupNo: string }
  data: {
  groupNo: string
    groupType: string
    purpose: string
    description: string
    selectedQuestion: number
    selectedQuestionText: string
    reason: string
    questionOptions: Array<{text: string, options: string}>
  }
  at: number
}

const designStore = reactive(new Map<string, DesignPayload>())

// 小组类型列表
const groupTypes = [
  { key: '选择题组', name: '选择题组（1-6组）' },
  { key: '填空题组', name: '填空题组（7-12组）' }
]

// 问卷数据
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

// 根据组别类型获取问卷
function getGroupDesigns(groupType: string) {
  return designItems.value.filter(item => item.data.groupType === groupType)
}

// 时间格式化
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', { hour12: false })
}

// 导出单个问卷设计
function exportSingleDesign(item: DesignPayload) {
  const lines: string[] = []
  
  lines.push(`Activity2 问卷设计 - 第${item.from.groupNo}组`)
  lines.push(`组别类型：${item.data.groupType}`)
  lines.push(`提交时间：${formatTime(item.at)}`)
  lines.push('')
  
  lines.push('一、调查目的：')
  lines.push(item.data.purpose)
  lines.push('')
  
  lines.push('二、调查说明：')
  lines.push(item.data.description)
  lines.push('')
  
  lines.push('三、使用时长题目选择：')
  lines.push(`选择了题目${item.data.selectedQuestion}：`)
  lines.push(item.data.selectedQuestionText)
  lines.push('')
  
  lines.push('四、选择理由：')
  lines.push(item.data.reason)
  lines.push('')
  
  lines.push('五、题目选项：')
  item.data.questionOptions.forEach((q, i) => {
    lines.push(`题目${i + 1}：${q.text}`)
    lines.push(`选项：${q.options}`)
    lines.push('')
  })
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('问卷设计已复制到剪贴板')
}

// 导出所有问卷
function exportAllDesigns() {
  if (!designItems.value.length) return
  
  const lines: string[] = []
  lines.push('--- Activity2 问卷设计 - 全部提交汇总 ---')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push(`共收到 ${designItems.value.length} 个小组的问卷设计`)
  lines.push('')
  
  designItems.value.forEach((item) => {
    lines.push(`=== 第${item.from.groupNo}组 (${item.data.groupType}) ===`)
    lines.push(`提交时间: ${formatTime(item.at)}`)
    lines.push('')
    
    lines.push('调查目的：')
    lines.push(item.data.purpose)
    lines.push('')
    
    lines.push('调查说明：')
    lines.push(item.data.description)
    lines.push('')
    
    lines.push(`选择题目${item.data.selectedQuestion}：${item.data.selectedQuestionText}`)
    lines.push('')
    
    lines.push('选择理由：')
    lines.push(item.data.reason)
    lines.push('')
    lines.push('----------------------------------------')
    lines.push('')
  })
  
  lines.push(`统计信息:`)
  lines.push(`总提交数: ${designItems.value.length}`)
  lines.push(`参与小组数: ${completedGroups.value.size}`)
  lines.push(`完成率: ${progressPercentage.value}%`)
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success(`已导出 ${designItems.value.length} 个问卷设计到剪贴板`)
}

// 按组别导出
function exportByGroup() {
  if (!designItems.value.length) return
  
  const lines: string[] = []
  lines.push('--- Activity2 问卷设计 - 按组别分类导出 ---')
  lines.push(`导出时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
  lines.push('')
  
  groupTypes.forEach(groupType => {
    const groupDesigns = getGroupDesigns(groupType.key)
    lines.push(`=== ${groupType.name} ===（${groupDesigns.length} 个小组）`)
    lines.push('')
    
    if (groupDesigns.length === 0) {
      lines.push('暂无提交')
      lines.push('')
    } else {
      groupDesigns.forEach((item, index) => {
        lines.push(`${index + 1}. 第${item.from.groupNo}组`)
        lines.push(`   调查目的: ${item.data.purpose}`)
        lines.push(`   调查说明: ${item.data.description}`)
        lines.push(`   选择题目${item.data.selectedQuestion}: ${item.data.selectedQuestionText}`)
        lines.push(`   理由: ${item.data.reason}`)
        lines.push(`   提交时间: ${formatTime(item.at)}`)
        lines.push('')
      })
    }
    lines.push('----------------------------------------')
    lines.push('')
  })
  
  lines.push(`按组别统计:`)
  groupTypes.forEach(groupType => {
    const count = getGroupDesigns(groupType.key).length
    lines.push(`${groupType.name}: ${count} 个小组`)
  })
  lines.push(`总计: ${designItems.value.length} 个小组`)
  
  copyToClipboard(lines.join('\n'))
  ElMessage.success('已按组别导出所有问卷设计到剪贴板')
}

// 清空数据
function clearData() {
  designStore.clear()
  ElMessage.warning('数据已清空')
}

// 复制到剪贴板
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
  if (!payload || String(payload.type) !== 'activity2_design') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  if (!from.groupNo) return
  
  const groupNo = String(from.groupNo)
  const key = groupNo
  
  const isFirstSubmission = !designStore.has(key)
  
  designStore.set(key, {
    type: 'activity2_design',
    from: { groupNo },
    data: {
      groupNo: data.groupNo || groupNo,
      groupType: data.groupType || '未知组别',
      purpose: data.purpose || '',
      description: data.description || '',
      selectedQuestion: data.selectedQuestion || 1,
      selectedQuestionText: data.selectedQuestionText || '',
      reason: data.reason || '',
      questionOptions: data.questionOptions || []
    },
    at: payload.at || Date.now()
  })
  
  if (isFirstSubmission) {
    console.log(`[Activity2 Teacher] 收到问卷设计: 第${groupNo}组 (首次提交)`)
    ElMessage.success(`第${groupNo}组提交了问卷设计`)
      } else {
    console.log(`[Activity2 Teacher] 更新问卷设计: 第${groupNo}组 (覆盖之前的设计)`)
    ElMessage.info(`第${groupNo}组更新了问卷设计`)
  }
}

onMounted(() => {
  console.log('[Activity2 Teacher] 🟢 组件已挂载，开始监听 submit 事件')
  socket.on('submit', handleDesignSubmission)
})

onBeforeUnmount(() => {
  console.log('[Activity2 Teacher] 🔴 组件卸载，清理监听器')
  socket.off('submit', handleDesignSubmission)
})
</script>

<style scoped>
.activity-monitor {
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

/* 问卷展示布局 */
.questionnaires-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-panel {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.group-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.group-count {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 问卷网格 */
.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.design-card {
  width: 100%;
  min-height: 350px;
  position: relative;
}

.design-card :deep(.el-card__body) {
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

.type-tag:not(.group-tag) {
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
  margin-top: 32px;
}

.design-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.design-section {
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.design-section.highlight {
  background: #fef3c7;
  border-color: #f59e0b;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.section-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
  word-wrap: break-word;
}

.selected-question {
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  line-height: 1.6;
}

.design-meta {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.meta-time {
  font-size: 12px;
  color: #6b7280;
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
