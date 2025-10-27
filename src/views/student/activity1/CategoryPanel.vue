<template>
  <div class="category-panel">
    <div class="panel-header">
      <h3 class="panel-title">分类文件夹</h3>
    </div>

    <div class="panel-content">
      <!-- 操作说明 -->
      <div class="instruction">
        <p>拖动照片到文件夹进行分类</p>
      </div>

      <!-- 文件夹列表 -->
      <div class="folders">
        <!-- 熟柿子文件夹 -->
        <div 
          class="folder-item ripe-folder"
          @dragover.prevent="handleDragOver('熟')"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop('熟', $event)"
          :class="{ 'drag-over': dragOverFolder === '熟' }"
        >
          <div class="folder-content">
            <div class="folder-header">
              <div class="folder-icon">📁</div>
              <div class="folder-info">
                <div class="folder-name">熟柿子</div>
                <div class="folder-count">{{ getRipeCount }} 张</div>
              </div>
            </div>
            
            <!-- 显示熟柿子的图片 -->
            <div v-if="getRipePhotos.length > 0" class="folder-photos">
              <div 
                v-for="(photo, index) in getRipePhotos" 
                :key="index"
                class="photo-thumbnail"
              >
                <img :src="photo.url" :alt="`熟柿子 ${index + 1}`" />
                <div class="photo-index">{{ getPhotoOriginalIndex(photo) }}</div>
              </div>
            </div>
            <div v-else class="folder-empty">
              拖动照片到此处
            </div>
          </div>
        </div>

        <!-- 生柿子文件夹 -->
        <div 
          class="folder-item unripe-folder"
          @dragover.prevent="handleDragOver('生')"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop('生', $event)"
          :class="{ 'drag-over': dragOverFolder === '生' }"
        >
          <div class="folder-content">
            <div class="folder-header">
              <div class="folder-icon">📁</div>
              <div class="folder-info">
                <div class="folder-name">生柿子</div>
                <div class="folder-count">{{ getUnripeCount }} 张</div>
              </div>
            </div>
            
            <!-- 显示生柿子的图片 -->
            <div v-if="getUnripePhotos.length > 0" class="folder-photos">
              <div 
                v-for="(photo, index) in getUnripePhotos" 
                :key="index"
                class="photo-thumbnail"
              >
                <img :src="photo.url" :alt="`生柿子 ${index + 1}`" />
                <div class="photo-index">{{ getPhotoOriginalIndex(photo) }}</div>
              </div>
            </div>
            <div v-else class="folder-empty">
              拖动照片到此处
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface Photo {
  url: string
  label?: string
}

const props = defineProps<{
  photos: Photo[]
}>()

const emit = defineEmits<{
  labelPhoto: [data: { index: number, label: string }]
}>()

const dragOverFolder = ref<string | null>(null)

// 计算熟柿子数量
const getRipeCount = computed(() => {
  return props.photos.filter(p => p.label === '熟').length
})

// 计算生柿子数量
const getUnripeCount = computed(() => {
  return props.photos.filter(p => p.label === '生').length
})

// 获取熟柿子图片列表
const getRipePhotos = computed(() => {
  return props.photos.filter(p => p.label === '熟')
})

// 获取生柿子图片列表
const getUnripePhotos = computed(() => {
  return props.photos.filter(p => p.label === '生')
})

// 获取照片的原始索引（用于显示编号）
const getPhotoOriginalIndex = (photo: Photo) => {
  const index = props.photos.findIndex(p => p === photo)
  return String(index + 1).padStart(2, '0')
}

// 拖拽经过
const handleDragOver = (folder: string) => {
  dragOverFolder.value = folder
}

// 拖拽离开
const handleDragLeave = () => {
  dragOverFolder.value = null
}

// 放置
const handleDrop = (label: string, event: DragEvent) => {
  dragOverFolder.value = null
  
  if (!event.dataTransfer) return
  
  const photoIndex = event.dataTransfer.getData('photoIndex')
  if (!photoIndex) return
  
  const index = parseInt(photoIndex)
  if (isNaN(index) || index < 0 || index >= props.photos.length) return
  
  emit('labelPhoto', { index, label })
}
</script>

<style scoped>
.category-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  margin-bottom: 24px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: visible;
}

.instruction {
  padding: 12px;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
}

.instruction p {
  margin: 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.folders {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.folder-item {
  padding: 16px;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 100px;
}

.folder-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.folder-item:hover {
  border-color: #9ca3af;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.folder-item.drag-over {
  border-style: solid;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
}

.ripe-folder {
  border-left: 6px solid #f59e0b;
}

.ripe-folder.drag-over {
  background: #fef3c7;
  border-color: #f59e0b;
}

.unripe-folder {
  border-left: 6px solid #10b981;
}

.unripe-folder.drag-over {
  background: #d1fae5;
  border-color: #10b981;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.folder-icon {
  font-size: 32px;
  opacity: 0.8;
}

.folder-info {
  flex: 1;
}

.folder-name {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.folder-count {
  font-size: 13px;
  color: #6b7280;
}

.folder-photos {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
}

.photo-thumbnail {
  position: relative;
  width: 80px;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background: #000;
  cursor: default;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.photo-thumbnail:hover {
  transform: scale(1.05);
  z-index: 1;
}

.photo-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-index {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.folder-empty {
  flex: 1;
  padding: 12px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #fafafa;
}
</style>

