<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>信息科技课堂</h2>
        </div>
      </template>


      <!-- 学生登录表单 -->
      <el-form
        ref="studentFormRef"
        :model="studentForm"
        :rules="studentRules"
        label-width="0"
        @submit.prevent="handleStudentLogin"
        class="student-form"
      >
        <el-row :gutter="16">
          <el-col :span="12" :offset="2">
            <el-form-item prop="groupNo">
              <div class="input-with-label">
                <span class="input-prefix">第</span>
                <el-input
                  v-model="studentForm.groupNo"
                  placeholder="输入组号"
                  :disabled="isLogging"
                  size="large"
                  class="modern-input"
                  inputmode="numeric"
                  maxlength="2"
                  clearable
                />
                <span class="input-suffix">小组</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8" :offset="1">
            <el-form-item prop="studentNo">
              <div class="input-with-label">
                <el-input
                  v-model="studentForm.studentNo"
                  placeholder="输入学号"
                  :disabled="isLogging"
                  size="large"
                  class="modern-input"
                  inputmode="numeric"
                  maxlength="3"
                  clearable
                />
                <span class="input-suffix">号</span>
              </div>
            </el-form-item>
          </el-col>

        </el-row>
        
        <el-form-item class="login-button-item">
          <el-button
            type="primary"
            :loading="isLogging"
            @click="handleStudentLogin"
            size="large"
            class="login-button"
          >
            {{ isLogging ? '登录中...' : '进入课堂' }}
          </el-button>
        </el-form-item>
      </el-form>


      <!-- 错误提示 -->
      <el-alert
        v-if="loginError"
        :title="loginError"
        type="error"
        :closable="false"
        style="margin-top: 16px"
      />

      <!-- 连接状态 -->
      <div class="connection-status" v-if="!isAuthenticated">
        <el-tag :type="connectionStatusType" size="small">
          {{ connectionStatusText }}
        </el-tag>
      </div>
    </el-card>

    <!-- 摄像头检查弹窗 -->
    <el-dialog
      v-model="showCameraCheck"
      title="📷 摄像头检查"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      center
    >
      <div class="camera-check-content">
        <div class="check-description">
          <p>为了确保Activity4拍照功能正常使用，请检查摄像头是否清晰</p>
        </div>

        <!-- 摄像头预览区域 -->
        <div class="camera-preview-container">
          <video 
            ref="videoRef" 
            class="camera-preview"
            autoplay 
            muted 
            playsinline
            @loadedmetadata="onVideoLoaded"
          ></video>
          
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-overlay">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在启动摄像头...</p>
          </div>
          
          <!-- 错误状态 -->
          <div v-if="cameraError" class="error-overlay">
            <el-icon class="error-icon"><Warning /></el-icon>
            <p>{{ cameraError }}</p>
            <el-button type="primary" @click="initCamera">重新尝试</el-button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="camera-check-actions">
          <el-button 
            v-if="!isCameraReady && !cameraError" 
            type="primary" 
            size="large"
            @click="initCamera"
            :loading="isLoading"
          >
            启动摄像头检查
          </el-button>
          
          <template v-if="isCameraReady">
            <el-button 
              type="success" 
              size="large"
              @click="confirmCameraAndLogin"
            >
              摄像头清晰，确认登录
            </el-button>
            <el-button 
              size="large"
              @click="retryCamera"
            >
              重新检查
            </el-button>
          </template>
          
          <el-button 
            type="info" 
            size="large"
            @click="skipCameraCheck"
          >
            跳过检查，直接登录
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { Loading, Warning } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import type { StudentAuth } from '@/types'

// Router
const router = useRouter()
const route = useRoute()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()

// 响应式数据
const studentFormRef = ref<FormInstance>()

// 学生表单
const studentForm = ref({
  studentNo: '',
  groupNo: ''
})

// 摄像头检查相关状态
const showCameraCheck = ref(false)
const videoRef = ref<HTMLVideoElement>()
const mediaStream = ref<MediaStream | null>(null)
const isLoading = ref(false)
const cameraError = ref('')
const isCameraReady = ref(false)

// 直接键盘输入，不再使用下拉选项

// 当前班级
const currentClass = computed(() => {
  return route.params.classNo || '502'
})

// 表单验证规则
const studentRules: FormRules = {
  studentNo: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  groupNo: [
    { required: true, message: '请输入小组', trigger: 'blur' }
  ]
}

// 计算属性
const isLogging = computed(() => authStore.isLogging)
const loginError = computed(() => authStore.loginError)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const connectionStatusType = computed(() => {
  if (socketStore.isConnected) return 'success'
  if (socketStore.isReconnecting) return 'warning'
  return 'danger'
})

const connectionStatusText = computed(() => {
  if (socketStore.isReady) return '已连接'
  if (socketStore.isReconnecting) return '重连中...'
  if (socketStore.connectionError) return `连接错误: ${socketStore.connectionError}`
  return '未连接'
})

// 摄像头相关方法
const initCamera = async () => {
  console.log('[Camera Check] 开始初始化摄像头')
  isLoading.value = true
  cameraError.value = ''
  
  try {
    // 检查浏览器支持
    if (!navigator.mediaDevices) {
      throw new Error('浏览器不支持 MediaDevices API')
    }
    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 getUserMedia API')
    }
    
    // 检查协议
    console.log('[Camera Check] 当前协议:', window.location.protocol)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('[Camera Check] 摄像头API需要HTTPS或localhost环境')
    }
    
    // 停止现有流
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
    }
    
    // 请求摄像头权限
    const constraints = { 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment' // 优先使用后置摄像头
      } 
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    mediaStream.value = stream
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
    
    isCameraReady.value = true
    ElMessage.success('摄像头启动成功')
  } catch (error: any) {
    console.error('[Camera Check] 摄像头启动失败:', error)
    
    if (error.name === 'NotAllowedError') {
      cameraError.value = '摄像头权限被拒绝，请点击地址栏摄像头图标允许访问'
    } else if (error.name === 'NotFoundError') {
      cameraError.value = '未找到摄像头设备，请检查摄像头是否连接'
    } else if (error.name === 'NotReadableError') {
      cameraError.value = '摄像头被其他应用占用，请关闭其他使用摄像头的应用'
    } else if (error.name === 'SecurityError') {
      cameraError.value = '安全限制：请确保在HTTPS或localhost环境下使用'
    } else {
      cameraError.value = `摄像头启动失败: ${error.message}`
    }
  } finally {
    isLoading.value = false
  }
}

const onVideoLoaded = () => {
  console.log('[Camera Check] 视频流加载完成')
}

const retryCamera = () => {
  isCameraReady.value = false
  cameraError.value = ''
  initCamera()
}

const cleanup = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
  isCameraReady.value = false
}

const confirmCameraAndLogin = async () => {
  cleanup()
  showCameraCheck.value = false
  await performLogin()
}

const skipCameraCheck = async () => {
  cleanup()
  showCameraCheck.value = false
  await performLogin()
}

// 实际登录逻辑
const performLogin = async () => {
  try {
    const sNo = parseInt(String(studentForm.value.studentNo).trim(), 10)
    const gNo = parseInt(String(studentForm.value.groupNo).trim(), 10)
    if (!Number.isFinite(sNo) || sNo <= 0) throw new Error('学号必须为正整数')
    if (!Number.isFinite(gNo) || gNo <= 0) throw new Error('小组号必须为正整数')

    const authInfo: StudentAuth = {
      role: 'student',
      classNo: String(currentClass.value),
      studentNo: sNo,
      groupNo: gNo,
      pin4: '1234' // 默认PIN码
    }
    
    await authStore.login(authInfo)
    ElMessage.success('进入课堂成功')
    
    // 登录成功后跳转
    router.push('/student')
    
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  }
}

// 登录入口方法
const handleStudentLogin = async () => {
  if (!studentFormRef.value) return
  
  try {
    await studentFormRef.value.validate()
    
    // 显示摄像头检查弹窗
    showCameraCheck.value = true
    
    // 自动启动摄像头检查
    setTimeout(() => {
      initCamera()
    }, 500) // 延迟一点确保弹窗已显示
    
  } catch (error: any) {
    ElMessage.error(error.message || '表单验证失败')
  }
}

// 生命周期
onMounted(() => {
  // 初始化Socket监听器
  socketStore.initSocketListeners()
  
  // 尝试自动登录
  authStore.autoLogin().catch(() => {
    // 自动登录失败，忽略错误
  })
})

// 组件卸载时清理摄像头资源
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.card-header {
  text-align: center;
  padding: 20px 0;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-weight: 700;
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 16px;
  font-weight: 500;
}

.class-info {
  text-align: center;
  margin-bottom: 30px;
}

.student-form {
  padding: 0 20px 30px;
}

.modern-select {
  width: 100%;
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 56px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.connection-status {
  margin-top: 20px;
  text-align: center;
}

:deep(.el-input__wrapper) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  background: #fafafa;
  transition: all 0.3s ease;
  height: 56px;
  font-size: 16px;
}
:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  background: #fff;
}
:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

:deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

:deep(.el-select__placeholder) {
  color: #999;
  font-weight: 400;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border-bottom: none;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-tag--large) {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.input-with-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-prefix,
.input-suffix {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.input-with-label .modern-select {
  flex: 1;
  margin-bottom: 0;
}

.login-button-item {
  margin-top: 32px;
}

/* 摄像头检查弹窗样式 */
.camera-check-content {
  text-align: center;
}

.check-description {
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.camera-preview-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: #1f2937;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

/* 加载和错误状态 */
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #ffffff;
  text-align: center;
}

.loading-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.error-overlay {
  background: rgba(239, 68, 68, 0.8);
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 32px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.camera-check-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.camera-check-actions .el-button {
  min-width: 120px;
}

/* 弹窗样式覆盖 */
:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #303133;
}
</style>
