<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useActivity, useSocket, useStatus } from '@/store'
import type { 
  Activity1Result, 
  Activity2_1_selectResult, 
  Activity2_2_designResult, 
  Activity4Result,
  QuestionnaireAnswer,
  QuestionOption
} from '@/store/activity'

const socket = useSocket()
const activity = useActivity()
const status = useStatus()

// 辅助函数：计算评分总和
function calculateTotalScore(rating: { score: number }[]): number {
  return rating.reduce((sum, r) => sum + r.score, 0)
}

// 辅助函数：更新小组总分
function updateGroupTotalScore(groupNo: string) {
  const group = status.groupStatus[groupNo]
  if (group) {
    const newTotal = 
      group.scores.activity1 + 
      group.scores.activity2_1 + 
      group.scores.activity2_2 + 
      group.scores.activity3 + 
      group.scores.activity4
    
    group.totalScore = newTotal
  }
}

// 监听学生提交
function onStudentSubmit(payload: any) {
  if (!payload || !payload.messageType) return
  
  const { messageType, data, from } = payload
  
  // 生成学生唯一标识
  const groupNo = from?.groupNo
  const studentId = from?.studentNo
  
  try {
    // 根据不同的消息类型处理
    switch (messageType) {
      case 'student_login':
        // 学生登录通知（只关心操作员）
        if (data && from) {
          const { groupNo, studentNo, studentRole, loginTime } = data
          
          // 更新小组状态（只关心操作员）
          if (studentRole === 'operator' && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].isOnline = true
            status.groupStatus[groupNo].operatorNo = studentNo
            status.groupStatus[groupNo].loginTime = loginTime
          }
        }
        break
        
      case 'student_logout':
        // 学生离线通知（只关心操作员）
        if (data && from) {
          const { groupNo, studentRole } = data
          
          // 更新小组状态（只关心操作员）
          if (studentRole === 'operator' && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].isOnline = false
          }
          
        }
        break
        
      case 'activity1_submit':
        // Activity 1 - 观点交锋
        if (data && activity.ac1_allResult) {
          activity.ac1_allResult[groupNo] = {
            viewpoint: data.viewpoint,
            point: data.point,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity1Result
          
          // 更新小组得分
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity1 = calculateTotalScore(data.rating || [])
            updateGroupTotalScore(groupNo)
          }          
        }
        break
        
      case 'activity2_1_submit':
        // Activity 2.1 - 题目选择
        if (data && activity.ac2_1_allSelectResult) {
          activity.ac2_1_allSelectResult[groupNo] = {
            selectedDurationQuestion: data.selectedDurationQuestion,
            selectedImpactQuestion: data.selectedImpactQuestion,
            durationReason: data.durationReason,
            impactReason: data.impactReason,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity2_1_selectResult
          
          // 更新小组得分
          let score = 0
          if (groupNo && status.groupStatus[groupNo]) {
            score = calculateTotalScore(data.rating || [])
            status.groupStatus[groupNo].scores.activity2_1 = score
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${from?.groupNo}组 提交了活动二-题目选择 (得分: ${score}/2)`)
        }
        break
        
      case 'activity2_2_submit':
        // Activity 2.2 - 题目设计
        if (data && activity.ac2_2_allDesignResult) {
          activity.ac2_2_allDesignResult[groupNo] = {
            designQuestion: data.designQuestion,
            rating: data.rating,
            great: data.great || 0,
            submittedAt: data.submittedAt
          } as Activity2_2_designResult
          
          // 更新小组得分
          let score = 0
          if (groupNo && status.groupStatus[groupNo]) {
            score = calculateTotalScore(data.rating || [])
            status.groupStatus[groupNo].scores.activity2_2 = score
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`第${groupNo}组 提交了活动二-题目设计 (得分: ${score}/3)`)
        }
        break
        
      case 'activity2_2_like_submit':
        // Activity 2.2 - 点赞
        if (data && activity.ac2_2_allDesignResult) {
          const targetGroupNo = data.groupNo
          const groupResult = activity.ac2_2_allDesignResult[targetGroupNo]
          
          if (groupResult) {
            groupResult.great = data.great || 0
            // console.log(`[Teacher Listener] 第${targetGroupNo}组点赞数更新为 ${groupResult.great}`)
          }
        }
        break
        
      case 'questionnaire_submit':
        // Activity 3 - 问卷填写（无评分，提交即得1分）
        if (data && data.questions && activity.ac3_allQuestionnaireAnswer) {
          // 验证问卷数据
          const questions = data.questions as QuestionOption[]
          
          // 存储问卷答案
          const questionnaireAnswer: QuestionnaireAnswer = {
            groupNo: groupNo,
            studentNo: studentId,
            studentRole: from.studentRole,
            questions: questions,
            submittedAt: data.submittedAt || Date.now()
          }
          
          activity.ac3_allQuestionnaireAnswer[studentId] = questionnaireAnswer

          
          // 更新小组得分（问卷提交即得1分）  
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity3 = 1
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${studentInfo} 提交了问卷`)
        }
        break
        
      case 'activity4_submit':
        // Activity 4 - 数据获取方式分类
        if (data && activity.ac4_allResult) {
          activity.ac4_allResult[studentId] = {
            selections: data.selections,
            hasSubmittedAll: data.hasSubmittedAll || true,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity4Result
          
          // 更新小组得分
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity4 = calculateTotalScore(data.rating || [])
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${studentInfo} 提交了活动四`)
        }
        break
        
      default:
        // console.log('[Teacher Listener] 未知的消息类型:', messageType)
    }
  } catch (error) {
    console.error('[Teacher Listener] 处理学生提交失败:', error)
    // ElMessage.error(`处理 ${studentInfo} 的提交失败`)
  }
}

onMounted(() => {
  // console.log('[Teacher Listener] 开始监听学生提交')
  socket.on('submit', onStudentSubmit)
})

onBeforeUnmount(() => {
  // console.log('[Teacher Listener] 停止监听学生提交')
  socket.off('submit', onStudentSubmit)
})
</script>

