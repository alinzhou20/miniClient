<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useActivity, useSocket, useStatus } from '@/store'
import type { 
  Activity1Result, 
  Activity2Result, 
  Activity3Result, 
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
      group.scores.activity2 + 
      group.scores.activity3 + 
      group.scores.activity4
    
    group.totalScore = newTotal
  }
}

// 处理学生登录
function onStudentLogin(payload: any) {
  if (!payload || payload.messageType !== 'student_login') return
  
  const { data, from } = payload
  if (!data || !from) return
  
  const { groupNo, studentNo, studentRole, loginTime } = data
  
  // 更新小组状态（只关心操作员）
  if (studentRole === 'operator' && status.groupStatus[groupNo]) {
    status.groupStatus[groupNo].isOnline = true
    status.groupStatus[groupNo].operatorNo = studentNo
    status.groupStatus[groupNo].loginTime = loginTime
  }
}

// 统一的 submit 事件处理
function handleSubmit(payload: any) {
  if (!payload || !payload.messageType) return
  
  const { messageType, data, from } = payload
  
  // 生成学生唯一标识
  const groupNo = from?.groupNo
  const studentId = from?.studentNo
  
  try {
    // 根据不同的消息类型处理
    switch (messageType) {
      case 'student_login':
        onStudentLogin(payload)
        break
        
      // case 'student_logout':
      //   onStudentLogout(payload)
      //   break
        
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
        // Activity 2 - 题目选择
        if (data && activity.ac2_allResult) {
          activity.ac2_allResult[groupNo] = {
            selectedDurationQuestion: data.selectedDurationQuestion,
            selectedImpactQuestion: data.selectedImpactQuestion,
            durationReason: data.durationReason,
            impactReason: data.impactReason,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity2Result
          
          // 更新小组得分
          let score = 0
          if (groupNo && status.groupStatus[groupNo]) {
            score = calculateTotalScore(data.rating || [])
            status.groupStatus[groupNo].scores.activity2 = score
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${from?.groupNo}组 提交了活动二-题目选择 (得分: ${score}/2)`)
        }
        break
        
      case 'activity2_2_submit':
        // Activity 3 - 题目设计
        if (data && activity.ac3_allResult) {
          activity.ac3_allResult[groupNo] = {
            designQuestion: data.designQuestion,
            rating: data.rating,
            great: data.great || 0,
            submittedAt: data.submittedAt,
            challengeLevel: data.challengeLevel || null,
            likedByGroups: data.likedByGroups || []
          } as Activity3Result
          
          // 更新小组得分
          let score = 0
          if (groupNo && status.groupStatus[groupNo]) {
            score = calculateTotalScore(data.rating || [])
            status.groupStatus[groupNo].scores.activity3 = score
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`第${groupNo}组 提交了活动三-题目设计 (得分: ${score}/2)`)
        }
        break
        
      case 'activity2_2_like_submit':
        // Activity 2.2 - 点赞
        if (data && activity.ac3_allResult) {
          const targetGroupNo = data.targetGroupNo
          const groupResult = activity.ac3_allResult[targetGroupNo]
          
          if (groupResult) {
            groupResult.great = data.great || 0
            groupResult.likedByGroups = data.likedByGroups || []
            // console.log(`[Teacher Listener] 第${targetGroupNo}组点赞数更新为 ${groupResult.great}`)
          }
        }
        break
        
      case 'questionnaire_submit':
        // Activity 4 - 问卷填写（无评分，提交即得1分）
        if (data && data.questions && activity.ac4_allQuestionnaireAnswer) {
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
          
          activity.ac4_allQuestionnaireAnswer[studentId] = questionnaireAnswer

          
          // 更新小组得分（问卷提交即得1分）  
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity4 = 1
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${studentInfo} 提交了问卷`)
        }
        break
        
      default:
        // console.log('[Teacher Listener] 未知的消息类型:', messageType)
    }
  } catch (error) {
    console.error('[Teacher Listener] 处理学生提交失败:', error)
    // ElMessage.error(`处理提交失败`)
  }
}

onMounted(() => {
  socket.on('submit', handleSubmit)
  // console.log('[Teacher Listener] 开始监听 submit 消息')
})

onBeforeUnmount(() => {
  socket.off('submit', handleSubmit)
  // console.log('[Teacher Listener] 停止监听 submit 消息')
})
</script>

