<template>
  <div class="preview-panel">
    <div class="panel-header">
      <h3 class="panel-title">图片预览</h3>
    </div>

    <div class="panel-content">
      <!-- 照片列表 - 固定显示2个槽位 -->
      <div class="photos-grid">
        <div 
          v-for="index in 2" 
          :key="index - 1"
          class="photo-item"
          :class="{ 
            'empty-slot': !photos[index - 1],
            'labeled': photos[index - 1]?.label,
            'cropping': cropMode.active && cropMode.index === (index - 1)
          }"
          :draggable="!cropMode.active && !!photos[index - 1]"
          @dragstart="photos[index - 1] && handleDragStart(index - 1, $event)"
          @dragend="handleDragEnd"
        >
          <!-- 空槽位 -->
          <div v-if="!photos[index - 1]" class="photo-wrapper empty-wrapper">
            <div class="empty-placeholder">
              <span class="placeholder-icon">📷</span>
              <p class="placeholder-text">等待拍摄</p>
              <p class="placeholder-number">{{ String(index).padStart(2, '0') }}</p>
            </div>
          </div>
          
          <!-- 裁剪模式：显示裁剪器 -->
          <div 
            v-else-if="cropMode.active && cropMode.index === (index - 1)" 
            class="photo-wrapper cropping-wrapper"
          >
            <vue-cropper
              :ref="(el: any) => { if (el && cropMode.index === (index - 1)) cropperRef = el }"
              :img="cropMode.imageUrl"
              :output-size="0.9"
              :output-type="'jpeg'"
              :info="true"
              :can-scale="true"
              :auto-crop="true"
              :auto-crop-width="300"
              :auto-crop-height="200"
              :fixed="false"
              :fixed-number="[4, 3]"
              :full="false"
              :fixed-box="false"
              :can-move="true"
              :can-move-box="true"
              :original="false"
              :center-box="true"
              :high="true"
              :info-true="true"
              :max-img-size="3000"
              :enlarge="1"
              :mode="'contain'"
            ></vue-cropper>
          </div>
          
          <!-- 普通模式：显示图片 -->
          <div v-else class="photo-wrapper">
            <img :src="photos[index - 1].url" :alt="`照片 ${String(index).padStart(2, '0')}`" />
          </div>

          <!-- 普通模式：显示照片信息和操作按钮 -->
          <div class="photo-info" v-if="photos[index - 1] && !cropMode.active">
            <span class="photo-name">{{ String(index).padStart(2, '0') }}.jpg</span>
            <div class="photo-actions">
              <el-button 
                size="small" 
                type="success"
                @click="enterCropMode(index - 1)"
                :icon="Crop"
              >
                裁剪
              </el-button>
              <el-button 
                size="small" 
                type="primary"
                @click="downloadPhoto(index - 1)"
                :icon="Download"
              >
                下载
              </el-button>
              <el-button 
                size="small" 
                type="danger"
                @click="deletePhoto(index - 1)"
                :icon="Delete"
              >
                删除
              </el-button>
            </div>
          </div>

          <!-- 裁剪模式：显示裁剪工具栏 -->
          <div class="crop-toolbar" v-if="photos[index - 1] && cropMode.active && cropMode.index === (index - 1)">
            <el-button 
              size="small"
              @click="cancelCrop"
              :icon="Close"
            >
              取消
            </el-button>
            <el-button 
              size="small"
              @click="resetCrop"
              :icon="RefreshLeft"
            >
              重置
            </el-button>
            <el-button 
              size="small"
              type="primary"
              @click="confirmCrop"
              :icon="Check"
            >
              确认裁剪
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Delete, Crop, Close, RefreshLeft, Check } from '@element-plus/icons-vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

export interface Photo {
  url: string
  originalUrl?: string  // 保存原图URL，用于重新裁剪
  label?: string
}

const props = defineProps<{
  photos: Photo[]
}>()

const emit = defineEmits<{
  'update:photos': [photos: Photo[]]
  deletePhoto: [index: number]
  updatePhoto: [data: { index: number, url: string }]
  startDrag: [index: number]
}>()

// 裁剪模式状态
const cropMode = ref({
  active: false,
  index: -1,
  imageUrl: ''
})

let cropperRef: any = null // 使用普通变量，因为在 v-for 中使用函数式 ref

// 拖拽相关
const handleDragStart = (index: number, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('photoIndex', String(index))
  }
  emit('startDrag', index)
}

const handleDragEnd = () => {
  // 拖拽结束
}

// 进入裁剪模式
const enterCropMode = (index: number) => {
  const photo = props.photos[index]
  if (!photo) return
  
  cropMode.value.active = true
  cropMode.value.index = index
  // 使用原图进行裁剪，如果没有原图则使用当前图片
  cropMode.value.imageUrl = photo.originalUrl || photo.url
  
  ElMessage.info('已进入裁剪模式，拖动调整裁剪区域')
}

// 重置裁剪
const resetCrop = () => {
  if (cropperRef) {
    cropperRef.refresh()
  }
}

// 确认裁剪
const confirmCrop = () => {
  if (!cropperRef || cropMode.value.index === -1) return
  
  try {
    console.log('cropperRef:', cropperRef)
    console.log('cropperRef methods:', Object.keys(cropperRef))
    
    // 尝试方法1: getCropBlob
    if (typeof cropperRef.getCropBlob === 'function') {
      cropperRef.getCropBlob((blob: Blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          emit('updatePhoto', {
            index: cropMode.value.index,
            url: reader.result as string
          })
          ElMessage.success('裁剪完成')
          exitCropMode()
        }
        reader.readAsDataURL(blob)
      })
    }
    // 尝试方法2: getCropData
    else if (typeof cropperRef.getCropData === 'function') {
      cropperRef.getCropData((data: string) => {
        emit('updatePhoto', {
          index: cropMode.value.index,
          url: data
        })
        ElMessage.success('裁剪完成')
        exitCropMode()
      })
    }
    // 尝试方法3: finish方法
    else if (typeof cropperRef.finish === 'function') {
      const canvas = cropperRef.finish()
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      emit('updatePhoto', {
        index: cropMode.value.index,
        url: dataUrl
      })
      ElMessage.success('裁剪完成')
      exitCropMode()
    }
    // 如果都没有，打印可用方法
    else {
      console.error('可用的方法:', cropperRef)
      ElMessage.error('裁剪器未正确初始化')
    }
  } catch (error: any) {
    console.error('裁剪失败:', error)
    ElMessage.error(`裁剪失败: ${error.message || '请重试'}`)
  }
}

// 取消裁剪
const cancelCrop = () => {
  exitCropMode()
  ElMessage.info('已取消裁剪')
}

// 退出裁剪模式
const exitCropMode = () => {
  cropMode.value.active = false
  cropMode.value.index = -1
  cropMode.value.imageUrl = ''
  cropperRef = null // 清除裁剪器引用
}

// 下载照片
const downloadPhoto = (index: number) => {
  const photo = props.photos[index]
  if (!photo) return
  
  const fileName = `${String(index + 1).padStart(2, '0')}.jpg`
  
  const link = document.createElement('a')
  link.href = photo.url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success(`${fileName} 已下载`)
}

// 删除照片
const deletePhoto = (index: number) => {
  emit('deletePhoto', index)
  ElMessage.success('照片已删除')
}
</script>

<style scoped>
.preview-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.crop-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #0ea5e9;
  margin-top: 12px;
}

.panel-content {
  flex: 1;
  overflow: visible;
}

.photos-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.photo-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: move;
}

.photo-item:hover {
  border-color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

.photo-item.labeled {
  border-color: #10b981;
}

.photo-item:active {
  opacity: 0.7;
  transform: scale(0.98);
}

.photo-item.cropping {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  cursor: default;
  padding: 8px; /* 保留少量内边距 */
}

.photo-item.cropping .photo-wrapper {
  margin-bottom: 0; /* 移除底部间距，因为工具栏有 margin-top */
}

.photo-item.cropping:hover {
  transform: none;
}

.photo-item.cropping:active {
  opacity: 1;
  transform: none;
}

.photo-item.empty-slot {
  border-style: dashed;
  border-color: #d1d5db;
  background: #fafafa;
  cursor: default;
}

.photo-item.empty-slot:hover {
  border-color: #9ca3af;
  box-shadow: none;
}

.photo-wrapper {
  position: relative;
  width: 100%;
  background: #f3f4f6; /* 浅灰色背景，填充空白区域 */
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 完整显示图片，保持比例 */
}

/* 普通模式下的图片包装 - 固定比例 */
.photo-item:not(.cropping) .photo-wrapper {
  aspect-ratio: 16/9; /* 16:9 宽屏比例 */
  height: auto;
}

/* 裁剪模式下的容器 */
.cropping-wrapper {
  aspect-ratio: 16/9; /* 16:9 宽屏比例 */
  min-height: 300px;
  max-height: 600px;
  background: #000;
  overflow: hidden;
  display: block;
  padding: 0;
  margin-bottom: 0;
  position: relative;
  border-radius: 8px;
}

.cropping-wrapper :deep(.vue-cropper) {
  width: 100%;
  height: 100%;
}

.empty-wrapper {
  background: #fafafa;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-placeholder {
  text-align: center;
  color: #9ca3af;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
  display: block;
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.placeholder-number {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #d1d5db;
}

.photo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.photo-actions {
  display: flex;
  gap: 8px;
}

/* vue-cropper 自定义样式 */
.cropping-wrapper :deep(.vue-cropper .cropper-crop-box) {
  border-color: #0ea5e9;
}

.cropping-wrapper :deep(.vue-cropper .cropper-point) {
  background-color: #0ea5e9;
  opacity: 1;
}

.cropping-wrapper :deep(.vue-cropper .cropper-line) {
  background-color: #0ea5e9;
  opacity: 0.5;
}

.cropping-wrapper :deep(.vue-cropper .cropper-view-box) {
  outline: 2px solid rgba(14, 165, 233, 0.8);
}
</style>

