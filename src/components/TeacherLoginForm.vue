<template>
  <div class="teacher-login-container">
    <el-card class="teacher-login-card">
      <template #header>
        <div class="card-header">
          <h2>教师登录</h2>
          <p class="subtitle">信息科技课堂</p>
        </div>
      </template>

      <el-form
        ref="teacherFormRef"
        :model="teacherForm"
        :rules="teacherRules"
        label-width="80px"
        @submit.prevent="handleTeacherLogin"
        class="teacher-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="teacherForm.username"
            placeholder="请输入用户名"
            :disabled="isLogging"
            size="large"
            prefix-icon="User"
            class="modern-input"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="teacherForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :disabled="isLogging"
            size="large"
            prefix-icon="Lock"
            class="modern-input"
          />
        </el-form-item>
        
        <el-form-item class="login-button-item">
          <el-button
            type="primary"
            :loading="isLogging"
            @click="handleTeacherLogin"
            size="large"
            class="login-button"
          >
            {{ isLogging ? '登录中...' : '教师登录' }}
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

      <!-- 返回学生登录 -->
      <div class="switch-login">
        <el-button @click="goToStudentLogin" type="info" text>
          <el-icon><ArrowLeft /></el-icon>
          返回学生登录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import type { TeacherAuth } from '@/types'

// Router
const router = useRouter()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()

// 响应式数据
const teacherFormRef = ref<FormInstance>()

// 教师表单
const teacherForm = ref({
  username: 'admin',
  password: 'bgxx2025'
})

// 表单验证规则
const teacherRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
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
const handleTeacherLogin = async () => {
  if (!teacherFormRef.value) return
  
  try {
    await teacherFormRef.value.validate()
    
    const authInfo: TeacherAuth = {
      role: 'teacher',
      username: teacherForm.value.username,
      password: teacherForm.value.password
    }
    
    await authStore.login(authInfo)
    ElMessage.success('教师登录成功')
    
    // 登录成功后跳转
    router.push('/teacher')
    
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  }
}

const goToStudentLogin = () => {
  router.push('/login')
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
.teacher-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.teacher-login-card {
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

.teacher-form {
  padding: 0 20px 30px;
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

.switch-login {
  margin-top: 20px;
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
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

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border-bottom: none;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-button-item {
  margin-top: 32px;
}
</style>
