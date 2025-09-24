<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'
import { useMessageStore } from '@/stores/message'

// Router
const router = useRouter()

// Store
const authStore = useAuthStore()
const socketStore = useSocketStore()
const messageStore = useMessageStore()

// 生命周期
onMounted(() => {
  // 注意：Socket监听器将在登录成功后初始化，避免模块加载顺序问题
  
  // 尝试自动登录
  authStore.autoLogin().then((success) => {
    if (success) {
      // 自动登录成功，尝试恢复之前的路径
      const savedPath = localStorage.getItem('lastVisitedPath')
      const currentPath = router.currentRoute.value.path
      
      if (savedPath && savedPath !== '/login' && savedPath !== '/login/teacher') {
        // 验证保存的路径是否与当前用户角色匹配
        const isValidPath = authStore.isStudent 
          ? savedPath.startsWith('/student')
          : savedPath.startsWith('/teacher')
        
        if (isValidPath) {
          router.push(savedPath)
          return
        }
      }
      
      // 如果没有有效的保存路径，或当前已在正确页面，使用默认路径
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/login/teacher') {
        const defaultRoute = authStore.isStudent ? '/student/activity1' : '/teacher/activity1'
        router.push(defaultRoute)
      }
    }
  }).catch(() => {
    // 自动登录失败，确保在登录页面
    router.push('/login')
  })
  
  // 监听路由变化，保存当前路径（排除登录页面）
  watch(() => router.currentRoute.value.path, (newPath) => {
    if (authStore.isAuthenticated && 
        newPath !== '/login' && 
        newPath !== '/login/teacher' && 
        newPath !== '/') {
      localStorage.setItem('lastVisitedPath', newPath)
    }
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f7fa;
}

#app {
  width: 100%;
  height: 100vh;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 样式覆盖 */
.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 6px;
}

.el-input__wrapper {
  border-radius: 6px;
}

.el-textarea__inner {
  border-radius: 6px;
}
</style>
