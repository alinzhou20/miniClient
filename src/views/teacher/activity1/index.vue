<template>
  <div class="page">
    <!-- 结果展示区域 -->
    <div class="stats-section">
      <!-- 操作按钮区域 -->
      <div class="action-bar">
        <el-button 
          type="primary" 
          size="large"
          @click="downloadAllPhotos"
          :disabled="ripePhotos.length === 0 && unripePhotos.length === 0"
        >
          📦 打包下载
        </el-button>
      </div>

      <!-- 生熟分类区域 -->
      <div class="classification-container">
        <!-- 生柿子区域 -->
        <div class="photos-section unripe-section">
          <div class="section-header">
            <h3 class="section-title">🟢 生柿子</h3>
            <div class="photos-count">{{ unripePhotos.length }} 张</div>
          </div>
          <div class="photos-grid">
            <div v-for="photo in unripePhotos" :key="photo.key" class="photo-card" @click="previewImage(photo.src, photo.label)">
              <img :src="photo.src" :alt="photo.label" />
              <div class="photo-info">{{ photo.label }}</div>
              <div class="photo-overlay">
                <span class="preview-icon">🔍</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 熟柿子区域 -->
        <div class="photos-section ripe-section">
          <div class="section-header">
            <h3 class="section-title">🟠 熟柿子</h3>
            <div class="photos-count">{{ ripePhotos.length }} 张</div>
          </div>
          <div class="photos-grid">
            <div v-for="photo in ripePhotos" :key="photo.key" class="photo-card" @click="previewImage(photo.src, photo.label)">
              <img :src="photo.src" :alt="photo.label" />
              <div class="photo-info">{{ photo.label }}</div>
              <div class="photo-overlay">
                <span class="preview-icon">🔍</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="80%"
      align-center
      destroy-on-close
    >
      <div class="preview-container">
        <img :src="previewSrc" :alt="previewTitle" class="preview-image" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTeaAc1 } from '@/store/activity/activity1'

const ac1 = useTeaAc1()

// 图片预览状态
const previewVisible = ref(false)
const previewSrc = ref('')
const previewTitle = ref('')

// 打开图片预览
const previewImage = (src: string, title: string) => {
  previewSrc.value = src
  previewTitle.value = title
  previewVisible.value = true
}

// 打包下载所有照片
const downloadAllPhotos = async () => {
  try {
    // 动态导入 JSZip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    // 创建样本文件夹
    const sampleFolder = zip.folder('样本')
    if (!sampleFolder) return
    
    // 创建生柿子文件夹
    const unripeFolder = sampleFolder.folder('生样本')
    if (unripeFolder) {
      unripePhotos.value.forEach((photo, index) => {
        // 提取 base64 数据
        const base64Data = photo.src.split(',')[1]
        unripeFolder.file(`${index + 1}.jpg`, base64Data, { base64: true })
      })
    }
    
    // 创建熟柿子文件夹
    const ripeFolder = sampleFolder.folder('熟样本')
    if (ripeFolder) {
      ripePhotos.value.forEach((photo, index) => {
        // 提取 base64 数据
        const base64Data = photo.src.split(',')[1]
        ripeFolder.file(`${index + 1}.jpg`, base64Data, { base64: true })
      })
    }
    
    // 生成压缩包
    const content = await zip.generateAsync({ type: 'blob' })
    
    // 创建下载链接
    const url = URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = url
    link.download = `柿子样本_${new Date().toLocaleDateString()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log(`打包完成：生柿子 ${unripePhotos.value.length} 张，熟柿子 ${ripePhotos.value.length} 张`)
  } catch (error) {
    console.error('打包下载失败:', error)
  }
}

// 生柿子照片
const unripePhotos = computed(() => {
  if (!ac1.stuPhoto) return []
  
  const photos: Array<{ key: string; src: string; label: string }> = []
  
  Object.entries(ac1.stuPhoto).forEach(([groupNo, data]) => {
    if (data.photo1 && data.label1 === '生') {
      photos.push({
        key: `${groupNo}-1`,
        src: data.photo1,
        label: `第${groupNo}组-样本1`
      })
    }
    if (data.photo2 && data.label2 === '生') {
      photos.push({
        key: `${groupNo}-2`,
        src: data.photo2,
        label: `第${groupNo}组-样本2`
      })
    }
  })
  
  return photos
})

// 熟柿子照片
const ripePhotos = computed(() => {
  if (!ac1.stuPhoto) return []
  
  const photos: Array<{ key: string; src: string; label: string }> = []
  
  Object.entries(ac1.stuPhoto).forEach(([groupNo, data]) => {
    if (data.photo1 && data.label1 === '熟') {
      photos.push({
        key: `${groupNo}-1`,
        src: data.photo1,
        label: `第${groupNo}组-样本1`
      })
    }
    if (data.photo2 && data.label2 === '熟') {
      photos.push({
        key: `${groupNo}-2`,
        src: data.photo2,
        label: `第${groupNo}组-样本2`
      })
    }
  })
  
  return photos
})


</script>

<style scoped>
.page {
  padding: 0;
  max-width: 1480px;
  margin: 0 auto;
  background: #F5F5F0;
}

.stats-section {
  padding: 20px 0;
}

/* 操作按钮区域 */
.action-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  padding: 0 20px;
}

/* 分类容器 */
.classification-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* 图片展示区域 */
.photos-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.unclassified-section {
  margin-bottom: 24px;
  border: 3px dashed #9ca3af;
}

.unripe-section {
  border-left: 4px solid #10b981;
}

.ripe-section {
  border-left: 4px solid #f59e0b;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.photos-count {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 12px;
  border-radius: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.photo-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
  aspect-ratio: 16/9;
  cursor: pointer;
}

.photo-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  border-color: #3b82f6;
  z-index: 10;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-info {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(67, 137, 248, 0.9);
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
}

/* 悬停遮罩层 */
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

/* 预览容器 */
.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  max-height: 80vh;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  display: block;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .page {
    width: 100%;
    padding: 0 16px;
  }
  
  .classification-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  
  .preview-icon {
    font-size: 24px;
  }
}

@media (min-width: 1440px) {
  .photos-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}
</style>
