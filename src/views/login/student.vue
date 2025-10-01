<template>
  <div class="page">
    <div class="card" :class="{ wide: showCameraCheck }">
      <!-- 登录表单 -->
      <div v-if="!showCameraCheck">
        <div class="header">
          <h1>信息科技课堂</h1>
          <p>小组登录</p>
          <el-tag :type="connectionStatusType" size="small" effect="plain">
          {{ connectionStatusText }}
          </el-tag>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" class="form">
          <el-form-item prop="groupNo">
            <label>选择小组</label>
            <el-input v-model="form.groupNo" placeholder="输入小组号（1-20）" :disabled="isLogging" />
          </el-form-item>
          
          <el-button type="primary" :loading="isLogging" @click="handleLogin" class="btn">
            {{ isLogging ? '登录中...' : '进入课堂' }}
          </el-button>
        </el-form>

        <div class="switch">
          <el-button @click="goToTeacher" link>切换到教师登录</el-button>
        </div>
      </div>

      <!-- 摄像头检查 -->
      <div v-else class="camera">
        <h2>📷 摄像头检查</h2>
        <video :ref="el => { if (el) camera.videoRef.value = el as HTMLVideoElement }" autoplay playsinline muted class="video" />
        <el-button @click="confirmLogin" type="primary" class="btn">确认</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStatus } from '@/store/status'
import { useCamera } from '@/utils/camera'
import { useSocket } from '@/store/socket'

const router = useRouter()
const status = useStatus()
const {socket, connect} = useSocket()
const camera = useCamera()

const formRef = ref<FormInstance>()
const showCameraCheck = ref(false)
const isLogging = ref(false)
const form = ref({ groupNo: '' })

const rules: FormRules = {
  groupNo: [
    { required: true, message: '请输入小组号', trigger: 'blur' },
    { pattern: /^([1-9]|1\d|20)$/, message: '请输入1-20的数字', trigger: 'blur' }
  ]
}

const connectionStatusType = computed(() => {
  if (socket !== null) return 'success'
  return 'danger'
})

const connectionStatusText = computed(() => {
  if (socket !== null) return '已连接'
  return '未连接'
})

// 登录按钮，打开摄像头检查
const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    showCameraCheck.value = true
    await camera.initCamera()
  } catch {}
}

// 确认登录，连接Socket
const confirmLogin = async () => {
  showCameraCheck.value = false
  camera.cleanup()
  isLogging.value = true
  
  try {
    await connect({
      type: 'student',
      mode: status.mode,
      groupNo: form.value.groupNo
    })
    
    status.userStatus = { type: 'student', groupNo: form.value.groupNo }
    
    ElMessage.success('登录成功')
    router.push('/student')
  } catch (error: any) {
    console.error('[Login] 登录失败:', error)
    ElMessage.error(error.message || '连接失败')
  } finally {
    isLogging.value = false
  }
}

const goToTeacher = () => router.push('/login/teacher')
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  transition: max-width 0.3s;
}

.card.wide {
  max-width: 600px;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1976d2;
  margin: 0 0 8px;
}

.header p {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px;
}

.form {
  margin-bottom: 24px;
}

.form label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.btn {
  width: 100%;
  height: 44px;
  background: #1976d2;
  border: none;
  font-size: 16px;
  margin-top: 8px;
}

.btn:hover {
  background: #1565c0;
}

.switch {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.camera {
  text-align: center;
}

.camera h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
  margin: 0 0 20px;
}

.video {
  width: 100%;
  height: 300px;
  background: #000;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 20px;
}
</style>