<template>
  <div class="main-content">
    <!-- 评价标准 -->
    <Evaluation />

    <!-- 截图区域 -->
    <div class="screenshot-area">
      <div class="screenshot-title">屏幕截图</div>
      <div class="screenshot-card" :class="{ 'has-screenshot': ac2.screenshot }">
        <!-- 显示截图 -->
        <div v-if="ac2.screenshot" class="screenshot-preview">
          <img :src="ac2.screenshot" alt="屏幕截图" />
          <el-button 
            class="retake-button" 
            size="small" 
            @click="retakeScreenshot"
          >
            重新截图
          </el-button>
        </div>
        <!-- 截图按钮 -->
        <div v-else class="screenshot-content">
          <el-button 
            type="primary" 
            size="large" 
            @click="startScreenshot"
            class="screenshot-button"
          >
            开始截图
          </el-button>
        </div>
      </div>
    </div>

    <!-- 截图组件 -->
    <StudentScreenshot 
      v-model="showScreenshot" 
      @upload="handleScreenshotUpload"
    />

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStuStatus } from '@/store/status'
import { useStuAc2 } from '@/store/activity/activity2'
import { ElMessage } from 'element-plus'
import StudentScreenshot from '../../components/screenshot.vue'
import Evaluation from '../../components/evaluation.vue'

const status = useStuStatus()
const ac2 = useStuAc2()

// 截图功能
const showScreenshot = ref(false)

// 启动截图
const startScreenshot = () => {
  showScreenshot.value = true
}

// 重新截图
const retakeScreenshot = () => {
  ac2.screenshot = null
  startScreenshot()
}

// 处理截图上传
const handleScreenshotUpload = async () => {
  showScreenshot.value = false
  
  if (!status.photo) {
    ElMessage.warning('截图未成功')
    return
  }

  // 保存截图
  ac2.screenshot = status.photo
  ElMessage.success('截图保存成功！')
}

</script>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 截图区域 */
.screenshot-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.screenshot-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  padding: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.screenshot-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 40px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.screenshot-card.has-screenshot {
  padding: 0;
  overflow: hidden;
}

.screenshot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.screenshot-button {
  font-size: 18px;
  padding: 16px 48px;
  height: auto;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.screenshot-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.screenshot-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  min-height: 300px;
}

.screenshot-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.retake-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid #e5e7eb;
}

.retake-button:hover {
  background: white;
  transform: scale(1.05);
}
</style>
