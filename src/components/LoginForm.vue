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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
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

// 方法
const handleStudentLogin = async () => {
  if (!studentFormRef.value) return
  
  try {
    await studentFormRef.value.validate()
    
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

// 生命周期
onMounted(() => {
  // 初始化Socket监听器
  socketStore.initSocketListeners()
  
  // 尝试自动登录
  authStore.autoLogin().catch(() => {
    // 自动登录失败，忽略错误
  })
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
</style>
