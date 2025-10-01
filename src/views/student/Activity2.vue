<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">📝 Activity 2: 问卷设计，精研问题</h2>
    </div>

    <!-- 主要布局 -->
    <div class="main-layout">
      <!-- 左侧面板 -->
      <div class="left-panel">
    <!-- 活动说明 -->
        <div class="card instruction-card">
          <h3 class="card-title">📋 活动说明</h3>
          <div class="instruction-content">
            <ol class="instruction-list">
              <li>补充调查目的和说明</li>
              <li>选择使用时长题目</li>
            </ol>
          </div>
    </div>

        <!-- 题库和预览区域 -->
        <div class="bank-preview-area">
          <!-- 题库 -->
          <div class="card question-bank-card">
        <div class="card-header">
            <h3 class="card-title">📚 题库</h3>
            </div>
          
          <div class="question-bank-content">
            <!-- 基础信息 -->
            <div class="bank-section">
              <div class="section-header">
                <span class="section-title">问卷基础信息</span>
            </div>
              <div class="bank-item fixed-item">
                <div class="item-label">标题</div>
                <div class="item-content">学生数字设备使用情况调查问卷</div>
          </div>
              <div class="bank-item fixed-item">
                <div class="item-label">说明</div>
                <div class="item-content">为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建立，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。</div>
          </div>
        </div>

            <!-- 预置题目 -->
            <div class="bank-section">
              <div class="section-header">
                <span class="section-title">预置题目</span>
          </div>
              <div 
                v-for="q in baseQuestions" 
                :key="q.id" 
                class="bank-item question-item"
                :class="{ 'selected': isQuestionSelected(q.id) }"
                @click="toggleQuestion(q.id)"
              >
                <div class="item-header">
                  <span class="q-number">{{ q.id }}.</span>
                  <span class="q-title">{{ q.title }}</span>
                  <el-icon v-if="isQuestionSelected(q.id)" class="check-icon"><CircleCheck /></el-icon>
        </div>
                <div class="q-options">{{ q.options.join(' / ') }}</div>
          </div>
            </div>
            
            <!-- 自定义题目 -->
            <div class="bank-section" v-if="customQuestions.length > 0">
              <div class="section-header">
                <span class="section-title">我的设计</span>
          </div>
              <div 
                v-for="q in customQuestions" 
                :key="q.id" 
                class="bank-item question-item custom"
                :class="{ 'selected': isQuestionSelected(q.id) }"
                @click="toggleQuestion(q.id)"
              >
                <div class="item-header">
                  <span class="q-number">{{ q.id }}.</span>
                  <span class="q-title">{{ q.title }}</span>
                  <el-icon v-if="isQuestionSelected(q.id)" class="check-icon"><CircleCheck /></el-icon>
              </div>
                <div class="q-options">{{ q.options.join(' / ') }}</div>
            </div>
          </div>
        </div>
      </div>

          <!-- 问卷预览 -->
          <div class="card preview-card">
        <div class="card-header">
            <h3 class="card-title">📋 问卷预览</h3>
            <el-button size="small" type="primary" @click="submitQuestionnaire" :disabled="selectedQuestions.length === 0">
              提交问卷
          </el-button>
        </div>

          <div class="questionnaire-preview">
            <div class="preview-title">学生数字设备使用情况调查问卷</div>
            <div class="preview-description">
              为了更好地了解同学们使用数字设备的情况，用于分析，得出合理建立，提升使用数字设备自我管理意识，特设计此问卷。希望同学们如实填写，感谢大家的积极参与。
          </div>
          
            <div v-if="selectedQuestions.length === 0" class="empty-preview">
              <el-icon class="empty-icon"><DocumentCopy /></el-icon>
              <p>请从题库中选择题目</p>
        </div>

            <div v-else class="preview-questions">
              <div 
                v-for="(q, idx) in selectedQuestions" 
                :key="q.id" 
                class="preview-question"
              >
                <div class="pq-header">
                  <span class="pq-number">{{ idx + 1 }}.</span>
                  <span class="pq-title">{{ q.title }}</span>
        </div>
                <div class="pq-options">{{ q.options.join(' / ') }}</div>
          </div>
        </div>
          </div>
              </div>
            </div>
          </div>
          
      <!-- 右侧问题设计 -->
      <div class="right-panel">
        <div ref="designPanelRef" class="design-panel" :class="{ 'fixed': isDesignFixed }">
          <div class="panel-header">
            <h3 class="panel-title">问题设计</h3>
            <div class="panel-actions">
              <el-button size="small" type="primary" :icon="Promotion" @click="getTips">获取提示</el-button>
              <el-button size="small" type="success" :icon="Plus" @click="addToBank" :disabled="!canAddToBank">加入题库</el-button>
        </div>
      </div>

          <div class="panel-body">
            <!-- 小组信息提示 -->
            <div class="group-info-tip">
              <span class="tip-label">小组：</span>
              <span class="tip-value">第{{ groupNo }}组</span>
              <span class="tip-label">题型：</span>
              <span class="tip-value">{{ questionTypeText }}</span>
        </div>

            <!-- 问题内容 -->
            <div class="form-group">
              <label class="form-label">问题内容：</label>
            <el-input
                v-model="newQuestion.content"
              type="textarea"
              :rows="3"
                placeholder="请输入问题内容"
              maxlength="200"
              show-word-limit
            />
          </div>

            <!-- 选项内容 -->
            <div class="form-group" v-if="questionType !== 'fill'">
              <label class="form-label">选项内容：</label>
              <div class="options-container">
                <div 
                  v-for="(_opt, idx) in newQuestion.options" 
                  :key="idx"
                  class="option-item"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
            <el-input
                    v-model="newQuestion.options[idx]"
                    placeholder="请输入选项内容"
                    style="flex: 1;"
                  />
          <el-button 
                    :icon="Delete" 
                    circle 
                    size="small" 
                    type="danger" 
                    @click="removeOption(idx)"
                    :disabled="newQuestion.options.length <= 2"
                  />
        </div>
          <el-button 
                  class="add-option-btn" 
                  :icon="Plus" 
                  @click="addOption"
                  size="small"
            type="primary" 
                  plain
                >
                  添加选项
          </el-button>
        </div>
      </div>

            <!-- AI提示区域 -->
            <div class="ai-tips-box" v-if="aiTips">
              <div class="tips-header">
                <el-icon class="tips-icon"><Promotion /></el-icon>
                <span>AI 设计建议</span>
          </div>
              <div class="tips-content">{{ aiTips }}</div>
        </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { EntityMode } from '@/types'
import { ElMessage } from 'element-plus'
import { CircleCheck, DocumentCopy, Promotion, Plus, Delete } from '@element-plus/icons-vue'

const status = useStatus()
const socket = useSocket()

// 题目接口
interface Question {
  id: number
  title: string
  options: string[]
  type: 'single' | 'multiple' | 'fill'
}

// 获取小组号
const groupNo = computed(() => String(status.userStatus?.groupNo ?? ''))

// 根据小组号自动判断题型
const questionType = computed<'single' | 'fill'>(() => {
  const gNo = parseInt(groupNo.value)
  return gNo < 7 ? 'single' : 'fill'
})

const questionTypeText = computed(() => {
  return questionType.value === 'single' ? '选择题' : '填空题'
})

// 预置题目（基础题库）
const baseQuestions = ref<Question[]>([
  { id: 1, title: '就读年级', options: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'], type: 'single' },
  { id: 2, title: '你的性别', options: ['男', '女'], type: 'single' },
  { id: 3, title: '你平均每天使用数字设备的时间长吗？', options: ['长', '短', '基本不用'], type: 'single' },
  { id: 4, title: '你平均每天使用数字设备的时间长吗？', options: ['30分钟以内', '30-60分钟', '60分钟以上'], type: 'single' }
])

// 自定义题目
const customQuestions = ref<Question[]>([])

// 已选择的题目ID列表
const selectedQuestionIds = ref<number[]>([])

// 新题目设计表单
const newQuestion = ref({
  content: '',
  options: ['', '']
})

// AI提示
const aiTips = ref('')

// 设计面板滚动状态
const designPanelRef = ref<HTMLElement>()
const isDesignFixed = ref(false)
const designTopOffset = ref(0)

// 计算属性：已选择的题目列表
const selectedQuestions = computed(() => {
  const allQuestions = [...baseQuestions.value, ...customQuestions.value]
  return selectedQuestionIds.value
    .map(id => allQuestions.find(q => q.id === id))
    .filter(q => q !== undefined) as Question[]
})

// 判断题目是否被选中
const isQuestionSelected = (id: number) => {
  return selectedQuestionIds.value.includes(id)
}

// 切换题目选择
const toggleQuestion = (id: number) => {
  const index = selectedQuestionIds.value.indexOf(id)
  if (index > -1) {
    selectedQuestionIds.value.splice(index, 1)
      } else {
    selectedQuestionIds.value.push(id)
  }
}

// 添加选项
const addOption = () => {
  if (newQuestion.value.options.length < 6) {
    newQuestion.value.options.push('')
    } else {
    ElMessage.warning('最多支持6个选项')
  }
}

// 删除选项
const removeOption = (index: number) => {
  if (newQuestion.value.options.length > 2) {
    newQuestion.value.options.splice(index, 1)
  }
}

// 是否可以加入题库
const canAddToBank = computed(() => {
  if (!newQuestion.value.content.trim()) return false
  if (questionType.value !== 'fill') {
    return newQuestion.value.options.every(opt => opt.trim())
  }
  return true
})

// 加入题库
const addToBank = () => {
  if (!canAddToBank.value) {
    ElMessage.warning('请完整填写题目内容')
    return
  }

  const newId = Math.max(...baseQuestions.value.map(q => q.id), ...customQuestions.value.map(q => q.id), 0) + 1
  
  const question: Question = {
    id: newId,
    title: newQuestion.value.content.trim(),
    options: questionType.value === 'fill' ? ['填空'] : newQuestion.value.options.map(o => o.trim()),
    type: questionType.value
  }

  customQuestions.value.push(question)
  
  // 重置表单
  newQuestion.value = {
    content: '',
    options: ['', '']
  }
  
  aiTips.value = ''
  
  ElMessage.success('题目已加入题库！')
}

// 获取AI提示
const getTips = async () => {
  if (!newQuestion.value.content.trim()) {
    ElMessage.warning('请先输入问题内容')
    return
  }

  try {
    // 模拟AI提示（实际应调用AI接口）
    aiTips.value = `针对问题"${newQuestion.value.content}"的建议：\n\n1. 确保问题表述清晰明确\n2. 选项应当涵盖主要情况\n3. 避免诱导性表述\n4. 考虑答案的可分析性`
    
    ElMessage.success('已获取AI建议')
  } catch (error) {
    ElMessage.error('获取提示失败')
  }
}

// 提交问卷
const submitQuestionnaire = () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请至少选择一个题目')
    return
  }

  const user = status.userStatus
  if (!user || !user.groupNo) {
    ElMessage.error('未获取到小组信息')
    return
  }

  try {
    socket.submit({
      mode: EntityMode.GROUP,
      messageType: 'activity2_questionnaire',
      activityIndex: '2',
      data: { 
        groupNo: String(user.groupNo),
        questions: selectedQuestions.value,
        customQuestions: customQuestions.value
      },
      from: {
        id: String(user.groupNo),
        groupNo: String(user.groupNo)
      },
      to: null
    })
    
    ElMessage.success('问卷提交成功！')
  } catch (error: any) {
    console.error('[Activity2] 提交失败', error)
    ElMessage.error('提交失败，请重试')
  }
}

// 滚动跟随
const handleScroll = () => {
  if (!designPanelRef.value) return
  const scroll = window.pageYOffset || document.documentElement.scrollTop
  isDesignFixed.value = scroll > designTopOffset.value && designPanelRef.value.getBoundingClientRect().top <= 80
}

onMounted(() => {
  setTimeout(() => {
    if (designPanelRef.value) {
      designTopOffset.value = window.pageYOffset + designPanelRef.value.getBoundingClientRect().top - 80
    }
    }, 100)
  window.addEventListener('scroll', handleScroll)
  
  console.log('[Activity2] 组件已挂载，小组号:', groupNo.value)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  console.log('[Activity2] 组件卸载')
})
</script>

<style scoped>
.page {
  padding: 20px;
  width: 1240px;
  max-width: 100%;
  margin: 0 auto;
  background: #F5F5F0;
  min-height: 100vh;
}

.activity-header {
  margin-bottom: 24px;
  text-align: center;
}

.activity-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 主布局 */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 24px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 活动说明卡片 */
.instruction-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-color: #0ea5e9;
}

.instruction-content {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.instruction-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

/* 题库和预览区域 */
.bank-preview-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.right-panel {
  position: relative;
}

/* 卡片样式 */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

/* 题库卡片 */
.question-bank-card {
  max-height: 500px;
}

.question-bank-content {
  max-height: 400px;
  overflow-y: auto;
}

.bank-section {
  margin-bottom: 20px;
}

.bank-section:last-child {
  margin-bottom: 0;
}

.section-header {
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #0369a1;
}

.bank-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.bank-item.fixed-item {
  background: #fef3c7;
  border-color: #fbbf24;
}

.bank-item.question-item {
  cursor: pointer;
}

.bank-item.question-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.bank-item.question-item.selected {
  background: #dcfce7;
  border-color: #10b981;
}

.bank-item.question-item.custom {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

.bank-item.question-item.custom.selected {
  background: #cffafe;
  border-color: #06b6d4;
}

.item-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.item-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.q-number {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.q-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.check-icon {
  font-size: 20px;
  color: #10b981;
}

.q-options {
  font-size: 13px;
  color: #6b7280;
  padding-left: 22px;
}

/* 问卷预览卡片 */
.preview-card {
  max-height: 600px;
}

.questionnaire-preview {
  max-height: 500px;
  overflow-y: auto;
}

.preview-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 12px;
  margin-bottom: 12px;
}

.preview-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  margin-bottom: 16px;
}

.empty-preview {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #d1d5db;
}

.preview-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-question {
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
}

.pq-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.pq-number {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
}

.pq-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.pq-options {
  font-size: 13px;
  color: #6b7280;
  padding-left: 22px;
}

/* 右侧问题设计面板 */
.design-panel {
  background: white;
  border: 2px solid #B6E1FF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(182, 225, 255, 0.3);
  transition: all 0.3s ease;
}

.design-panel.fixed {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 428px;
  z-index: 100;
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #B6E1FF, #8EC5FC);
  border-radius: 14px 14px 0 0;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.panel-body {
  padding: 20px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* 小组信息提示 */
.group-info-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 2px solid #3b82f6;
}

.tip-label {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

.tip-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e3a8a;
  background: white;
  padding: 4px 12px;
  border-radius: 8px;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

/* 选项容器 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 24px;
}

.add-option-btn {
  width: 100%;
}

/* AI提示框 */
.ai-tips-box {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 12px;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 12px;
}

.tips-icon {
  font-size: 20px;
}

.tips-content {
  font-size: 13px;
  color: #78350f;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 滚动条 */
.question-bank-content::-webkit-scrollbar,
.questionnaire-preview::-webkit-scrollbar,
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.question-bank-content::-webkit-scrollbar-track,
.questionnaire-preview::-webkit-scrollbar-track,
.panel-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.question-bank-content::-webkit-scrollbar-thumb,
.questionnaire-preview::-webkit-scrollbar-thumb,
.panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.question-bank-content::-webkit-scrollbar-thumb:hover,
.questionnaire-preview::-webkit-scrollbar-thumb:hover,
.panel-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .bank-preview-area {
    grid-template-columns: 1fr;
  }
  
  .design-panel.fixed {
    position: relative;
    width: 100%;
  }
}
</style>
