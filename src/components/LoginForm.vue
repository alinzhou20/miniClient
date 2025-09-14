<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>极简课堂客户端</h2>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="login-tabs">
        <!-- 学生登录 -->
        <el-tab-pane label="学生登录" name="student">
          <el-form
            ref="studentFormRef"
            :model="studentForm"
            :rules="studentRules"
            label-width="80px"
            @submit.prevent="handleStudentLogin"
          >
            <el-form-item label="班级号" prop="classNo">
              <el-input
                v-model="studentForm.classNo"
                placeholder="请输入班级号"
                :disabled="isLogging"
              />
            </el-form-item>
            
            <el-form-item label="学号" prop="studentNo">
              <el-input-number
                v-model="studentForm.studentNo"
                :min="1"
                :max="99999"
                placeholder="请输入学号"
                :disabled="isLogging"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="小组号" prop="groupNo">
              <el-input-number
                v-model="studentForm.groupNo"
                :min="1"
                :max="20"
                placeholder="请输入小组号"
                :disabled="isLogging"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="pin4">
              <el-input
                v-model="studentForm.pin4"
                type="password"
                placeholder="请输入4位密码"
                maxlength="4"
                show-password
                :disabled="isLogging"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="isLogging"
                @click="handleStudentLogin"
                style="width: 100%"
              >
                {{ isLogging ? '登录中...' : '学生登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 教师登录 -->
        <el-tab-pane label="教师登录" name="teacher">
          <el-form
            ref="teacherFormRef"
            :model="teacherForm"
            :rules="teacherRules"
            label-width="80px"
            @submit.prevent="handleTeacherLogin"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="teacherForm.username"
                placeholder="请输入用户名"
                :disabled="isLogging"
              />
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="teacherForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                :disabled="isLogging"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button
                type="primary"
                :loading="isLogging"
                @click="handleTeacherLogin"
                style="width: 100%"
              >
                {{ isLogging ? '登录中...' : '教师登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import type { StudentAuth, TeacherAuth } from '@/types'

// Router
const router = useRouter()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()

// 响应式数据
const activeTab = ref('student')
const studentFormRef = ref<FormInstance>()
const teacherFormRef = ref<FormInstance>()

// 学生表单
const studentForm = ref({
  classNo: '502',
  studentNo: 1,
  groupNo: 1,
  pin4: '1234'
})

// 教师表单
const teacherForm = ref({
  username: 'admin',
  password: 'bgxx2025'
})

// 表单验证规则
const studentRules: FormRules = {
  classNo: [
    { required: true, message: '请输入班级号', trigger: 'blur' }
  ],
  studentNo: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { type: 'number', min: 1, message: '学号必须大于0', trigger: 'blur' }
  ],
  groupNo: [
    { required: true, message: '请输入小组号', trigger: 'blur' },
    { type: 'number', min: 1, message: '小组号必须大于0', trigger: 'blur' }
  ],
  pin4: [
    { required: true, message: '请输入4位密码', trigger: 'blur' },
    { len: 4, message: '密码必须是4位', trigger: 'blur' }
  ]
}

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
const handleStudentLogin = async () => {
  if (!studentFormRef.value) return
  
  try {
    await studentFormRef.value.validate()
    
    const authInfo: StudentAuth = {
      role: 'student',
      classNo: studentForm.value.classNo,
      studentNo: studentForm.value.studentNo,
      groupNo: studentForm.value.groupNo,
      pin4: studentForm.value.pin4
    }
    
    await authStore.login(authInfo)
    ElMessage.success('学生登录成功')
    
    // 登录成功后跳转
    router.push('/student')
    
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  }
}

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
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
  font-weight: 600;
}

.login-tabs {
  margin-top: 20px;
}

.connection-status {
  margin-top: 16px;
  text-align: center;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
