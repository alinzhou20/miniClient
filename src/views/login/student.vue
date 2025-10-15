<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <h1>萧山区信息科技平台</h1>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="form">
        <el-form-item prop="groupNo">
          <label>选择小组</label>
          <el-input v-model="form.groupNo" placeholder="输入小组号（1-12）" :disabled="isLogging" />
        </el-form-item>
        
        <el-button type="primary" :loading="isLogging" @click="handleLogin" class="btn">
          {{ isLogging ? '登录中...' : '进入课堂' }}
        </el-button>
      </el-form>

      <div class="switch">
        <el-button @click="showCameraDialog = true" link>检查摄像头</el-button>
        <span class="divider">|</span>
        <el-button @click="goToTeacher" link>切换到教师登录</el-button>
      </div>
    </div>

    <!-- 摄像头弹窗 -->
    <StudentCamera v-model="showCameraDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import StudentCamera from '@/views/components/StudentCamera.vue'

const router = useRouter()
const status = useStatus()
const socketStore = useSocket()
const { connect } = socketStore

const formRef = ref<FormInstance>()
const showCameraDialog = ref(false)
const isLogging = ref(false)
const form = ref({ 
  groupNo: ''
})

const rules: FormRules = {
  groupNo: [
    { required: true, message: '请输入小组号', trigger: 'blur' },
    { pattern: /^([1-9]|1\d|20)$/, message: '请输入1-20的数字', trigger: 'blur' }
  ]
}

// 计算学号（操作员学号）
const currentStudentNo = computed(() => {
  const groupNo = parseInt(form.value.groupNo)
  if (isNaN(groupNo) || groupNo < 1 || groupNo > 20) return '-'
  return groupNo * 2 - 1
})

// 登录按钮，直接登录
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  
  isLogging.value = true
  
  try {
    const studentNo = currentStudentNo.value.toString()
    
    await connect({
      type: 'student',
      mode: status.mode,
      studentRole: 'operator',
      groupNo: form.value.groupNo,
      studentNo: studentNo
    })
    
    // 保存完整的用户状态（包括 mode，用于重连）
    status.userStatus = { 
      type: 'student',
      mode: status.mode,
      groupNo: form.value.groupNo,
      studentRole: 'operator',
      studentNo: studentNo
    }
    
    // 跳转到学生页面
    router.push('/student')
  } catch (error: any) {
    console.error('[Login] 登录失败:', error)
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

.form :deep(.el-select) {
  width: 100%;
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

.divider {
  color: #ddd;
  margin: 0 8px;
}
</style>