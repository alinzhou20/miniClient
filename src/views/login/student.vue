<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <h1>信息科技课堂</h1>
        <p>小组登录</p>
        <el-tag :type="connectionStatusType" size="small" effect="plain">
        {{ connectionStatusText }}
        </el-tag>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="form">
        <div class="form-row">
          <el-form-item prop="groupNo" class="form-item-half">
            <label>选择小组</label>
            <el-input v-model="form.groupNo" placeholder="输入小组号（1-12）" :disabled="isLogging" />
          </el-form-item>

          <el-form-item prop="role" class="form-item-half">
            <label>选择角色</label>
            <el-select v-model="form.role" placeholder="请选择角色" :disabled="isLogging">
              <el-option label="操作员" value="operator">
                <span>操作员</span>
              </el-option>
              <el-option label="记录员" value="recorder">
                <span>记录员</span>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
        
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
import { ElMessage } from 'element-plus'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'
import StudentCamera from '@/views/components/StudentCamera.vue'

const router = useRouter()
const status = useStatus()
const {socket, connect} = useSocket()

const formRef = ref<FormInstance>()
const showCameraDialog = ref(false)
const isLogging = ref(false)
const form = ref({ 
  groupNo: '', 
  role: 'operator' as 'operator' | 'recorder'
})

const rules: FormRules = {
  groupNo: [
    { required: true, message: '请输入小组号', trigger: 'blur' },
    { pattern: /^([1-9]|1\d|20)$/, message: '请输入1-20的数字', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 计算学号
const operatorStudentNo = computed(() => {
  const groupNo = parseInt(form.value.groupNo)
  if (isNaN(groupNo) || groupNo < 1 || groupNo > 20) return '-'
  return groupNo * 2 - 1
})

const recorderStudentNo = computed(() => {
  const groupNo = parseInt(form.value.groupNo)
  if (isNaN(groupNo) || groupNo < 1 || groupNo > 20) return '-'
  return groupNo * 2
})

// 当前选中角色的学号
const currentStudentNo = computed(() => {
  if (form.value.role === 'operator') return operatorStudentNo.value
  return recorderStudentNo.value
})

const connectionStatusType = computed(() => {
  if (socket !== null) return 'success'
  return 'danger'
})

const connectionStatusText = computed(() => {
  if (socket !== null) return '已连接'
  return '未连接'
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
    const roleName = form.value.role === 'operator' ? '操作员' : '记录员'
    
    await connect({
      type: 'student',
      mode: status.mode,
      studentRole: form.value.role,
      groupNo: form.value.groupNo,
      studentNo: studentNo
    })
    
    status.userStatus = { 
      type: 'student', 
      groupNo: form.value.groupNo,
      studentRole: form.value.role,
      studentNo: studentNo
    }
    
    ElMessage.success(`登录成功！${roleName} - 学号: ${studentNo}`)
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

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.form-item-half {
  flex: 1;
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