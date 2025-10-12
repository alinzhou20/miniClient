<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 活动标题 -->
      <div class="activity-header">
        <h2 class="activity-title">📋 问卷答题，收集数据</h2>
      </div>

      <!-- 操控按钮区域 -->
      <div class="action-section">
        <div class="stats-info">
          <div class="stat-item">
            <span class="stat-label">已提交学生：</span>
            <span class="stat-value">{{ submittedGroupCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成率：</span>
            <span class="stat-value">{{ completionRate }}%</span>
          </div>
        </div>

        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large"
            :icon="Download"
            @click="exportAllAnswers"
            :disabled="submittedGroupCount === 0"
          >
            导出数据
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
      </div>

      <!-- 问卷答题卡组件 - 显示统计柱状图 -->
      <div class="answer-display-section">
        <QuestionnaireAnswerCard />
      </div>
    </div>

    <!-- 测试工具对话框 -->
    <el-dialog 
      v-model="showTestDialog" 
      title="测试工具 - 模拟问卷提交"
      width="600px"
    >
      <div class="test-form">
        <el-form :model="testForm" label-width="100px">
          <el-form-item label="小组号">
            <el-input-number v-model="testForm.groupNo" :min="1" :max="25" />
          </el-form-item>
          <el-form-item label="学号">
            <el-input-number v-model="testForm.studentNo" :min="1" :max="99" />
          </el-form-item>
          <el-form-item label="学生角色">
            <el-radio-group v-model="testForm.studentRole">
              <el-radio value="operator">操作员</el-radio>
              <el-radio value="member">成员</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>

        <div class="test-info">
          <el-alert type="info" :closable="false">
            点击"添加测试数据"将模拟该学生提交完整问卷（随机生成答案）
          </el-alert>
        </div>
      </div>

      <template #footer>
        <el-button @click="showTestDialog = false">取消</el-button>
        <el-button type="primary" @click="addTestData">添加测试数据</el-button>
        <el-button type="success" @click="addBatchTestData">批量添加(5人)</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { useActivity, type QuestionnaireAnswer, type QuestionOption } from '@/store/activity'
import QuestionnaireAnswerCard from './answer.vue'
// @ts-ignore
import * as XLSX from 'xlsx'

const activity = useActivity()

// 测试对话框
const showTestDialog = ref(false)
const testForm = ref({
  groupNo: 1,
  studentNo: 1,
  studentRole: 'operator' as 'operator' | 'member'
})

// 已提交学生数
const submittedGroupCount = computed(() => {
  return Object.keys(activity.ac4_allQuestionnaireAnswer).length
})

// 完成率（假设总共24个学生：6组*4人）
const completionRate = computed(() => {
  return Math.round((submittedGroupCount.value / 24) * 100)
})

// 添加测试数据
function addTestData() {
  const { groupNo, studentNo, studentRole } = testForm.value
  const studentId = `${groupNo}-${studentNo}`
  
  // 检查是否已存在
  if (activity.ac4_allQuestionnaireAnswer[studentId]) {
    // ElMessage.warning(`学生 ${studentId} 已存在，将覆盖原数据`)
  }
  
  // 生成测试问卷（基于 questionnaire）
  const testQuestions: QuestionOption[] = activity.questionnaire.questions.map(q => {
    const question = { ...q }
    
    // 随机生成答案
    if (q.type === 'fill') {
      question.answer = `测试答案-${Math.random().toString(36).substring(7)}`
    } else if (q.type === 'single' && q.options) {
      const randomIdx = Math.floor(Math.random() * q.options.length)
      question.answer = String.fromCharCode(65 + randomIdx)
    } else if (q.type === 'multiple' && q.options) {
      const count = Math.floor(Math.random() * q.options.length) + 1
      const selected: string[] = []
      for (let i = 0; i < count; i++) {
        const randomIdx = Math.floor(Math.random() * q.options.length)
        const option = String.fromCharCode(65 + randomIdx)
        if (!selected.includes(option)) {
          selected.push(option)
        }
      }
      question.answer = selected
    }
    
    return question
  })
  
  // 添加到 store
  const questionnaireAnswer: QuestionnaireAnswer = {
    groupNo: String(groupNo),
    studentNo: String(studentNo),
    studentRole: studentRole,
    questions: testQuestions,
    submittedAt: Date.now()
  }
  
  activity.ac4_allQuestionnaireAnswer[studentId] = questionnaireAnswer
  
  // ElMessage.success(`成功添加测试数据：第${groupNo}组-${studentNo}号`)
  showTestDialog.value = false
}

// 批量添加测试数据
function addBatchTestData() {
  const baseGroup = testForm.value.groupNo
  
  for (let i = 0; i < 5; i++) {
    const studentNo = i + 1
    const studentId = `${baseGroup}-${studentNo}`
    
    const testQuestions: QuestionOption[] = activity.questionnaire.questions.map(q => {
      const question = { ...q }
      
      if (q.type === 'fill') {
        question.answer = `测试答案${i + 1}-${Math.random().toString(36).substring(7)}`
      } else if (q.type === 'single' && q.options) {
        const randomIdx = Math.floor(Math.random() * q.options.length)
        question.answer = String.fromCharCode(65 + randomIdx)
      } else if (q.type === 'multiple' && q.options) {
        const count = Math.floor(Math.random() * q.options.length) + 1
        const selected: string[] = []
        for (let j = 0; j < count; j++) {
          const randomIdx = Math.floor(Math.random() * q.options.length)
          const option = String.fromCharCode(65 + randomIdx)
          if (!selected.includes(option)) {
            selected.push(option)
          }
        }
        question.answer = selected
      }
      
      return question
    })
    
    const questionnaireAnswer: QuestionnaireAnswer = {
      groupNo: String(baseGroup),
      studentNo: String(studentNo),
      studentRole: i === 0 ? 'operator' : 'member',
      questions: testQuestions,
      submittedAt: Date.now() - i * 1000
    }
    
    activity.ac4_allQuestionnaireAnswer[studentId] = questionnaireAnswer
  }
  
  // ElMessage.success(`成功批量添加5个学生的测试数据（第${baseGroup}组）`)
  showTestDialog.value = false
}

// 导出所有答题
function exportAllAnswers() {
  if (submittedGroupCount.value === 0) return
  
  try {
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // ==================== 工作表1：答题详情 ====================
    const detailData: any[][] = []
    
    // 标题行
    detailData.push([activity.questionnaire.title])
    detailData.push([activity.questionnaire.description])
    detailData.push([]) // 空行
    detailData.push([`导出时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`])
    detailData.push([`已提交学生数：${submittedGroupCount.value} / 24`])
    detailData.push([`完成率：${completionRate.value}%`])
    detailData.push([]) // 空行
    
    // 表头行 - 多选题按选项展开
    const headers = ['小组号', '学号', '角色', '提交时间']
    const headerMapping: Array<{ questionIdx: number, optionIdx?: number }> = []
    
    activity.questionnaire.questions.forEach((q, idx) => {
      if (q.type === 'multiple' && q.options) {
        // 多选题：每个选项占一列
        q.options.forEach((option, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx)
          headers.push(`题${idx + 1}-${letter}：${option}`)
          headerMapping.push({ questionIdx: idx, optionIdx: optIdx })
        })
      } else {
        // 单选题和填空题：一列
        headers.push(`题${idx + 1}：${q.title}`)
        headerMapping.push({ questionIdx: idx })
      }
    })
    detailData.push(headers)
    
    // 按学生ID排序
    const sortedAnswers = Object.entries(activity.ac4_allQuestionnaireAnswer)
      .sort((a, b) => {
        const [groupA, noA] = a[0].split('-').map(Number)
        const [groupB, noB] = b[0].split('-').map(Number)
        return groupA !== groupB ? groupA - groupB : noA - noB
      })
    
    // 数据行
    sortedAnswers.forEach(([, answer]) => {
      const row: any[] = [
        `第${answer.groupNo}组`,
        answer.studentNo,
        answer.studentRole === 'operator' ? '操作员' : '记录员',
        new Date(answer.submittedAt).toLocaleString('zh-CN', { hour12: false })
      ]
      
      // 根据headerMapping填充每一列
      headerMapping.forEach(({ questionIdx, optionIdx }) => {
        const question = answer.questions[questionIdx]
        
        if (optionIdx !== undefined) {
          // 多选题的某个选项列
          const letter = String.fromCharCode(65 + optionIdx)
          let isSelected = false
          
          if (question?.answer) {
            if (Array.isArray(question.answer)) {
              isSelected = question.answer.includes(letter)
            } else if (typeof question.answer === 'string') {
              const letters = question.answer.split('、').filter(l => l && l.trim())
              isSelected = letters.includes(letter)
            }
          }
          
          row.push(isSelected ? '√' : '×')
        } else {
          // 单选题或填空题
          let answerText = ''
          
          if (question?.type === 'fill') {
            answerText = question.answer || '未填写'
          } else if (question?.type === 'single') {
            // 单选题：显示选项字母和内容
            if (question.answer && question.options) {
              const idx = question.answer.charCodeAt(0) - 65
              answerText = `${question.answer}. ${question.options[idx] || ''}`
            } else {
              answerText = '未选择'
            }
          }
          
          row.push(answerText)
        }
      })
      
      detailData.push(row)
    })
    
    const ws1 = XLSX.utils.aoa_to_sheet(detailData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 },  // 小组号
      { wch: 8 },   // 学号
      { wch: 10 },  // 角色
      { wch: 20 },  // 提交时间
    ]
    
    // 根据题目类型设置列宽
    activity.questionnaire.questions.forEach((q) => {
      if (q.type === 'multiple' && q.options) {
        // 多选题：每个选项列宽度为25（展示完整选项内容）
        q.options.forEach(() => {
          colWidths.push({ wch: 25 })
        })
      } else {
        // 单选题和填空题：列宽度为30
        colWidths.push({ wch: 30 })
      }
    })
    ws1['!cols'] = colWidths
    
    // 合并标题和描述单元格
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // 标题
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // 描述
    ]
    
    XLSX.utils.book_append_sheet(wb, ws1, '答题详情')
    
    // ==================== 工作表2：统计分析 ====================
    const statsData: any[][] = []
    
    statsData.push(['问卷统计分析'])
    statsData.push([]) // 空行
    statsData.push(['基本信息'])
    statsData.push(['问卷标题', activity.questionnaire.title])
    statsData.push(['问卷描述', activity.questionnaire.description])
    statsData.push(['导出时间', new Date().toLocaleString('zh-CN', { hour12: false })])
    statsData.push(['已提交人数', submittedGroupCount.value])
    statsData.push(['总人数', 24])
    statsData.push(['完成率', `${completionRate.value}%`])
    statsData.push([]) // 空行
    
    // 每道题的统计
    statsData.push(['题目统计'])
    statsData.push([]) // 空行
    
    activity.questionnaire.questions.forEach((question, qIdx) => {
      statsData.push([`题目 ${qIdx + 1}`, question.title])
      statsData.push(['题目类型', question.type === 'fill' ? '填空题' : question.type === 'single' ? '单选题' : '多选题'])
      
      if (question.type === 'fill') {
        // 填空题：列出所有答案
        statsData.push(['答案列表', ''])
        sortedAnswers.forEach(([, answer]) => {
          const ans = answer.questions[qIdx]?.answer || '未填写'
          statsData.push(['', ans])
        })
      } else if (question.options) {
        // 选择题：统计每个选项的选择人数
        statsData.push(['选项', '内容', '选择人数', '占比'])
        
        question.options.forEach((option, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx)
          let count = 0
          
          sortedAnswers.forEach(([, answer]) => {
            const ans = answer.questions[qIdx]
            if (question.type === 'single') {
              if (ans?.answer === letter) count++
            } else if (question.type === 'multiple') {
              // 支持数组格式（如 ['A', 'B']）或字符串格式（如 'A、B'）
              if (Array.isArray(ans?.answer)) {
                if (ans.answer.includes(letter)) count++
              } else if (typeof ans?.answer === 'string') {
                const letters = ans.answer.split('、').filter(l => l && l.trim())
                if (letters.includes(letter)) count++
              }
            }
          })
          
          const percentage = submittedGroupCount.value > 0 
            ? ((count / submittedGroupCount.value) * 100).toFixed(1)
            : '0.0'
          
          statsData.push([letter, option, count, `${percentage}%`])
        })
      }
      
      statsData.push([]) // 空行
    })
    
    const ws2 = XLSX.utils.aoa_to_sheet(statsData)
    
    // 设置列宽
    ws2['!cols'] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 12 },
      { wch: 10 }
    ]
    
    XLSX.utils.book_append_sheet(wb, ws2, '统计分析')
    
    // ==================== 导出文件 ====================
    const fileName = `问卷答题统计_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}_${new Date().toLocaleTimeString('zh-CN', { hour12: false }).replace(/:/g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    // ElMessage.success(`已导出 ${submittedGroupCount.value} 名学生的答题到 Excel 文件`)
  } catch (error: any) {
    console.error('[Activity4] 导出失败:', error)
    // ElMessage.error(`导出失败: ${error.message}`)
  }
}

// 清空数据
function clearData() {
  ElMessageBox.confirm(
    '确定要清空所有问卷答题数据吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      activity.ac4_allQuestionnaireAnswer = {}
      // ElMessage.success('数据已清空')
    })
    .catch(() => {
      // 用户取消
    })
}
</script>

<style scoped>
.page {
  padding: 0;
  width: 1240px;
  margin: 0 auto;
  background: #F5F5F0;
}

.stats-section {
  padding: 40px 0;
}

/* 活动标题 */
.activity-header {
  text-align: center;
  margin-bottom: 32px;
}

.activity-title {
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 操控按钮区域 */
.action-section {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.stats-info {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0ea5e9;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 问卷答题展示区域 */
.answer-display-section {
  background: white;
  border-radius: 16px;
  padding: 28px 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 测试工具对话框 */
.test-form {
  padding: 10px 0;
}

.test-info {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 1240px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
}

@media (max-width: 1024px) {
  .action-section {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-info {
    justify-content: space-around;
  }

  .action-buttons {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 28px;
  }

  .stats-info {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .answer-display-section {
    padding: 20px;
  }
}
</style>

