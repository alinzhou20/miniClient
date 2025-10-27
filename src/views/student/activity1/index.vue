<template>
  <div class="main-content">
    <!-- 顶部区域：自我评价 -->
    <Evaluation />
    
    <!-- 主内容区：左中右布局 -->
    <div class="content-layout">
      <!-- 左侧：拍摄采集 -->
      <div class="left-panel">
        <CapturePanel 
          :photo-count="photos.length"
          @photo-taken="handlePhotoTaken" 
        />
      </div>

      <!-- 中间：图片预览 -->
      <div class="middle-panel">
        <PreviewPanel 
          :photos="photos" 
          @delete-photo="handleDeletePhoto"
          @update-photo="handleUpdatePhoto"
          @start-drag="handleStartDrag"
        />
      </div>

      <!-- 右侧：分类文件夹 -->
      <div class="right-panel">
        <CategoryPanel 
          :photos="photos"
          @label-photo="handleLabelPhoto"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStuStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import { ElMessage } from 'element-plus'
import { EventType } from '@/type/event'
import CapturePanel from './CapturePanel.vue'
import PreviewPanel from './PreviewPanel.vue'
import CategoryPanel from './CategoryPanel.vue'
import Evaluation from '../../components/evaluation.vue'

const status = useStuStatus()
const socket = useSocket()

// 照片列表
export interface Photo {
  url: string
  originalUrl?: string  // 保存原图URL，用于重新裁剪
  label?: string
}

const photos = ref<Photo[]>([])
const draggingPhotoIndex = ref<number | null>(null)

// 处理拍摄照片
const handlePhotoTaken = (photoUrl: string) => {
  // 限制最多2张照片
  if (photos.value.length >= 2) {
    ElMessage.warning('最多只能拍摄2张照片')
    return
  }
  
  photos.value.push({
    url: photoUrl,
    originalUrl: photoUrl,  // 保存原图URL，用于重新裁剪
    label: undefined
  })
  
  ElMessage.success(`照片 ${String(photos.value.length).padStart(2, '0')} 已添加`)
  
  // 如果已经拍摄了2张照片，给第一个评价标准打1分并提交
  if (photos.value.length === 2 && status.activity1Score) {
    status.activity1Score[1] = 1
    submitScoresToTeacher()
  }
}

// 处理更新照片（裁剪后）
const handleUpdatePhoto = ({ index, url }: { index: number, url: string }) => {
  if (photos.value[index]) {
    photos.value[index].url = url
    // 保留 originalUrl，不更新，这样可以重新从原图裁剪
  }
}

// 处理删除照片
const handleDeletePhoto = (index: number) => {
  photos.value.splice(index, 1)
  
  // 更新评分
  if (status.activity1Score) {
    // 根据剩余照片数量更新第一个标准的分数
    if (photos.value.length >= 2) {
      status.activity1Score[1] = 1  // 还有2张，保持分数
    } else {
      status.activity1Score[1] = 0  // 少于2张，清除分数
    }
    // 清空分类相关的评分
    status.activity1Score[2] = 0
  }
  
  // 提交更新
  submitLabels()
  submitScoresToTeacher()
}

// 处理开始拖拽照片
const handleStartDrag = (index: number) => {
  draggingPhotoIndex.value = index
}

// 处理给照片打标签
const handleLabelPhoto = ({ index, label }: { index: number, label: string }) => {
  if (photos.value[index]) {
    photos.value[index].label = label
    
    ElMessage.success(`照片 ${String(index + 1).padStart(2, '0')} 已标记为：${label}`)
    
    // 自动提交到教师端
    submitLabels()
  }
}

// 提交评分给教师端
const submitScoresToTeacher = () => {
  if (!status.user?.studentNo) return
  
  // 计算总分并发送评分消息
  const activityScores = {
    activity1: Object.values(status.activity1Score).reduce((sum, score) => sum + score, 0),
    activity2: Object.values(status.activity2Score).reduce((sum, score) => sum + score, 0),
    activity3: Object.values(status.activity3Score).reduce((sum, score) => sum + score, 0)
  }
  
  console.log('📊 [活动1] 提交评分:', {
    详细评分: status.activity1Score,
    总分: activityScores.activity1,
    学号: status.user.studentNo
  })
  
  socket.emit('submit', {
    eventType: EventType.SUBMIT,
    messageType: 'activity-update',
    from: {
      studentNo: status.user.studentNo!,
      groupNo: status.user.groupNo!,
      studentRole: status.user.studentRole!
    },
    data: activityScores
  })
}

// 提交标签信息给教师端
const submitLabels = () => {
  if (!status.user?.groupNo) return
  
  // 转换为教师端期望的格式：photo1, photo2, label1, label2
  const submitData: any = {
    groupNo: status.user.groupNo!,
    submittedAt: Date.now()
  }
  
  // 添加照片和标签（最多支持前2张照片）
  photos.value.forEach((photo, index) => {
    if (index < 2) {
      submitData[`photo${index + 1}`] = photo.url
      submitData[`label${index + 1}`] = photo.label || ''
    }
  })
  
  // 发送标签更新消息
  socket.emit('submit', {
    eventType: EventType.SUBMIT,
    messageType: 'activity1_label_update',
    from: {
      studentNo: status.user.studentNo!,
      groupNo: status.user.groupNo!,
      studentRole: status.user.studentRole!
    },
    data: submitData
  })
  
  // 检查是否所有照片都已打标（至少2张且都有标签）
  const allLabeled = photos.value.length >= 2 && photos.value.slice(0, 2).every(p => p.label)
  
  // 更新评分
  if (status.activity1Score) {
    if (allLabeled) {
      status.activity1Score[2] = 1  // 标准2：分类标注完成
      ElMessage.success('分类完成，已提交给教师端')
    } else {
      status.activity1Score[2] = 0  // 未完成分类
    }
  }
  
  // 提交评分给教师端
  submitScoresToTeacher()
}
</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 40px);
}

.content-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-height: 0;
  max-height: 720px; /* 固定高度：两张16:9照片的高度 + 间距 + padding */
}

.left-panel,
.middle-panel,
.right-panel {
  height: 800px; /* 固定高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .left-panel,
  .middle-panel,
  .right-panel {
    min-height: 400px;
  }
}
</style>
