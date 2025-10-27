<template>
  <div class="capture-panel">
    <div class="panel-header">
      <h3 class="panel-title">拍摄采集</h3>
    </div>

    <div class="panel-content">
      <!-- 操作说明 -->
      <div class="instruction">
        <p>1. 点击拍摄按钮打开摄像头</p>
        <p>2. 拍摄完成后自动添加到预览区</p>
        <p>3. 在预览区可以裁剪和编辑照片</p>
      </div>

      <!-- 拍摄按钮 -->
      <el-button 
        type="primary" 
        size="large"
        @click="showCamera = true"
        class="capture-btn"
        :icon="Camera"
        :disabled="(photoCount ?? 0) >= 2"
      >
        拍摄照片
      </el-button>
    </div>

    <!-- 使用现有的摄像头组件 -->
    <StudentCamera 
      v-model="showCamera" 
      @upload="handlePhotoUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import StudentCamera from '../../components/camera.vue'

defineProps<{
  photoCount?: number
}>()

const emit = defineEmits<{
  photoTaken: [photo: string]
}>()

const showCamera = ref(false)

// 处理照片上传
const handlePhotoUpload = (photoData: string) => {
  emit('photoTaken', photoData)
  ElMessage.success('照片已拍摄成功')
}
</script>

<style scoped>
.capture-panel {
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
  padding: 16px;
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  border-radius: 8px;
}

.instruction p {
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.capture-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
}
</style>

