<template>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useActivity, useSocket, useStatus } from '@/store'
import { ElMessage } from 'element-plus'
import type { Activity1Result, Activity2_1_selectResult, Activity2_2_designResult, Activity4Result } from '@/store/activity'

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
    
    // console.log(`[得分更新] ${groupNo}组 总分: ${newTotal}`, {
    //   activity1: group.scores.activity1,
    //   activity2_1: group.scores.activity2_1,
    //   activity2_2: group.scores.activity2_2,
    //   activity3: group.scores.activity3,
    //   activity4: group.scores.activity4
    // })
  }
}

// 监听学生提交
function onStudentSubmit(payload: any) {
  if (!payload || !payload.messageType) return
  
  const { messageType, data, from } = payload
  
  // 生成学生唯一标识
  const studentId = from?.id || `${from?.studentNo}_${from?.groupNo}`
  const studentInfo = `${from?.groupNo}组 ${from?.studentNo}号 (${from?.studentRole || ''})`
  const groupNo = from?.groupNo
  
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
          
          const roleName = studentRole === 'operator' ? '操作员' : '记录员'
          // ElMessage.success(`${groupNo}组 ${roleName}(${studentNo}号) 已登录`)
        }
        break
        
      case 'student_logout':
        // 学生离线通知（只关心操作员）
        if (data && from) {
          const { groupNo, studentRole } = data
          // console.log('student_logout', data)
          
          // 更新小组状态（只关心操作员）
          if (studentRole === 'operator' && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].isOnline = false
          }
          
          const roleName = studentRole === 'operator' ? '操作员' : '记录员'
          // ElMessage.warning(`${groupNo}组 ${roleName} 已离线`)
        }
        break
        
      case 'activity1_submit':
        // Activity 1 - 观点交锋
        if (data && activity.ac1_allResult) {
          activity.ac1_allResult[studentId] = {
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
          
          // ElMessage.success(`${studentInfo} 提交了活动一`)
        }
        break
        
      case 'activity2_1_submit':
        // Activity 2.1 - 题目选择
        if (data && activity.ac2_1_allSelectResult) {
          activity.ac2_1_allSelectResult[studentId] = {
            selectedDurationQuestion: data.selectedDurationQuestion,
            selectedImpactQuestion: data.selectedImpactQuestion,
            durationReason: data.durationReason,
            impactReason: data.impactReason,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity2_1_selectResult
          
          // 更新小组得分
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity2_1 = calculateTotalScore(data.rating || [])
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${studentInfo} 提交了活动二(选择题目)`)
        }
        break
        
      case 'activity2_2_submit':
        // Activity 2.2 - 题目设计
        if (data && activity.ac2_2_allDesignResult) {
          activity.ac2_2_allDesignResult[studentId] = {
            designQuestion: data.designQuestion,
            rating: data.rating,
            submittedAt: data.submittedAt
          } as Activity2_2_designResult
          
          // 更新小组得分
          if (groupNo && status.groupStatus[groupNo]) {
            status.groupStatus[groupNo].scores.activity2_2 = calculateTotalScore(data.rating || [])
            updateGroupTotalScore(groupNo)
          }
          
          // ElMessage.success(`${studentInfo} 提交了活动二(设计题目)`)
        }
        break
        
      case 'questionnaire_submit':
        // Activity 3 - 问卷填写（无评分，提交即得1分）
        if (data && activity.ac3_allQuestionnaireResult) {
          activity.ac3_allQuestionnaireResult[studentId] = {
            questions: data.questions,
            submittedAt: data.submittedAt
          }
          
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

