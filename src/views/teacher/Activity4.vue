<template>
  <div class="page">
    <!-- 活动标题 -->
    <div class="activity-header">
      <h2 class="activity-title">📷 Activity 4: 摄像头拍照活动</h2>
      <div class="activity-description">实时查看学生拍照提交情况</div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-cards">
        <div class="stats-card">
          <div class="stats-icon">👥</div>
          <div class="stats-content">
            <div class="stats-number">{{ completedGroups.size }}</div>
            <div class="stats-label">已提交小组</div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-icon">📸</div>
          <div class="stats-content">
            <div class="stats-number">{{ totalPhotos }}</div>
            <div class="stats-label">收到照片</div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-icon">⏰</div>
          <div class="stats-content">
            <div class="stats-number">{{ latestPhotoTime }}</div>
            <div class="stats-label">最新提交</div>
          </div>
        </div>
      </div>
      
      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-label">
          <span>小组完成进度</span>
          <span class="progress-count">{{ completedGroups.size }}/25 小组</span>
        </div>
        <el-progress 
          :percentage="progressPercentage" 
          :stroke-width="8"
          :color="progressColor"
        />
      </div>
    </div>

    <!-- 照片展示区域 -->
    <div class="photos-section">
      <div class="section-controls">
        <div class="controls-left">
          <h3 class="section-title">学生拍照记录</h3>
        </div>
        <div class="controls-right">
          <el-select v-model="selectedGroup" placeholder="筛选小组" size="small" style="width: 120px;" clearable>
            <el-option 
              v-for="group in availableGroups" 
              :key="group" 
              :label="`第${group}组`" 
              :value="group"
            />
          </el-select>
          <el-button type="primary" size="small" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 照片网格 -->
      <div class="photos-grid">
        <div 
          v-for="photo in filteredPhotos" 
          :key="photo.key"
          class="photo-card"
          @click="openPhotoDetail(photo)"
        >
          <div class="photo-header">
            <div class="student-info">
              <span class="group-badge">第{{ photo.groupNo }}组</span>
              <span class="student-badge">{{ photo.studentNo }}号</span>
            </div>
            <div class="photo-time">{{ formatTime(photo.timestamp) }}</div>
          </div>
          
          <div class="photo-content">
            <img 
              :src="photo.photoData" 
              :alt="`第${photo.groupNo}组 ${photo.studentNo}号拍照`"
              class="photo-image"
              @error="onImageError"
            />
          </div>
          
          <div class="photo-actions">
            <el-button size="small" type="primary" @click.stop="downloadPhoto(photo)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button size="small" @click.stop="openPhotoDetail(photo)">
              <el-icon><ZoomIn /></el-icon>
              查看
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredPhotos.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Picture /></el-icon>
          <p v-if="photos.length === 0">暂无学生提交照片</p>
          <p v-else>当前筛选条件下没有照片</p>
        </div>
      </div>
    </div>

    <!-- 照片详情对话框 -->
    <el-dialog
      v-model="photoDetailVisible"
      :title="`第${currentPhoto?.groupNo}组 ${currentPhoto?.studentNo}号 - 拍照详情`"
      width="80%"
      :before-close="closePhotoDetail"
    >
      <div v-if="currentPhoto" class="photo-detail">
        <div class="detail-info">
          <div class="info-item">
            <strong>提交时间：</strong>{{ formatDetailTime(currentPhoto.timestamp) }}
          </div>
          <div class="info-item">
            <strong>照片ID：</strong>{{ currentPhoto.photoId }}
          </div>
        </div>
        
        <div class="detail-image-container">
          <img 
            :src="currentPhoto.photoData" 
            :alt="`第${currentPhoto.groupNo}组拍照`"
            class="detail-image"
          />
        </div>
        
        <div class="detail-actions">
          <el-button type="primary" @click="downloadPhoto(currentPhoto)">
            <el-icon><Download /></el-icon>
            下载原图
          </el-button>
          <el-button @click="closePhotoDetail">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { socketService } from '@/services/socket'
import { ElMessage } from 'element-plus'
import { Refresh, Download, ZoomIn, Picture } from '@element-plus/icons-vue'

// 照片数据类型定义
interface PhotoSubmission {
  key: string
  groupNo: string
  studentNo: string
  photoId: string
  photoData: string
  timestamp: number
  at: number
}

// 状态管理
const photos = ref<PhotoSubmission[]>([])
const completedGroups = reactive(new Set<string>())
const selectedGroup = ref<string>('')
const photoDetailVisible = ref(false)
const currentPhoto = ref<PhotoSubmission | null>(null)

// 计算属性
const totalPhotos = computed(() => photos.value.length)

const progressPercentage = computed(() => {
  return Math.round((completedGroups.size / 25) * 100)
})

const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
})

const latestPhotoTime = computed(() => {
  if (photos.value.length === 0) return '-'
  const latest = Math.max(...photos.value.map(p => p.timestamp))
  return formatTime(latest)
})

const availableGroups = computed(() => {
  const groups = new Set(photos.value.map(p => p.groupNo))
  return Array.from(groups).sort((a, b) => parseInt(a) - parseInt(b))
})

const filteredPhotos = computed(() => {
  let result = photos.value
  
  if (selectedGroup.value) {
    result = result.filter(p => p.groupNo === selectedGroup.value)
  }
  
  // 按时间倒序排列
  return result.sort((a, b) => b.timestamp - a.timestamp)
})

// 格式化时间
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

// 处理收到的照片数据
const onPhotoSubmit = (payload: any) => {
  if (!payload || String(payload.type || '') !== 'activity4_photo') return
  
  const from = payload.from || {}
  const data = payload.data || {}
  const groupNo = String(from.groupNo ?? '').trim()
  const studentNo = String(from.studentNo ?? '').trim()
  
  if (!groupNo || !studentNo || !data.photoData) return
  
  const photoSubmission: PhotoSubmission = {
    key: `${groupNo}-${studentNo}-${data.photoId}`,
    groupNo,
    studentNo,
    photoId: data.photoId || `photo_${Date.now()}`,
    photoData: data.photoData,
    timestamp: data.timestamp || Date.now(),
    at: payload.at || Date.now()
  }
  
  // 检查是否已存在相同的照片
  const existingIndex = photos.value.findIndex(p => p.key === photoSubmission.key)
  if (existingIndex >= 0) {
    // 更新现有照片
    photos.value[existingIndex] = photoSubmission
  } else {
    // 添加新照片
    photos.value.push(photoSubmission)
  }
  
  // 更新已完成组数统计
  completedGroups.add(groupNo)
  
  // 保存到本地存储
  saveToLocalStorage()
  
  console.log(`[Activity4 Teacher] 收到新照片: 第${groupNo}组-${studentNo}号`)
  ElMessage.success(`收到第${groupNo}组的新照片`)
}

// 打开照片详情
const openPhotoDetail = (photo: PhotoSubmission) => {
  currentPhoto.value = photo
  photoDetailVisible.value = true
}

// 关闭照片详情
const closePhotoDetail = () => {
  photoDetailVisible.value = false
  currentPhoto.value = null
}

// 下载照片
const downloadPhoto = (photo: PhotoSubmission) => {
  try {
    const link = document.createElement('a')
    link.href = photo.photoData
    link.download = `第${photo.groupNo}组_${photo.studentNo}号_${photo.photoId}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('照片下载成功')
  } catch (error) {
    console.error('下载照片失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}

// 刷新数据
const refreshData = () => {
  ElMessage.info('数据已刷新')
}

// 图片加载失败处理
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  console.warn('图片加载失败')
}

// 本地存储
const saveToLocalStorage = () => {
  try {
    const data = {
      photos: photos.value,
      completedGroups: Array.from(completedGroups),
      timestamp: Date.now()
    }
    localStorage.setItem('teacher_activity4_photos', JSON.stringify(data))
  } catch (error) {
    console.warn('保存Activity4数据到本地存储失败:', error)
  }
}

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('teacher_activity4_photos')
    if (stored) {
      const data = JSON.parse(stored)
      photos.value = data.photos || []
      completedGroups.clear()
      if (Array.isArray(data.completedGroups)) {
        data.completedGroups.forEach(group => completedGroups.add(group))
      }
      console.log('Activity4 教师端数据已从本地存储恢复')
    }
  } catch (error) {
    console.warn('从本地存储恢复Activity4数据失败:', error)
  }
}

// 组件生命周期
onMounted(() => {
  // 恢复本地存储数据
  loadFromLocalStorage()
  
  // 监听socket事件
  socketService.on('submit', onPhotoSubmit)
  
  console.log('[Activity4 Teacher] 开始监听学生照片提交')
})

onUnmounted(() => {
  socketService.off('submit', onPhotoSubmit)
})
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 活动标题 */
.activity-header {
  margin-bottom: 24px;
}

.activity-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.activity-description {
  color: #6b7280;
  font-size: 14px;
}

/* 统计信息 */
.stats-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stats-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* 进度条 */
.progress-section {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #374151;
}

.progress-count {
  font-weight: 600;
  color: #1f2937;
}

/* 照片展示区域 */
.photos-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.section-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.controls-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 照片网格 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.photo-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.photo-header {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.photo-time {
  font-size: 12px;
  color: #6b7280;
}

.photo-content {
  padding: 0;
}

.photo-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.photo-actions {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
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

/* 照片详情对话框 */
.photo-detail {
  text-align: center;
}

.detail-info {
  margin-bottom: 20px;
  text-align: left;
}

.info-item {
  margin-bottom: 8px;
  color: #374151;
}

.detail-image-container {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.detail-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page {
    padding: 16px;
  }
  
  .section-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .controls-right {
    justify-content: space-between;
  }
  
  .photos-grid {
    grid-template-columns: 1fr;
  }
  
  .photo-image {
    height: 150px;
  }
}
</style>
