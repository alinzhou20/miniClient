import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthInfo, User, UserRole } from '@/types'
import { socketService } from '@/services/socket'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isAuthenticated = ref(false)
  const currentUser = ref<User | null>(null)
  const authInfo = ref<AuthInfo | null>(null)
  const loginError = ref<string>('')
  const isLogging = ref(false)

  // 计算属性
  const userRole = computed((): UserRole | null => {
    return currentUser.value?.role || null
  })

  const isStudent = computed(() => userRole.value === 'student')
  const isTeacher = computed(() => userRole.value === 'teacher')

  // 登录方法
  const login = async (auth: AuthInfo): Promise<void> => {
    isLogging.value = true
    loginError.value = ''
    
    try {
      // 保存认证信息
      authInfo.value = auth
      
      // 连接Socket服务
      await socketService.connect(auth)
      
      // 设置用户信息
      if (auth.role === 'student') {
        currentUser.value = {
          role: 'student',
          classNo: auth.classNo,
          studentNo: auth.studentNo,
          groupNo: auth.groupNo
        }
      } else {
        currentUser.value = {
          role: 'teacher',
          username: auth.username
        }
      }
      
      isAuthenticated.value = true
      
      // 保存到localStorage
      localStorage.setItem('authInfo', JSON.stringify(auth))
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      
      // 登录成功，跳转逻辑由组件处理
      
    } catch (error: any) {
      loginError.value = error.message || '登录失败'
      throw error
    } finally {
      isLogging.value = false
    }
  }

  // 登出方法
  const logout = () => {
    // 断开Socket连接
    socketService.disconnect()
    
    // 清除状态
    isAuthenticated.value = false
    currentUser.value = null
    authInfo.value = null
    loginError.value = ''
    
    // 清除localStorage
    localStorage.removeItem('authInfo')
    localStorage.removeItem('currentUser')
    
    // 跳转逻辑由调用组件处理
  }

  // 自动登录（从localStorage恢复）
  const autoLogin = async (): Promise<boolean> => {
    try {
      const savedAuthInfo = localStorage.getItem('authInfo')
      const savedUser = localStorage.getItem('currentUser')
      
      if (savedAuthInfo && savedUser) {
        const auth = JSON.parse(savedAuthInfo) as AuthInfo
        const user = JSON.parse(savedUser) as User
        
        // 尝试重新连接
        await socketService.connect(auth)
        
        authInfo.value = auth
        currentUser.value = user
        isAuthenticated.value = true
        
        return true
      }
    } catch (error) {
      // 自动登录失败，清除无效数据
      logout()
    }
    
    return false
  }

  // 清除错误
  const clearError = () => {
    loginError.value = ''
  }

  return {
    // 状态
    isAuthenticated,
    currentUser,
    authInfo,
    loginError,
    isLogging,
    
    // 计算属性
    userRole,
    isStudent,
    isTeacher,
    
    // 方法
    login,
    logout,
    autoLogin,
    clearError
  }
})
