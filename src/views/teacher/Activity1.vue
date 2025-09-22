<template>
  <div class="page">
    <h2 class="title">活动一：数据获取方法多</h2>
    
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
    
    <!-- 4个情景题统计卡片 -->
    <div class="questions-grid">
      <div v-for="(question, index) in questions" :key="question.id" class="question-card" @click="openDetailDialog(question.id)">
        <div class="question-header">
          <div class="question-number">情景{{ getQuestionNumber(index) }}</div>
          <div class="question-title">{{ question.title }}</div>
        </div>
        
        <div class="question-image">
          <img :src="question.image" :alt="question.title" />
        </div>
        
        <div class="question-stats">
          <div class="participants-count">
            参与人数：<strong>{{ getParticipantsCount(question.id) }}</strong>
          </div>
          
          <div v-if="getParticipantsCount(question.id) > 0" class="top-options">
            <div class="top-options-title">选择情况（按人数排序）：</div>
            <div v-for="(topOption, idx) in getTopOptions(question.id)" :key="topOption.id" class="top-option-item" :class="'top-' + topOption.id">
              <span class="option-name">{{ topOption.label }}</span>
              <span class="option-count">{{ topOption.count }}人</span>
              <span class="option-percent">({{ Math.round(topOption.count / getParticipantsCount(question.id) * 100) }}%)</span>
            </div>
          </div>
          
          <div v-else class="no-data">
            暂无学生回答数据
          </div>
        </div>
        
        <div class="question-indicator">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 详细统计弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      top="10vh"
      :before-close="closeDetailDialog"
    >
      <div class="detail-content">
        <div v-for="option in getSortedOptionsForDetail(selectedQuestionId)" :key="option.id" class="detail-section">
          <div class="detail-header">
            <span class="detail-label" :class="'bg-' + option.id">{{ option.label }}</span>
            <span class="detail-count">{{ option.count }}人</span>
            <span v-if="selectedQuestionId && getParticipantsCount(selectedQuestionId) > 0" class="detail-percent">
              ({{ Math.round(option.count / getParticipantsCount(selectedQuestionId) * 100) }}%)
            </span>
          </div>
          <div class="detail-students">
            <span v-for="student in option.students" :key="student.key" class="student-tag">
              第{{ student.groupNo }}组-{{ student.studentNo }}号
            </span>
          </div>
          <div v-if="option.students.length === 0" class="no-students">
            暂无学生选择此选项
        </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { socketService } from '@/services/socket'
import { ArrowRight } from '@element-plus/icons-vue'

// 类型定义
type AnswerId = 'A' | 'B' | 'C' | 'D'
type QuestionId = 'q1' | 'q2' | 'q3' | 'q4'

const options = [
  { id: 'A' as AnswerId, label: '现场记录' },
  { id: 'B' as AnswerId, label: '问卷调查' },
  { id: 'C' as AnswerId, label: '网络获取' },
  { id: 'D' as AnswerId, label: '设备采集' }
]

// 4个情景题定义
const questions = [
  {
    id: 'q1' as QuestionId,
    title: '在学校组织的体检中，医生应如何准确获取学生的肺活量数据？',
    image: '/src/public/activity1_q1.png'
  },
  {
    id: 'q2' as QuestionId,
    title: '小明希望了解未来几天的天气状况，他应如何快速有效获取相关的天气数据？',
    image: '/src/public/activity1_q2.png'
  },
  {
    id: 'q3' as QuestionId,
    title: '科学课上，每个小组需要记录蚕宝宝的生长情况，如何获取相关数据？',
    image: '/src/public/activity1_q3.png'
  },
  {
    id: 'q4' as QuestionId,
    title: '为改进学校午餐的口味，校方应如何快速全面获取全校师生对饭菜喜爱程度的数据？',
    image: '/src/public/activity1_q4.png'
  }
]

// 存储学生答案数据: Map<studentKey, answers>
// studentKey格式: "groupNo-studentNo"
// answers格式: { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }
const studentAnswers = reactive(new Map<string, Record<QuestionId, AnswerId>>())

// 弹窗相关状态
const dialogVisible = ref(false)
const selectedQuestionId = ref<QuestionId | null>(null)

const dialogTitle = computed(() => {
  if (!selectedQuestionId.value) return ''
  const question = questions.find(q => q.id === selectedQuestionId.value)
  return question ? `${question.title} - 详细统计` : ''
})

// 小组完成统计
const completedGroups = reactive(new Set<string>())
const progressPercentage = computed(() => {
  return Math.round((completedGroups.size / 25) * 100)
})

const getQuestionNumber = (index: number) => {
  const numbers = ['一', '二', '三', '四']
  return numbers[index] || (index + 1)
}

function studentKey(groupNo: string, studentNo: string) {
  return `${groupNo}-${studentNo}`
}

// 解析学生key获取组号和学号
function parseStudentKey(key: string): { groupNo: string; studentNo: string } {
  const [groupNo, studentNo] = key.split('-')
  return { groupNo: groupNo || '', studentNo: studentNo || '' }
}

function handleSubmit(payload: any) {
  if (!payload || String(payload.type || '') !== 'activity1_question') return
  const from = payload.from || {}
  const data = payload.data || {}
  const g = String(from.groupNo ?? '').trim()
  const s = String(from.studentNo ?? '').trim()
  const action = String(data.action ?? 'submit')
  
  if (!g || !s) return
  
  const key = studentKey(g, s)
  const wasGroupCompleted = completedGroups.has(g)
  
  if (action === 'reset') {
    // 重置操作
    studentAnswers.delete(key)
    
    // 检查该小组是否还有其他学生的数据
    const hasOtherGroupData = Array.from(studentAnswers.keys()).some(k => k.startsWith(g + '-'))
    if (!hasOtherGroupData) {
      completedGroups.delete(g)
    }
  } else {
    // 提交答案
    const answers = data.answers
    if (!answers || typeof answers !== 'object') return
    
    studentAnswers.set(key, answers)
    
    // 首次提交时添加到完成统计
    if (!wasGroupCompleted) {
      completedGroups.add(g)
    }
  }
  
  // 保存到本地存储
  saveActivity1TeacherData()
  
  console.log(`[Activity1] 处理提交: 第${g}组-${s}号, 操作: ${action}, 完成小组数: ${completedGroups.size}`)
}

// 本地存储相关
function saveActivity1TeacherData() {
  const data = {
    studentAnswers: Array.from(studentAnswers.entries()),
    completedGroups: Array.from(completedGroups),
    timestamp: Date.now()
  }
  localStorage.setItem('activity1_teacher_data', JSON.stringify(data))
}

function loadActivity1TeacherData() {
  try {
    const stored = localStorage.getItem('activity1_teacher_data')
    if (stored) {
      const data = JSON.parse(stored)
      
      // 恢复学生答案数据
      if (data.studentAnswers && Array.isArray(data.studentAnswers)) {
        data.studentAnswers.forEach(([key, answers]: [string, any]) => {
          studentAnswers.set(key, answers)
        })
      }
      
      // 恢复小组完成统计
      if (data.completedGroups && Array.isArray(data.completedGroups)) {
        data.completedGroups.forEach((groupNo: string) => {
          completedGroups.add(groupNo)
        })
      }
      
      console.log(`[Activity1] 已恢复本地存储数据，学生数据: ${studentAnswers.size}, 完成小组数: ${completedGroups.size}`)
    }
  } catch (error) {
    console.warn('恢复Activity1教师端数据失败:', error)
  }
}

onMounted(() => {
  loadActivity1TeacherData()
  socketService.on('submit', handleSubmit)
})

onBeforeUnmount(() => {
  socketService.off('submit', handleSubmit)
})

// 统计相关函数
function getParticipantsCount(questionId: QuestionId): number {
  let count = 0
  studentAnswers.forEach((answers) => {
    if (answers[questionId]) {
      count++
    }
  })
  return count
}

function getOptionCount(questionId: QuestionId, optionId: AnswerId): number {
  let count = 0
  studentAnswers.forEach((answers) => {
    if (answers[questionId] === optionId) {
      count++
    }
  })
  return count
}

// 删除了未使用的getOptionPercent和getDetailOptionCount函数

function getDetailStudents(questionId: QuestionId | null, optionId: AnswerId): Array<{ key: string; groupNo: string; studentNo: string }> {
  if (!questionId) return []
  
  const students: Array<{ key: string; groupNo: string; studentNo: string }> = []
  
  studentAnswers.forEach((answers, key) => {
    if (answers[questionId] === optionId) {
      const { groupNo, studentNo } = parseStudentKey(key)
      students.push({ key, groupNo, studentNo })
    }
  })
  
  // 按组号和学号排序
  return students.sort((a, b) => {
    const groupDiff = parseInt(a.groupNo) - parseInt(b.groupNo)
    if (groupDiff !== 0) return groupDiff
    return parseInt(a.studentNo) - parseInt(b.studentNo)
  })
}

// 获取按人数排序的前几个选项
function getTopOptions(questionId: QuestionId): Array<{ id: AnswerId; label: string; count: number }> {
  const optionCounts = options.map(option => ({
    id: option.id,
    label: option.label,
    count: getOptionCount(questionId, option.id)
  }))
  
  return optionCounts
    .filter(option => option.count > 0)
    .sort((a, b) => b.count - a.count)
}

// 获取详细统计的排序选项（包含学生信息）
function getSortedOptionsForDetail(questionId: QuestionId | null): Array<{
  id: AnswerId;
  label: string;
  count: number;
  students: Array<{ key: string; groupNo: string; studentNo: string }>
}> {
  if (!questionId) return []
  
  const optionDetails = options.map(option => ({
    id: option.id,
    label: option.label,
    count: getOptionCount(questionId, option.id),
    students: getDetailStudents(questionId, option.id)
  }))
  
  // 按人数降序排列，人数为0的放在最后
  return optionDetails.sort((a, b) => {
    if (a.count === 0 && b.count === 0) return 0
    if (a.count === 0) return 1
    if (b.count === 0) return -1
    return b.count - a.count
  })
}

// 弹窗操作
function openDetailDialog(questionId: QuestionId) {
  selectedQuestionId.value = questionId
  dialogVisible.value = true
}

function closeDetailDialog() {
  dialogVisible.value = false
  selectedQuestionId.value = null
}
</script>

<style scoped>
.page { 
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.title { 
  font-size: 18px; 
  font-weight: 700; 
  margin-bottom: 20px; 
  color: #1f2937; 
}

/* 进度条样式 */
.progress-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.progress-label {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}
.progress-count {
  font-size: 15px;
  font-weight: 700;
  color: #059669;
}
.progress-bar {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 5px;
  transition: width 0.3s ease;
}

/* 问题网格 */
.questions-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr)); 
  gap: 24px; 
}

/* 问题卡片 */
.question-card { 
  border: 1px solid #e5e7eb; 
  border-radius: 16px; 
  background: #fff; 
  padding: 20px; 
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.question-card:hover { 
  border-color: #3b82f6; 
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

/* 问题头部 */
.question-header {
  margin-bottom: 16px;
}
.question-number {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 8px;
}
.question-title { 
  font-size: 14px; 
  font-weight: 600; 
  color: #1f2937; 
  line-height: 1.5;
}

/* 问题图片 */
.question-image {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  margin-bottom: 16px;
}
.question-image img {
  max-width: 100%;
  max-height: 160px;
  object-fit: contain;
}

/* 问题统计 */
.question-stats {
  flex: 1;
}
.participants-count {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
}
.participants-count strong {
  color: #059669;
  font-weight: 700;
}

/* 选项统计 */
.top-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.top-options-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}
.top-option-item {
  display: flex; 
  align-items: center; 
  gap: 8px; 
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid;
}
.top-option-item:first-child { border-left-color: #3b82f6; }
.top-option-item:nth-child(2) { border-left-color: #10b981; }
.top-option-item:nth-child(3) { border-left-color: #f59e0b; }
.top-option-item:nth-child(4) { border-left-color: #ef4444; }

.option-rank {
  font-size: 12px; 
  font-weight: 700;
  color: #6b7280; 
  min-width: 16px;
}
.option-name {
  font-size: 13px; 
  font-weight: 600; 
  color: #374151;
  flex: 1;
}
.option-count {
  font-size: 12px; 
  font-weight: 700; 
  color: #059669;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 10px;
}
.option-percent {
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
}

/* 选项配色 */
.top-A { border-left-color: #16a34a !important; }
.top-B { border-left-color: #f59e0b !important; }
.top-C { border-left-color: #3b82f6 !important; }
.top-D { border-left-color: #ef4444 !important; }

.top-A .option-count { background: #d1fae5; color: #065f46; }
.top-B .option-count { background: #fed7aa; color: #9a3412; }
.top-C .option-count { background: #dbeafe; color: #1e3a8a; }
.top-D .option-count { background: #fecaca; color: #991b1b; }

.no-data { 
  color: #9ca3af; 
  font-size: 14px; 
  text-align: center;
  padding: 30px 0;
  font-style: italic;
  background: #f9fafb;
  border-radius: 12px;
}

/* 指示器 */
.question-indicator { 
  display: flex; 
  justify-content: flex-end; 
  align-items: center;
  color: #9ca3af;
  font-size: 14px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

/* 弹窗样式 */
.detail-content { 
  max-height: 400px; 
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条样式 */
.detail-content::-webkit-scrollbar {
  width: 6px;
}
.detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
.detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.detail-section { 
  margin-bottom: 24px; 
  background: #fafbfc;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 16px;
}
.detail-section:last-child { 
  margin-bottom: 0; 
}

.detail-header { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.detail-label { 
  font-size: 13px; 
  font-weight: 600; 
  padding: 6px 14px;
  border-radius: 20px;
  color: white;
}
.detail-count { 
  font-size: 13px; 
  color: #6b7280;
  font-weight: 600;
}
.detail-percent {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 8px;
}

/* 弹窗中的选项配色 */
.bg-A { background: #16a34a; }
.bg-B { background: #f59e0b; }
.bg-C { background: #3b82f6; }
.bg-D { background: #ef4444; }

.detail-students { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 8px;
}
.student-tag { 
  font-size: 12px; 
  background: #f3f4f6; 
  color: #374151;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
}

.no-students {
  color: #9ca3af; 
  font-size: 12px;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .questions-grid { 
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
  }
}
@media (max-width: 768px) {
  .questions-grid { 
    grid-template-columns: 1fr; 
  }
  .question-card { 
    padding: 16px; 
  }
  .question-image {
    min-height: 120px;
  }
  .question-image img {
    max-height: 100px;
  }
}
</style>
