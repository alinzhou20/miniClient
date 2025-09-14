<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
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
  // 初始化Socket监听器
  socketStore.initSocketListeners()
  
  // 初始化消息监听器
  messageStore.initMessageListener()
  
  // 尝试自动登录
  authStore.autoLogin().then((success) => {
    if (success) {
      // 自动登录成功，跳转到对应页面
      const targetRoute = authStore.isStudent ? '/student' : '/teacher'
      router.push(targetRoute)
    }
  }).catch(() => {
    // 自动登录失败，确保在登录页面
    router.push('/login')
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
