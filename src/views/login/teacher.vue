<template>
  <div class="page">
    <div class="card">
      <div class="header">
        <h1>萧山区信息科技平台</h1>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="form">
        <el-form-item prop="password">
          <label>请输入教师密码</label>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :disabled="isLogging"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-button type="primary" :loading="isLogging" @click="handleLogin" class="btn">
          {{ isLogging ? '验证中...' : '登录管理端' }}
        </el-button>
      </el-form>

      <div class="switch">
        <el-button @click="goToStudent" link>返回学生登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { useStatus } from '@/store/status'
import { useSocket } from '@/store/socket'

const router = useRouter()
const status = useStatus()
const {connect} = useSocket()

const formRef = ref<FormInstance>()
const isLogging = ref(false)
const form = ref({ password: '' })

const rules: FormRules = {
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, message: '密码长度不正确', trigger: 'blur' }
  ]
}

// 登录按钮，连接Socket
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 前端验证密码
    if (form.value.password !== '12356') {
      // ElMessage.error('密码错误')
      return
    }
    
    isLogging.value = true
    
    await connect({ type: 'teacher' })
    
    status.userStatus = { type: 'teacher' }
    
    // ElMessage.success('登录成功')
    router.push('/teacher/activity0')
  } catch (error: any) {
    console.error('[Login] 登录失败:', error)
    // ElMessage.error(error.message || '连接失败')
  } finally {
    isLogging.value = false
  }
}

const goToStudent = () => router.push('/login')
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
</style>