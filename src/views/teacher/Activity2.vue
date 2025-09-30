<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">🤖 Activity 6: AI学习助手活动</h2>
      <div class="activity-description">控制学生AI提问和拍照上传功能</div>
    </div>

    <!-- 功能控制区域 -->
    <div class="control-section">
      <div class="control-panel">
        <div class="function-controls">
          <div class="control-item">
            <div class="control-info">
              <h4 class="control-title">🎛️ 卡片切换控制</h4>
              <p class="control-desc">控制学生端显示的功能卡片</p>
            </div>
            <div class="control-actions card-controls">
              <el-button 
                :type="currentCard === 'ask' ? 'primary' : 'default'"
                @click="switchToCard('ask')"
                class="card-control-btn"
              >
                <el-icon><ChatDotRound /></el-icon>
                问一问
              </el-button>
              <el-button 
                :type="currentCard === 'upload' ? 'primary' : 'default'"
                @click="switchToCard('upload')"
                class="card-control-btn"
              >
                <el-icon><Upload /></el-icon>
                上传功能
              </el-button>
              <el-button 
                :type="currentCard === 'view' ? 'primary' : 'default'"
                @click="switchToCard('view')"
                class="card-control-btn"
              >
                <el-icon><View /></el-icon>
                查看词云
              </el-button>
            </div>
          </div>

          <div class="control-item">
            <div class="control-info">
              <h4 class="control-title">📷 上传功能控制</h4>
              <p class="control-desc">开启或关闭学生的拍照上传功能</p>
            </div>
            <div class="control-actions">
              <el-button 
                type="primary" 
                size="large"
                @click="enableUploadFunction"
                :disabled="uploadEnabled"
                class="enable-upload-btn"
                v-if="!uploadEnabled"
              >
                <el-icon><Upload /></el-icon>
                开启上传功能
              </el-button>
              <el-button 
                type="danger" 
                size="large"
                @click="disableUploadFunction"
                class="disable-upload-btn"
                v-if="uploadEnabled"
              >
                <el-icon><Lock /></el-icon>
                关闭上传功能
              </el-button>
              <div v-if="uploadEnabled" class="upload-status-info">
                <span class="status-enabled">上传功能已开启</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学生提交记录 -->
    <div class="submissions-section">
      <div class="section-header">
        <h3 class="section-title">学生提交记录</h3>
        <div class="submissions-tabs">
          <el-button 
            :type="activeTab === 'upload' ? 'primary' : 'default'"
            @click="activeTab = 'upload'"
            size="small"
          >
            上传结果 ({{ submissions.length }})
          </el-button>
          <el-button 
            :type="activeTab === 'edit' ? 'primary' : 'default'"
            @click="activeTab = 'edit'"
            size="small"
          >
            编辑内容 ({{ editSubmissions.length }})
          </el-button>
          <el-button 
            :type="activeTab === 'wordcloud' ? 'primary' : 'default'"
            @click="activeTab = 'wordcloud'"
            size="small"
            :disabled="wordCloudData.length === 0"
          >
            词云图 ({{ wordCloudData.length }})
          </el-button>
        </div>
      </div>

      <!-- 上传结果列表 -->
      <div v-if="activeTab === 'upload'" class="submissions-grid">
        <div v-if="submissions.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>暂无上传结果记录</p>
        </div>
        
        <el-card 
          v-for="submission in submissions" 
          :key="submission.key"
          class="submission-card" 
          shadow="hover"
        >
          <div class="submission-header">
            <div class="student-info">
              <span class="group-badge">第{{ submission.groupNo }}组</span>
              <span class="student-badge">{{ submission.studentNo }}号</span>
            </div>
            <div class="submission-time">{{ formatTime(submission.timestamp) }}</div>
          </div>
          
          <div class="submission-content">
            <div class="content-label">
              分析结果:
              <span v-if="submission.analysisCount" class="analysis-meta">
                (共{{ submission.analysisCount }}次，选择第{{ submission.selectedIndex }}次)
              </span>
            </div>
            <div class="content-text">{{ submission.analysisResult }}</div>
          </div>
          
          <div class="submission-actions">
            <el-button size="small" type="primary" @click="viewSubmissionDetail(submission)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button size="small" @click="exportSubmission(submission)">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 编辑内容列表 -->
      <div v-if="activeTab === 'edit'" class="submissions-grid">
        <div v-if="editSubmissions.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>暂无编辑内容记录</p>
        </div>
        
        <el-card 
          v-for="submission in editSubmissions" 
          :key="submission.key"
          class="submission-card edit-card-style" 
          shadow="hover"
        >
          <div class="submission-header">
            <div class="student-info">
              <span class="group-badge">第{{ submission.groupNo }}组</span>
              <span class="student-badge">{{ submission.studentNo }}号</span>
            </div>
            <div class="submission-time">{{ formatTime(submission.timestamp) }}</div>
          </div>
          
          <div class="submission-content">
            <div class="edit-content-section">
              <div class="edit-item">
                <div class="edit-label">问题1:</div>
                <div class="edit-text">{{ submission.q1 }}</div>
              </div>
              <div class="edit-item">
                <div class="edit-label">问题2:</div>
                <div class="edit-text">{{ submission.q2 }}</div>
              </div>
            </div>
          </div>
          
          <div class="submission-actions">
            <el-button size="small" type="primary" @click="viewSubmissionDetail(submission)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button size="small" @click="exportSubmission(submission)">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 词云图展示 -->
      <div v-if="activeTab === 'wordcloud'" class="wordcloud-section">
        <div v-if="wordCloudData.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>暂无词云图数据</p>
        </div>
        
        <div v-else class="wordcloud-container">
          <div class="wordcloud-stats">
            <h4 class="stats-title">数据统计</h4>
            <p class="stats-info">共收到 {{ wordCloudData.length }} 组数据</p>
            <div class="stats-controls">
              <el-button 
                type="success" 
                size="small"
                @click="generateTestData"
                v-if="wordCloudData.length === 0"
              >
                生成测试数据
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="clearWordCloudData"
                v-if="wordCloudData.length > 0"
              >
                清空数据
              </el-button>
            </div>
          </div>
          
          <div class="wordcloud-display-section">
            <div class="wordcloud-item-single">
              <h4 class="wordcloud-title">分析问题 - 词云图</h4>
              <div class="wordcloud-content">
                <div 
                  ref="wordCloudRef" 
                  id="teacher-wordcloud-chart"
                  class="echarts-wordcloud"
                ></div>
                <div v-if="wordCloudData.length === 0" class="empty-wordcloud">
                  <el-icon class="empty-icon"><Document /></el-icon>
                  <p>暂无词云数据</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="wordcloud-details">
            <h4 class="details-title">详细数据</h4>
            <div class="details-grid">
              <div 
                v-for="data in wordCloudData" 
                :key="data.groupNo"
                class="detail-card"
              >
                <div class="detail-header">第{{ data.groupNo }}组</div>
                <div class="detail-content">
                  <div class="detail-item">
                    <span class="detail-label">问题1:</span>
                    <span class="detail-value">{{ data.q1 }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">问题2:</span>
                    <span class="detail-value">{{ data.q2 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情查看对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`第${currentSubmission?.groupNo}组 ${currentSubmission?.studentNo}号 - 提交详情`"
      width="600px"
      :before-close="closeDetail"
    >
      <div v-if="currentSubmission" class="detail-content">
        <div class="detail-info">
          <div class="info-item">
            <strong>提交时间：</strong>{{ formatDetailTime(currentSubmission.timestamp) }}
          </div>
          <div class="info-item">
            <strong>小组信息：</strong>第{{ currentSubmission.groupNo }}组 {{ currentSubmission.studentNo }}号
          </div>
          <div v-if="currentSubmission.analysisCount" class="info-item">
            <strong>分析情况：</strong>共拍照{{ currentSubmission.analysisCount }}次，学生选择第{{ currentSubmission.selectedIndex }}次结果提交
          </div>
        </div>
        
        <div class="detail-result">
          <div class="result-label">分析结果:</div>
          <div class="result-content">{{ currentSubmission.analysisResult }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSocket } from '@/utils/socket'
import { ElMessage } from 'element-plus'
import { Upload, Document, View, Download, Lock, ChatDotRound } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'

// 功能控制状态
// Store
const socket = useSocket()

const uploadEnabled = ref(false)
const activeTab = ref<'upload' | 'edit' | 'wordcloud'>('upload')
const currentCard = ref<'ask' | 'upload' | 'view'>('ask')

// 学生提交数据
interface SubmissionRecord {
  key: string
  groupNo: string
  studentNo: string
  analysisResult?: string
  analysisCount?: number
  selectedIndex?: number
  q1?: string
  q2?: string
  originalQ1?: string
  originalQ2?: string
  type: 'upload' | 'edit'
  timestamp: number
}

const submissions = ref<SubmissionRecord[]>([])
const editSubmissions = ref<SubmissionRecord[]>([])
const detailVisible = ref(false)
const currentSubmission = ref<SubmissionRecord | null>(null)

// 词云图数据
const wordCloudData = ref<Array<{groupNo: string, q1: string, q2: string}>>([])
const showWordCloud = ref(false)

// ECharts词云图相关状态
const wordCloudRef = ref<HTMLElement>()
const wordCloudChart = ref<echarts.ECharts | null>(null)

// 开启上传功能
const enableUploadFunction = async () => {
  try {
    // 发送消息给所有学生显示上传卡片
    const payload = {
      type: 'show_upload_card',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: {},
      at: Date.now()
    }
    
    await socket.dispatch(payload as any)
    
    uploadEnabled.value = true
    ElMessage.success('上传功能已开启！学生现在可以拍照上传')
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity6 Teacher] 开启上传功能失败:', error)
    ElMessage.error('开启上传功能失败，请重试')
  }
}

// 关闭上传功能
const disableUploadFunction = async () => {
  try {
    // 发送消息给所有学生关闭上传卡片
    const payload = {
      type: 'hide_upload_card',
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: {},
      at: Date.now()
    }
    
    await socket.dispatch(payload as any)
    
    uploadEnabled.value = false
    ElMessage.warning('上传功能已关闭')
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity6 Teacher] 关闭上传功能失败:', error)
    ElMessage.error('关闭上传功能失败，请重试')
  }
}

// 切换学生端卡片
const switchToCard = async (cardType: 'ask' | 'upload' | 'view') => {
  try {
    let messageType = ''
    let actionText = ''
    
    switch (cardType) {
      case 'ask':
        messageType = 'show_ask_card'
        actionText = '问一问功能'
        break
      case 'upload':
        messageType = 'show_upload_card'
        actionText = '上传功能'
        break
      case 'view':
        messageType = 'show_view_card'
        actionText = '查看词云'
        break
    }
    
    const payload = {
      type: messageType,
      from: { role: 'teacher' },
      to: ['0'], // 广播到全体
      data: {},
      at: Date.now()
    }
    
    await socket.dispatch(payload as any)
    
    currentCard.value = cardType
    
    // 如果切换到上传功能，同时开启上传
    if (cardType === 'upload') {
      uploadEnabled.value = true
    }
    
    ElMessage.success(`已切换到${actionText}`)
    saveToLocalStorage()
    
  } catch (error: any) {
    console.error('[Activity6 Teacher] 切换卡片失败:', error)
    ElMessage.error('切换卡片失败，请重试')
  }
}

// 处理学生提交
const handleSubmission = (payload: any) => {
  if (!payload) return
  
  const from = payload.from || {}
  const data = payload.data || {}
  const groupNo = String(from.groupNo ?? '').trim()
  const studentNo = String(from.studentNo ?? '').trim()
  
  if (!groupNo || !studentNo) return
  
  // 处理上传结果
  if (payload.type === 'activity6_upload') {
    const analysisResult = data.analysisResult || ''
    
    const submissionRecord: SubmissionRecord = {
      key: `${groupNo}-${studentNo}-${Date.now()}`,
      groupNo,
      studentNo,
      analysisResult,
      analysisCount: data.analysisCount,
      selectedIndex: data.selectedIndex,
      type: 'upload',
      timestamp: data.timestamp || Date.now()
    }
    
    // 检查是否已有该小组的上传提交，如果有则替换
    const existingIndex = submissions.value.findIndex(s => s.groupNo === groupNo && s.type === 'upload')
    if (existingIndex >= 0) {
      submissions.value[existingIndex] = submissionRecord
    } else {
      submissions.value.push(submissionRecord)
    }
    
    console.log(`[Activity6 Teacher] 收到第${groupNo}组上传结果`)
    ElMessage.success(`收到第${groupNo}组的分析结果`)
  }
  
  // 处理编辑结果
  else if (payload.type === 'activity6_edit_result') {
    const q1 = data.q1 || ''
    const q2 = data.q2 || ''
    const originalQ1 = data.originalQ1 || ''
    const originalQ2 = data.originalQ2 || ''
    
    const editRecord: SubmissionRecord = {
      key: `${groupNo}-${studentNo}-edit-${Date.now()}`,
      groupNo,
      studentNo,
      q1,
      q2,
      originalQ1,
      originalQ2,
      type: 'edit',
      timestamp: data.timestamp || Date.now()
    }
    
    // 检查是否已有该小组的编辑提交，如果有则替换
    const existingIndex = editSubmissions.value.findIndex(s => s.groupNo === groupNo)
    if (existingIndex >= 0) {
      editSubmissions.value[existingIndex] = editRecord
    } else {
      editSubmissions.value.push(editRecord)
    }
    
    // 更新词云图数据
    const wordCloudIndex = wordCloudData.value.findIndex(item => item.groupNo === groupNo)
    const newWordCloudData = { groupNo, q1, q2 }
    
    if (wordCloudIndex >= 0) {
      wordCloudData.value[wordCloudIndex] = newWordCloudData
    } else {
      wordCloudData.value.push(newWordCloudData)
    }
    
    console.log(`[Activity6 Teacher] 收到第${groupNo}组编辑结果`)
    ElMessage.success(`收到第${groupNo}组的编辑内容`)
    
    // 如果有足够的数据，显示词云图
    if (wordCloudData.value.length >= 3) {
      showWordCloud.value = true
    }
    
    // 更新词云图
    if (activeTab.value === 'wordcloud' && wordCloudChart.value) {
      updateWordCloud()
    }
  }
  
  // 按时间排序
  submissions.value.sort((a, b) => b.timestamp - a.timestamp)
  editSubmissions.value.sort((a, b) => b.timestamp - a.timestamp)
  
  saveToLocalStorage()
}

// 查看详情
const viewSubmissionDetail = (submission: SubmissionRecord) => {
  currentSubmission.value = submission
  detailVisible.value = true
}

const closeDetail = () => {
  detailVisible.value = false
  currentSubmission.value = null
}

// 导出提交记录
const exportSubmission = (submission: SubmissionRecord) => {
  let content = `Activity6 学生提交记录

小组信息：第${submission.groupNo}组 ${submission.studentNo}号
提交时间：${formatDetailTime(submission.timestamp)}
提交类型：${submission.type === 'upload' ? '上传结果' : '编辑内容'}

`

  if (submission.type === 'upload') {
    content += `分析结果：
${submission.analysisResult}

分析情况：共${submission.analysisCount || 0}次分析，选择第${submission.selectedIndex || 0}次结果`
  } else {
    content += `编辑内容：
问题1：${submission.q1}
问题2：${submission.q2}

原始内容：
原始问题1：${submission.originalQ1}
原始问题2：${submission.originalQ2}`
  }

  content += `

---
导出时间：${new Date().toLocaleString('zh-CN')}`

  try {
    navigator.clipboard.writeText(content)
    ElMessage.success('提交记录已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动选择内容')
  }
}

// 初始化词云图
const initWordCloud = () => {
  if (!wordCloudRef.value) return
  
  if (wordCloudChart.value) {
    wordCloudChart.value.dispose()
  }
  
  wordCloudChart.value = echarts.init(wordCloudRef.value)
  
  // 设置响应式
  window.addEventListener('resize', () => {
    if (wordCloudChart.value) {
      wordCloudChart.value.resize()
    }
  })
  
  updateWordCloud()
}

// 更新词云图数据
const updateWordCloud = () => {
  if (!wordCloudChart.value) return
  
  // 获取词云数据
  const wordData = getWordCloudData()
  
  if (wordData.length === 0) {
    // 如果没有数据，显示空状态
    const option = {
      backgroundColor: '#ffffff',
      graphic: {
        elements: [{
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: '暂无词云数据',
            fontSize: 16,
            fill: '#9ca3af',
            textAlign: 'center'
          }
        }]
      }
    }
    wordCloudChart.value.setOption(option, true)
    return
  }
  
  const option = {
    backgroundColor: '#ffffff',
    tooltip: {
      show: true,
      formatter: (params: any) => {
        return `${params.name}<br/>出现频次: ${Math.floor((params.value - 20) / 10)}<br/>来源: 第${params.data.groupNo}组`
      }
    },
    series: [{
      type: 'wordCloud',
      sizeRange: [18, 80],
      rotationRange: [-45, 45],
      rotationStep: 15,
      gridSize: 12,
      shape: 'circle',
      width: '100%',
      height: '100%',
      drawOutOfBound: false,
      layoutAnimation: true,
      textStyle: {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontWeight: 'bold',
        color: () => {
          const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
            '#6366f1', '#f97316', '#059669', '#dc2626'
          ]
          return colors[Math.floor(Math.random() * colors.length)]
        }
      },
      emphasis: {
        focus: 'self',
        textStyle: {
          shadowBlur: 15,
          shadowColor: '#333'
        }
      },
      data: wordData
    }]
  }
  
  wordCloudChart.value.setOption(option, true)
}

// 获取词云图数据
const getWordCloudData = () => {
  const wordFreq: Record<string, {value: number, groupNo: string}> = {}
  
  wordCloudData.value.forEach(item => {
    if (item.q1 && item.q1.trim()) {
      const word = item.q1.trim()
      if (wordFreq[word]) {
        wordFreq[word].value++
      } else {
        wordFreq[word] = { value: 1, groupNo: item.groupNo }
      }
    }
    
    if (item.q2 && item.q2.trim()) {
      const word = item.q2.trim()
      if (wordFreq[word]) {
        wordFreq[word].value++
      } else {
        wordFreq[word] = { value: 1, groupNo: item.groupNo }
      }
    }
  })
  
  return Object.entries(wordFreq).map(([name, data]) => ({
    name,
    value: data.value * 10 + 20, // 调整大小权重
    groupNo: data.groupNo
  }))
}

// 生成测试数据
const generateTestData = () => {
  const testData = [
    { groupNo: '1', q1: '是否监管', q2: '使用频率' },
    { groupNo: '2', q1: '安全性', q2: '学习效果' },
    { groupNo: '3', q1: '隐私保护', q2: '使用时长' },
    { groupNo: '4', q1: '内容质量', q2: '是否监管' },
    { groupNo: '5', q1: '学习效果', q2: '安全性' },
    { groupNo: '6', q1: '使用频率', q2: '隐私保护' },
    { groupNo: '7', q1: '技术依赖', q2: '内容质量' },
    { groupNo: '8', q1: '网络成瘾', q2: '技术依赖' },
    { groupNo: '9', q1: '学习资源', q2: '网络成瘾' },
    { groupNo: '10', q1: '数字素养', q2: '学习资源' }
  ]
  
  wordCloudData.value = testData
  saveToLocalStorage()
  
  // 更新词云图
  setTimeout(() => {
    updateWordCloud()
  }, 100)
  
  ElMessage.success('测试数据已生成，词云图已更新！')
}

// 清空词云图数据
const clearWordCloudData = () => {
  wordCloudData.value = []
  saveToLocalStorage()
  
  if (wordCloudChart.value) {
    wordCloudChart.value.clear()
  }
  
  ElMessage.warning('词云图数据已清空')
}


// 时间格式化
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}小时前`
  
  return date.toLocaleDateString('zh-CN')
}

const formatDetailTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 本地存储
const saveToLocalStorage = () => {
  try {
    const data = {
      uploadEnabled: uploadEnabled.value,
      activeTab: activeTab.value,
      currentCard: currentCard.value,
      submissions: submissions.value,
      editSubmissions: editSubmissions.value,
      wordCloudData: wordCloudData.value,
      showWordCloud: showWordCloud.value,
      timestamp: Date.now()
    }
    localStorage.setItem('teacher_activity6_data', JSON.stringify(data))
  } catch (error) {
    console.warn('保存Activity6数据失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('teacher_activity6_data')
    if (stored) {
      const data = JSON.parse(stored)
      uploadEnabled.value = data.uploadEnabled || false
      activeTab.value = data.activeTab || 'upload'
      currentCard.value = data.currentCard || 'ask'
      submissions.value = data.submissions || []
      editSubmissions.value = data.editSubmissions || []
      wordCloudData.value = data.wordCloudData || []
      showWordCloud.value = data.showWordCloud || false
      console.log('Activity6 教师端数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('恢复Activity6数据失败:', error)
  }
}

// 监听标签页切换
watch(activeTab, async (newTab) => {
  if (newTab === 'wordcloud') {
    await nextTick()
    setTimeout(() => {
      initWordCloud()
    }, 100)
  }
})

// 组件生命周期
onMounted(() => {
  loadFromLocalStorage()
  socket.on('submit', handleSubmission)
  console.log('[Activity6 Teacher] 开始监听学生提交')
  
  // 如果当前是词云图标签页，初始化词云图
  if (activeTab.value === 'wordcloud') {
    setTimeout(() => {
      initWordCloud()
    }, 100)
  }
})

onUnmounted(() => {
  socket.off('submit', handleSubmission)
  
  // 销毁词云图实例
  if (wordCloudChart.value) {
    wordCloudChart.value.dispose()
    wordCloudChart.value = null
  }
})
</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
}

/* 活动标题 */
.activity-header {
  margin-bottom: 24px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.activity-description {
  color: #6b7280;
  font-size: 16px;
}

/* 控制区域 */
.control-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.function-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.control-info {
  flex: 1;
}

.control-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.control-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.control-status {
  display: flex;
  align-items: center;
}

.status-text {
  color: #059669;
  font-weight: 600;
  background: #d1fae5;
  padding: 6px 12px;
  border-radius: 12px;
}

.control-actions {
  display: flex;
  gap: 12px;
}

.enable-upload-btn {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.enable-upload-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
}

.enable-upload-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
}

/* 学生提交区域 */
.submissions-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.submissions-tabs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.submissions-count {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}

.count-label {
  color: #6b7280;
}

.count-number {
  color: #059669;
  font-weight: 700;
}

.count-total {
  color: #9ca3af;
}

/* 提交网格 */
.submissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.submission-card {
  height: 200px;
  position: relative;
  transition: all 0.2s ease;
}

.submission-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.submission-card :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.student-info {
  display: flex;
  gap: 6px;
}

.group-badge,
.student-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.group-badge {
  background: #dbeafe;
  color: #1e40af;
}

.student-badge {
  background: #dcfce7;
  color: #166534;
}

.submission-time {
  font-size: 12px;
  color: #6b7280;
}

.submission-content {
  flex: 1;
  margin-bottom: 12px;
}

.content-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.analysis-meta {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
}

.content-text {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.submission-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

/* 详情对话框 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.info-item {
  margin-bottom: 8px;
  color: #374151;
}

.info-item:last-child {
  margin-bottom: 0;
}

.detail-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-label {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.result-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .submissions-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .submissions-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .function-controls {
    gap: 12px;
  }
  
  .control-item {
    padding: 16px;
  }
}

/* 上传功能按钮样式 */
.disable-upload-btn {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  transition: all 0.3s ease;
}

.disable-upload-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(239, 68, 68, 0.4);
}

.upload-status-info {
  margin-top: 8px;
}

.status-enabled {
  color: #059669;
  font-weight: 600;
  background: #d1fae5;
  padding: 4px 12px;
  border-radius: 12px;
}

/* 卡片控制按钮样式 */
.card-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-control-btn {
  min-width: 120px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.card-control-btn:not(.is-disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 编辑卡片样式 */
.edit-card-style {
  border-left: 4px solid #8b5cf6;
}

.edit-content-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.edit-label {
  font-size: 12px;
  font-weight: 600;
  color: #8b5cf6;
  margin-bottom: 6px;
}

.edit-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

/* 词云图样式 */
.wordcloud-section {
  width: 100%;
}

.wordcloud-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wordcloud-stats {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stats-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.stats-info {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
}

.stats-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.wordcloud-display-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wordcloud-item,
.wordcloud-item-single {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.wordcloud-item-single {
  width: 100%;
}

.wordcloud-title {
  font-size: 16px;
  font-weight: 700;
  color: #374151;
  margin: 0 0 16px 0;
  text-align: center;
}

.wordcloud-content {
  min-height: 400px;
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  border: 1px solid #e2e8f0;
}

.echarts-wordcloud {
  width: 100%;
  height: 360px;
}

.empty-wordcloud {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #9ca3af;
}

.empty-wordcloud .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-wordcloud p {
  margin: 0;
  font-size: 16px;
}

.wordcloud-details {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}

.details-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 20px 0;
  text-align: center;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.detail-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-header {
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 12px;
  text-align: center;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  min-width: 60px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  word-break: break-word;
}

/* 响应式词云图 */
@media (max-width: 768px) {
  .wordcloud-display-section {
    grid-template-columns: 1fr;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
